#!/bin/bash
# Script to set up self-signed SSL certificates for production

set -e

echo "=========================================="
echo "Self-Signed SSL Certificate Setup"
echo "=========================================="
echo ""

# Configuration
DOMAIN="time.tcode.tw"
DEPLOYMENT_DIR="${1:-/Users/lachesis/clock-deployment}"

echo "Domain: $DOMAIN"
echo "Deployment directory: $DEPLOYMENT_DIR"
echo ""
echo "This will create a self-signed certificate."
echo "Note: Browsers will show a security warning that you'll need to accept."
echo ""

read -p "Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Creating directories..."
mkdir -p "$DEPLOYMENT_DIR/ssl"

echo ""
echo "=========================================="
echo "Generating Self-Signed Certificate"
echo "=========================================="
echo ""

# Generate self-signed certificate (valid for 365 days)
docker run --rm \
  -v "$DEPLOYMENT_DIR/ssl:/ssl" \
  alpine/openssl \
  req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /ssl/privkey.pem \
  -out /ssl/fullchain.pem \
  -subj "/C=TW/ST=Taiwan/L=Taipei/O=Clock/OU=IT/CN=$DOMAIN" \
  -addext "subjectAltName=DNS:$DOMAIN,DNS:www.$DOMAIN,IP:192.168.0.77"

echo ""
echo "Certificate generated successfully!"
echo ""

echo "=========================================="
echo "Updating Nginx Configuration"
echo "=========================================="
echo ""

# Create self-signed SSL nginx config
cat > "$DEPLOYMENT_DIR/nginx/prod/nginx.prod.conf" << 'EOF'
# Clock Application Production Nginx Configuration with Self-Signed SSL

# Upstream definitions for backend services
upstream clock_frontend {
    server clock_frontend_prod:3000;
}

upstream clock_backend {
    server clock_backend_prod:8080;
}

# HTTP server - redirect to HTTPS
server {
    listen 80;
    server_name time.tcode.tw _;

    # Health check endpoint (allow HTTP)
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Redirect all other HTTP traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name time.tcode.tw _;

    # Self-signed SSL certificate paths
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Client upload limits
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/json application/javascript;
    gzip_min_length 1000;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logging
    access_log /var/log/nginx/clock_access.log;
    error_log /var/log/nginx/clock_error.log;

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Backend API routing
    location /api/ {
        proxy_pass http://clock_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Keep connections alive
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Static files caching (from Next.js public directory)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://clock_frontend;
        proxy_cache_valid 30d;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Frontend routing (root path and all non-API paths)
    location / {
        proxy_pass http://clock_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Next.js specific settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

echo "Nginx configuration updated"

echo ""
echo "=========================================="
echo "Updating docker-compose.prod.yml"
echo "=========================================="
echo ""

# Check if docker-compose has SSL volumes
if grep -q "./ssl:/etc/nginx/ssl:ro" "$DEPLOYMENT_DIR/docker-compose.prod.yml"; then
    echo "SSL volumes already configured"
else
    echo "Please manually add this volume to clock_nginx_prod in docker-compose.prod.yml:"
    echo "  - ./ssl:/etc/nginx/ssl:ro"
    echo ""
    read -p "Press Enter after you've updated docker-compose.prod.yml..."
fi

echo ""
echo "=========================================="
echo "Restarting Services"
echo "=========================================="
echo ""

cd "$DEPLOYMENT_DIR"
export PATH=/usr/local/bin:$PATH
docker-compose -f docker-compose.prod.yml restart clock_nginx_prod

echo ""
echo "=========================================="
echo "Self-Signed SSL Setup Complete!"
echo "=========================================="
echo ""
echo "Certificate location: $DEPLOYMENT_DIR/ssl/"
echo "Certificate valid for: 365 days"
echo ""
echo "⚠️  IMPORTANT:"
echo "When you first access https://time.tcode.tw or https://192.168.0.77,"
echo "your browser will show a security warning."
echo ""
echo "To proceed:"
echo "  Chrome/Edge: Click 'Advanced' → 'Proceed to site (unsafe)'"
echo "  Firefox: Click 'Advanced' → 'Accept the Risk and Continue'"
echo "  Safari: Click 'Show Details' → 'visit this website'"
echo ""
echo "This is normal for self-signed certificates!"
echo ""
echo "Your site is now available at:"
echo "  https://time.tcode.tw"
echo "  https://192.168.0.77"
echo ""
