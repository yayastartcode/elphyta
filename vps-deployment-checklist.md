# VPS Deployment Checklist

This checklist ensures you don't miss any steps when deploying to your Ubuntu 24.04 VPS.

## Pre-Deployment Checklist

### 1. VPS Setup
- [ ] Ubuntu 24.04 server provisioned
- [ ] Domain name configured (A record pointing to VPS IP)
- [ ] SSH access configured
- [ ] Non-root user created with sudo privileges

### 2. Server Dependencies
- [ ] Node.js 20.x LTS installed
- [ ] pnpm installed globally
- [ ] Database configured (MongoDB Atlas OR local MongoDB 7.0)
- [ ] Nginx installed
- [ ] PM2 installed globally
- [ ] UFW firewall configured
- [ ] SSL certificate obtained (Let's Encrypt)

### 3. Application Configuration
- [ ] Repository cloned to VPS
- [ ] `.env` file created with production values
- [ ] MongoDB user and database created
- [ ] Frontend built successfully
- [ ] PM2 ecosystem file configured

## Deployment Steps

### 1. Initial Setup (Run once)
```bash
# Follow the ubuntu-vps-setup.md guide
# Then run:
chmod +x deploy.sh
```

### 2. Deploy Application
```bash
./deploy.sh
```

### 3. Verify Deployment
- [ ] Application starts without errors: `pm2 status`
- [ ] Health endpoint responds: `curl http://localhost:3001/health`
- [ ] Frontend loads: Visit your domain
- [ ] API calls work: Test login/registration
- [ ] Database operations work: Create user, play game

## Environment Variables for VPS

Create `/home/yourusername/elphyta-app/.env` with:

```env
# Database
# For MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
# OR for local MongoDB:
# MONGODB_URI=mongodb://elphyta_user:your-app-password@localhost:27017/elphyta_db

# JWT
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters

# Server
PORT=3001
NODE_ENV=production

# CORS
CLIENT_URL=https://yourdomain.com
PRODUCTION_URL=https://yourdomain.com

# Optional: Email configuration (if you add email features later)
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASS=your-app-password
```

## Nginx Configuration

Create `/etc/nginx/sites-available/elphyta`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (Let's Encrypt will add these)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Serve static files (React build)
    location / {
        root /home/yourusername/elphyta-app/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
```

## PM2 Ecosystem Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'elphyta-api',
    script: './api/index.ts',
    interpreter: 'node',
    interpreter_args: '--loader ts-node/esm',
    cwd: '/home/yourusername/elphyta-app',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
```

## Monitoring Commands

```bash
# Check application status
pm2 status
pm2 logs elphyta-api
pm2 monit

# Check system resources
htop
df -h
free -h

# Check services
sudo systemctl status nginx
sudo systemctl status mongod

# Check logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
sudo journalctl -u mongod -f

# Test endpoints
curl https://yourdomain.com/api/health
curl -I https://yourdomain.com
```

## Backup Strategy

### Database Backup
```bash
# Manual backup
mongodump --db elphyta_db --out /home/yourusername/backups/mongodb_$(date +%Y%m%d_%H%M%S)

# Automated daily backup (add to crontab)
0 2 * * * /home/yourusername/backup-db.sh
```

### Application Backup
```bash
# Backup application files
tar -czf /home/yourusername/backups/app_$(date +%Y%m%d_%H%M%S).tar.gz /home/yourusername/elphyta-app --exclude=node_modules --exclude=.git
```

## Security Checklist

- [ ] SSH key authentication enabled
- [ ] Password authentication disabled
- [ ] UFW firewall configured
- [ ] Fail2Ban installed and configured
- [ ] SSL certificate installed
- [ ] MongoDB authentication enabled
- [ ] Strong passwords used
- [ ] Regular security updates enabled
- [ ] Non-root user for application
- [ ] Proper file permissions set

## Performance Optimization

- [ ] Nginx gzip compression enabled
- [ ] Static file caching configured
- [ ] PM2 cluster mode (if needed)
- [ ] MongoDB indexes created
- [ ] Log rotation configured
- [ ] Monitoring setup (optional: Grafana + Prometheus)

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   - Check if PM2 process is running: `pm2 status`
   - Check if port 3001 is listening: `sudo netstat -tlnp | grep 3001`
   - Check PM2 logs: `pm2 logs elphyta-api`

2. **Database Connection Error**
   - Check MongoDB status: `sudo systemctl status mongod`
   - Verify credentials in .env file
   - Check MongoDB logs: `sudo journalctl -u mongod`

3. **Frontend Not Loading**
   - Check if build files exist: `ls -la /home/yourusername/elphyta-app/dist`
   - Check Nginx configuration: `sudo nginx -t`
   - Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`

4. **SSL Certificate Issues**
   - Renew certificate: `sudo certbot renew`
   - Check certificate status: `sudo certbot certificates`

### Emergency Recovery

```bash
# Restore from backup
mongorestore --db elphyta_db /path/to/backup/elphyta_db

# Rollback application
git reset --hard HEAD~1
pnpm install
pnpm run build
pm2 restart elphyta-api
```

This checklist ensures a smooth deployment and operation of your Truth or Dare application on a VPS!