import api from './api';
import {
  AdminAttendanceSummaryResponse,
  AdminAttendanceRecordsResponse,
  UpdateAttendanceRecordRequest,
  CreateAttendanceRecordRequest,
  CreateEmployeeRequest,
  AttendanceRecordWithEmployee,
} from '@/types/admin';
import { Employee } from '@/types/auth';

class AdminService {
  // Get attendance summary for all employees
  async getAttendanceSummary(
    startDate?: string,
    endDate?: string,
    employeeId?: number
  ): Promise<AdminAttendanceSummaryResponse> {
    try {
      const params: Record<string, string> = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (employeeId) params.employee_id = employeeId.toString();

      const response = await api.get<AdminAttendanceSummaryResponse>('/admin/attendance/summary', {
        params,
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get attendance summary');
    }
  }

  // Get all attendance records with pagination
  async getAttendanceRecords(
    page: number = 1,
    perPage: number = 50,
    startDate?: string,
    endDate?: string,
    employeeId?: number
  ): Promise<AdminAttendanceRecordsResponse> {
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        per_page: perPage.toString(),
      };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (employeeId) params.employee_id = employeeId.toString();

      const response = await api.get<AdminAttendanceRecordsResponse>('/admin/attendance/records', {
        params,
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get attendance records');
    }
  }

  // Update an attendance record
  async updateAttendanceRecord(
    recordId: number,
    data: UpdateAttendanceRecordRequest
  ): Promise<AttendanceRecordWithEmployee> {
    try {
      const response = await api.put<AttendanceRecordWithEmployee>(
        `/admin/attendance/records/${recordId}`,
        data
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to update attendance record');
    }
  }

  // Create a new attendance record
  async createAttendanceRecord(
    data: CreateAttendanceRecordRequest
  ): Promise<AttendanceRecordWithEmployee> {
    try {
      const response = await api.post<AttendanceRecordWithEmployee>(
        '/admin/attendance/records',
        data
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to create attendance record');
    }
  }

  // Delete an attendance record
  async deleteAttendanceRecord(recordId: number): Promise<void> {
    try {
      await api.delete(`/admin/attendance/records/${recordId}`);
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to delete attendance record');
    }
  }

  // Get all employees (for dropdowns)
  async getAllEmployees(): Promise<Employee[]> {
    try {
      const response = await api.get<{ employees: Employee[]; total: number }>(
        '/admin/employees'
      );

      return response.data.employees;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get employees');
    }
  }

  // Reset employee password
  async resetPassword(employeeId: number, newPassword: string): Promise<void> {
    try {
      await api.put(`/admin/employees/${employeeId}/password`, {
        new_password: newPassword,
      });
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to reset password');
    }
  }

  // Create new employee
  async createEmployee(data: CreateEmployeeRequest): Promise<Employee> {
    try {
      const response = await api.post<Employee>('/admin/employees', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to create employee');
    }
  }

  // Update employee status (activate/inactivate)
  async updateEmployeeStatus(employeeId: number, isActive: boolean): Promise<void> {
    try {
      await api.put(`/admin/employees/${employeeId}/status`, {
        is_active: isActive,
      });
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to update employee status');
    }
  }
}

export const adminService = new AdminService();
export default adminService;
