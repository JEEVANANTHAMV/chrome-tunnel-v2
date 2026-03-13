#!/usr/bin/env node

/**
 * Script to download FRP binaries for all platforms
 * This should be run before building the application
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const tar = require('tar');
const AdmZip = require('adm-zip');
const { execSync } = require('child_process');

const FRP_VERSION = '0.67.0';
const FRP_BASE_URL = 'https://github.com/fatedier/frp/releases/download';

const PLATFORMS = {
    win32: {
        url: `${FRP_BASE_URL}/v${FRP_VERSION}/frp_${FRP_VERSION}_windows_amd64.zip`,
        filename: `frp_${FRP_VERSION}_windows_amd64.zip`,
        binaryName: 'frpc.exe',
        destDir: 'bin',
        format: 'zip',
        extractedDir: `frp_${FRP_VERSION}_windows_amd64`,
    },
    darwin: {
        url: `${FRP_BASE_URL}/v${FRP_VERSION}/frp_${FRP_VERSION}_darwin_amd64.tar.gz`,
        filename: `frp_${FRP_VERSION}_darwin_amd64.tar.gz`,
        binaryName: 'frpc-darwin',
        destDir: 'bin',
        format: 'tar',
        extractedDir: `frp_${FRP_VERSION}_darwin_amd64`,
    },
    linux: {
        url: `${FRP_BASE_URL}/v${FRP_VERSION}/frp_${FRP_VERSION}_linux_amd64.tar.gz`,
        filename: `frp_${FRP_VERSION}_linux_amd64.tar.gz`,
        binaryName: 'frpc',
        destDir: 'bin',
        format: 'tar',
        extractedDir: `frp_${FRP_VERSION}_linux_amd64`,
    },
};

// Also download ARM64 version for macOS (Apple Silicon)
const PLATFORMS_ARM64 = {
    darwin_arm64: {
        url: `${FRP_BASE_URL}/v${FRP_VERSION}/frp_${FRP_VERSION}_darwin_arm64.tar.gz`,
        filename: `frp_${FRP_VERSION}_darwin_arm64.tar.gz`,
        binaryName: 'frpc-darwin-arm64',
        destDir: 'bin',
        format: 'tar',
        extractedDir: `frp_${FRP_VERSION}_darwin_arm64`,
    },
};

async function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        let redirectCount = 0;
        const maxRedirects = 5;

        function downloadWithRedirects(currentUrl) {
            const protocol = currentUrl.startsWith('https') ? https : http;

            protocol.get(currentUrl, (response) => {
                // Handle redirects
                if (response.statusCode === 301 || response.statusCode === 302) {
                    redirectCount++;
                    if (redirectCount > maxRedirects) {
                        reject(new Error(`Too many redirects for ${url}`));
                        return;
                    }
                    const location = response.headers.location;
                    if (location) {
                        console.log(`  Redirecting to: ${location}`);
                        response.resume(); // Consume response data
                        downloadWithRedirects(location);
                    } else {
                        reject(new Error(`Redirect without location header for ${url}`));
                    }
                    return;
                }

                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
                    return;
                }

                const file = fs.createWriteStream(destPath);
                response.pipe(file);

                file.on('finish', () => {
                    file.close();
                    resolve();
                });

                file.on('error', (err) => {
                    fs.unlink(destPath, () => { });
                    reject(err);
                });
            }).on('error', (err) => {
                fs.unlink(destPath, () => { });
                reject(err);
            });
        }

        downloadWithRedirects(url);
    });
}

async function extractBinary(platformKey, platformConfig) {
    const tempDir = path.join(__dirname, '..', 'temp-frp');
    const tarballPath = path.join(tempDir, platformConfig.filename);
    const destDir = path.join(__dirname, '..', platformConfig.destDir);

    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    // Create bin directory if it doesn't exist
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    console.log(`Downloading ${platformKey} binary...`);
    await downloadFile(platformConfig.url, tarballPath);

    console.log(`Extracting ${platformKey} binary...`);

    const extractedDir = path.join(tempDir, platformConfig.extractedDir);

    if (platformConfig.format === 'zip') {
        // Extract ZIP file
        const zip = new AdmZip(tarballPath);
        zip.extractAllTo(tempDir, true);
    } else {
        // Extract tar.gz file
        await tar.extract({
            file: tarballPath,
            cwd: tempDir,
        });
    }

    // Find and copy the frpc binary
    const sourceBinary = path.join(extractedDir, 'frpc' + (platformKey === 'win32' ? '.exe' : ''));
    const destBinary = path.join(destDir, platformConfig.binaryName);

    fs.copyFileSync(sourceBinary, destBinary);

    // Make executable on Unix systems
    if (platformKey !== 'win32') {
        execSync(`chmod +x "${destBinary}"`);
    }

    console.log(`Successfully extracted ${platformConfig.binaryName}`);

    // Clean up
    fs.unlinkSync(tarballPath);
    execSync(`rm -rf "${extractedDir}"`);
}

async function main() {
    console.log('========================================');
    console.log('Downloading FRP Binaries for All Platforms');
    console.log('========================================\n');

    try {
        // Download for all platforms
        for (const [key, config] of Object.entries(PLATFORMS)) {
            await extractBinary(key, config);
        }

        // Download ARM64 version for macOS
        for (const [key, config] of Object.entries(PLATFORMS_ARM64)) {
            await extractBinary(key, config);
        }

        // Clean up temp directory
        const tempDir = path.join(__dirname, '..', 'temp-frp');
        if (fs.existsSync(tempDir)) {
            execSync(`rm -rf "${tempDir}"`);
        }

        console.log('\n========================================');
        console.log('All FRP binaries downloaded successfully!');
        console.log('========================================');
        console.log('\nBinaries available:');
        console.log('  - bin/frpc.exe (Windows)');
        console.log('  - bin/frpc-darwin (macOS Intel)');
        console.log('  - bin/frpc-darwin-arm64 (macOS Apple Silicon)');
        console.log('  - bin/frpc (Linux)');

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();
