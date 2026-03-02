import api from './api.service';
import type { ScianCode, MunicipalityScian } from '../types/sdui.types';
import type { PaginatedResponse, ApiResponse } from '../types/api.types';

export interface ScianQuery {
  page?: number;
  limit?: number;
  search?: string;
  impacto?: string;
  activo?: boolean;
}

export const scianService = {
  async list(query: ScianQuery = {}): Promise<PaginatedResponse<ScianCode>> {
    const response = await api.get('/scian', { params: query });
    return response.data;
  },

  async getById(id: string): Promise<ApiResponse<ScianCode>> {
    const response = await api.get(`/scian/${id}`);
    return response.data;
  },

  async updateImpact(
    id: string,
    impactoSdui: string,
  ): Promise<ApiResponse<ScianCode>> {
    const response = await api.patch(`/scian/${id}/impact`, { impactoSdui });
    return response.data;
  },

  async listByMunicipality(
    municipalityId: string,
    query: ScianQuery = {},
  ): Promise<PaginatedResponse<MunicipalityScian>> {
    const response = await api.get(`/scian/municipality/${municipalityId}`, {
      params: query,
    });
    return response.data;
  },

  async toggleMunicipalityScian(
    municipalityId: string,
    scianId: string,
    activo: boolean,
  ): Promise<ApiResponse<MunicipalityScian>> {
    const response = await api.patch(
      `/scian/municipality/${municipalityId}/${scianId}`,
      { activo },
    );
    return response.data;
  },
};
