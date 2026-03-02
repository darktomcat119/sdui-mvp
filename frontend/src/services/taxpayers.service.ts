import api from './api.service';
import type {
  Taxpayer,
  TaxpayerStats,
  BulkUploadResult,
} from '../types/sdui.types';
import type { PaginatedResponse, ApiResponse } from '../types/api.types';

export interface TaxpayerQuery {
  page?: number;
  limit?: number;
  search?: string;
  scianId?: string;
  zoneId?: string;
  tipoContribuyente?: string;
  estatus?: string;
}

export const taxpayersService = {
  async list(
    query: TaxpayerQuery = {},
  ): Promise<PaginatedResponse<Taxpayer>> {
    const response = await api.get('/taxpayers', { params: query });
    return response.data;
  },

  async getById(id: string): Promise<ApiResponse<Taxpayer>> {
    const response = await api.get(`/taxpayers/${id}`);
    return response.data;
  },

  async create(data: {
    razonSocial: string;
    tipoPersonalidad: string;
    rfc?: string;
    curp?: string;
    tipoTramite: string;
    numeroLicencia?: string;
    claveCatastral?: string;
    usoSuelo?: string;
    actividadRegulada?: string;
    scianId: string;
    zoneId: string;
    tipoContribuyente: string;
    superficieM2: number;
    cuotaVigente: number;
  }): Promise<ApiResponse<Taxpayer>> {
    const response = await api.post('/taxpayers', data);
    return response.data;
  },

  async update(
    id: string,
    data: Partial<{
      razonSocial: string;
      tipoPersonalidad: string;
      rfc: string;
      curp: string;
      tipoTramite: string;
      scianId: string;
      zoneId: string;
      tipoContribuyente: string;
      superficieM2: number;
      cuotaVigente: number;
      estatus: string;
    }>,
  ): Promise<ApiResponse<Taxpayer>> {
    const response = await api.patch(`/taxpayers/${id}`, data);
    return response.data;
  },

  async bulkUpload(file: File): Promise<ApiResponse<BulkUploadResult>> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/taxpayers/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getStats(): Promise<ApiResponse<TaxpayerStats>> {
    const response = await api.get('/taxpayers/stats');
    return response.data;
  },
};
