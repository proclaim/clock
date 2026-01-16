export type EmployeeRole = 'STAFF' | 'ADMIN' | 'staff' | 'admin';

export interface Employee {
  id: number;
  username: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: EmployeeRole;
  is_active: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refresh_token: string;
  employee: Employee;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface AuthContextType {
  user: Employee | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}
