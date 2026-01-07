-- +migrate Up
-- Initial schema for Clock check-in/check-out system

-- ============================================================================
-- CUSTOM TYPES (ENUMS)
-- ============================================================================

-- Employee role enumeration
CREATE TYPE employee_role AS ENUM ('STAFF', 'ADMIN');

-- Attendance record status
-- AUTO_CLOSED: System automatically closed a forgotten check-in from a previous day
CREATE TYPE attendance_status AS ENUM ('CHECKED_IN', 'CHECKED_OUT', 'AUTO_CLOSED');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Employees table
-- Stores user account information
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role employee_role DEFAULT 'STAFF' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for employees table
CREATE INDEX idx_employees_username ON employees(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_email ON employees(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_is_active ON employees(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_role ON employees(role) WHERE deleted_at IS NULL;

-- Attendance records table
-- Stores check-in and check-out events
CREATE TABLE attendance_records (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
    check_out_time TIMESTAMP WITH TIME ZONE,
    status attendance_status DEFAULT 'CHECKED_IN' NOT NULL,
    check_in_note TEXT,
    check_out_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for attendance_records table
CREATE INDEX idx_attendance_employee_id ON attendance_records(employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_attendance_check_in_time ON attendance_records(check_in_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_attendance_status ON attendance_records(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_attendance_employee_month ON attendance_records(employee_id, check_in_time) WHERE deleted_at IS NULL;

-- Composite index for finding active check-ins for a specific employee
CREATE INDEX idx_attendance_active_checkin ON attendance_records(employee_id, status)
    WHERE status = 'CHECKED_IN' AND deleted_at IS NULL;

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for employees table
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for attendance_records table
CREATE TRIGGER update_attendance_records_updated_at
    BEFORE UPDATE ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default admin user
-- Username: admin
-- Password: admin123
-- Password hash generated with bcrypt cost 10
INSERT INTO employees (username, name, email, role, password_hash, is_active)
VALUES (
    'admin',
    'System Administrator',
    'admin@clock.local',
    'ADMIN',
    '$2a$10$elBM7jbocib72jCGjCHlXeL8piito1kgstnlPwjyzpQHxWVIycYoG',  -- admin123
    true
);

-- Insert sample staff user 1
-- Username: john.doe
-- Password: staff123
INSERT INTO employees (username, name, email, phone, role, password_hash, is_active)
VALUES (
    'john.doe',
    'John Doe',
    'john.doe@clock.local',
    '555-0101',
    'STAFF',
    '$2a$10$fqRfnXJPoqlXeb9Ms/396.iFZmXZ24vLXQVeZ7nYDyeEOsVIISWpq',  -- staff123
    true
);

-- Insert sample staff user 2
-- Username: jane.smith
-- Password: staff123
INSERT INTO employees (username, name, email, phone, role, password_hash, is_active)
VALUES (
    'jane.smith',
    'Jane Smith',
    'jane.smith@clock.local',
    '555-0102',
    'STAFF',
    '$2a$10$fqRfnXJPoqlXeb9Ms/396.iFZmXZ24vLXQVeZ7nYDyeEOsVIISWpq',  -- staff123
    true
);

-- Insert sample attendance records for testing (last 3 days for john.doe)
-- Day 1 (3 days ago) - Complete day
INSERT INTO attendance_records (employee_id, check_in_time, check_out_time, status, check_in_note, check_out_note)
VALUES (
    2,  -- john.doe
    CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '8 hours',
    CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '17 hours',
    'CHECKED_OUT',
    'Started work',
    'End of day'
);

-- Day 2 (2 days ago) - Complete day
INSERT INTO attendance_records (employee_id, check_in_time, check_out_time, status, check_in_note, check_out_note)
VALUES (
    2,  -- john.doe
    CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '8 hours 15 minutes',
    CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '17 hours 30 minutes',
    'CHECKED_OUT',
    NULL,
    NULL
);

-- Day 3 (yesterday) - Complete day
INSERT INTO attendance_records (employee_id, check_in_time, check_out_time, status, check_in_note, check_out_note)
VALUES (
    2,  -- john.doe
    CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '8 hours 5 minutes',
    CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '17 hours 15 minutes',
    'CHECKED_OUT',
    'Good morning',
    'Completed all tasks'
);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE employees IS 'Stores employee/user account information';
COMMENT ON TABLE attendance_records IS 'Stores check-in and check-out events for employees';

COMMENT ON COLUMN employees.username IS 'Unique username for login';
COMMENT ON COLUMN employees.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN employees.role IS 'Employee role: STAFF or ADMIN';
COMMENT ON COLUMN employees.is_active IS 'Whether the employee account is active';
COMMENT ON COLUMN employees.deleted_at IS 'Soft delete timestamp, NULL if not deleted';

COMMENT ON COLUMN attendance_records.employee_id IS 'Foreign key to employees table';
COMMENT ON COLUMN attendance_records.check_in_time IS 'Timestamp when employee checked in';
COMMENT ON COLUMN attendance_records.check_out_time IS 'Timestamp when employee checked out, NULL if still checked in';
COMMENT ON COLUMN attendance_records.status IS 'Current status: CHECKED_IN or CHECKED_OUT';
COMMENT ON COLUMN attendance_records.deleted_at IS 'Soft delete timestamp, NULL if not deleted';

-- +migrate Down
-- Rollback migration

-- Drop triggers
DROP TRIGGER IF EXISTS update_attendance_records_updated_at ON attendance_records;
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables
DROP TABLE IF EXISTS attendance_records;
DROP TABLE IF EXISTS employees;

-- Drop custom types
DROP TYPE IF EXISTS attendance_status;
DROP TYPE IF EXISTS employee_role;
