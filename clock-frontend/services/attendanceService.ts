import api from './api';
import {
  CheckInRequest,
  CheckInResponse,
  CheckOutRequest,
  CheckOutResponse,
  AttendanceStatusResponse,
  AttendanceRecordsResponse,
  SubmitEditRequestPayload,
  EditRequest,
  EditRequestListResponse,
} from '@/types/attendance';

class AttendanceService {
  async checkIn(note?: string): Promise<CheckInResponse> {
    try {
      const response = await api.post<CheckInResponse>('/attendance/check-in', {
        note: note || '',
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Check-in failed. Please try again.');
    }
  }

  async checkOut(note?: string): Promise<CheckOutResponse> {
    try {
      const response = await api.post<CheckOutResponse>('/attendance/check-out', {
        note: note || '',
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Check-out failed. Please try again.');
    }
  }

  async getCurrentStatus(): Promise<AttendanceStatusResponse> {
    try {
      const response = await api.get<AttendanceStatusResponse>('/attendance/status');

      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get current status');
    }
  }

  async getRecords(year?: number, month?: number): Promise<AttendanceRecordsResponse> {
    try {
      const params: any = {};
      if (year !== undefined) params.year = year;
      if (month !== undefined) params.month = month;

      const response = await api.get<AttendanceRecordsResponse>('/attendance/records', {
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
  async submitEditRequest(data: SubmitEditRequestPayload): Promise<EditRequest> {
    try {
      const response = await api.post<EditRequest>('/attendance/edit-requests', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to submit edit request');
    }
  }

  async getEditRequests(): Promise<EditRequestListResponse> {
    try {
      const response = await api.get<EditRequestListResponse>('/attendance/edit-requests');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get edit requests');
    }
  }
}

export const attendanceService = new AttendanceService();
