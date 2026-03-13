# ChromeGenie Client

A desktop application for Chrome control automation via MCP, developed by InnoSynth.

## Features
- **MCP Server Management**: Starts and stops the local `innosynth-mcp` server with custom model providers.
- **Reverse Tunneling**: Built-in support for `frp` to expose your local browser control to remote VMs or the internet.
- **Multi-OS Support**: Built with Electron, supporting Windows, macOS, and Linux.
- **Premium Dashboard**: A modern, glassmorphic UI for easy configuration and monitoring.

## Prerequisites
- Node.js (v18+)
- npm

## Getting Started

### 1. Installation
Install dependencies in both the root and frontend:
```bash
npm install
```

### 2. Set up FRP
Download the `frpc` binary for your current platform:
```bash
npm run setup:frp
```

### 3. Development
Run the app in development mode:
```bash
npm run dev
```

### 4. Build for Production
To build the application for all major OS platforms:
```bash
npm run build
```
The output will be in the `dist/` folder.

## Architecture

```
User (Dashboard) <--> Electron Main <--> innosynth-mcp (Localhost:3000)
                             |
                             +--> frpc (Tunnel) <--> Remote FRPS (Docker VM)
```

## Configuration

### MCP Settings
- **Model Provider**: Choose between OpenAI, vLLM (Local), Anthropic, etc.
- **Model Name**: The exact name of the model to use (e.g., `qwen3-max`).
- **Base URL**: Set this if using a local vLLM or custom endpoint.
- **API Key**: Your provider's API key.

### Tunneling Settings
- **Server Address**: The IP or domain of your remote FRP server.
- **Remote Port**: The port on the remote server to map to your local MCP server.
- **Custom Domain**: Use this if your FRP server is configured with subdomains.

## Open Source
Developed by InnoSynth for free browser control automation.
