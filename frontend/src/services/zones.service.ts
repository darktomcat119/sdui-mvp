import api from './api.service';
import type { ZoneCatalog, MunicipalityZone } from '../types/sdui.types';
import type { PaginatedResponse, ApiResponse } from '../types/api.types';

export const zonesService = {
  async listCatalog(
    search?: string,
  ): Promise<PaginatedResponse<ZoneCatalog>> {
    const response = await api.get('/zones/catalog', {
      params: { search, limit: 50 },
    });
    return response.data;
  },

  async createZone(data: {
    codigoZona: string;
    nombreZona: string;
  }): Promise<ApiResponse<ZoneCatalog>> {
    const response = await api.post('/zones/catalog', data);
    return response.data;
  },

  async listMunicipalityZones(
    search?: string,
  ): Promise<PaginatedResponse<MunicipalityZone>> {
    const response = await api.get('/zones/municipality', {
      params: { search, limit: 50 },
    });
    return response.data;
  },

  async configureMunicipalityZone(data: {
    zoneId: string;
    nivelDemanda: string;
    multiplicador: number;
    vigenciaDesde: string;
    justificacion?: string;
  }): Promise<ApiResponse<MunicipalityZone>> {
    const response = await api.post('/zones/municipality', data);
    return response.data;
  },

  async updateMunicipalityZone(
    id: string,
    data: {
      nivelDemanda?: string;
      multiplicador?: number;
      justificacion?: string;
    },
  ): Promise<ApiResponse<MunicipalityZone>> {
    const response = await api.patch(`/zones/municipality/${id}`, data);
    return response.data;
  },
};
