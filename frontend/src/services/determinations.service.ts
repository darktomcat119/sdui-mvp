import api from './api.service';
import type {
  Determination,
  DeterminationSummary,
  LimitException,
} from '../types/sdui.types';
import type { PaginatedResponse, ApiResponse } from '../types/api.types';

export interface DeterminationQuery {
  page?: number;
  limit?: number;
  clasificacion?: string;
  estatus?: string;
  search?: string;
}

export const determinationsService = {
  async execute(
    taxpayerIds?: string[],
  ): Promise<ApiResponse<{ total: number; protegido: number; moderado: number; proporcional: number; bloqueadas: number }>> {
    const response = await api.post('/determinations/execute', { taxpayerIds });
    return response.data;
  },

  async list(
    query: DeterminationQuery = {},
  ): Promise<PaginatedResponse<Determination>> {
    const response = await api.get('/determinations', { params: query });
    return response.data;
  },

  async getById(id: string): Promise<ApiResponse<Determination>> {
    const response = await api.get(`/determinations/${id}`);
    return response.data;
  },

  async getSummary(): Promise<ApiResponse<DeterminationSummary>> {
    const response = await api.get('/determinations/summary');
    return response.data;
  },

  async approve(id: string): Promise<ApiResponse<Determination>> {
    const response = await api.patch(`/determinations/${id}/approve`);
    return response.data;
  },

  async listExceptions(
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<LimitException>> {
    const response = await api.get('/determinations/exceptions', {
      params: { page, limit },
    });
    return response.data;
  },

  async resolveException(
    id: string,
    data: {
      resolutionOption: 'APROBAR' | 'RECHAZAR' | 'ESCALAR';
      justificacion: string;
      escalatedTo?: string;
    },
  ): Promise<ApiResponse<LimitException>> {
    const response = await api.patch(`/determinations/exceptions/${id}`, data);
    return response.data;
  },
};
