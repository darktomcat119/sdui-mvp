import api from './api.service';
import type { Municipality } from '../types/sdui.types';
import type { ApiResponse } from '../types/api.types';

export const municipalitiesService = {
  async getById(id: string): Promise<ApiResponse<Municipality>> {
    const response = await api.get(`/municipalities/${id}`);
    return response.data;
  },

  async update(
    id: string,
    data: { cuotaBaseLegal?: number },
  ): Promise<ApiResponse<Municipality>> {
    const response = await api.patch(`/municipalities/${id}`, data);
    return response.data;
  },
};
