#!/bin/bash
# Script to create .deb package for ChromeGenie Client using dpkg-deb

set -e

APP_NAME="chrome-genie-client"
APP_VERSION="1.0.0"
DIST_DIR="dist/chrome-genie-client"
DEB_DIR="deb-build"
DEB_PACKAGE="${APP_NAME}_${APP_VERSION}_amd64.deb"

# Create deb package structure
mkdir -p ${DEB_DIR}/usr/bin
mkdir -p ${DEB_DIR}/usr/share/applications
mkdir -p ${DEB_DIR}/usr/share/icons/hicolor/256x256/apps
mkdir -p ${DEB_DIR}/DEBIAN

# Copy binary
cp ${DIST_DIR}/${APP_NAME}-linux_x64 ${DEB_DIR}/usr/bin/${APP_NAME}

# Copy resources
cp -r ${DIST_DIR}/resources.neu ${DEB_DIR}/usr/bin/
cp -r ${DIST_DIR}/extensions ${DEB_DIR}/usr/bin/
mkdir -p ${DEB_DIR}/usr/bin/bin
cp -r bin/* ${DEB_DIR}/usr/bin/bin/

# Copy icon
cp resources/assets/icon_512.png ${DEB_DIR}/usr/share/icons/hicolor/256x256/apps/${APP_NAME}.png

# Create desktop file
cat > ${DEB_DIR}/usr/share/applications/${APP_NAME}.desktop << EOF
[Desktop Entry]
Name=ChromeGenie Client
Exec=${APP_NAME}
Icon=${APP_NAME}
Type=Application
Categories=Utility;
EOF

# Create control file
cat > ${DEB_DIR}/DEBIAN/control << EOF
Package: ${APP_NAME}
Version: ${APP_VERSION}
Architecture: amd64
Maintainer: InnoSynth <support@innosynth.com>
Description: ChromeGenie Client for browser control automation
Homepage: https://github.com/innosynth/chrome-genie-client
EOF

# Create postinst script
cat > ${DEB_DIR}/DEBIAN/postinst << EOF
#!/bin/bash
chmod +x /usr/bin/${APP_NAME}
exit 0
EOF
chmod +x ${DEB_DIR}/DEBIAN/postinst

# Build the .deb package using dpkg-deb
if command -v dpkg-deb &> /dev/null; then
    echo "Building .deb package..."
    cd ${DEB_DIR}
    dpkg-deb --build . ../dist/${DEB_PACKAGE}
    cd ..
    echo "Created: dist/${DEB_PACKAGE}"
else
    echo "Warning: dpkg-deb not found. Skipping .deb package creation."
    echo "To build .deb on macOS, install with: brew install dpkg"
fi

# Cleanup
rm -rf ${DEB_DIR}
