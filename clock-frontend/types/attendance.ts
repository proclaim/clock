export type AttendanceStatus = 'CHECKED_IN' | 'CHECKED_OUT' | 'AUTO_CLOSED';

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  check_in_time: string;
  check_out_time: string | null;
  status: AttendanceStatus;
  check_in_note: string | null;
  check_out_note: string | null;
}

export interface CheckInRequest {
  note?: string;
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
}

export interface CheckOutResponse extends AttendanceRecord {}

export interface AttendanceStatusResponse {
  is_checked_in: boolean;
  current_record: AttendanceRecord | null;
}

export interface AttendanceRecordsResponse {
  records: AttendanceRecord[];
  total: number;
}

export type EditRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface EditRequest {
  id: number;
  attendance_record_id: number;
  employee_id: number;
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

export interface EditRequestListResponse {
  edit_requests: EditRequest[];
  total: number;
}
