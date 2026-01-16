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
