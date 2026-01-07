# Clock Application - Production Deployment Guide

## Overview

This guide provides instructions for deploying the Clock application to production on server 192.168.0.77. The application will be accessible at `http://time.tcode.tw`.

## Architecture

### Service Structure
```
time.tcode.tw (Port 80)
├── Nginx Reverse Proxy
    ├── Frontend (Next.js on port 3000)
    └── Backend (Go API on port 8080)
        └── PostgreSQL Database (port 5436)
```

### Port Configuration
| Service | Port | Access |
|---------|------|--------|
| Nginx | 80 | Public (time.tcode.tw) |
| PostgreSQL | 5436 | Docker network only |
| Backend | 8080 | Docker network only |
| Frontend | 3000 | Docker network only |

## Prerequisites

- SSH access to deployment server (192.168.0.77)
- GitHub repository with clock application
- Docker and Docker Compose installed on server
- DNS configured: `time.tcode.tw` → `192.168.0.77`

## Initial Setup (One-Time)

### 1. Configure DNS

**Option A: DNS Server** (if you control tcode.tw domain)
```bash
# Add A record in your DNS management console
time.tcode.tw → 192.168.0.77
```

**Option B: Local hosts file** (for testing/local network)
```bash
# On your local machine
sudo nano /etc/hosts

# Add this line:
192.168.0.77    time.tcode.tw
```

**Verify DNS:**
```bash
ping time.tcode.tw
# Should resolve to 192.168.0.77
```

### 2. SSH to Server

```bash
ssh lachesis@192.168.0.77
```

### 3. Create Deployment Directory

```bash
mkdir -p ~/clock-deployment
cd ~/clock-deployment
```

### 4. Create Production Environment File

```bash
nano .env.prod
```

**Environment File Template:**
```bash
# Database Configuration
DB_USER=clock_user
DB_PASSWORD=REPLACE_WITH_SECURE_PASSWORD
DB_NAME=clock

# JWT Configuration (minimum 32 characters each)
JWT_SECRET=REPLACE_WITH_SECURE_SECRET_32_CHARS_MIN
JWT_REFRESH_SECRET=REPLACE_WITH_DIFFERENT_SECRET_32_CHARS_MIN
JWT_EXPIRATION=2592000
JWT_REFRESH_EXPIRATION=2592000

# Application Configuration
FRONTEND_URL=http://time.tcode.tw
NEXT_PUBLIC_API_URL=http://time.tcode.tw/api/v1

# Environment
ENV=production
LOG_LEVEL=info
```

**Generate Secure Secrets:**
```bash
# Generate secure passwords/secrets (run 3 times for DB_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET)
openssl rand -base64 32
```

**Important:** Replace all `REPLACE_WITH_*` placeholders with actual secure values.

### 5. Copy Build Script to Server

```bash
# From your local machine
scp ~/clock/build.sh lachesis@192.168.0.77:~/clock-deployment/

# On the server, make it executable
ssh lachesis@192.168.0.77
cd ~/clock-deployment
chmod +x build.sh
```

### 6. Update Build Script with Repository URL

```bash
nano build.sh

# Update line 10 with your actual repository URL:
REPO_URL="https://github.com/YOUR-ORG/clock.git"
```

### 7. Run Initial Deployment

```bash
./build.sh prod
```

This will:
- Clone the repository
- Build Docker images
- Start all services
- Run database migrations
- Verify health checks

## Regular Deployment Workflow

### From Your Local Machine

```bash
# 1. Commit and push changes to GitHub (main branch)
cd ~/clock
git add .
git commit -m "Your commit message"
git push origin main

# 2. Trigger deployment on server
ssh lachesis@192.168.0.77 "cd ~/clock-deployment && ./build.sh prod"

# 3. Verify deployment
curl http://time.tcode.tw
```

### Quick One-Liner Deployment

```bash
ssh lachesis@192.168.0.77 "cd ~/clock-deployment && ./build.sh prod"
```

## Monitoring

### View Application Status

```bash
ssh lachesis@192.168.0.77

# List running containers
docker ps | grep clock

# View all service status
cd ~/clock-deployment
docker-compose -f docker-compose.prod.yml ps

# View logs (all services)
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker logs -f clock_backend_prod
docker logs -f clock_frontend_prod
docker logs -f clock_postgres_prod
docker logs -f clock_nginx_prod

# View last 100 lines
docker logs --tail 100 clock_backend_prod
```

### Health Checks

```bash
# Check Nginx
curl http://time.tcode.tw/health
# Expected: "healthy"

# Check Backend API
curl http://time.tcode.tw/api/v1/health
# Expected: JSON response with status

# Check Frontend (should return HTML)
curl http://time.tcode.tw | head -20

# Check from external machine
curl http://192.168.0.77/health
```

## Database Management

### Access Database

```bash
ssh lachesis@192.168.0.77

# Access PostgreSQL shell
docker exec -it clock_postgres_prod psql -U clock_user -d clock

# Run queries
\dt          # List tables
\d employees # Describe employees table
SELECT * FROM employees LIMIT 5;
\q           # Quit
```

### Create Database Backup

```bash
ssh lachesis@192.168.0.77

# Create backup with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p ~/clock-deployment/backups
docker exec clock_postgres_prod pg_dump -U clock_user clock > \
    ~/clock-deployment/backups/clock_backup_$TIMESTAMP.sql

# Verify backup
ls -lh ~/clock-deployment/backups/
```

### Restore Database from Backup

```bash
ssh lachesis@192.168.0.77

# Restore from backup file
docker exec -i clock_postgres_prod psql -U clock_user clock < \
    ~/clock-deployment/backups/clock_backup_20260107_120000.sql
```

### Automated Daily Backups (Optional)

```bash
# Create backup script
nano ~/clock-deployment/backup_db.sh
```

```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$HOME/clock-deployment/backups"
mkdir -p "$BACKUP_DIR"
docker exec clock_postgres_prod pg_dump -U clock_user clock > \
    "$BACKUP_DIR/clock_backup_$TIMESTAMP.sql"
# Keep only last 7 days
find "$BACKUP_DIR" -name "clock_backup_*.sql" -mtime +7 -delete
```

```bash
chmod +x ~/clock-deployment/backup_db.sh

# Add to crontab (runs daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/lachesis/clock-deployment/backup_db.sh
```

## Troubleshooting

### Application Not Accessible

**Check if containers are running:**
```bash
docker ps | grep clock
```

**If containers are not running:**
```bash
cd ~/clock-deployment
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs
```

**Check health status:**
```bash
docker-compose -f docker-compose.prod.yml ps
# Look for "(healthy)" status
```

**Check nginx logs:**
```bash
docker logs clock_nginx_prod
```

### Database Connection Failed

**Check PostgreSQL is running and healthy:**
```bash
docker-compose -f docker-compose.prod.yml ps clock_postgres_prod
# Should show "healthy"
```

**Test database connection:**
```bash
docker exec -it clock_postgres_prod pg_isready -U clock_user -d clock -h localhost
# Expected: "localhost:5432 - accepting connections"
```

**Check environment variables:**
```bash
cat ~/clock-deployment/.env.prod | grep DB_
```

**Check backend can connect to database:**
```bash
docker logs clock_backend_prod | grep -i "database\|connection\|migration"
```

### Backend API Returns 500 Errors

**Check backend logs:**
```bash
docker logs -f clock_backend_prod
```

**Check if migrations ran successfully:**
```bash
docker logs clock_backend_prod | grep -i "migration"
# Look for "Migrated X migrations"
```

**Restart backend:**
```bash
cd ~/clock-deployment
docker-compose -f docker-compose.prod.yml restart clock_backend_prod
docker logs -f clock_backend_prod
```

### Frontend Shows Blank Page

**Check frontend logs:**
```bash
docker logs -f clock_frontend_prod
```

**Verify NEXT_PUBLIC_API_URL:**
```bash
docker-compose -f docker-compose.prod.yml exec clock_frontend_prod env | grep NEXT
# Should show: NEXT_PUBLIC_API_URL=http://time.tcode.tw/api/v1
```

**Check nginx routing:**
```bash
docker logs clock_nginx_prod
curl -v http://time.tcode.tw/
```

### Build Script Fails

**Check repository access:**
```bash
cd ~/clock-deployment/repos/clock
git pull origin main
# Should succeed without errors
```

**Check disk space:**
```bash
df -h
# Ensure sufficient space for Docker images
```

**Check Docker service:**
```bash
systemctl status docker
docker info
```

### Port Already in Use

**Check what's using port 80:**
```bash
sudo lsof -i :80
```

**Stop clock services:**
```bash
cd ~/clock-deployment
docker-compose -f docker-compose.prod.yml down
```

## Emergency Recovery

### Complete Container Reset (Keeps Database)

```bash
ssh lachesis@192.168.0.77
cd ~/clock-deployment

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Start fresh
./build.sh prod
```

### Complete Reset (Deletes Database - USE WITH CAUTION)

```bash
ssh lachesis@192.168.0.77
cd ~/clock-deployment

# Backup database first!
docker exec clock_postgres_prod pg_dump -U clock_user clock > backup_before_reset.sql

# Stop services and remove volumes
docker-compose -f docker-compose.prod.yml down -v

# Start fresh (migrations will recreate database)
./build.sh prod
```

### Rollback to Previous Version

```bash
ssh lachesis@192.168.0.77
cd ~/clock-deployment/repos/clock

# View commit history
git log --oneline -10

# Reset to previous commit
git reset --hard COMMIT_HASH

# Rebuild and deploy
cd ~/clock-deployment
./build.sh prod
```

## Service Management

### Restart Single Service

```bash
cd ~/clock-deployment

# Restart backend
docker-compose -f docker-compose.prod.yml restart clock_backend_prod

# Restart frontend
docker-compose -f docker-compose.prod.yml restart clock_frontend_prod

# Restart nginx
docker-compose -f docker-compose.prod.yml restart clock_nginx_prod
```

### Stop All Services

```bash
cd ~/clock-deployment
docker-compose -f docker-compose.prod.yml down
```

### Start Services

```bash
cd ~/clock-deployment
docker-compose -f docker-compose.prod.yml up -d
```

### View Resource Usage

```bash
# Container resource usage
docker stats

# Specific to clock services
docker stats --no-stream | grep clock
```

## Security Checklist

- [ ] SSH keys configured (no password authentication)
- [ ] Firewall configured (allow only ports 22 and 80)
- [ ] `.env.prod` has strong passwords (32+ characters)
- [ ] `.env.prod` file permissions set to 600
- [ ] JWT secrets are different from each other
- [ ] Database not exposed directly (only via Docker network)
- [ ] Regular database backups scheduled
- [ ] Access logs monitored periodically
- [ ] Docker images updated regularly

### Securing .env.prod

```bash
# Set proper permissions
chmod 600 ~/clock-deployment/.env.prod

# Verify
ls -l ~/clock-deployment/.env.prod
# Should show: -rw------- (owner read/write only)
```

## Performance Optimization

### Monitor Performance

```bash
# Check Docker stats
docker stats --no-stream

# Check disk usage
docker system df

# Check container logs size
du -sh /var/lib/docker/containers/*
```

### Increase Resources (if needed)

Edit `docker-compose.prod.yml` to add resource limits:

```yaml
services:
  clock_backend_prod:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## Maintenance Tasks

### Daily
- Monitor application availability
- Check for errors in logs

### Weekly
- Create database backup
- Review access logs
- Check disk space

### Monthly
- Update Docker images
- Review performance metrics
- Test disaster recovery procedures

## Quick Reference Commands

```bash
# Deploy
ssh lachesis@192.168.0.77 "cd ~/clock-deployment && ./build.sh prod"

# View logs
ssh lachesis@192.168.0.77 "docker logs -f clock_backend_prod"

# Access database
ssh lachesis@192.168.0.77 "docker exec -it clock_postgres_prod psql -U clock_user -d clock"

# Restart service
ssh lachesis@192.168.0.77 "cd ~/clock-deployment && docker-compose -f docker-compose.prod.yml restart clock_backend_prod"

# Backup database
ssh lachesis@192.168.0.77 "docker exec clock_postgres_prod pg_dump -U clock_user clock > ~/clock_backup.sql"

# Check status
ssh lachesis@192.168.0.77 "docker ps | grep clock"
```

## Support and Documentation

- **Main Documentation**: `/Users/jim/clock/README.md`
- **Plan File**: `/Users/jim/.claude/plans/spicy-greeting-locket.md`
- **Architecture**: `/Users/jim/clock/ARCHITECTURE.md`
- **GitHub Repository**: (update with actual URL)

## Important Notes

- Access URL: `http://time.tcode.tw`
- Port 80 is used (ensure DNS is configured)
- Database data persists in named volume `clock_postgres_prod_data`
- Build process takes 2-3 minutes (Next.js compilation)
- Migrations run automatically on backend startup
- All services have health checks enabled
- Services restart automatically on failure (`unless-stopped`)

## Contact

For issues or questions:
1. Check troubleshooting section above
2. Review logs: `docker-compose logs -f`
3. Verify environment variables in `.env.prod`
4. Check GitHub repository issues
