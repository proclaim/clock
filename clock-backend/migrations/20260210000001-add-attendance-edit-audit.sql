-- +migrate Up
ALTER TABLE attendance_records
    ADD COLUMN IF NOT EXISTS edited_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS edit_reason TEXT;

-- +migrate Down
ALTER TABLE attendance_records
    DROP COLUMN IF EXISTS edited_by,
    DROP COLUMN IF EXISTS edited_at,
    DROP COLUMN IF EXISTS edit_reason;
