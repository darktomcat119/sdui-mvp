import api from './api.service';
import type { LoginRequest, LoginResponse, User } from '../types/auth.types';

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  async refresh(refreshToken: string): Promise<LoginResponse> {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  async logout(refreshToken?: string): Promise<void> {
    await api.post('/auth/logout', { refreshToken });
  },

  async me(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data.data;
  },
};
