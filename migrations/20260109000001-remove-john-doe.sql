-- +migrate Up
-- Remove all john.* staff accounts and associated data

-- Delete attendance records for all john.* accounts
DELETE FROM attendance_records WHERE employee_id IN (
    SELECT id FROM employees WHERE username LIKE 'john%'
);

-- Delete all john.* employee accounts
DELETE FROM employees WHERE username LIKE 'john%';

-- +migrate Down
-- Rollback migration (restore john.doe account)

-- Restore john.doe employee account
INSERT INTO employees (id, username, name, email, phone, role, password_hash, is_active)
VALUES (
    2,
    'john.doe',
    'John Doe',
    'john.doe@clock.local',
    '555-0101',
    'STAFF',
    '$2a$10$fqRfnXJPoqlXeb9Ms/396.iFZmXZ24vLXQVeZ7nYDyeEOsVIISWpq',  -- staff123
    true
);

-- Note: Attendance records are not restored in rollback as they are historical data
