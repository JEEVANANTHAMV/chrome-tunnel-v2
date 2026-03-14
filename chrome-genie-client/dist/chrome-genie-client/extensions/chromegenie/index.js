// ChromeGenie Extension for Neutralinojs
// This extension provides MCP and FRP control functionality

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Determine if we're in development or production mode
const isDev = process.env.NODE_ENV === 'development' || !process.env.NEU_RELEASE;

let mcpProcess = null;
let frpcProcess = null;

// Find an available port
function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = require('net').createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => {
        resolve(port);
      });
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
  });
}

// Get the base path for resources
function getBasePath() {
  if (isDev) {
    return process.cwd();
  } else {
    // In production, use the Neutralino resources path
    return process.resourcesPath || path.join(__dirname, '..', '..');
  }
}

// Start MCP server
async function startMcp(config) {
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

  const basePort = port || 3000;
  const mcpPort = await findAvailablePort(basePort);

  mcpProcess = spawn('npx', ['innosynth-mcp', '--experimental', '--port', mcpPort.toString(), '--host', '0.0.0.0'], {
    env,
    shell: true,
  });

  mcpProcess.stdout.on('data', (data) => {
    console.log(`MCP STDOUT: ${data}`);
    // Emit event to renderer
    if (typeof Neutralino !== 'undefined' && Neutralino.Event) {
      Neutralino.Event.emit('mcp-log', data.toString());
    }
  });

  mcpProcess.stderr.on('data', (data) => {
    console.error(`MCP STDERR: ${data}`);
    if (typeof Neutralino !== 'undefined' && Neutralino.Event) {
      Neutralino.Event.emit('mcp-log', `ERROR: ${data.toString()}`);
    }
  });

  return { success: true, port: mcpPort };
}

// Stop MCP server
async function stopMcp() {
  if (mcpProcess) {
    mcpProcess.kill();
    mcpProcess = null;
  }
  return { success: true };
}

// Start FRPC
async function startFrpc(config) {
  if (frpcProcess) {
    frpcProcess.kill();
  }

  const { serverAddr, serverPort, token, localPort, remotePort, customDomain } = config;

  // Generate frpc.ini content
  const frpcConfig = `
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

  // Create config directory if it doesn't exist
  const configDir = path.join(process.env.HOME || process.env.USERPROFILE, '.chromegenie');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const configPath = path.join(configDir, 'frpc.ini');
  fs.writeFileSync(configPath, frpcConfig);

  // Platform-specific frpc binary path
  const basePath = getBasePath();
  let binDir = path.join(basePath, 'bin');
  
  // Fallback for some distributions
  if (!fs.existsSync(binDir)) {
    binDir = path.join(basePath, '..', '..', 'bin');
  }

  let frpcPath;
  if (process.platform === 'win32') {
    frpcPath = path.join(binDir, 'frpc.exe');
  } else if (process.platform === 'darwin') {
    // Try to find the correct architecture binary
    const arch = process.arch;
    const armPath = path.join(binDir, 'frpc-darwin-arm64');
    const x64Path = path.join(binDir, 'frpc-darwin');
    
    if (arch === 'arm64' && fs.existsSync(armPath)) {
      frpcPath = armPath;
    } else if (fs.existsSync(x64Path)) {
      frpcPath = x64Path;
    } else {
      frpcPath = path.join(binDir, 'frpc'); // Generic fallback
    }
  } else {
    frpcPath = path.join(binDir, 'frpc');
  }

  // Check if frpc exists
  if (!fs.existsSync(frpcPath)) {
    console.error(`frpc binary not found at: ${frpcPath}`);
    if (typeof Neutralino !== 'undefined' && Neutralino.Event) {
      Neutralino.Event.emit('frpc-log', `ERROR: frpc binary not found at ${frpcPath}\n`);
    }
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
    if (typeof Neutralino !== 'undefined' && Neutralino.Event) {
      Neutralino.Event.emit('frpc-log', data.toString());
    }
  });

  frpcProcess.stderr.on('data', (data) => {
    if (typeof Neutralino !== 'undefined' && Neutralino.Event) {
      Neutralino.Event.emit('frpc-log', `ERROR: ${data.toString()}`);
    }
  });

  frpcProcess.on('error', (err) => {
    console.error('Failed to start frpc:', err);
    if (typeof Neutralino !== 'undefined' && Neutralino.Event) {
      Neutralino.Event.emit('frpc-log', `ERROR: Failed to start frpc - ${err.message}\n`);
    }
  });

  return { success: true };
}

// Stop FRPC
async function stopFrpc() {
  if (frpcProcess) {
    frpcProcess.kill();
    frpcProcess = null;
  }
  return { success: true };
}

// Export functions for the extension
module.exports = {
  startMcp,
  stopMcp,
  startFrpc,
  stopFrpc
};
