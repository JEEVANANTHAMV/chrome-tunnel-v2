#!/usr/bin/env node
// Setup resources directory for Neutralino development

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const resourcesDir = path.join(__dirname, '..', 'resources');
const jsDir = path.join(resourcesDir, 'js');

// Ensure resources/js directory exists
if (!fs.existsSync(jsDir)) {
  fs.mkdirSync(jsDir, { recursive: true });
}

// Copy preload script to resources
const preloadSrc = path.join(__dirname, '..', 'preload.js');
const preloadDest = path.join(resourcesDir, 'preload.js');
if (fs.existsSync(preloadSrc)) {
  fs.copyFileSync(preloadSrc, preloadDest);
  console.log('Copied preload.js to resources');
}

// Copy assets to resources
const assetsSrc = path.join(__dirname, '..', 'assets');
const assetsDest = path.join(resourcesDir, 'assets');
if (fs.existsSync(assetsSrc)) {
  if (!fs.existsSync(assetsDest)) fs.mkdirSync(assetsDest, { recursive: true });
  fs.cpSync(assetsSrc, assetsDest, { recursive: true });
  console.log('Copied assets to resources');
}

// Check if neutralino.js exists
const neutralinoJsPath = path.join(jsDir, 'neutralino.js');
if (!fs.existsSync(neutralinoJsPath)) {
  console.log('Downloading Neutralino client library...');
  try {
    execSync('npx @neutralinojs/neu update', { stdio: 'inherit' });
  } catch (err) {
    console.error('Failed to update Neutralino:', err);
    process.exit(1);
  }
}

console.log('Resources setup complete');
