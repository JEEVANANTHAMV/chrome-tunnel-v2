const axios = require('axios');
const fs = require('fs');
const path = require('path');
const tar = require('tar');
const zip = require('adm-zip');

const FRP_VERSION = '0.54.0';
const BIN_DIR = path.join(__dirname, '..', 'bin');

async function downloadFRP() {
  if (!fs.existsSync(BIN_DIR)) {
    fs.mkdirSync(BIN_DIR, { recursive: true });
  }

  let platform = process.platform;
  let arch = process.arch === 'x64' ? 'amd64' : 'arm64';
  
  if (platform === 'win32') platform = 'windows';
  if (platform === 'darwin') platform = 'darwin';
  
  const fileName = `frp_${FRP_VERSION}_${platform}_${arch}`;
  const extension = platform === 'windows' ? 'zip' : 'tar.gz';
  const url = `https://github.com/fatedier/frp/releases/download/v${FRP_VERSION}/${fileName}.${extension}`;
  
  console.log(`Downloading FRP from ${url}...`);
  
  const downloadPath = path.join(BIN_DIR, `${fileName}.${extension}`);
  const writer = fs.createWriteStream(downloadPath);
  
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });
  
  response.data.pipe(writer);
  
  return new Promise((resolve, reject) => {
    writer.on('finish', async () => {
      console.log('Download complete. Extracting...');
      
      if (extension === 'zip') {
        const zipFile = new zip(downloadPath);
        zipFile.extractAllTo(BIN_DIR, true);
      } else {
        await tar.x({
          file: downloadPath,
          cwd: BIN_DIR,
        });
      }
      
      // Move frpc to the base bin dir
      const extractedDir = path.join(BIN_DIR, fileName);
      const frpcSource = path.join(extractedDir, platform === 'windows' ? 'frpc.exe' : 'frpc');
      const frpcDest = path.join(BIN_DIR, platform === 'windows' ? 'frpc.exe' : 'frpc');
      
      if (fs.existsSync(frpcSource)) {
        fs.renameSync(frpcSource, frpcDest);
        if (platform !== 'windows') {
          fs.chmodSync(frpcDest, '755');
        }
      }
      
      console.log('FRP setup complete.');
      resolve();
    });
    writer.on('error', reject);
  });
}

downloadFRP().catch(console.error);
