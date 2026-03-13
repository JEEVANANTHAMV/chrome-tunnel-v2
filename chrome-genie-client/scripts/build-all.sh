#!/bin/bash

# Build script for ChromeGenie Client
# This script builds the application for all platforms

set -e

echo "=========================================="
echo "ChromeGenie Client - Multi-Platform Build"
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

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install

# Build frontend
echo -e "\n${YELLOW}Building frontend...${NC}"
npm run build:frontend

# Build for Linux (if running on Linux)
if [ "$(uname)" == "Linux" ]; then
    echo -e "\n${YELLOW}Building for Linux...${NC}"
    npm run build:linux
    echo -e "${GREEN}Linux build completed!${NC}"
fi

# Build for macOS (if running on macOS)
if [ "$(uname)" == "Darwin" ]; then
    echo -e "\n${YELLOW}Building for macOS...${NC}"
    npm run build:mac
    echo -e "${GREEN}macOS build completed!${NC}"
fi

# Note: Windows builds should be done on Windows or using Wine/WSL
echo -e "\n${YELLOW}Build process completed!${NC}"
echo -e "${GREEN}Check the 'dist' folder for built applications.${NC}"
