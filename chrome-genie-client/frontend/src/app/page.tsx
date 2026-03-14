'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Terminal, 
  Cpu, 
  Globe, 
  Play, 
  Square, 
  RefreshCw, 
  ChevronRight, 
  Activity,
  Shield,
  Zap,
  Server,
  AlertTriangle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

declare global {
  interface Window {
    electronAPI: {
      startMcp: (config: any) => Promise<{ success: boolean, port?: number }>;
      stopMcp: () => Promise<{ success: boolean }>;
      startFrpc: (config: any) => Promise<{ success: boolean }>;
      stopFrpc: () => Promise<{ success: boolean }>;
      onMcpLog: (callback: (log: string) => void) => void;
      onFrpcLog: (callback: (log: string) => void) => void;
    };
    chromeGenie: {
      startMcp: (config: any) => Promise<{ success: boolean, port?: number }>;
      stopMcp: () => Promise<{ success: boolean }>;
      startFrpc: (config: any) => Promise<{ success: boolean }>;
      stopFrpc: () => Promise<{ success: boolean }>;
      onMcpLog: (callback: (log: string) => void) => void;
      onFrpcLog: (callback: (log: string) => void) => void;
    };
  }
}

export default function Dashboard() {
  const [modelProvider, setModelProvider] = useState('default');
  const [modelName, setModelName] = useState('qwen3-max');
  const [baseUrl, setBaseUrl] = useState('http://172.174.244.221:8001');
  const [apiKey, setApiKey] = useState('any-key');
  const [mcpPort, setMcpPort] = useState('3000');
  
  // Auto-generated FRP Tunnel Settings
  const HARDCODED_FRP_SERVER = '172.174.244.221';
  const HARDCODED_FRP_PORT = '7000';
  const HARDCODED_FRP_TOKEN = 'mysecrettoken';
  const [publicUrl, setPublicUrl] = useState('');
  
  const [mcpStatus, setMcpStatus] = useState('stopped'); // stopped, running, error
  const [frpcStatus, setFrpcStatus] = useState('stopped');
  const [isNativeMode, setIsNativeMode] = useState(false);
  
  const [logs, setLogs] = useState<{id: string, type: 'MCP' | 'FRP', content: string, time: string}[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasNativeAPI = !!(window.electronAPI || window.chromeGenie);
      setIsNativeMode(hasNativeAPI);
      if (hasNativeAPI && window.electronAPI) {
        window.electronAPI.onMcpLog((log) => {
          addLog('MCP', log);
        });
        window.electronAPI.onFrpcLog((log) => {
          addLog('FRP', log);
        });
      }
    }
  }, []);

  const addLog = (type: 'MCP' | 'FRP', content: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [
      ...prev.slice(-100), 
      { id: Math.random().toString(36).substr(2, 9), type, content, time }
    ]);
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const startMcpAndTunnel = async () => {
    setMcpStatus('running');
    addLog('MCP', 'Initializing server with ' + modelProvider + '...');
    if (!window.electronAPI) {
      setMcpStatus('error');
      addLog('MCP', 'ERROR: Native API not available - please run the app using "npm run dev" or build and run the desktop application');
      addLog('MCP', 'HINT: Run "npm run dev" from the project root to start the full development environment');
      return;
    }
    try {
      const res = await window.electronAPI.startMcp({
        modelProvider,
        modelName,
        baseUrl,
        apiKey,
        port: parseInt(mcpPort),
      });
      
      let finalPort = mcpPort;
      if (res.success && res.port) {
        finalPort = res.port.toString();
        setMcpPort(finalPort);
      }

      if (!res.success) {
        setMcpStatus('error');
        addLog('MCP', 'ERROR: Failed to start process');
        return;
      }

      // Automatically Start Tunnel
      setFrpcStatus('running');
      addLog('FRP', 'Establishing auto-tunnel to ' + HARDCODED_FRP_SERVER + '...');
      
      const generatedDomain = `agent-${Math.random().toString(36).substring(2, 8)}.innosynth.org`;
      setPublicUrl(`http://${generatedDomain}`);

      const frpRes = await window.electronAPI.startFrpc({
        serverAddr: HARDCODED_FRP_SERVER,
        serverPort: HARDCODED_FRP_PORT,
        token: HARDCODED_FRP_TOKEN,
        localPort: finalPort,
        customDomain: generatedDomain,
      });

      if (!frpRes.success) {
        setFrpcStatus('error');
        addLog('FRP', 'ERROR: Tunnel failed to connect');
      }

    } catch (err) {
      setMcpStatus('error');
      setFrpcStatus('error');
      addLog('MCP', 'ERROR: ' + (err as Error).message);
    }
  };

  const stopMcpAndTunnel = async () => {
    if (!window.electronAPI) {
      addLog('MCP', 'ERROR: Native API not available - please run the app using "npm run dev"');
      return;
    }
    await window.electronAPI.stopMcp();
    await window.electronAPI.stopFrpc();
    setMcpStatus('stopped');
    setFrpcStatus('stopped');
    setPublicUrl('');
    addLog('MCP', 'Server and tunnel stopped.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-purple-500/30">
      {/* Navigation Header */}
      <header className="h-16 border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center glow-primary">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text tracking-tight">ChromeGenie</span>
          <div className="h-4 w-[1px] bg-white/10 mx-2" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Dashboard v1.0</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <span className={cn("status-dot", mcpStatus === 'running' ? 'active' : 'inactive')} />
              <span className="text-xs font-semibold opacity-80">MCP / TUNNEL</span>
            </div>
          </div>
          <button className="p-2 rounded-full hover:bg-white/5 transition-colors text-muted-foreground hover:text-white">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Browser Mode Warning Banner */}
      {!isNativeMode && (
        <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-amber-500 font-medium">
              Running in browser mode - Native features unavailable. Run <code className="bg-amber-500/20 px-1.5 py-0.5 rounded">npm run dev</code> from project root for full functionality.
            </span>
          </div>
        </div>
      )}

      {/* Connection Indicator Bar */}
      <div className="px-6 py-3 bg-purple-500/5 border-b border-white/5 flex items-center justify-between mb-2">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", mcpStatus === 'running' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-white/20')} />
            <span className="text-xs font-medium opacity-60">Local:</span>
            <span className="text-sm font-mono tracking-tight">localhost:{mcpPort}</span>
          </div>
          <div className="w-[1px] h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", frpcStatus === 'running' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-white/20')} />
            <span className="text-xs font-medium opacity-60">Public:</span>
            <span className="text-sm font-mono text-purple-400 font-bold">
              {publicUrl ? publicUrl : 'Tunnel not configured'}
            </span>
          </div>
        </div>
        <div className="text-[10px] text-white/30 font-medium">
          STABLE CONNECTION ESTABLISHED • LATENCY: 24ms
        </div>
      </div>

      <main className="flex-1 p-6 grid grid-cols-12 gap-6 max-w-[1600px] mx-auto w-full">
        
        {/* Left Column: Config */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          
          {/* MCP Card */}
          <section className="glass-panel rounded-2xl overflow-hidden animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-400" />
                <h2 className="font-semibold text-sm uppercase tracking-wider opacity-80">MCP Server Engine</h2>
              </div>
              <Activity className="w-4 h-4 text-purple-400 opacity-50" />
            </div>
            
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label>Provider</label>
                  <select 
                    value={modelProvider}
                    onChange={(e) => setModelProvider(e.target.value)}
                    className="w-full text-sm"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="vllm">vLLM / Local</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="default">Default Provider</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label>Preferred Port</label>
                  <input 
                    type="number" 
                    value={mcpPort}
                    onChange={(e) => setMcpPort(e.target.value)}
                    className="w-full text-sm"
                  />
                  <p className="text-[10px] text-white/40 mt-1">If in use, an available port is auto-selected.</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label>Model Identifier</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="e.g. gpt-4o, qwen3-max"
                    className="w-full pl-3 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label>Endpoint URL (Optional)</label>
                <input 
                  type="text" 
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="w-full text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label>API Auth Token</label>
                <div className="relative group">
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full text-sm pr-10"
                  />
                  <Shield className="absolute right-3 top-2.5 w-4 h-4 text-white/20 group-hover:text-purple-400 transition-colors" />
                </div>
              </div>

              <div className="pt-2">
                {mcpStatus === 'running' ? (
                  <button onClick={stopMcpAndTunnel} className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-500 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group">
                    <Square className="w-4 h-4 fill-current group-active:scale-95 transition-transform" />
                    Shutdown Server & Tunnel
                  </button>
                ) : (
                  <button onClick={startMcpAndTunnel} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 glow-primary group active:translate-y-0.5">
                    <Play className="w-4 h-4 fill-current" />
                    Launch MCP Engine & Tunnel
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Logs */}
        <div className="col-span-12 lg:col-span-7 h-[calc(100vh-10rem)] flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
          <section className="glass-panel flex-1 rounded-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-black/40 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-green-400" />
                <h2 className="font-semibold text-sm uppercase tracking-wider opacity-80">System Console</h2>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setLogs([])}
                  className="px-3 py-1 rounded-md bg-white/5 hover:bg-white/10 text-xs font-medium transition-colors"
                >
                  Clear console
                </button>
              </div>
            </div>
            
            <div className="flex-1 bg-black/60 p-5 font-mono text-[13px] overflow-y-auto overflow-x-hidden leading-relaxed scrollbar-thin">
              {logs.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full opacity-20 pointer-events-none">
                  <Terminal className="w-12 h-12 mb-2" />
                  <p>Awaiting engine initialization...</p>
                </div>
              )}
              
              <AnimatePresence initial={false}>
                {logs.map((log) => (
                  <motion.div 
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-1.5 flex gap-3 group"
                  >
                    <span className="text-white/20 shrink-0 select-none">[{log.time}]</span>
                    <span className={cn(
                      "shrink-0 font-bold select-none",
                      log.type === 'MCP' ? "text-purple-400/80" : "text-pink-400/80"
                    )}>
                      {log.type}
                    </span>
                    <span className={cn(
                      "break-all",
                      log.content.includes('ERROR') ? 'text-red-400' : 'text-white/80'
                    )}>
                      {log.content}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={logEndRef} />
            </div>

            <div className="p-3 bg-black/40 border-t border-white/5 flex items-center gap-3 px-4">
              <ChevronRight className="w-4 h-4 text-green-500 animate-pulse" />
              <div className="h-4 w-[2px] bg-green-500 animate-caret" />
              <span className="text-xs text-white/40 italic">System ready for commands.</span>
            </div>
          </section>
        </div>
      </main>

      <footer className="h-10 px-6 border-t border-white/5 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] font-medium text-white/20">
        <div>Developed by InnoSynth © 2025</div>
        <div className="flex gap-4">
          <span className="hover:text-white/60 cursor-pointer transition-colors">Documentation</span>
          <span className="hover:text-white/60 cursor-pointer transition-colors">GitHub</span>
          <span className="hover:text-white/60 cursor-pointer transition-colors">Support</span>
        </div>
      </footer>

      {/* Styles for animation */}
      <style jsx global>{`
        @keyframes caret {
          from, to { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-caret {
          animation: caret 1s infinite step-end;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
