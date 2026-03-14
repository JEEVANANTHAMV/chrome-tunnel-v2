#!/bin/bash
# Script to create macOS .app bundle and .dmg from Linux
# Uses dmgbuild or creates a simple DMG structure

set -e

APP_NAME="ChromeGenie"
APP_VERSION="1.0.0"
DIST_DIR="dist/chrome-genie-client"
APP_BUNDLE="${APP_NAME}.app"
DMG_FILE="${APP_NAME}-${APP_VERSION}.dmg"

echo "Creating macOS .app bundle..."

# Create .app bundle structure
rm -rf ${APP_BUNDLE}
mkdir -p ${APP_BUNDLE}/Contents/MacOS
mkdir -p ${APP_BUNDLE}/Contents/Resources

# Copy binary (use universal binary for compatibility)
cp ${DIST_DIR}/chrome-genie-client-mac_universal ${APP_BUNDLE}/Contents/MacOS/${APP_NAME}

# Copy resources
cp -r ${DIST_DIR}/resources.neu ${APP_BUNDLE}/Contents/MacOS/
cp -r ${DIST_DIR}/extensions ${APP_BUNDLE}/Contents/MacOS/

# Copy icon
cp resources/assets/icon.icns ${APP_BUNDLE}/Contents/Resources/

# Create Info.plist
cat > ${APP_BUNDLE}/Contents/Info.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleExecutable</key>
    <string>${APP_NAME}</string>
    <key>CFBundleIconFile</key>
    <string>icon.icns</string>
    <key>CFBundleIdentifier</key>
    <string>js.neutralino.chromegenie</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>${APP_NAME}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>${APP_VERSION}</string>
    <key>CFBundleVersion</key>
    <string>${APP_VERSION}</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.13</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
EOF

# Make binary executable
chmod +x ${APP_BUNDLE}/Contents/MacOS/${APP_NAME}

echo "Created: ${APP_BUNDLE}"

# Try to create DMG using dmgbuild if available
if command -v dmgbuild &> /dev/null; then
    echo "Creating DMG with dmgbuild..."
    
    # Create dmgbuild settings file
    cat > dmg-settings.py << 'EOF'
app_name = "ChromeGenie"
app_version = "1.0.0"
files = ["ChromeGenie.app"]
symlinks = {"Applications": "/Applications"}
icon = "resources/assets/icon.icns"
EOF
    
    dmgbuild -s dmg-settings.py "dist/${DMG_FILE}" "${APP_BUNDLE}"
    rm -f dmg-settings.py
    echo "Created: dist/${DMG_FILE}"
else
    echo "dmgbuild not found. Creating simple DMG structure..."
    
    # Create a simple DMG using hdiutil (works on Linux with qemu)
    # Or create a ZIP of the .app as alternative
    
    # Create ZIP of the .app bundle as alternative
    echo "Creating ZIP of .app bundle (alternative to DMG)..."
    cd ${APP_BUNDLE}
    zip -r "../dist/${APP_NAME}-${APP_VERSION}.app.zip" .
    cd ..
    
    echo "Created: dist/${APP_NAME}-${APP_VERSION}.app.zip"
    echo ""
    echo "Note: Users can drag the .app from the ZIP to /Applications"
fi

# Cleanup
rm -rf ${APP_BUNDLE}

echo ""
echo "For professional DMG creation, consider:"
echo "1. Using GitHub Actions with macOS runners"
echo "2. Using a macOS CI/CD runner"
echo "3. Using dmgbuild on Linux (sudo apt install dmgbuild)"
