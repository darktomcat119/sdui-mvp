import api from './api.service';
import type { AuditLog, PaginatedResponse } from '../types/api.types';

export interface AuditQueryParams {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  action?: string;
  module?: string;
}

export const auditService = {
  async list(params: AuditQueryParams = {}): Promise<PaginatedResponse<AuditLog>> {
    const response = await api.get('/audit-logs', { params });
    return response.data;
  },

  async getById(id: string): Promise<{ data: AuditLog }> {
    const response = await api.get(`/audit-logs/${id}`);
    return response.data;
  },
};
