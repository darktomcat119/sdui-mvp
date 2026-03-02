import api from './api.service';
import type { ApiResponse } from '../types/api.types';

export interface CentralConfigVersion {
  id: string;
  version: number;
  pSuperficieMin: number;
  pSuperficieMax: number;
  pZonaMin: number;
  pZonaMax: number;
  pGiroMin: number;
  pGiroMax: number;
  pTipoMin: number;
  pTipoMax: number;
  zonaMultMin: number;
  zonaMultMax: number;
  variacionLimitMin: number;
  variacionLimitMax: number;
  itdThresholdProtegido: number;
  itdThresholdProporcional: number;
  active: boolean;
  justification: string | null;
  createdAt: string;
}

export const centralConfigService = {
  async getActive(): Promise<ApiResponse<CentralConfigVersion | null>> {
    const response = await api.get('/central-config');
    return response.data;
  },

  async getHistory(): Promise<ApiResponse<CentralConfigVersion[]>> {
    const response = await api.get('/central-config/history');
    return response.data;
  },

  async create(data: Omit<CentralConfigVersion, 'id' | 'version' | 'active' | 'createdAt'>): Promise<ApiResponse<CentralConfigVersion>> {
    const response = await api.post('/central-config', data);
    return response.data;
  },

  async activate(id: string): Promise<ApiResponse<CentralConfigVersion>> {
    const response = await api.patch(`/central-config/${id}/activate`);
    return response.data;
  },
};
