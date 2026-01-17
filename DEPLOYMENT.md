# Deployment Guide - Robotics Academy Platform

This guide walks you through deploying the Robotics Academy Platform on your own hardware with a static IP and domain.

## Prerequisites

- Ubuntu/Debian server with root access
- Static IP address configured
- Domain name pointing to your static IP
- Docker and Docker Compose installed
- At least 4GB RAM, 2 CPU cores, 50GB storage

## Step-by-Step Deployment

### 1. Server Preparation

**Update system:**
```bash
sudo apt update && sudo apt upgrade -y
```

**Install Docker:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

**Install Git:**
```bash
sudo apt install git -y
```

### 2. Clone and Configure

**Clone repository:**
```bash
cd /opt
sudo git clone <your-repository-url> robotics-academy
cd robotics-academy
sudo chown -R $USER:$USER .
```

**Create environment file:**
```bash
cp .env.example .env
nano .env
```

**Configure .env:**
```env
# Database (CHANGE THIS!)
DB_PASSWORD=YourVerySecurePasswordHere123!

# NextAuth (CHANGE THIS!)
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=generate_this_with_openssl_rand_base64_32

# Application
NODE_ENV=production
PORT=3000
```

**Generate secure secrets:**
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate DB_PASSWORD (or use a password manager)
openssl rand -base64 24
```

### 3. SSL Certificate Setup (Let's Encrypt)

**Install Certbot:**
```bash
sudo apt install certbot -y
```

**Stop any services using port 80:**
```bash
sudo systemctl stop apache2 nginx  # If running
```

**Generate certificates:**
```bash
sudo certbot certonly --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com \
  --agree-tos \
  --email your-email@example.com
```

**Copy certificates for Nginx:**
```bash
mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
sudo chown -R $USER:$USER nginx/ssl
```

**Set up automatic renewal:**
```bash
sudo crontab -e
# Add this line:
0 0 * * * certbot renew --quiet && cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/robotics-academy/nginx/ssl/cert.pem && cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/robotics-academy/nginx/ssl/key.pem && docker-compose -f /opt/robotics-academy/docker-compose.yml restart nginx
```

### 4. Configure Nginx for HTTPS

Edit `nginx/nginx.conf` and uncomment HTTPS sections:

```bash
nano nginx/nginx.conf
```

Uncomment these lines:
- Line ~40: `listen 443 ssl http2;`
- Lines ~42-46: SSL certificate configuration
- Lines ~24-28: HTTP to HTTPS redirect

**Update server_name:**
Change `localhost` to your actual domain:
```nginx
server_name yourdomain.com www.yourdomain.com;
```

### 5. Configure Firewall

```bash
# Enable firewall
sudo ufw enable

# Allow SSH (important!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

### 6. Deploy Application

**Build and start services:**
```bash
docker-compose up -d --build
```

**Check status:**
```bash
docker-compose ps
docker-compose logs -f app
```

**Wait for initialization:**
The first startup will:
1. Build the Docker image (~5-10 minutes)
2. Run database migrations
3. Seed initial data
4. Start the application

### 7. Verify Deployment

**Check services:**
```bash
# All services should be "Up"
docker-compose ps

# Check logs for errors
docker-compose logs app
docker-compose logs postgres
docker-compose logs nginx
```

**Test access:**
1. Open browser to `https://yourdomain.com`
2. You should see the homepage
3. Navigate to `https://yourdomain.com/login`
4. Login with default credentials:
   - Email: admin@roboticsacademy.com
   - Password: admin123

**⚠️ IMMEDIATELY change the admin password after first login!**

### 8. Post-Deployment Configuration

**Change admin password:**
1. Log in as admin
2. Go to Admin Panel > Settings
3. Change password

**Create your first users:**
1. Admin Panel > Users > Create New User
2. Assign appropriate roles (Parent, Student, Teacher)

**Customize content:**
1. Admin Panel > Pages - Edit homepage, about, etc.
2. Admin Panel > Courses - Add your courses
3. Admin Panel > Blog - Create posts

### 9. Set Up Automatic Backups

**Create backup script:**
```bash
sudo nano /usr/local/bin/backup-robotics-academy.sh
```

**Add this content:**
```bash
#!/bin/bash
BACKUP_DIR="/backup/robotics-academy"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker exec robotics_academy_db pg_dump -U postgres robotics_academy | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/robotics-academy/uploads/

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

**Make executable:**
```bash
sudo chmod +x /usr/local/bin/backup-robotics-academy.sh
```

**Schedule daily backups:**
```bash
sudo crontab -e
# Add this line (runs at 2 AM daily):
0 2 * * * /usr/local/bin/backup-robotics-academy.sh
```

### 10. Monitoring Setup

**View real-time logs:**
```bash
# Application logs
docker-compose logs -f app

# Database logs
docker-compose logs -f postgres

# Nginx logs
docker-compose logs -f nginx

# All services
docker-compose logs -f
```

**Check system resources:**
```bash
# Container stats
docker stats

# Disk usage
df -h

# Memory usage
free -h
```

**Access built-in monitoring:**
- Navigate to `https://yourdomain.com/admin/analytics`
- View page views, user metrics, system performance

## Maintenance Tasks

### Update Application

```bash
cd /opt/robotics-academy
git pull
docker-compose down
docker-compose up -d --build
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart app
docker-compose restart nginx
```

### View Database

```bash
# Access PostgreSQL
docker exec -it robotics_academy_db psql -U postgres -d robotics_academy

# Or use Prisma Studio
docker exec -it robotics_academy_app npx prisma studio
```

### Restore from Backup

```bash
# Stop services
docker-compose down

# Restore database
gunzip -c /backup/robotics-academy/db_20240101_020000.sql.gz | \
  docker exec -i robotics_academy_db psql -U postgres robotics_academy

# Restore uploads
tar -xzf /backup/robotics-academy/uploads_20240101_020000.tar.gz -C /

# Start services
docker-compose up -d
```

## Troubleshooting

### Application won't start

**Check logs:**
```bash
docker-compose logs app
```

**Common issues:**
- Database not ready: Wait 30 seconds, check `docker-compose logs postgres`
- Port conflicts: Change ports in `docker-compose.yml`
- Permission issues: Run `sudo chown -R $USER:$USER .`

### SSL Certificate Issues

**Verify certificates:**
```bash
sudo certbot certificates
```

**Renew manually:**
```bash
sudo certbot renew
```

### Database Connection Failed

**Check database status:**
```bash
docker-compose ps postgres
docker-compose logs postgres
```

**Reset database (⚠️ deletes all data):**
```bash
docker-compose down -v
docker-compose up -d
```

### High Memory Usage

**Check container stats:**
```bash
docker stats
```

**Restart services:**
```bash
docker-compose restart
```

**Increase swap (if needed):**
```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## Security Checklist

- ✅ Change default admin password
- ✅ Use strong database password
- ✅ Use strong NEXTAUTH_SECRET
- ✅ Enable firewall (ufw)
- ✅ SSL certificates installed
- ✅ Regular backups configured
- ✅ Keep system updated (`sudo apt update && sudo apt upgrade`)
- ✅ Monitor logs regularly
- ⚠️ Consider fail2ban for brute-force protection
- ⚠️ Set up monitoring alerts

## Performance Tuning

### For High Traffic

**Increase worker processes in nginx.conf:**
```nginx
events {
    worker_connections 2048;  # Increase from 1024
}
```

**Scale application containers:**
```bash
docker-compose up -d --scale app=3
```

**Add database connection pooling:**
Edit `DATABASE_URL` in `.env`:
```
DATABASE_URL="postgresql://postgres:password@postgres:5432/robotics_academy?schema=public&connection_limit=20&pool_timeout=10"
```

## Getting Help

If you encounter issues:
1. Check logs: `docker-compose logs`
2. Review this guide
3. Check main README.md
4. Contact support team

## Success!

Your Robotics Academy Platform should now be running at `https://yourdomain.com`!

Next steps:
1. Change admin password
2. Create user accounts
3. Add courses and content
4. Create invoices for parents
5. Start using the LMS!
