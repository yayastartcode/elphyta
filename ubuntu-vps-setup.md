# Ubuntu 24.04 VPS Setup Guide for Node.js/React Application

This guide will help you set up Ubuntu 24.04 to host your Truth or Dare application on a VPS.

## Prerequisites

- Ubuntu 24.04 VPS with root access
- Domain name pointed to your VPS IP
- At least 2GB RAM and 25GB storage (recommended for Ubuntu 24.04)
- Basic knowledge of Linux command line

## 1. Initial Server Setup

### Install essential packages
```bash
sudo apt install -y curl wget git build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release unzip
```

### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Create Non-Root User (if not already done)
```bash
# Create new user
sudo adduser yourusername

# Add user to sudo group
sudo usermod -aG sudo yourusername

# Switch to new user
su - yourusername
```

### Configure SSH (Optional but Recommended)
```bash
# Generate SSH key on your local machine
ssh-keygen -t rsa -b 4096

# Copy public key to server
ssh-copy-id yourusername@your-server-ip

# Disable password authentication (optional)
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart ssh
```

## 2. Install Node.js and npm

### Install Node.js 20.x (LTS)
```bash
# Install NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Install pnpm (since your project uses pnpm)
```bash
npm install -g pnpm
```

## 3. Database Configuration

### Option A: MongoDB Atlas (Cloud Database - Recommended)

If you're using MongoDB Atlas, you **don't need to install MongoDB locally**. Instead:

1. **Get your MongoDB Atlas connection string** from your Atlas dashboard
2. **Configure environment variables** in your application:

```bash
# In your .env file
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
```

3. **Ensure your VPS IP is whitelisted** in MongoDB Atlas Network Access settings

### Option B: Local MongoDB Installation (Alternative)

If you prefer to install MongoDB locally on your VPS:

#### Import MongoDB GPG Key
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
```

#### Add MongoDB Repository
```bash
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
```

#### Install MongoDB
```bash
sudo apt-get update
sudo apt-get install -y mongodb-org
```

#### Start and Enable MongoDB
```bash
sudo systemctl start mongod
sudo systemctl enable mongod
sudo systemctl status mongod
```

#### Secure MongoDB (Optional but Recommended)
```bash
# Connect to MongoDB (using mongosh for MongoDB 7.0)
mongosh

# Create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "your-strong-password",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})

# Create database user for your app
use elphyta_db
db.createUser({
  user: "elphyta_user",
  pwd: "your-app-password",
  roles: [ { role: "readWrite", db: "elphyta_db" } ]
})

exit

# Enable authentication
sudo nano /etc/mongod.conf
# Add:
# security:
#   authorization: enabled

sudo systemctl restart mongod
```

## 4. Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 5. Install PM2 (Process Manager)

```bash
npm install -g pm2
```

## 6. Setup Firewall

```bash
# Enable UFW
sudo ufw --force enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Check status
sudo ufw status
```

## 7. Deploy Your Application

### Clone Your Repository
```bash
cd /home/yourusername
git clone https://github.com/yourusername/your-repo.git
cd your-repo
```

### Install Dependencies
```bash
pnpm install
```

### Create Production Environment File
```bash
cp .env.example .env
nano .env
```

Update your `.env` file with production values:
```env
# Database
MONGODB_URI=mongodb://elphyta_user:your-app-password@localhost:27017/elphyta_db

# JWT
JWT_SECRET=your-super-secure-jwt-secret-here

# Server
PORT=3001
NODE_ENV=production

# CORS
CLIENT_URL=https://yourdomain.com
PRODUCTION_URL=https://yourdomain.com
```

### Build Frontend
```bash
pnpm run build
```

### Start Backend with PM2
```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

Add this content:
```javascript
module.exports = {
  apps: [{
    name: 'elphyta-api',
    script: './api/index.ts',
    interpreter: 'node',
    interpreter_args: '--loader ts-node/esm',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G'
  }]
}
```

```bash
# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
```

## 8. Configure Nginx

### Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/elphyta
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Serve static files (React build)
    location / {
        root /home/yourusername/your-repo/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node.js backend
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

### Enable Site
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/elphyta /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## 9. Setup SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install snapd if not already installed
sudo apt install -y snapd

# Install certbot via snap (recommended for Ubuntu 24.04)
sudo snap install --classic certbot

# Create symlink
sudo ln -sf /snap/bin/certbot /usr/bin/certbot

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

## 10. Update Frontend API Configuration

Update your frontend API configuration to use your domain:

```bash
nano src/config/api.ts
```

Update the production URL:
```typescript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? 'http://localhost:3001' : 'https://yourdomain.com/api');
```

Create production environment file:
```bash
nano .env.production
```

```env
VITE_API_BASE_URL=https://yourdomain.com/api
```

Rebuild frontend:
```bash
pnpm run build
```

## 11. Monitoring and Maintenance

### Check Application Status
```bash
# Check PM2 processes
pm2 status
pm2 logs

# Check Nginx status
sudo systemctl status nginx

# Check MongoDB status
sudo systemctl status mongod

# Check system resources
htop
df -h
```

### Backup Database
```bash
# Create backup script
nano ~/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +"%Y%m%d_%H%M%S")
mongodump --db elphyta_db --out /home/yourusername/backups/mongodb_$DATE
find /home/yourusername/backups -name "mongodb_*" -mtime +7 -delete
```

```bash
chmod +x ~/backup-db.sh

# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /home/yourusername/backup-db.sh
```

## 12. Security Hardening

### Install Fail2Ban
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Configure Automatic Updates
```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Troubleshooting

### Common Issues

1. **Application not starting**: Check PM2 logs with `pm2 logs`
2. **Database connection issues**: Verify MongoDB is running and credentials are correct
3. **Nginx 502 errors**: Check if backend is running on correct port
4. **Permission issues**: Ensure correct file ownership with `sudo chown -R yourusername:yourusername /path/to/app`

### Useful Commands

```bash
# Restart all services
sudo systemctl restart nginx
pm2 restart all
sudo systemctl restart mongod

# View logs
sudo tail -f /var/log/nginx/error.log
pm2 logs
sudo journalctl -u mongod

# Check ports
sudo netstat -tlnp
```

This setup will give you a production-ready environment for hosting your Truth or Dare application on Ubuntu 24.04!