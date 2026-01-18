-- +migrate Up
-- Leave records for employee absences

-- Leaves table
CREATE TABLE leaves (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Ensure end_date is not before start_date
    CONSTRAINT check_date_range CHECK (end_date >= start_date)
);

-- Indexes for leaves table
CREATE INDEX idx_leaves_employee_id ON leaves(employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_leaves_date_range ON leaves(employee_id, start_date, end_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_leaves_start_date ON leaves(start_date) WHERE deleted_at IS NULL;

-- Trigger for leaves table
CREATE TRIGGER update_leaves_updated_at
    BEFORE UPDATE ON leaves
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE leaves IS 'Stores employee leave/absence records';
COMMENT ON COLUMN leaves.employee_id IS 'Foreign key to employees table';
COMMENT ON COLUMN leaves.start_date IS 'First day of leave';
COMMENT ON COLUMN leaves.end_date IS 'Last day of leave (inclusive)';
COMMENT ON COLUMN leaves.note IS 'Optional note or reason for leave';
COMMENT ON COLUMN leaves.deleted_at IS 'Soft delete timestamp, NULL if not deleted';

-- +migrate Down
DROP TRIGGER IF EXISTS update_leaves_updated_at ON leaves;
DROP TABLE IF EXISTS leaves;
