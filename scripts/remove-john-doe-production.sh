#!/bin/bash
# Script to remove john.doe account from production database
# This script should be run on the production server where the database is accessible

set -e

echo "======================================="
echo "Remove ALL john.* from Production DB"
echo "======================================="
echo ""
echo "This will:"
echo "1. Delete all attendance records for john.* accounts"
echo "2. Delete all john.* employee accounts"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

# Get database connection details
DB_CONTAINER=${DB_CONTAINER:-clock_postgres_prod}
DB_USER=${DB_USER:-clock_user}
DB_NAME=${DB_NAME:-clock}

echo ""
echo "Connecting to production database..."
echo "Container: $DB_CONTAINER"
echo "Database: $DB_NAME"
echo ""

# Execute SQL to remove all john.* accounts
docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME <<EOF
-- Check if any john.* accounts exist
SELECT 'Found john.* accounts:' as status, username, name, email FROM employees WHERE username LIKE 'john%';

-- Delete attendance records for all john.* accounts
DELETE FROM attendance_records WHERE employee_id IN (
    SELECT id FROM employees WHERE username LIKE 'john%'
);

-- Delete all john.* employee accounts
DELETE FROM employees WHERE username LIKE 'john%';

-- Verify deletion
SELECT 'Remaining employees:' as status;
SELECT username, name, role FROM employees ORDER BY id;
EOF

echo ""
echo "======================================="
echo "All john.* accounts removed successfully!"
echo "======================================="
