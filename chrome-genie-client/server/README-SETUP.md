# FRP Server (FRPS) Setup & Configuration

This guide explains how to set up the FRP (Fast Reverse Proxy) server for **ChromeGenie** on a fresh Ubuntu machine.

## 1. Prerequisites
- **Ubuntu 24.04+** (Azure/AWS/Local)
- **Public IP**: `172.174.244.221` (Current)
- **Wildcard DNS**: Ensure `*.innosynth.org` points to the Public IP of this server.

## 2. Server Installation (Native)
We recommend running FRPS as a native service for maximum reliability.

```bash
# Download the latest stable FRP release
wget https://github.com/fatedier/frp/releases/download/v0.61.1/frp_0.61.1_linux_amd64.tar.gz
tar -xzf frp_0.61.1_linux_amd64.tar.gz

# Move the binary to a system path
sudo mv frp_0.61.1_linux_amd64/frps /usr/local/bin/frps_new

# Create a configuration directory
sudo mkdir -p /opt/frp
```

## 3. Configuration (`/opt/frp/frps.ini`)
The server uses **INI** format for simplicity. Create this file:

```ini
[common]
bind_port = 7000
subdomain_host = innosynth.org

# Dashboard Credentials
dashboard_port = 7500
dashboard_user = admin
dashboard_pwd = StrongDashboardPwdHere

# HTTP Routing
vhost_http_port = 80
vhost_https_port = 443

# Security Token (MUST Match Client)
token = 48f8ef8d08aa5c4d9adab6b3b7f7b9df
```

## 4. Running the Server
To run the server in the background:
```bash
sudo nohup /usr/local/bin/frps_new -c /opt/frp/frps.ini > /opt/frp/frps.log 2>&1 &
```

To check logs:
```bash
tail -f /opt/frp/frps.log
```

## 5. Summary Table

| Service | Details |
|---------|---------|
| **Server IP** | `172.174.244.221` |
| **User ID** | `forjinn` |
| **SSH Password** | `Psgcasmcom@12` |
| **Control Port** | `7000` |
| **Dashboard** | `http://172.174.244.221:7500` (User: `admin` / Pwd: `StrongDashboardPwdHere`) |
| **Master Token** | `48f8ef8d08aa5c4d9adab6b3b7f7b9df` |
| **Domain** | `innosynth.org` |

---
**Note**: If you want to use Docker instead, ensure you pull `v0.61.0+` as older versions have protocol mismatches with the Darwin/ARM64 client.
