// Neutralinojs Preload Script
// This script runs before the page loads and sets up the bridge between the renderer and main process

// Expose the ChromeGenie API to the window object
window.chromeGenie = {
  startMcp: (config) => {
    return neu.extensions.chromegenie.startMcp(config);
  },
  stopMcp: () => {
    return neu.extensions.chromegenie.stopMcp();
  },
  startFrpc: (config) => {
    return neu.extensions.chromegenie.startFrpc(config);
  },
  stopFrpc: () => {
    return neu.extensions.chromegenie.stopFrpc();
  },
  onMcpLog: (callback) => {
    neu.Event.on('mcp-log', (event) => {
      callback(event.detail);
    });
  },
  onFrpcLog: (callback) => {
    neu.Event.on('frpc-log', (event) => {
      callback(event.detail);
    });
  }
};

// Also expose as electronAPI for backward compatibility during migration
window.electronAPI = window.chromeGenie;

console.log('ChromeGenie API loaded successfully');
