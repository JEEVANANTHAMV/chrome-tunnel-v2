#!/usr/bin/env node
// Setup resources directory for Neutralino development

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const resourcesDir = path.join(__dirname, '..', 'resources');
const jsDir = path.join(resourcesDir, 'js');

// Ensure resources/js directory exists
if (!fs.existsSync(jsDir)) {
  fs.mkdirSync(jsDir, { recursive: true });
}

// Copy preload script to resources
const preloadSrc = path.join(__dirname, '..', 'preload.js');
const preloadDest = path.join(resourcesDir, 'preload.js');
if (fs.existsSync(preloadSrc)) {
  fs.copyFileSync(preloadSrc, preloadDest);
  console.log('Copied preload.js to resources');
}

// Copy assets to resources
const assetsSrc = path.join(__dirname, '..', 'assets');
const assetsDest = path.join(resourcesDir, 'assets');
if (fs.existsSync(assetsSrc)) {
  if (!fs.existsSync(assetsDest)) fs.mkdirSync(assetsDest, { recursive: true });
  fs.cpSync(assetsSrc, assetsDest, { recursive: true });
  console.log('Copied assets to resources');
}

// Check if neutralino.js exists
const neutralinoJsPath = path.join(jsDir, 'neutralino.js');
if (!fs.existsSync(neutralinoJsPath)) {
  console.log('Downloading Neutralino client library...');
  try {
    execSync('npx @neutralinojs/neu update', { stdio: 'inherit' });
  } catch (err) {
    console.error('Failed to update Neutralino:', err);
    process.exit(1);
  }
}

// Ensure Next.js dev server has access to these files
const publicDir = path.join(__dirname, '..', 'frontend', 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

const publicJsDir = path.join(publicDir, 'js');
if (!fs.existsSync(publicJsDir)) fs.mkdirSync(publicJsDir, { recursive: true });

if (fs.existsSync(preloadDest)) {
  fs.copyFileSync(preloadDest, path.join(publicDir, 'preload.js'));
  console.log('Copied preload.js to frontend/public');
}
if (fs.existsSync(neutralinoJsPath)) {
  fs.copyFileSync(neutralinoJsPath, path.join(publicJsDir, 'neutralino.js'));
  console.log('Copied neutralino.js to frontend/public/js');
}

console.log('Resources setup complete');
