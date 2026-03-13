const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let mcpProcess = null;
let frpcProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    title: "ChromeGenie Dashboard",
  });

  const url = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, 'frontend/out/index.html')}`;

  mainWindow.loadURL(url);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('start-mcp', async (event, config) => {
  if (mcpProcess) {
    mcpProcess.kill();
  }

  const { modelProvider, modelName, baseUrl, apiKey, port } = config;

  const env = {
    ...process.env,
    STAGEHAND_ENV: 'LOCAL',
    MODEL_NAME: modelName || 'qwen3-max',
    MODEL_BASE_URL: baseUrl || 'http://localhost:8001/v1',
    OPENAI_API_KEY: apiKey || 'any-key',
  };

  // Run: npx innosynth-mcp --experimental --port 3000 --host 0.0.0.0
  // Note: We use the port from config if provided, default to 3000
  const mcpPort = port || 3000;

  mcpProcess = spawn('npx', ['innosynth-mcp', '--experimental', '--port', mcpPort.toString(), '--host', '0.0.0.0'], {
    env,
    shell: true,
  });

  mcpProcess.stdout.on('data', (data) => {
    console.log(`MCP STDOUT: ${data}`);
    mainWindow.webContents.send('mcp-log', data.toString());
  });

  mcpProcess.stderr.on('data', (data) => {
    console.error(`MCP STDERR: ${data}`);
    mainWindow.webContents.send('mcp-log', `ERROR: ${data.toString()}`);
  });

  return { success: true };
});

ipcMain.handle('stop-mcp', async () => {
  if (mcpProcess) {
    mcpProcess.kill();
    mcpProcess = null;
  }
  return { success: true };
});

ipcMain.handle('start-frpc', async (event, config) => {
  if (frpcProcess) {
    frpcProcess.kill();
  }

  const { serverAddr, serverPort, token, localPort, remotePort, customDomain } = config;

  // Generate frpc.ini content
  let frpcConfig = `
[common]
server_addr = ${serverAddr}
server_port = ${serverPort}
token = ${token}

[nextjs]
type = ${customDomain ? 'http' : 'tcp'}
local_ip = 127.0.0.1
local_port = ${localPort}
${customDomain ? `custom_domains = ${customDomain}` : `remote_port = ${remotePort}`}
`;

  const configPath = path.join(app.getPath('userData'), 'frpc.ini');
  fs.writeFileSync(configPath, frpcConfig);

  // Platform-specific frpc binary path
  let frpcPath;
  const isAppImage = process.env.APPIMAGE !== undefined;
  const binDir = isAppImage
    ? path.join(process.resourcesPath, 'bin')
    : path.join(__dirname, process.platform === 'win32' ? '..' : 'bin');

  if (process.platform === 'win32') {
    frpcPath = path.join(binDir, 'frpc.exe');
  } else if (process.platform === 'darwin') {
    // Check for ARM64 vs x64 on macOS
    const arch = process.arch;
    frpcPath = path.join(binDir, arch === 'arm64' ? 'frpc-darwin-arm64' : 'frpc-darwin');
  } else {
    frpcPath = path.join(binDir, 'frpc');
  }

  // Check if frpc exists
  if (!fs.existsSync(frpcPath)) {
    console.error(`frpc binary not found at: ${frpcPath}`);
    mainWindow.webContents.send('frpc-log', `ERROR: frpc binary not found at ${frpcPath}\n`);
    return { success: false, error: 'frpc binary not found' };
  }

  // Make frpc executable on Unix systems
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(frpcPath, 0o755);
    } catch (err) {
      console.error('Failed to set frpc as executable:', err);
    }
  }

  frpcProcess = spawn(frpcPath, ['-c', configPath], {
    shell: false,
  });

  frpcProcess.stdout.on('data', (data) => {
    mainWindow.webContents.send('frpc-log', data.toString());
  });

  frpcProcess.stderr.on('data', (data) => {
    mainWindow.webContents.send('frpc-log', `ERROR: ${data.toString()}`);
  });

  frpcProcess.on('error', (err) => {
    console.error('Failed to start frpc:', err);
    mainWindow.webContents.send('frpc-log', `ERROR: Failed to start frpc - ${err.message}\n`);
  });

  return { success: true };
});

ipcMain.handle('stop-frpc', async () => {
  if (frpcProcess) {
    frpcProcess.kill();
    frpcProcess = null;
  }
  return { success: true };
});
