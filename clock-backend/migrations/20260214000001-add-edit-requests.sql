-- +migrate Up
-- Add edit_requests table for employee self-edit with admin approval

CREATE TYPE edit_request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE edit_requests (
    id SERIAL PRIMARY KEY,
    attendance_record_id INTEGER NOT NULL REFERENCES attendance_records(id),
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    requested_check_in_time TIMESTAMP WITH TIME ZONE,
    requested_check_out_time TIMESTAMP WITH TIME ZONE,
    note TEXT,
    status edit_request_status DEFAULT 'PENDING' NOT NULL,
    reviewed_by INTEGER REFERENCES employees(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_edit_requests_employee_id ON edit_requests(employee_id);
CREATE INDEX idx_edit_requests_status ON edit_requests(status) WHERE status = 'PENDING';
CREATE INDEX idx_edit_requests_attendance_record_id ON edit_requests(attendance_record_id);

CREATE TRIGGER update_edit_requests_updated_at
    BEFORE UPDATE ON edit_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- +migrate Down
DROP TRIGGER IF EXISTS update_edit_requests_updated_at ON edit_requests;
DROP TABLE IF EXISTS edit_requests;
DROP TYPE IF EXISTS edit_request_status;
