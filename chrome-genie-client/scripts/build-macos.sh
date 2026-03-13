#!/bin/bash

# Build script for ChromeGenie Client - macOS
# This script builds the application for macOS

set -e

echo "=========================================="
echo "ChromeGenie Client - macOS Build"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}Node.js version:${NC} $(node --version)"
echo -e "${GREEN}npm version:${NC} $(npm --version)"

# Check for Xcode command line tools
if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}Warning: Xcode command line tools may not be installed${NC}"
    echo -e "${YELLOW}Install with: xcode-select --install${NC}"
fi

# Install Node.js dependencies
echo -e "\n${YELLOW}Installing Node.js dependencies...${NC}"
npm install

# Build frontend
echo -e "\n${YELLOW}Building frontend...${NC}"
npm run build:frontend

# Build for macOS
echo -e "\n${YELLOW}Building for macOS...${NC}"
npm run build:mac

echo -e "\n${GREEN}macOS build completed!${NC}"
echo -e "${GREEN}Check the 'dist' folder for built applications.${NC}"
echo -e "\n${YELLOW}Available formats:${NC}"
echo -e "  - dmg: macOS disk image installer"
echo -e "  - zip: Compressed archive"
echo -e "\n${YELLOW}Note:${NC}"
echo -e "  - The app is built for both x64 and arm64 (Apple Silicon)"
echo -e "  - You may need to sign the app for distribution"
