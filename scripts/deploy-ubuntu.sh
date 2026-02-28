#!/bin/bash
# ==============================================================================
# PiRA Platform - Ubuntu Server Deployment Script
# Designed for fresh Ubuntu 22.04 / 24.04 installations (e.g., Proxmox VM/LXC)
# ==============================================================================
# Run this script as root or with sudo privileges:
# sudo ./deploy-ubuntu.sh
# ==============================================================================

set -e # Exit immediately if a command exits with a non-zero status

# --- Configuration Variables ---
APP_NAME="pira-platform"
APP_DIR="/opt/$APP_NAME"
GIT_REPO="https://github.com/YOUR_USERNAME/New-PiRA-Platform.git" # <-- CHANGE THIS to your repo URL
DB_NAME="pira_db"
DB_USER="pira_user"
# Generate a secure random password for the database
DB_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)
NODE_VERSION="22"

echo "==============================================="
echo " Starting PiRA Platform Deployment Setup"
echo "==============================================="

# 1. Update system and install required packages
echo "[1/10] Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y curl git wget build-essential openssl nginx ufw

# 2. Install PostgreSQL
echo "[2/10] Installing PostgreSQL..."
sudo apt-get install -y postgresql postgresql-contrib

# 3. Secure and setup PostgreSQL Database
echo "[3/10] Configuring PostgreSQL Database..."
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" || echo "Database might already exist"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';" || echo "User might already exist"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -c "ALTER DATABASE $DB_NAME OWNER TO $DB_USER;"
sudo -u postgres psql -c "GRANT ALL ON SCHEMA public TO $DB_USER;" -d $DB_NAME

# 4. Install Node.js
echo "[4/10] Installing Node.js v$NODE_VERSION..."
curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | sudo -E bash -
sudo apt-get install -y nodejs

# 5. Install PM2 (Process Manager) globally
echo "[5/10] Installing PM2..."
sudo npm install -g pm2

# 6. Setup Application Directory and Clone Code
echo "[6/10] Setting up application directory..."
if [ -d "$APP_DIR" ]; then
    echo "Directory $APP_DIR already exists. Updating repo..."
    cd $APP_DIR
    sudo git pull
else
    echo "Cloning repository..."
    sudo git clone $GIT_REPO $APP_DIR
    cd $APP_DIR
fi

# Set proper ownership so npm doesn't complain
sudo chown -R $USER:$USER $APP_DIR

# 7. Setup Environment Variables (.env)
echo "[7/10] Generating .env file..."
# Generate a NextAuth secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)
# Construct standard local postgres URL based on what we just created
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME?schema=public"

cat << EOF > .env
# Database
DATABASE_URL="$DATABASE_URL"

# Authentication
NEXTAUTH_URL="http://localhost:3000" # Change to your domain/IP later
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"

# Feature Flags & Environment
NODE_ENV="production"
EOF

# 8. Install dependencies and build
echo "[8/10] Installing NPM dependencies and building..."
npm install
npx prisma generate
npx prisma db push --accept-data-loss # Or use migrate deploy if you prefer migrations mode
npm run build

# 9. Start Application with PM2
echo "[9/10] Starting application with PM2..."
pm2 stop $APP_NAME || true
pm2 start npm --name $APP_NAME -- run start
# Save PM2 process list and configure to start on boot
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER

# 10. Configure Nginx Reverse Proxy
echo "[10/10] Configuring Nginx..."
sudo bash -c "cat << 'EOF' > /etc/nginx/sites-available/$APP_NAME
server {
    listen 80;
    server_name _; # Responds to any domain/IP. Change to your domain if needed.

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF"

sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl restart nginx

# Setup basic firewall (UFW)
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
# Uncomment the next line to enable the firewall (might drop your connection if SSH isn't allowed properly)
echo "y" | sudo ufw enable

echo "==============================================="
echo " Setup Complete! "
echo "==============================================="
echo "Your app is running locally via PM2 and exposed via Nginx on port 80."
echo "If your Proxmox VM VM's IP is 192.168.1.100, access it at: http://192.168.1.100"
echo ""
echo "Important: "
echo "1. Change the NEXTAUTH_URL in $APP_DIR/.env to your actual domain or IP address."
echo "2. Edit the GIT_REPO URL inside this script before running it on the new server."
echo "3. To view live logs: pm2 logs $APP_NAME"
echo "4. Database URL (Keep this safe!): $DATABASE_URL"
echo "==============================================="
