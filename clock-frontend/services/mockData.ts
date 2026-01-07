import { Employee, LoginResponse } from '@/types/auth';
import { AttendanceRecord } from '@/types/attendance';

// Mock Users
export const mockUsers: Array<Employee & { password: string }> = [
  {
    id: 1,
    username: 'admin',
    name: 'System Administrator',
    email: 'admin@clock.local',
    phone: '555-0100',
    role: 'ADMIN',
    is_active: true,
    password: 'admin123',
  },
  {
    id: 2,
    username: 'john.doe',
    name: 'John Doe',
    email: 'john.doe@clock.local',
    phone: '555-0101',
    role: 'STAFF',
    is_active: true,
    password: 'staff123',
  },
  {
    id: 3,
    username: 'jane.smith',
    name: 'Jane Smith',
    email: 'jane.smith@clock.local',
    phone: '555-0102',
    role: 'STAFF',
    is_active: true,
    password: 'staff123',
  },
];

// Mock Attendance Records
export const mockAttendanceRecords: AttendanceRecord[] = [
  // John Doe's records
  {
    id: 1,
    employee_id: 2,
    check_in_time: '2026-01-05T08:30:00Z',
    check_out_time: '2026-01-05T17:30:00Z',
    status: 'CHECKED_OUT',
    check_in_note: '開始工作',
    check_out_note: '準時下班',
  },
  {
    id: 2,
    employee_id: 2,
    check_in_time: '2026-01-04T08:25:00Z',
    check_out_time: null,
    status: 'AUTO_CLOSED',
    check_in_note: '早安',
    check_out_note: null,
  },
  {
    id: 3,
    employee_id: 2,
    check_in_time: '2026-01-03T08:20:00Z',
    check_out_time: '2026-01-03T17:35:00Z',
    status: 'CHECKED_OUT',
    check_in_note: null,
    check_out_note: '完成所有任務',
  },
  {
    id: 4,
    employee_id: 2,
    check_in_time: '2026-01-02T08:15:00Z',
    check_out_time: '2026-01-02T17:20:00Z',
    status: 'CHECKED_OUT',
    check_in_note: '本週開始',
    check_out_note: null,
  },
  // Jane Smith's records
  {
    id: 5,
    employee_id: 3,
    check_in_time: '2026-01-05T09:00:00Z',
    check_out_time: '2026-01-05T18:00:00Z',
    status: 'CHECKED_OUT',
    check_in_note: null,
    check_out_note: null,
  },
  {
    id: 6,
    employee_id: 3,
    check_in_time: '2026-01-04T09:05:00Z',
    check_out_time: '2026-01-04T18:10:00Z',
    status: 'CHECKED_OUT',
    check_in_note: null,
    check_out_note: null,
  },
];

// In-memory storage for session
let currentAttendanceRecords = [...mockAttendanceRecords];
let nextRecordId = Math.max(...mockAttendanceRecords.map(r => r.id)) + 1;

export const resetMockData = () => {
  currentAttendanceRecords = [...mockAttendanceRecords];
  nextRecordId = Math.max(...mockAttendanceRecords.map(r => r.id)) + 1;
};

export const getMockAttendanceRecords = () => currentAttendanceRecords;

export const addMockAttendanceRecord = (record: Omit<AttendanceRecord, 'id'>) => {
  const newRecord: AttendanceRecord = {
    id: nextRecordId++,
    ...record,
  };
  currentAttendanceRecords.push(newRecord);
  return newRecord;
};

export const updateMockAttendanceRecord = (id: number, updates: Partial<AttendanceRecord>) => {
  const index = currentAttendanceRecords.findIndex(r => r.id === id);
  if (index !== -1) {
    currentAttendanceRecords[index] = {
      ...currentAttendanceRecords[index],
      ...updates,
    };
    return currentAttendanceRecords[index];
  }
  return null;
};
