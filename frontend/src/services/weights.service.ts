import api from './api.service';
import type { WeightConfiguration } from '../types/sdui.types';
import type { PaginatedResponse, ApiResponse } from '../types/api.types';

export const weightsService = {
  async getCurrent(): Promise<ApiResponse<WeightConfiguration>> {
    const response = await api.get('/weights');
    return response.data;
  },

  async getHistory(
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<WeightConfiguration>> {
    const response = await api.get('/weights/history', {
      params: { page, limit },
    });
    return response.data;
  },

  async create(data: {
    pSuperficie: number;
    pZona: number;
    pGiro: number;
    pTipo: number;
    limiteVariacionPct: number;
    ejercicioFiscal: number;
    vigenciaDesde: string;
    justificacion?: string;
    folioActa?: string;
  }): Promise<ApiResponse<WeightConfiguration>> {
    const response = await api.post('/weights', data);
    return response.data;
  },
};
