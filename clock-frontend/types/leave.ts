export interface Leave {
  id: number;
  employee_id: number;
  start_date: string;
  end_date: string;
  note: string | null;
  days: number;
}

export interface LeaveWithEmployee extends Leave {
  employee_name: string;
  employee_username: string;
}

export interface CreateLeaveRequest {
  start_date: string;
  end_date: string;
  note?: string;
}

export interface UpdateLeaveRequest {
  start_date?: string;
  end_date?: string;
  note?: string;
}

export interface LeaveResponse {
  leave: Leave;
}

export interface LeavesResponse {
  leaves: Leave[];
  total: number;
}

export interface AdminLeavesResponse {
  leaves: LeaveWithEmployee[];
  total: number;
  page: number;
  per_page: number;
}
