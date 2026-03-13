#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const inputPng = path.join(__dirname, '..', 'assets', 'icon.png');
const outputIcns = path.join(__dirname, '..', 'assets', 'icon.icns');

const iconsetDir = path.join(__dirname, '..', 'assets', 'icon.iconset');
if (fs.existsSync(iconsetDir)) {
  execSync(`rm -rf "${iconsetDir}"`);
}
fs.mkdirSync(iconsetDir, { recursive: true });

const sizes = [
  { from: 16, to: 'icon_16x16.png' },
  { from: 16, to: 'icon_16x16@2x.png' },
  { from: 32, to: 'icon_32x32.png' },
  { from: 32, to: 'icon_32x32@2x.png' },
  { from: 128, to: 'icon_128x128.png' },
  { from: 128, to: 'icon_128x128@2x.png' },
  { from: 256, to: 'icon_256x256.png' },
  { from: 256, to: 'icon_256x256@2x.png' },
  { from: 512, to: 'icon_512x512.png' },
  { from: 512, to: 'icon_512x512@2x.png' },
];

console.log('Generating icon sizes...');

for (const size of sizes) {
  const targetPath = path.join(iconsetDir, size.to);
  execSync(`convert "${inputPng}" -resize ${size.from}x${size.from} "${targetPath}"`);
  console.log(`  Created ${size.to}`);
}

try {
  execSync(`iconutil -c icns "${iconsetDir}" -o "${outputIcns}"`);
  console.log(`Successfully created ${outputIcns}`);
} catch (err) {
  console.log('iconutil not available, creating placeholder...');
  fs.copyFileSync(inputPng, outputIcns);
}

execSync(`rm -rf "${iconsetDir}"`);
console.log('Done!');
