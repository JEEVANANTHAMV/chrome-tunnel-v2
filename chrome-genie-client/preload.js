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
        const port = config.port || 3000;
        let envCmd = '';
        if (window.NL_OS === 'Windows') {
          envCmd = `set STAGEHAND_ENV=LOCAL&& set MODEL_NAME=${config.modelName}&& set MODEL_BASE_URL=${config.baseUrl}&& set OPENAI_API_KEY=${config.apiKey}&& `;
        } else {
          envCmd = `STAGEHAND_ENV=LOCAL MODEL_NAME=${config.modelName} MODEL_BASE_URL=${config.baseUrl} OPENAI_API_KEY=${config.apiKey} `;
        }
        
        const cmd = `${envCmd}npx innosynth-mcp --experimental --port ${port} --host 0.0.0.0`;
        const res = await Neutralino.os.spawnProcess(cmd);
        mcpPid = res.id;
        return { success: true, port: port };
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
        
        const frpcConfig = `[common]
server_addr = ${serverAddr}
server_port = ${serverPort}
token = ${token}

[nextjs]
type = ${customDomain ? 'http' : 'tcp'}
local_ip = 127.0.0.1
local_port = ${localPort}
${customDomain ? `custom_domains = ${customDomain}` : `remote_port = ${remotePort}`}
`;

        const configPath = `${window.NL_PATH}/.tmp/frpc.ini`;
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
        
        const res = await Neutralino.os.spawnProcess(`${binPath} -c ${configPath}`);
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
  
  // Debug injection
  const debugDiv = document.createElement('div');
  debugDiv.innerHTML = '<div style="background:red;color:white;position:fixed;top:0;left:0;z-index:9999;padding:10px;">ChromeGenie API Injected!</div>';
  window.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(debugDiv);
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
