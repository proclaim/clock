import api from './api';
import {
  CheckInRequest,
  CheckInResponse,
  CheckOutRequest,
  CheckOutResponse,
  ClockAction,
  SuggestedTimeResponse,
  AttendanceStatusResponse,
  AttendanceRecordsResponse,
  SubmitEditRequestPayload,
  SubmitAddRequestPayload,
  EditRequest,
  EditRequestListResponse,
} from '@/types/attendance';

class AttendanceService {
  async checkIn(note?: string, checkInTime?: string): Promise<CheckInResponse> {
    try {
      const payload: CheckInRequest = { note: note || '' };
      if (checkInTime) payload.check_in_time = checkInTime;

      const response = await api.post<CheckInResponse>('/attendance/check-in', payload);

      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Check-in failed. Please try again.');
    }
  }

  async checkOut(note?: string, checkOutTime?: string): Promise<CheckOutResponse> {
    try {
      const payload: CheckOutRequest = { note: note || '' };
      if (checkOutTime) payload.check_out_time = checkOutTime;

      const response = await api.post<CheckOutResponse>('/attendance/check-out', payload);

      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Check-out failed. Please try again.');
    }
  }

  async getSuggestedTime(action: ClockAction): Promise<SuggestedTimeResponse> {
    try {
      const response = await api.get<SuggestedTimeResponse>('/attendance/suggested-time', {
        params: { action },
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get suggested time');
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

  async submitAddRequest(data: SubmitAddRequestPayload): Promise<EditRequest> {
    try {
      const response = await api.post<EditRequest>('/attendance/add-requests', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to submit add request');
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
