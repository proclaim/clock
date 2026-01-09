#!/bin/bash
# Script to set up Let's Encrypt SSL certificates for production

set -e

echo "=========================================="
echo "SSL Certificate Setup for Clock"
echo "=========================================="
echo ""

# Configuration
DOMAIN="time.tcode.tw"
EMAIL="admin@tcode.tw"  # Change this to your email
DEPLOYMENT_DIR="${1:-/Users/lachesis/clock-deployment}"

echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "Deployment directory: $DEPLOYMENT_DIR"
echo ""

read -p "Is this information correct? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Creating directories for certbot..."
mkdir -p "$DEPLOYMENT_DIR/certbot/conf"
mkdir -p "$DEPLOYMENT_DIR/certbot/www"

echo ""
echo "=========================================="
echo "Step 1: Requesting SSL Certificate"
echo "=========================================="
echo ""
echo "This will use Let's Encrypt to obtain a certificate."
echo "Make sure:"
echo "  1. Port 80 is accessible from the internet"
echo "  2. DNS for $DOMAIN points to this server"
echo ""

# Stop nginx temporarily if running
cd "$DEPLOYMENT_DIR"
docker-compose -f docker-compose.prod.yml stop clock_nginx_prod 2>/dev/null || true

# Request certificate using certbot standalone mode
docker run -it --rm \
  -p 80:80 \
  -v "$DEPLOYMENT_DIR/certbot/conf:/etc/letsencrypt" \
  -v "$DEPLOYMENT_DIR/certbot/www:/var/www/certbot" \
  certbot/certbot certonly \
  --standalone \
  --preferred-challenges http \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"

echo ""
echo "=========================================="
echo "Step 2: Switching to SSL Configuration"
echo "=========================================="
echo ""

# Backup current nginx config
if [ -f "$DEPLOYMENT_DIR/nginx/prod/nginx.prod.conf" ]; then
    cp "$DEPLOYMENT_DIR/nginx/prod/nginx.prod.conf" "$DEPLOYMENT_DIR/nginx/prod/nginx.prod.conf.backup"
    echo "Backed up current nginx config"
fi

# Copy SSL configuration
cp "$DEPLOYMENT_DIR/repos/clock/nginx/prod/nginx.ssl.conf" "$DEPLOYMENT_DIR/nginx/prod/nginx.prod.conf"
echo "SSL configuration activated"

# Update docker-compose to include certbot volumes
echo ""
echo "Please manually update docker-compose.prod.yml to add certbot volumes:"
echo ""
echo "For clock_nginx_prod service, add these volumes:"
echo "  - ./certbot/conf:/etc/letsencrypt:ro"
echo "  - ./certbot/www:/var/www/certbot:ro"
echo ""

read -p "Press Enter after you've updated docker-compose.prod.yml..."

echo ""
echo "=========================================="
echo "Step 3: Restarting Services"
echo "=========================================="
echo ""

cd "$DEPLOYMENT_DIR"
docker-compose -f docker-compose.prod.yml up -d clock_nginx_prod

echo ""
echo "=========================================="
echo "SSL Setup Complete!"
echo "=========================================="
echo ""
echo "Certificate location: $DEPLOYMENT_DIR/certbot/conf/live/$DOMAIN/"
echo "Certificate will expire in 90 days"
echo ""
echo "To renew certificate automatically, add this to crontab:"
echo "0 0 1 * * cd $DEPLOYMENT_DIR && docker-compose -f docker-compose.prod.yml run --rm certbot renew && docker-compose -f docker-compose.prod.yml restart clock_nginx_prod"
echo ""
echo "Your site should now be available at: https://$DOMAIN"
echo ""
