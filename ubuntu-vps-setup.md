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
git clone https://github.com/yayastartcode/elphyta.git
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
# Build the React application with production environment
NODE_ENV=production pnpm run build

# Set proper ownership and permissions for Nginx
sudo chown -R www-data:www-data /home/elphyta/elphyta/dist
sudo chmod -R 755 /home/elphyta/elphyta/dist

# Ensure the user can still access the files
sudo usermod -a -G www-data yourusername
```

**Important**: After updating API configuration or environment variables, you must rebuild and redeploy:

```bash
# Stop the API server
pm2 stop elphyta-api

# Fix permissions before rebuilding (to avoid build errors)
# Take ownership of the entire project directory
sudo chown -R elphyta:elphyta /home/elphyta/elphyta

# If dist directory exists, remove it completely
sudo rm -rf /home/elphyta/elphyta/dist

# Rebuild frontend with new environment variables
NODE_ENV=production pnpm run build

# Fix permissions for the new build
sudo chown -R www-data:www-data /home/elphyta/elphyta/dist
sudo find /home/elphyta/elphyta/dist -type f -exec chmod 644 {} \;
sudo find /home/elphyta/elphyta/dist -type d -exec chmod 755 {} \;

# Restart API server
pm2 start elphyta-api
sudo systemctl reload nginx
```

## Troubleshooting: 502 Bad Gateway Error

If you get a `502 Bad Gateway` error when accessing the API:

### Check API Server Status
```bash
# Check if the API server is running
pm2 status
pm2 logs elphyta-api

# Check what's running on port 3001
sudo netstat -tlnp | grep :3001
```

### Common Fixes

1. **API server not running**:
   ```bash
   pm2 start elphyta-api
   ```

2. **API server crashed**:
   ```bash
   pm2 restart elphyta-api
   pm2 logs elphyta-api --lines 50
   ```

3. **Wrong port in Nginx config**:
   ```bash
   # Check Nginx config
   sudo nginx -t
   
   # Verify API is on port 3001
   curl http://localhost:3001/api/health
   ```

4. **Environment variables missing**:
   ```bash
   # Check if .env file exists in project root
   ls -la /home/elphyta/elphyta/.env
   
   # Restart with environment
   pm2 restart elphyta-api
   ```

5. **Missing dependencies (ts-node error)**:
   ```bash
   # Install missing dependencies
   cd /home/elphyta/elphyta
   pnpm install
   
   # Or specifically install ts-node
   pnpm add -D ts-node
   
   # Restart API server
   pm2 restart elphyta-api
   ```

6. **Module resolution errors (Cannot find module)**:
   ```bash
   # Check the error logs for missing .js extensions
   pm2 logs elphyta-api --lines 20
   
   # If you see "Cannot find module" errors, ensure all imports
   # in TypeScript files use .js extensions for ES modules
   # Example: import Question from '../../api/models/Question.js'
   
   # Check for syntax errors in import statements
   # Example: Fix 'aimport' to 'import'
   
   # After fixing imports, restart the server
   pm2 restart elphyta-api
   ```

7. **Vercel to VPS Migration Issues (404 Not Found)**

The 404 "Route POST /auth/login not found" error occurs because:
1. The reverse proxy (nginx) strips the `/api` prefix before forwarding to Express
2. Express routes are mounted at `/api/auth` but receive requests at `/auth`
3. The VPS server needs to handle both prefixed and non-prefixed routes

### Root Cause
- Frontend calls `https://elphyta.online/api/auth/login`
- Nginx strips `/api` and forwards `/auth/login` to Express
- Express only has routes mounted at `/api/auth`, not `/auth`
- Results in 404 "Route POST /auth/login not found"

### Solution: Update VPS Server

**Step 1: Update your code on VPS**
```bash
# Pull latest changes (if using git)
git pull origin main

# Or manually update server.ts with the new route configuration
```

**Step 2: Restart the server on VPS**
```bash
# Stop current PM2 process
pm2 stop elphyta-api
pm2 delete elphyta-api

# Install dependencies (if needed)
npm install

# Start with new server configuration
pm2 start npm --name "elphyta-api" -- run start

# Verify server is running
pm2 status
pm2 logs elphyta-api
```

**Step 3: Test the endpoints**
```bash
# Test health endpoint
curl http://localhost:3001/health
curl http://localhost:3001/api/health

# Test auth endpoint
curl -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'
curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'
```

### Updated Route Configuration
The new `server.ts` handles both route patterns:
```javascript
// Routes - handle both /api prefixed and non-prefixed routes for VPS compatibility
app.use('/auth', authRoutes);        // For nginx-stripped requests
app.use('/game', gameRoutes);
app.use('/admin', adminRoutes);
app.use('/api/auth', authRoutes);    // For direct API calls
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes);
```

### Key Differences
- **Server File**: VPS uses `server.ts` instead of `api/index.ts`
- **Route Mounting**: Handles both `/api/auth` and `/auth` patterns
- **Reverse Proxy**: Accounts for nginx URL rewriting
- **Database Config**: Uses `database.ts` instead of `vercel-database.ts`

### Start Backend with PM2

**Important**: For VPS deployment, we use `server.ts` instead of `api/index.ts` (which is for Vercel serverless functions).

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

Add this content:
```javascript
module.exports = {
  apps: [{
    name: 'elphyta-api',
    script: './server.ts',
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
    server_name elphyta.online www.elphyta.online;

    # Cache static assets (must be before the main location block)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /home/elphyta/elphyta/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
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
        
        # Increase timeout for API requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Serve static files (React build) - must be last
    location / {
        root /home/elphyta/elphyta/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
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
# Remove default Nginx site if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# Enable the site
sudo ln -s /etc/nginx/sites-available/elphyta /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx status
sudo systemctl status nginx
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
sudo certbot --nginx -d elphyta.online -d www.elphyta.online

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
  (import.meta.env.DEV ? 'http://localhost:3001' : 'https://elphyta.online/api');
```

Create production environment file:
```bash
nano .env.production
```

```env
VITE_API_BASE_URL=https://elphyta.online/api
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

### 500 Internal Server Error - Common Causes and Solutions

#### 1. Nginx Redirection Cycle Error ("rewrite or internal redirection cycle")

**Error Message**: `rewrite or internal redirection cycle while internally redirecting to "/index.html"`

**Cause**: Nested location blocks in Nginx configuration causing infinite redirects.

**Fix**: Update your Nginx configuration:
```bash
# Edit your Nginx site configuration
sudo nano /etc/nginx/sites-available/truth-or-dare

# Replace the server block with the corrected version (see configuration above)
# Key changes:
# - Move static assets location block BEFORE the main location /
# - Remove nested location blocks
# - Ensure proper order: static assets, API routes, then main location

# Test the configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

#### 2. File Permissions Issues (Also Very Common)

**Error Message**: `stat() "/home/elphyta/elphyta/dist/" failed (13: Permission denied)`

**Immediate Fix for elphyta.online:**
```bash
# Fix ownership and permissions for your specific path
sudo chown -R www-data:www-data /home/elphyta/elphyta/dist
sudo chmod -R 755 /home/elphyta/elphyta/dist

# Fix permissions for all files (including assets)
sudo find /home/elphyta/elphyta/dist -type f -exec chmod 644 {} \;
sudo find /home/elphyta/elphyta/dist -type d -exec chmod 755 {} \;

# Specifically fix assets folder permissions
sudo chown -R www-data:www-data /home/elphyta/elphyta/dist/assets
sudo chmod -R 755 /home/elphyta/elphyta/dist/assets
sudo chmod -R 644 /home/elphyta/elphyta/dist/assets/*

# Add elphyta user to www-data group
sudo usermod -a -G www-data elphyta

# Set proper permissions for parent directories
sudo chmod 755 /home/elphyta
sudo chmod 755 /home/elphyta/elphyta

# Restart nginx after permission changes
sudo systemctl restart nginx
```

**Verify the fix:**
```bash
# Check if nginx can now access the files
sudo -u www-data ls -la /home/elphyta/elphyta/dist/
sudo -u www-data ls -la /home/elphyta/elphyta/dist/assets/
sudo -u www-data cat /home/elphyta/elphyta/dist/index.html | head -5

# Test specific asset files that were failing
sudo -u www-data cat /home/elphyta/elphyta/dist/assets/index-CllSyvji.css | head -3
sudo -u www-data head -3 /home/elphyta/elphyta/dist/assets/index-BvBa8ExY.js

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test your site
curl -I https://elphyta.online
curl -I https://elphyta.online/assets/index-CllSyvji.css
```

**If still getting permission errors:**
```bash
# Check SELinux (if enabled)
sudo getenforce
# If enforcing, temporarily disable
sudo setenforce 0

# Check parent directory permissions
ls -la /home/elphyta/
ls -la /home/elphyta/elphyta/

# Alternative: Move files to /var/www/html (standard nginx location)
sudo cp -r /home/elphyta/elphyta/dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/
# Then update nginx config to point to /var/www/html
```

**Generic Fix (for other deployments):**
```bash
# Fix ownership and permissions
sudo chown -R www-data:www-data /home/yourusername/elphyta/dist
sudo chmod -R 755 /home/yourusername/elphyta/dist
sudo chmod 755 /home/yourusername/elphyta
sudo chmod 755 /home/yourusername
sudo chmod 755 /home

# Add user to www-data group
sudo usermod -a -G www-data yourusername

# Restart Nginx
sudo systemctl restart nginx
```

#### 2. Check Application Logs
```bash
# Check PM2 application logs
pm2 logs elphyta-api

# Check if the API is running
pm2 status

# Test API directly
curl http://localhost:3001/api/health
```

#### 3. Check Nginx Configuration
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check access logs
sudo tail -f /var/log/nginx/access.log
```

#### 4. Verify File Structure
```bash
# Check if dist folder exists and has content
ls -la /home/yourusername/elphyta/dist/

# Check if index.html exists
ls -la /home/yourusername/elphyta/dist/index.html

# Check directory permissions
namei -l /home/yourusername/elphyta/dist/index.html
```

#### 5. Database Connection Issues
```bash
# Check environment variables
cat /home/yourusername/elphyta/.env

# Test MongoDB Atlas connection (if using Atlas)
# Check if your VPS IP is whitelisted in MongoDB Atlas

# For local MongoDB, check if it's running
sudo systemctl status mongod
```

#### 6. SELinux Issues (if enabled)
```bash
# Check if SELinux is enforcing
getenforce

# If SELinux is enabled, set proper context
sudo setsebool -P httpd_can_network_connect 1
sudo chcon -R -t httpd_exec_t /home/yourusername/elphyta/dist/
```

### Quick Diagnostic Commands
```bash
# Complete system check
echo "=== Node.js Version ==="
node --version

echo "=== PM2 Status ==="
pm2 status

echo "=== Nginx Status ==="
sudo systemctl status nginx

echo "=== Nginx Test ==="
sudo nginx -t

echo "=== File Permissions ==="
ls -la /home/yourusername/elphyta/dist/

echo "=== API Health Check ==="
curl -s http://localhost:3001/api/health || echo "API not responding"

echo "=== Recent Nginx Errors ==="
sudo tail -5 /var/log/nginx/error.log
```

### Step-by-Step 500 Error Resolution

1. **Run the diagnostic commands above**
2. **Fix file permissions** (most common issue)
3. **Restart all services**:
   ```bash
   pm2 restart all
   sudo systemctl restart nginx
   ```
4. **Check logs again** for any remaining errors
5. **Test the application** in browser

### Common Issues

1. **Application not starting**: Check PM2 logs with `pm2 logs`
2. **Database connection issues**: Verify MongoDB is running and credentials are correct
3. **Nginx 502 errors**: Check if backend is running on correct port
4. **Permission issues**: Ensure correct file ownership with `sudo chown -R yourusername:yourusername /path/to/app`
5. **Port conflicts**: Make sure port 3001 is not used by other services
6. **Firewall blocking**: Check UFW status and rules
7. **DNS issues**: Verify domain points to correct IP
8. **SSL certificate problems**: Check certificate validity
9. **Build issues**: Ensure `pnpm run build` completed successfully

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