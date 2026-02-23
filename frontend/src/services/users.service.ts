import api from './api.service';
import type { User } from '../types/auth.types';
import type { PaginatedResponse, ApiResponse } from '../types/api.types';

export const usersService = {
  async list(page = 1, limit = 20): Promise<PaginatedResponse<User>> {
    const response = await api.get('/users', { params: { page, limit } });
    return response.data;
  },

  async getById(id: string): Promise<ApiResponse<User>> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    municipalityId?: string;
    avatarFilename?: string;
  }): Promise<ApiResponse<User>> {
    const response = await api.post('/users', data);
    return response.data;
  },

  async update(
    id: string,
    data: Partial<{
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role: string;
    }>,
  ): Promise<ApiResponse<User>> {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },

  async updateStatus(
    id: string,
    status: 'active' | 'inactive',
  ): Promise<ApiResponse<User>> {
    const response = await api.patch(`/users/${id}/status`, { status });
    return response.data;
  },
};
