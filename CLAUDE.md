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
- `clock_nginx_prod` - Nginx reverse proxy (ports 80, 443)

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
