#!/bin/bash
# Script to create AppImage for ChromeGenie Client

set -e

APP_NAME="chrome-genie-client"
APP_VERSION="1.0.0"
DIST_DIR="dist/chrome-genie-client"
APPDIR="AppDir"
APPIMAGE="${APP_NAME}-${APP_VERSION}.AppImage"

# Check if appimagetool is installed
if [ ! -f appimagetool ]; then
    echo "Downloading appimagetool..."
    wget -O appimagetool https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage
    chmod +x appimagetool
fi

# Create AppDir structure
rm -rf ${APPDIR}
mkdir -p ${APPDIR}/usr/bin
mkdir -p ${APPDIR}/usr/share/applications
mkdir -p ${APPDIR}/usr/share/icons/hicolor/256x256/apps

# Copy binary
cp ${DIST_DIR}/${APP_NAME}-linux_x64 ${APPDIR}/usr/bin/${APP_NAME}

# Copy resources
cp -r ${DIST_DIR}/resources.neu ${APPDIR}/usr/bin/
cp -r ${DIST_DIR}/extensions ${APPDIR}/usr/bin/

# Copy icon to multiple locations
cp resources/icons/icon.png ${APPDIR}/usr/share/icons/hicolor/256x256/apps/${APP_NAME}.png
cp resources/icons/icon.png ${APPDIR}/${APP_NAME}.png

# Create desktop file
cat > ${APPDIR}/${APP_NAME}.desktop << EOF
[Desktop Entry]
Name=ChromeGenie Client
Exec=${APP_NAME}
Icon=${APP_NAME}
Type=Application
Categories=Utility;
EOF

# Create AppRun
cat > ${APPDIR}/AppRun << EOF
#!/bin/bash
DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
export APPDIR="\$DIR"
exec "\$DIR/usr/bin/${APP_NAME}" "\$@"
EOF
chmod +x ${APPDIR}/AppRun

# Build the AppImage
echo "Building AppImage..."
ARCH=x86_64 ./appimagetool ${APPDIR} dist/${APPIMAGE}

echo "Created: dist/${APPIMAGE}"

# Cleanup
rm -rf ${APPDIR}
