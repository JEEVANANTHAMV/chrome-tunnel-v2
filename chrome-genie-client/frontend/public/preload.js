// Neutralinojs Preload Script
// This script runs before the page loads and sets up the bridge between the renderer and main process

let mcpPid = null;
let frpcPid = null;

function initChromeGenieAPI() {
  console.log('Initializing ChromeGenie API...');
  
  if (typeof Neutralino !== 'undefined' && typeof Neutralino.init === 'function') {
    Neutralino.init();
  }
  
  window.chromeGenie = {
    startMcp: async (config) => {
      try {
        const startPort = config.port || 3000;
        
        // Use Node.js to find an open port starting from the requested port, binding to 0.0.0.0 to match the MCP server
        const portScript = `const net = require('net'); function getPort(p) { const s = net.createServer(); s.listen(p, '0.0.0.0', () => { console.log(s.address().port); s.close(); }); s.on('error', (e) => { if (e.code === 'EADDRINUSE') getPort(p + 1); else { console.log(p); } }); } getPort(${startPort});`;
        const portRes = await Neutralino.os.execCommand(`node -e "${portScript}"`);
        const finalPort = parseInt(portRes.stdOut.trim()) || startPort;
        console.log(`Found available port: ${finalPort}`);

        let envCmd = '';
        const commonPaths = 'export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$HOME/.npm-global/bin; ';
        
        if (window.NL_OS === 'Windows') {
          envCmd = `set STAGEHAND_ENV=LOCAL&& set MODEL_NAME=${config.modelName}&& set MODEL_BASE_URL=${config.baseUrl}&& set OPENAI_API_KEY=${config.apiKey}&& `;
        } else {
          envCmd = `${commonPaths} STAGEHAND_ENV=LOCAL MODEL_NAME=${config.modelName} MODEL_BASE_URL=${config.baseUrl} OPENAI_API_KEY=${config.apiKey} `;
        }
        
        const cmd = `${envCmd}npx innosynth-mcp --experimental --port ${finalPort} --host 0.0.0.0`;
        const res = await Neutralino.os.spawnProcess(cmd);
        mcpPid = res.id;

        // Add error detection for the spawned process
        Neutralino.events.on('spawnedProcess', (evt) => {
          if (evt.detail.id === mcpPid && evt.detail.action === 'stdErr' && evt.detail.data.includes('command not found')) {
            console.error('[MCP] ERROR: Node.js/npx not found. Please install Node.js from https://nodejs.org to use the MCP server.');
          }
        });

        return { success: true, port: finalPort };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
    stopMcp: async () => {
      if (mcpPid !== null) {
        try {
          await Neutralino.os.updateSpawnedProcess(mcpPid, 'exit');
          mcpPid = null;
        } catch (e) {}
      }
      return { success: true };
    },
    startFrpc: async (config) => {
      try {
        const { serverAddr, serverPort, token, localPort, remotePort, customDomain } = config;
        
        const frpcConfig = `serverAddr: 172.174.244.221
serverPort: 7000
auth:
  method: token
  token: 48f8ef8d08aa5c4d9adab6b3b7f7b9df
transport:
  protocol: tcp
  tls:
    enable: false
log:
  level: debug

proxies:
  - name: nextjs
    type: http
    localIP: 127.0.0.1
    localPort: ${localPort}
    subdomain: ${customDomain.split('.')[0]}
`;

        const configPath = `${window.NL_PATH}/.tmp/frpc.yaml`;
        await Neutralino.os.execCommand(`mkdir -p ${window.NL_PATH}/.tmp`).catch(()=>{});
        await Neutralino.filesystem.writeFile(configPath, frpcConfig);
        
        let frpcBin = 'frpc';
        if (window.NL_OS === 'Windows') frpcBin = 'frpc.exe';
        else if (window.NL_OS === 'Darwin' && window.NL_ARCH === 'arm64') frpcBin = 'frpc-darwin-arm64';
        else if (window.NL_OS === 'Darwin') frpcBin = 'frpc-darwin';

        const binPath = `${window.NL_PATH}/bin/${frpcBin}`;
        
        if (window.NL_OS !== 'Windows') {
          await Neutralino.os.execCommand(`chmod +x ${binPath}`);
        }
        
        const frpcCmd = `${binPath} -c ${configPath}`;
        console.log(`Spawning FRPC: ${frpcCmd}`);
        const res = await Neutralino.os.spawnProcess(frpcCmd);
        frpcPid = res.id;
        
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
    stopFrpc: async () => {
      if (frpcPid !== null) {
        try {
          await Neutralino.os.updateSpawnedProcess(frpcPid, 'exit');
          frpcPid = null;
        } catch (e) {}
      }
      return { success: true };
    },
    onMcpLog: (callback) => {
      Neutralino.events.on('spawnedProcess', (evt) => {
        if (evt.detail.id === mcpPid) {
          if (evt.detail.action === 'stdOut' || evt.detail.action === 'stdErr') {
            callback(evt.detail.data);
          }
        }
      });
    },
    onFrpcLog: (callback) => {
      Neutralino.events.on('spawnedProcess', (evt) => {
        if (evt.detail.id === frpcPid) {
          if (evt.detail.action === 'stdOut' || evt.detail.action === 'stdErr') {
            callback(evt.detail.data);
          }
        }
      });
    }
  };

  window.electronAPI = window.chromeGenie;
  console.log('ChromeGenie API loaded successfully');

  // Kill background processes when the window is closed
  Neutralino.events.on('windowClose', async () => {
    console.log('Window closing, cleaning up processes...');
    try {
      if (mcpPid !== null) await Neutralino.os.updateSpawnedProcess(mcpPid, 'exit');
      if (frpcPid !== null) await Neutralino.os.updateSpawnedProcess(frpcPid, 'exit');
    } catch (e) {
      console.error('Cleanup failed:', e);
    }
    Neutralino.app.exit();
  });
}

if (typeof Neutralino !== 'undefined') {
  initChromeGenieAPI();
} else {
  console.log('Neutralino not yet available...');
  const checkInterval = setInterval(() => {
    if (typeof Neutralino !== 'undefined') {
      clearInterval(checkInterval);
      initChromeGenieAPI();
    }
  }, 50);
  
  setTimeout(() => {
    clearInterval(checkInterval);
    if (typeof Neutralino === 'undefined') {
      window.electronAPI = {
        startMcp: () => Promise.resolve({ success: false, error: 'Neutralino API not available' }),
        stopMcp: () => Promise.resolve({ success: false, error: 'Neutralino API not available' }),
        startFrpc: () => Promise.resolve({ success: false, error: 'Neutralino API not available' }),
        stopFrpc: () => Promise.resolve({ success: false, error: 'Neutralino API not available' }),
        onMcpLog: () => {},
        onFrpcLog: () => {}
      };
      window.chromeGenie = window.electronAPI;
    }
  }, 5000);
}
