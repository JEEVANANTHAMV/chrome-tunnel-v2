# ChromeGenie Client - Build Documentation

## Build Outputs (in `chrome-genie-client/dist/`)

### Windows
- `ChromeGenie-1.0.0-win-x64.exe` (113 MB) - NSIS installer

### macOS
- `ChromeGenie-1.0.0-mac-x64.zip` (139 MB) - Intel Mac
- `ChromeGenie-1.0.0-mac-arm64.zip` (134 MB) - Apple Silicon

### Linux
- `ChromeGenie-1.0.0-linux-x86_64.AppImage` (149 MB) - Portable
- `ChromeGenie-1.0.0-linux-amd64.deb` (101 MB) - Debian package
- `ChromeGenie-1.0.0-linux-x64.tar.gz` (142 MB) - Archive

## Changes Made

1. **Icon**: Downloaded and converted the InnoSynth logo to all required formats (`.ico`, `.icns`, `.png`)

2. **`electron-builder.yml`**: Created comprehensive build configuration

3. **`package.json`**: Updated with build scripts and metadata

4. **`main.js`**: Added platform-specific FRP binary handling

5. **`next.config.ts`**: Configured for static export

6. **`scripts/download-frp-binaries.js`**: Downloads FRP binaries for all platforms

7. **`scripts/generate-icons.js`**: Icon conversion utility

8. **`build/entitlements.mac.plist`**: macOS entitlements

9. **`chrome-genie-client/.gitignore`**: Updated with build artifacts

## Build Commands

```bash
# Download FRP binaries
npm run download:frp

# Build for all platforms (from Linux)
npx electron-builder --win --mac --linux

# Build for specific platform
npx electron-builder --win   # Windows
npx electron-builder --mac   # macOS
npx electron-builder --linux # Linux
```
