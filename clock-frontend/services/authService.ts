import api from './api';
import { LoginRequest, LoginResponse, ChangePasswordRequest } from '@/types/auth';

class AuthService {
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        username,
        password,
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Login failed. Please try again.');
    }
  }

  async refreshToken(refreshToken: string): Promise<{ token: string; refresh_token: string }> {
    try {
      const response = await api.post('/auth/refresh', {
        refresh_token: refreshToken,
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Token refresh failed');
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await api.put('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to change password');
    }
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Logout on client side even if server request fails
      console.error('Logout request failed:', error);
    }
  }
}

export const authService = new AuthService();
