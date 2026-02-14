import { AttendanceRecord, AttendanceStatus } from './attendance';
import { Employee } from './auth';

export interface AttendanceRecordWithEmployee extends AttendanceRecord {
  employee_name: string;
  employee_username: string;
  edited_by?: number;
  edited_at?: string;
  edit_reason?: string;
}

export interface EmployeeAttendanceSummary {
  employee_id: number;
  employee_name: string;
  username: string;
  total_records: number;
  total_hours: number;
  total_minutes: number;
  total_minutes_raw: number;
}

export interface AdminAttendanceSummaryResponse {
  summaries: EmployeeAttendanceSummary[];
  total: number;
}

export interface AdminAttendanceRecordsResponse {
  records: AttendanceRecordWithEmployee[];
  total: number;
  page: number;
  per_page: number;
}

export interface UpdateAttendanceRecordRequest {
  check_in_time?: string;
  check_out_time?: string;
  status?: AttendanceStatus;
  check_in_note?: string;
  check_out_note?: string;
  edit_reason?: string;
}

export interface CreateAttendanceRecordRequest {
  employee_id: number;
  check_in_time: string;
  check_out_time?: string;
  status: AttendanceStatus;
  check_in_note?: string;
  check_out_note?: string;
  edit_reason: string;
}

export interface AdminEditRequest {
  id: number;
  attendance_record_id: number;
  employee_id: number;
  employee_name: string;
  employee_username: string;
  requested_check_in_time: string | null;
  requested_check_out_time: string | null;
  note: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewed_by: number | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  original_check_in_time: string;
  original_check_out_time: string | null;
  original_status: string;
}

export interface AdminEditRequestListResponse {
  edit_requests: AdminEditRequest[];
  total: number;
}

export interface CreateEmployeeRequest {
  username: string;
  name: string;
  password: string;
  role: 'STAFF' | 'ADMIN';
}
