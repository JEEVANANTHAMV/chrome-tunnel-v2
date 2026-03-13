#!/bin/bash

# Build script for ChromeGenie Client - Linux/Ubuntu
# This script builds the application for Linux

set -e

echo "=========================================="
echo "ChromeGenie Client - Linux Build"
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

# Check for required dependencies
echo -e "\n${YELLOW}Checking dependencies...${NC}"

# Check for Python (required by electron-builder)
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo -e "${RED}Error: Python is not installed${NC}"
    echo -e "${YELLOW}Install with: sudo apt-get install python3${NC}"
    exit 1
fi

# Check for make
if ! command -v make &> /dev/null; then
    echo -e "${RED}Warning: make is not installed${NC}"
    echo -e "${YELLOW}Install with: sudo apt-get install make${NC}"
fi

# Check for xz-utils (required for AppImage)
if ! command -v xz &> /dev/null; then
    echo -e "${RED}Warning: xz-utils is not installed${NC}"
    echo -e "${YELLOW}Install with: sudo apt-get install xz-utils${NC}"
fi

# Install Node.js dependencies
echo -e "\n${YELLOW}Installing Node.js dependencies...${NC}"
npm install

# Build frontend
echo -e "\n${YELLOW}Building frontend...${NC}"
npm run build:frontend

# Build for Linux
echo -e "\n${YELLOW}Building for Linux...${NC}"
npm run build:linux

echo -e "\n${GREEN}Linux build completed!${NC}"
echo -e "${GREEN}Check the 'dist' folder for built applications.${NC}"
echo -e "\n${YELLOW}Available formats:${NC}"
echo -e "  - AppImage: Portable executable"
echo -e "  - deb: Debian/Ubuntu package"
echo -e "  - tar.gz: Compressed archive"
