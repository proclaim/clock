import api from './api';
import {
  Leave,
  CreateLeaveRequest,
  LeaveResponse,
  LeavesResponse,
} from '@/types/leave';

class LeaveService {
  async createLeave(data: CreateLeaveRequest): Promise<Leave> {
    try {
      const response = await api.post<LeaveResponse>('/leaves', data);
      return response.data.leave;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to create leave');
    }
  }

  async getLeaves(year?: number, month?: number): Promise<LeavesResponse> {
    try {
      const params: Record<string, string> = {};
      if (year !== undefined) params.year = year.toString();
      if (month !== undefined) params.month = month.toString();

      const response = await api.get<LeavesResponse>('/leaves', { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get leaves');
    }
  }
}

export const leaveService = new LeaveService();
export default leaveService;
