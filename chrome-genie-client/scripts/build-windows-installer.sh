#!/bin/bash
# Script to create Windows installer using Inno Setup via Wine
# Alternative: Create a simple portable ZIP package

set -e

APP_NAME="ChromeGenie"
APP_VERSION="1.0.0"
DIST_DIR="dist/chrome-genie-client"
PORTABLE_ZIP="${APP_NAME}-${APP_VERSION}-Windows-Portable.zip"

echo "Creating Windows portable ZIP package..."

# Create temporary directory for portable package
PORTABLE_DIR="windows-portable"
rm -rf ${PORTABLE_DIR}
mkdir -p ${PORTABLE_DIR}

# Copy binary
cp ${DIST_DIR}/chrome-genie-client-win_x64.exe ${PORTABLE_DIR}/${APP_NAME}.exe

# Copy resources
cp ${DIST_DIR}/resources.neu ${PORTABLE_DIR}/
cp -r ${DIST_DIR}/extensions ${PORTABLE_DIR}/

# Create launcher batch file
cat > ${PORTABLE_DIR}/launch.bat << 'EOF'
@echo off
cd /d "%~dp0"
start "" "%~dp0ChromeGenie.exe"
EOF

# Create README file
cat > ${PORTABLE_DIR}/README.txt << EOF
ChromeGenie Client v${APP_VERSION}
===================================

To run the application:
1. Double-click ChromeGenie.exe
2. Or double-click launch.bat

To uninstall:
Simply delete this folder.

For more information, visit:
https://github.com/innosynth/chrome-genie-client
EOF

# Create ZIP package
echo "Creating ZIP package..."
cd ${PORTABLE_DIR}
zip -r "../dist/${PORTABLE_ZIP}" .
cd ..

echo "Created: dist/${PORTABLE_ZIP}"

# Cleanup
rm -rf ${PORTABLE_DIR}

echo ""
echo "Note: For a professional Windows installer (.exe), you can:"
echo "1. Use Inno Setup on Windows: https://jrsoftware.org/isinfo.php"
echo "2. Use NSIS on Windows: https://nsis.sourceforge.io/"
echo "3. Use CI/CD with GitHub Actions on Windows runners"
echo ""
echo "The portable ZIP works on all Windows systems without installation."
