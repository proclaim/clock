'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Employee, AuthContextType } from '@/types/auth';
import { authService } from '@/services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Employee | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('refresh_token');
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await authService.login(username, password);

      // Store tokens and user data
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('refresh_token', response.refresh_token);
      localStorage.setItem('auth_user', JSON.stringify(response.employee));

      setToken(response.token);
      setUser(response.employee);

      // Redirect based on role
      const role = response.employee.role;
      if (role === 'ADMIN' || role === 'admin') {
        router.push('/dashboard');
      } else {
        router.push('/attendance');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state and storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('auth_user');

      setToken(null);
      setUser(null);

      // Redirect to login
      router.push('/login');
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    changePassword,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'ADMIN' || user?.role === 'admin',
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
