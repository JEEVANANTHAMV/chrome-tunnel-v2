const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startMcp: (config) => ipcRenderer.invoke('start-mcp', config),
  stopMcp: () => ipcRenderer.invoke('stop-mcp'),
  startFrpc: (config) => ipcRenderer.invoke('start-frpc', config),
  stopFrpc: () => ipcRenderer.invoke('stop-frpc'),
  onMcpLog: (callback) => ipcRenderer.on('mcp-log', (_event, value) => callback(value)),
  onFrpcLog: (callback) => ipcRenderer.on('frpc-log', (_event, value) => callback(value)),
});
