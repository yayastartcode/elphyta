#!/bin/bash

# Deployment script for Truth or Dare application on Ubuntu VPS
# Run this script on your VPS after initial setup

set -e  # Exit on any error

echo "🚀 Starting deployment..."

# Configuration
APP_DIR="/home/$(whoami)/elphyta-app"
REPO_URL="https://github.com/yourusername/your-repo.git"  # Update this
BRANCH="main"
BACKUP_DIR="/home/$(whoami)/backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run this script as root"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database before deployment
print_status "Creating database backup..."
DATE=$(date +"%Y%m%d_%H%M%S")
mongodump --db elphyta_db --out "$BACKUP_DIR/mongodb_$DATE" 2>/dev/null || print_warning "Database backup failed (database might not exist yet)"

# Clone or update repository
if [ -d "$APP_DIR" ]; then
    print_status "Updating existing repository..."
    cd "$APP_DIR"
    git fetch origin
    git reset --hard origin/$BRANCH
else
    print_status "Cloning repository..."
    git clone -b $BRANCH "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# Install dependencies
print_status "Installing dependencies..."
pnpm install --frozen-lockfile

# Check if .env exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from .env.example..."
    cp .env.example .env
    print_warning "Please edit .env file with your production settings before continuing"
    print_warning "Press Enter when ready to continue..."
    read
fi

# Build frontend
print_status "Building frontend..."
pnpm run build

# Stop existing PM2 processes
print_status "Stopping existing application..."
pm2 stop elphyta-api 2>/dev/null || print_warning "No existing PM2 process found"

# Create PM2 ecosystem file if it doesn't exist
if [ ! -f "ecosystem.config.js" ]; then
    print_status "Creating PM2 ecosystem configuration..."
    cat > ecosystem.config.js << EOF
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
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF
fi

# Create logs directory
mkdir -p logs

# Start application with PM2
print_status "Starting application..."
pm2 start ecosystem.config.js
pm2 save

# Update Nginx configuration if needed
NGINX_CONFIG="/etc/nginx/sites-available/elphyta"
if [ ! -f "$NGINX_CONFIG" ]; then
    print_warning "Nginx configuration not found. Please run the initial setup first."
else
    print_status "Reloading Nginx..."
    sudo nginx -t && sudo systemctl reload nginx
fi

# Check application health
print_status "Checking application health..."
sleep 5

if pm2 list | grep -q "elphyta-api.*online"; then
    print_status "✅ Application is running successfully!"
else
    print_error "❌ Application failed to start. Check logs with: pm2 logs elphyta-api"
    exit 1
fi

# Test API endpoint
print_status "Testing API endpoint..."
if curl -f http://localhost:3001/health >/dev/null 2>&1; then
    print_status "✅ API is responding!"
else
    print_warning "⚠️  API health check failed. This might be normal if you don't have a health endpoint."
fi

# Show status
print_status "Deployment completed! Here's the current status:"
echo ""
pm2 status
echo ""
print_status "Useful commands:"
echo "  - View logs: pm2 logs elphyta-api"
echo "  - Restart app: pm2 restart elphyta-api"
echo "  - Stop app: pm2 stop elphyta-api"
echo "  - Monitor: pm2 monit"
echo "  - Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo ""
print_status "🎉 Deployment successful!"