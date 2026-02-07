# Clock Project - Claude Code Notes

## Production Server Access

```bash
ssh lachesis@192.168.0.77
```

Docker is located at `/usr/local/bin/docker` on the production server.

### Production Containers

- `clock_postgres_prod` - PostgreSQL database (port 5436:5432)
- `clock_backend_prod` - Go backend API (port 8080)
- `clock_frontend_prod` - Next.js frontend (port 3000)
- `clock_nginx_prod` - Nginx reverse proxy (port 8082:80, HTTP only - SSL via Cloudflare Tunnel)

### Useful Commands

```bash
# List clock containers
/usr/local/bin/docker ps --filter 'name=clock'

# Access production database
/usr/local/bin/docker exec -it clock_postgres_prod psql -U clock_user -d clock

# View backend logs
/usr/local/bin/docker logs clock_backend_prod --tail 100
```

### Production File Paths

The project files on the production server are at:
```
/Users/lachesis/clock-deployment/
```

**Not** `~/clock/` - always use the full path above.

### Updating Nginx Config

The nginx config is mounted read-only from the host:
- Host path: `/Users/lachesis/clock-deployment/nginx/prod/nginx.prod.conf`
- Container path: `/etc/nginx/conf.d/default.conf`

To update nginx config:
```bash
# 1. Copy updated config to production server
scp nginx/prod/nginx.prod.conf lachesis@192.168.0.77:/tmp/nginx.prod.conf

# 2. Update the host file (not the container - it's read-only)
ssh lachesis@192.168.0.77 'cp /tmp/nginx.prod.conf /Users/lachesis/clock-deployment/nginx/prod/nginx.prod.conf'

# 3. Test and reload nginx
ssh lachesis@192.168.0.77 '/usr/local/bin/docker exec clock_nginx_prod nginx -t && /usr/local/bin/docker exec clock_nginx_prod nginx -s reload'
```

**Do NOT** copy to `/etc/nginx/nginx.conf` - that's the main nginx config, not our server block config.

If `/etc/nginx/nginx.conf` gets corrupted, restore it from a fresh image:
```bash
/usr/local/bin/docker stop clock_nginx_prod
/usr/local/bin/docker run --rm nginx:alpine cat /etc/nginx/nginx.conf > /tmp/nginx.main.conf
/usr/local/bin/docker cp /tmp/nginx.main.conf clock_nginx_prod:/etc/nginx/nginx.conf
/usr/local/bin/docker start clock_nginx_prod
```

## Deployment Process

### Standard Deployment

```bash
# 1. Pull latest code on production server
ssh lachesis@192.168.0.77 'cd /Users/lachesis/clock-deployment/repos/clock && git pull'

# 2. Build backend image
ssh lachesis@192.168.0.77 'cd /Users/lachesis/clock-deployment/repos/clock && /usr/local/bin/docker build -f clock-backend/Dockerfile -t clock_backend_prod clock-backend/'

# 3. Build frontend image (IMPORTANT: must include NEXT_PUBLIC_API_URL)
ssh lachesis@192.168.0.77 'cd /Users/lachesis/clock-deployment/repos/clock && /usr/local/bin/docker build -f clock-frontend/Dockerfile -t clock_frontend_prod --build-arg NEXT_PUBLIC_API_URL=https://clock.tcode.tw/api/v1 clock-frontend/'

# 4. Restart containers
ssh lachesis@192.168.0.77 'cd /Users/lachesis/clock-deployment && /usr/local/bin/docker compose -f docker-compose.prod.yml up -d clock_backend_prod clock_frontend_prod'
```

### Important: Frontend Build-Time Variables

Next.js `NEXT_PUBLIC_*` environment variables are **baked into the JavaScript bundle at build time**. They cannot be changed at runtime.

If the frontend shows `ERR_CONNECTION_REFUSED` to `localhost:8080`, it means `NEXT_PUBLIC_API_URL` was not set during the Docker build.

**Fix:**
```bash
# Rebuild with the correct API URL
ssh lachesis@192.168.0.77 'cd /Users/lachesis/clock-deployment/repos/clock && /usr/local/bin/docker build -f clock-frontend/Dockerfile -t clock_frontend_prod --build-arg NEXT_PUBLIC_API_URL=https://clock.tcode.tw/api/v1 clock-frontend/'

# Restart frontend
ssh lachesis@192.168.0.77 'cd /Users/lachesis/clock-deployment && /usr/local/bin/docker compose -f docker-compose.prod.yml up -d clock_frontend_prod'
```

After fixing, users may need to hard refresh (Ctrl+Shift+R) to clear cached JS files.

## Cloudflare Tunnel

The clock app is exposed to the public internet via Cloudflare Tunnel (Zero Trust).

- **Public URL**: `https://clock.tcode.tw`
- **Tunnel routes**: `clock.tcode.tw` → `http://localhost:8082` (clock nginx)
- **SSL**: Handled entirely by Cloudflare - nginx serves HTTP only on port 8082
- **cloudflared**: Runs as a macOS LaunchDaemon on the production server (`/Library/LaunchDaemons/com.cloudflare.cloudflared.plist`)
- **Tunnel config**: Token-based, routing managed in Cloudflare Zero Trust dashboard (not local config)

### Adding/Modifying Tunnel Routes

Tunnel routes are configured in the **Cloudflare Zero Trust dashboard**:
1. Go to Cloudflare Zero Trust → Networks → Tunnels
2. Select the tunnel running on 192.168.0.77
3. Add a public hostname: `clock.tcode.tw` → `http://localhost:8082`

### Restarting cloudflared

```bash
# Check cloudflared status
ssh lachesis@192.168.0.77 'ps aux | grep cloudflared'

# Restart via launchctl (requires sudo)
ssh lachesis@192.168.0.77 'sudo launchctl stop com.cloudflare.cloudflared && sudo launchctl start com.cloudflare.cloudflared'
```

## Troubleshooting

### Login Returns 401 Unauthorized

Check backend logs for details:
```bash
ssh lachesis@192.168.0.77 '/usr/local/bin/docker logs clock_backend_prod --tail 50 2>&1 | grep -i login'
```

- "Login failed: user not found" - username doesn't exist
- "Login failed: invalid password" - wrong password

To reset a user's password:
```bash
# Generate a bcrypt hash locally
cd clock-backend && echo 'package main
import ("fmt"; "golang.org/x/crypto/bcrypt")
func main() { h, _ := bcrypt.GenerateFromPassword([]byte("newpassword"), 10); fmt.Println(string(h)) }' > /tmp/genhash.go && go run /tmp/genhash.go

# Update in database (use single quotes, escape $ with E prefix)
ssh lachesis@192.168.0.77 "/usr/local/bin/docker exec clock_postgres_prod psql -U clock_user -d clock -c \"UPDATE employees SET password_hash = E'\$2a\$10\$YOUR_HASH_HERE' WHERE username = 'USERNAME';\""
```

### Frontend Shows Connection Refused / Network Error

1. Check if containers are running:
   ```bash
   ssh lachesis@192.168.0.77 '/usr/local/bin/docker ps --filter "name=clock"'
   ```

2. Check if API URL is correct (should NOT be localhost:8080):
   ```bash
   ssh lachesis@192.168.0.77 'curl -sk https://192.168.0.77/ | grep -o "localhost:8080" || echo "OK - no localhost:8080 found"'
   ```

3. If localhost:8080 is found, rebuild frontend with correct `NEXT_PUBLIC_API_URL` (see above).

### Containers Show "unhealthy" Status

This is often just slow health checks. Verify actual functionality:
```bash
# Test backend health
ssh lachesis@192.168.0.77 '/usr/local/bin/docker exec clock_backend_prod wget -qO- http://localhost:8080/health'

# Test frontend
ssh lachesis@192.168.0.77 '/usr/local/bin/docker exec clock_nginx_prod wget -qO- http://clock_frontend_prod:3000/ | head -5'

# Test nginx (local)
ssh lachesis@192.168.0.77 'curl -s http://localhost:8082/ | head -5'

# Test via Cloudflare Tunnel (public)
curl -s https://clock.tcode.tw/ | head -5
```

### Database Queries

```bash
# List all users
ssh lachesis@192.168.0.77 '/usr/local/bin/docker exec clock_postgres_prod psql -U clock_user -d clock -c "SELECT id, username, name, role, is_active FROM employees;"'

# Check attendance records
ssh lachesis@192.168.0.77 '/usr/local/bin/docker exec clock_postgres_prod psql -U clock_user -d clock -c "SELECT * FROM attendance_records ORDER BY id DESC LIMIT 10;"'
```
