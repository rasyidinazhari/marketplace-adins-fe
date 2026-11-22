export type UserRole = 'Buyer' | 'Seller';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface RegisterResponse {
  status: string;
  message: string;
  id: number;
  name: string;
  email: string;
  role: UserRole | string;
  isActive: boolean;
  createdAt: string;
}