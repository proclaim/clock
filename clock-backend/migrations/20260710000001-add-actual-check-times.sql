-- +migrate Up
ALTER TABLE attendance_records
    ADD COLUMN IF NOT EXISTS actual_check_in_time TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS actual_check_out_time TIMESTAMP WITH TIME ZONE;

-- +migrate Down
ALTER TABLE attendance_records
    DROP COLUMN IF EXISTS actual_check_in_time,
    DROP COLUMN IF EXISTS actual_check_out_time;
