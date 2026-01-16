-- +migrate Up
-- Add audit fields to attendance_records table for admin edits

ALTER TABLE attendance_records
ADD COLUMN edited_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN edit_reason TEXT;

-- Add indexes for audit queries
CREATE INDEX idx_attendance_edited_by ON attendance_records(edited_by) WHERE edited_by IS NOT NULL;
CREATE INDEX idx_attendance_edited_at ON attendance_records(edited_at) WHERE edited_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN attendance_records.edited_by IS 'ID of admin who last edited this record';
COMMENT ON COLUMN attendance_records.edited_at IS 'Timestamp when record was last edited by admin';
COMMENT ON COLUMN attendance_records.edit_reason IS 'Reason provided by admin for editing this record';

-- +migrate Down
-- Rollback migration

DROP INDEX IF EXISTS idx_attendance_edited_at;
DROP INDEX IF EXISTS idx_attendance_edited_by;

ALTER TABLE attendance_records
DROP COLUMN IF EXISTS edit_reason,
DROP COLUMN IF EXISTS edited_at,
DROP COLUMN IF EXISTS edited_by;
