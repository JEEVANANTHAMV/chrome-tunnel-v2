#!/bin/bash
# Script to create macOS .app bundle and .dmg for ChromeGenie Client

set -e

APP_NAME="ChromeGenie"
APP_VERSION="1.0.0"
DIST_DIR="dist/chrome-genie-client"
APP_BUNDLE="${APP_NAME}.app"
DMG_FILE="${APP_NAME}-${APP_VERSION}.dmg"

# Create .app bundle structure
rm -rf ${APP_BUNDLE}
mkdir -p ${APP_BUNDLE}/Contents/MacOS
mkdir -p ${APP_BUNDLE}/Contents/Resources

# Copy binary (use universal binary for compatibility)
cp ${DIST_DIR}/chrome-genie-client-mac_universal ${APP_BUNDLE}/Contents/MacOS/${APP_NAME}

# Copy resources
cp -r ${DIST_DIR}/resources.neu ${APP_BUNDLE}/Contents/MacOS/
cp -r ${DIST_DIR}/extensions ${APP_BUNDLE}/Contents/MacOS/
mkdir -p ${APP_BUNDLE}/Contents/MacOS/bin
cp -r bin/* ${APP_BUNDLE}/Contents/MacOS/bin/

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

# Create DMG (requires hdiutil which is available on macOS)
if command -v hdiutil &> /dev/null; then
    # Create temporary directory for DMG contents
    DMG_SRC="dmg-src"
    rm -rf ${DMG_SRC}
    mkdir -p ${DMG_SRC}
    
    # Copy app bundle
    cp -r ${APP_BUNDLE} ${DMG_SRC}/
    
    # Create symlink to Applications folder
    ln -s /Applications ${DMG_SRC}/Applications
    
    # Create and mount DMG
    hdiutil create -srcfolder ${DMG_SRC} -volname "${APP_NAME}" -ov -format UDBZ dist/${DMG_FILE}
    
    echo "Created: dist/${DMG_FILE}"
    
    # Cleanup
    rm -rf ${DMG_SRC}
else
    echo "hdiutil not found. DMG creation skipped (requires macOS)."
fi

# Cleanup
rm -rf ${APP_BUNDLE}
