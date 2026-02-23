import api from './api.service';
import type { User } from '../types/auth.types';

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarFilename?: string;
  password?: string;
}

export const profileService = {
  async getProfile(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data.data;
  },

  async updateProfile(data: UpdateProfileData): Promise<User> {
    const response = await api.patch('/auth/profile', data);
    return response.data.data;
  },

  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/uploads/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.filename;
  },
};
