#!/bin/sh

set -e

echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is up - running migrations"

# Create dbconfig.yml for sql-migrate
cat > /tmp/dbconfig.yml <<EOF
production:
  dialect: postgres
  datasource: host=$DB_HOST port=$DB_PORT user=$DB_USER password=$DB_PASSWORD dbname=$DB_NAME sslmode=$DB_SSLMODE
  dir: /migrations
EOF

# Run migrations
cd /tmp
sql-migrate up -env=production -config=dbconfig.yml

echo "Migrations completed successfully"

# Start the application
echo "Starting Clock Backend..."
cd /root
exec ./main
