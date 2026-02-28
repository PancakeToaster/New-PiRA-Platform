# Proxmox/Ubuntu Deployment Guide

This guide explains how to use the automated deployment script (`deploy-ubuntu.sh`) to spin up the PiRA Platform on a fresh Ubuntu Server (bare metal, VM, or LXC container).

## Prerequisites

1. **A Fresh Ubuntu Server** (22.04 or 24.04 LTS recommended)
2. **Root or Sudo Access**
3. **Internet Connection**

## Instructions

1. **Upload your code to GitHub (or another Git provider)**
   - Make sure your repository is accessible. If it's a private repository, you will need to set up SSH keys or use a Personal Access Token (PAT) inside the `GIT_REPO` variable in the script.

2. **Edit the Deployment Script**
   - Open `scripts/deploy-ubuntu.sh`.
   - Update the `GIT_REPO` variable at the top of the file to point to your actual repository URL.
   ```bash
   GIT_REPO="https://github.com/YOUR_USERNAME/New-PiRA-Platform.git"
   ```

3. **Transfer the Script to the Server**
   You can either upload the `deploy-ubuntu.sh` file to your server via SCP/SFTP, or simply create a new file and paste the contents into it:
   ```bash
   nano deploy.sh
   # Paste the contents, then save (Ctrl+O, Enter, Ctrl+X)
   ```

4. **Make the Script Executable**
   ```bash
   chmod +x deploy.sh
   ```

5. **Run the Deployment**
   ```bash
   sudo ./deploy.sh
   ```

## What the Script Does Automatically:
1. **System Updates**: Runs `apt update && apt upgrade`.
2. **Installs PostgreSQL**: Sets up the database engine locally.
3. **Configures the Database**: Automatically generates a secure random password, creates a database named `pira_db`, and grants privileges.
4. **Installs Node.js**: Installs Node.js v22 via NodeSource.
5. **Installs PM2**: Installs PM2 globally for process management, ensuring your Next.js app stays online and auto-starts on boot.
6. **Clones the App**: Clones your GitHub repository into `/opt/pira-platform`.
7. **Generates `.env`**: Automatically creates your `.env` file with the correct Postgres connection string and generates a secure NextAuth secret.
8. **Builds the App**: Runs `npm install`, generates the Prisma client, pushes the schema (`db push`), and runs `npm run build`.
9. **Starts the App**: Uses PM2 to start the application.
10. **Configures Nginx**: Installs Nginx and sets up a reverse proxy so the Next.js app (running on port 3000) is accessible directly on port 80 (HTTP). It also enables the UFW firewall.

## Post-Deployment Steps

Once the script finishes:
1. Access the app by entering the server's IP address into your browser (e.g., `http://192.168.1.100`).
2. Update the `.env` file (`/opt/pira-platform/.env`) to change `NEXTAUTH_URL` to your actual domain name.
3. If you plan to use HTTPS (SSL), install Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```
4. View your live Next.js application logs anytime using:
   ```bash
   pm2 logs pira-platform
   ```
