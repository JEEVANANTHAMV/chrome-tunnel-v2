# ChromeGenie Client - Build Instructions

This document provides instructions for building the ChromeGenie Client application for Windows, macOS, and Linux.

## Prerequisites

### All Platforms
- **Node.js** (v18 or higher)
- **npm** (v8 or higher)

### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install -y python3 make xz-utils libgtk-3-0 libnss3 libgbm1
```

### macOS
```bash
xcode-select --install
```

### Windows
- **Windows 10/11** with Node.js installed
- No additional dependencies required

## Downloading FRP Binaries

Before building, you need to download the FRP (Fast Reverse Proxy) binaries for all target platforms:

```bash
npm run download:frp
```

Or run the script directly:
```bash
node scripts/download-frp-binaries.js
```

This will download FRP binaries for:
- Windows (x64)
- macOS (Intel x64 and Apple Silicon ARM64)
- Linux (x64)

## Building for Your Current Platform

### Quick Build
```bash
npm run build
```

This will build the application for your current platform.

### Platform-Specific Builds

#### Windows
```bash
# From Windows command prompt
npm run build:win

# Or use the batch script
scripts\build-windows.bat
```

**Output formats:**
- `ChromeGenie-{version}-win-x64.exe` - NSIS installer
- `ChromeGenie-{version}-win-x64-portable.exe` - Portable executable

#### macOS
```bash
npm run build:mac

# Or use the shell script
./scripts/build-macos.sh
```

**Output formats:**
- `ChromeGenie-{version}-mac-x64.dmg` - macOS disk image (Intel)
- `ChromeGenie-{version}-mac-arm64.dmg` - macOS disk image (Apple Silicon)
- `ChromeGenie-{version}-mac-x64.zip` - Compressed archive (Intel)
- `ChromeGenie-{version}-mac-arm64.zip` - Compressed archive (Apple Silicon)

#### Linux
```bash
npm run build:linux

# Or use the shell script
./scripts/build-linux.sh
```

**Output formats:**
- `ChromeGenie-{version}-linux-x64.AppImage` - Portable AppImage
- `ChromeGenie-{version}-linux-x64.deb` - Debian package
- `ChromeGenie-{version}-linux-x64.tar.gz` - Compressed archive

## Building for All Platforms

To build for all platforms at once (requires appropriate build tools for each platform):

```bash
# Linux/Mac
./scripts/build-all.sh

# Windows
scripts\build-all.bat
```

**Note:** Cross-platform building may require additional setup:
- Building Windows apps on Linux/Mac requires Wine
- Building macOS apps requires a Mac
- Building Linux apps on Windows requires WSL

## Build Output

All built applications will be in the `dist/` directory:

```
dist/
├── ChromeGenie-1.0.0-win-x64.exe
├── ChromeGenie-1.0.0-win-x64-portable.exe
├── ChromeGenie-1.0.0-mac-x64.dmg
├── ChromeGenie-1.0.0-mac-arm64.dmg
├── ChromeGenie-1.0.0-linux-x64.AppImage
├── ChromeGenie-1.0.0-linux-x64.deb
└── ...
```

## Development Build

For development, you can run the app without building:

```bash
npm run dev
```

This will:
1. Start the Next.js frontend in development mode
2. Launch Electron with hot-reload enabled

## Troubleshooting

### "frpc binary not found" error
Make sure you've run the FRP binary download script:
```bash
node scripts/download-frp-binaries.js
```

### macOS: "App can't be opened" error
On macOS, you may need to:
1. Go to System Preferences > Security & Privacy
2. Allow the app to run
3. Or sign the app with your developer certificate

### Linux: Missing dependencies
Install the required dependencies:
```bash
sudo apt-get install -y libgtk-3-0 libnss3 libgbm1
```

### Windows: Antivirus blocking the app
Add an exception for the built application in your antivirus software.

## CI/CD Integration

For automated builds, you can use GitHub Actions. Here's a basic example:

```yaml
name: Build

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Download FRP binaries
        run: node scripts/download-frp-binaries.js
      
      - name: Build
        run: npm run build
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ChromeGenie-${{ matrix.os }}
          path: dist/
```

## Version Management

To update the version, edit `package.json`:

```json
{
  "version": "1.0.0"
}
```

Then run `npm run build` to create new builds with the updated version.
