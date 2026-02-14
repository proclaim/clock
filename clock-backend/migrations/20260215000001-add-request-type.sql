-- +migrate Up
-- Add request_type to edit_requests for ADD requests (new records)

CREATE TYPE edit_request_type AS ENUM ('EDIT', 'ADD');

ALTER TABLE edit_requests
    ADD COLUMN request_type edit_request_type DEFAULT 'EDIT' NOT NULL;

ALTER TABLE edit_requests
    ALTER COLUMN attendance_record_id DROP NOT NULL;

-- +migrate Down
ALTER TABLE edit_requests
    ALTER COLUMN attendance_record_id SET NOT NULL;

ALTER TABLE edit_requests
    DROP COLUMN request_type;

DROP TYPE IF EXISTS edit_request_type;
