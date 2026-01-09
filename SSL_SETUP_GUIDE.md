# SSL Setup Guide for Clock Production

This guide explains how to set up HTTPS/SSL for the Clock application using Let's Encrypt.

## Prerequisites

Before setting up SSL, ensure:

1. **Domain Name**: `time.tcode.tw` should point to your server's public IP
2. **Port 80 Open**: Your server must be accessible on port 80 from the internet
3. **Port 443 Open**: Your server must be accessible on port 443 from the internet
4. **Valid Email**: You need an email address for Let's Encrypt notifications

## Quick Setup (Automated)

1. SSH to production server:
   ```bash
   ssh lachesis@192.168.0.77
   cd clock-deployment
   ```

2. Update the repository:
   ```bash
   cd repos/clock
   git pull origin main
   cd ../..
   ```

3. Run the SSL setup script:
   ```bash
   ./repos/clock/scripts/setup-ssl.sh /Users/lachesis/clock-deployment
   ```

4. Follow the prompts to:
   - Confirm domain and email
   - Wait for certificate generation
   - Restart services with SSL enabled

## Manual Setup

### Step 1: Obtain SSL Certificate

```bash
# Create directories
mkdir -p /Users/lachesis/clock-deployment/certbot/conf
mkdir -p /Users/lachesis/clock-deployment/certbot/www

# Stop nginx temporarily
cd /Users/lachesis/clock-deployment
docker-compose -f docker-compose.prod.yml stop clock_nginx_prod

# Request certificate
docker run -it --rm \
  -p 80:80 \
  -v "/Users/lachesis/clock-deployment/certbot/conf:/etc/letsencrypt" \
  -v "/Users/lachesis/clock-deployment/certbot/www:/var/www/certbot" \
  certbot/certbot certonly \
  --standalone \
  --preferred-challenges http \
  --email admin@tcode.tw \
  --agree-tos \
  --no-eff-email \
  -d time.tcode.tw
```

### Step 2: Update Nginx Configuration

```bash
# Backup current config
cp nginx/prod/nginx.prod.conf nginx/prod/nginx.prod.conf.backup

# Copy SSL configuration
cp repos/clock/nginx/prod/nginx.ssl.conf nginx/prod/nginx.prod.conf
```

### Step 3: Update docker-compose.prod.yml

The file is already updated with SSL support. Verify it includes:

```yaml
  clock_nginx_prod:
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/prod/nginx.prod.conf:/etc/nginx/conf.d/default.conf:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
```

### Step 4: Restart Services

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Certificate Renewal

Let's Encrypt certificates expire after 90 days. The certbot container automatically renews them.

To manually renew:

```bash
cd /Users/lachesis/clock-deployment
docker-compose -f docker-compose.prod.yml run --rm certbot renew
docker-compose -f docker-compose.prod.yml restart clock_nginx_prod
```

## Verification

After setup, verify SSL is working:

```bash
# Test HTTPS
curl -I https://time.tcode.tw

# Check certificate
openssl s_client -connect time.tcode.tw:443 -servername time.tcode.tw < /dev/null 2>/dev/null | openssl x509 -text -noout | grep "Not After"
```

## Troubleshooting

### Certificate Generation Failed

1. **DNS not pointing to server**: Ensure `time.tcode.tw` resolves to your server's IP
   ```bash
   nslookup time.tcode.tw
   ```

2. **Port 80 blocked**: Check firewall allows port 80
   ```bash
   netstat -an | grep :80
   ```

3. **Domain already has certificate**: Use `certbot renew` instead

### HTTPS Not Working

1. **Check nginx is listening on 443**:
   ```bash
   docker exec clock_nginx_prod netstat -an | grep 443
   ```

2. **Check certificate files exist**:
   ```bash
   ls -la certbot/conf/live/time.tcode.tw/
   ```

3. **Check nginx logs**:
   ```bash
   docker logs clock_nginx_prod
   ```

### Mixed Content Errors

If you see "mixed content" errors in browser console:
1. Update frontend API URL to use `https://`
2. Clear browser cache
3. Check that all resources are loaded via HTTPS

## Configuration Files

- **HTTP + HTTPS Config**: `nginx/prod/nginx.ssl.conf`
- **HTTP Only Config**: `nginx/prod/nginx.prod.conf` (backup)
- **SSL Certificates**: `certbot/conf/live/time.tcode.tw/`
- **ACME Challenge**: `certbot/www/`

## Features

✅ Automatic HTTP to HTTPS redirect
✅ TLS 1.2 and TLS 1.3 support
✅ Strong cipher configuration
✅ HSTS header for security
✅ Automatic certificate renewal
✅ Let's Encrypt integration

## Without SSL (Current Setup)

If you don't want to set up SSL yet, the application works fine with HTTP. The CORS configuration supports both:
- `http://time.tcode.tw`
- `http://192.168.0.77`
- `https://time.tcode.tw` (for when SSL is enabled)
