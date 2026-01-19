# Proxmox & Nginx Proxy Manager Deployment Guide

This guide explains how to host the Robotics Academy Platform on a Proxmox VM (or LXC) behind Nginx Proxy Manager (NPM).

## Architecture Overview

**Current:** `Client (HTTPS) -> Project Nginx (SSL) -> Next.js`
**Proposed:** `Client (HTTPS) -> Nginx Proxy Manager (SSL) -> Project Nginx (HTTP) -> Next.js`

**Why this approach?**
1.  **SSL Configuration**: NPM handles Let's Encrypt certificates automatically via its web UI.
    *   **Crucial**: You do **NOT** generate certificates inside the container.
    *   **Crucial**: You do **NOT** uncomment the SSL sections in `nginx/nginx.conf`.
2.  **Static Files**: We keep the **Project Nginx** because it is configured to serve the `/uploads` folder efficiently. NPM typically doesn't have access to your project's local volume.

## Step 1: Prepare the Proxmox VM/LXC
1.  Create a VM or LXC container in Proxmox (Ubuntu 22.04 LTS recommended).
2.  Install Docker & Docker Compose (see main `DEPLOYMENT.md`).
3.  Clone the repository.

## Step 2: Code Changes Required

### 1. Update `docker-compose.yml`
We need to change the exposed ports. Usually, NPM needs ports 80/443. We should move the Robotics Platform to a different port (e.g., 8000) so they don't conflict if running on the same machine.

**File:** `docker-compose.yml`
```yaml
  nginx:
    # ...
    ports:
      - "8000:80"   # Change from "80:80"
      # - "443:443" # Remove HTTPS port (NPM handles SSL)
```

### 2. Update `nginx/nginx.conf`
We need to ensure the internal Nginx trusts the headers passed by NPM (so logs show real user IPs, not the proxy IP).

**File:** `nginx/nginx.conf`
Inside the `server` block or `http` block:
```nginx
# Trust the Proxy (NPM)
set_real_ip_from 172.16.0.0/12; # Adjust to match your Docker bridge or NPM IP
set_real_ip_from 192.168.0.0/16; # Allow local network proxies
real_ip_header X-Forwarded-For;
real_ip_recursive on;
```

## Step 3: Configure Nginx Proxy Manager
1.  Log in to your NPM dashboard.
2.  Click **"Add Proxy Host"**.
3.  **Details Tab**:
    *   **Domain Names**: `academy.yourdomain.com`
    *   **Scheme**: `http` (Not https - we are talking to the container internally via HTTP)
    *   **Forward Hostname / IP**: The internal IP of your Proxmox VM (e.g., `192.168.1.50`).
    *   **Forward Port**: `8000` (The port we set in docker-compose).
    *   **Cache Assets**: Enable.
    *   **Block Common Exploits**: Enable.
    *   **Websockets Support**: Enable (Required for potential future real-time features).
4.  **SSL Tab**:
    *   **SSL Certificate**: "Request a new SSL Certificate".
    *   **Force SSL**: Enable.
    *   **HTTP/2 Support**: Enable.

## Summary Checklist
- [ ] Modify `docker-compose.yml` to expose port `8000:80`.
- [ ] Run `docker-compose up -d`.
- [ ] Point Nginx Proxy Manager to `http://<VM_IP>:8000`.
- [ ] Enable SSL in Nginx Proxy Manager.

This setup is robust, secure, and easier to manage than the default standalone configuration.
