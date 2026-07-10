export type AttendanceStatus = 'CHECKED_IN' | 'CHECKED_OUT' | 'AUTO_CLOSED';

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  check_in_time: string;
  check_out_time: string | null;
  actual_check_in_time?: string | null;
  actual_check_out_time?: string | null;
  status: AttendanceStatus;
  check_in_note: string | null;
  check_out_note: string | null;
}

export interface CheckInRequest {
  note?: string;
  // Optional chosen time (RFC3339) recorded as the official check-in time;
  // must be on today's date. The actual press time is stored server-side.
  check_in_time?: string;
}

export interface CheckInResponse {
  id: number;
  employee_id: number;
  check_in_time: string;
  status: AttendanceStatus;
  note: string | null;
  previous_record_auto_closed: boolean;
  auto_closed_record?: {
    id: number;
    check_in_time: string;
    status: AttendanceStatus;
  };
}

export interface CheckOutRequest {
  note?: string;
  // Optional chosen time (RFC3339) recorded as the official check-out time;
  // must be on today's date and after check-in. The actual press time is
  // stored server-side.
  check_out_time?: string;
}

export interface CheckOutResponse extends AttendanceRecord {}

export type ClockAction = 'check_in' | 'check_out';

export interface SuggestedTimeResponse {
  action: ClockAction;
  has_suggestion: boolean;
  suggested_time?: string;
  sample_count: number;
}

export interface AttendanceStatusResponse {
  is_checked_in: boolean;
  current_record: AttendanceRecord | null;
}

export interface AttendanceRecordsResponse {
  records: AttendanceRecord[];
  total: number;
}

export type EditRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type EditRequestType = 'EDIT' | 'ADD';

export interface EditRequest {
  id: number;
  attendance_record_id: number | null;
  employee_id: number;
  request_type: EditRequestType;
  requested_check_in_time: string | null;
  requested_check_out_time: string | null;
  note: string | null;
  status: EditRequestStatus;
  reviewed_by: number | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
}

export interface SubmitEditRequestPayload {
  attendance_record_id: number;
  check_in_time?: string;
  check_out_time?: string;
  note: string;
}

export interface SubmitAddRequestPayload {
  check_in_time: string;
  check_out_time?: string;
  note: string;
}

export interface EditRequestListResponse {
  edit_requests: EditRequest[];
  total: number;
}
