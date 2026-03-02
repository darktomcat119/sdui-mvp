import api from './api.service';
import type { ExecutiveSummary, TaxpayerStats } from '../types/sdui.types';
import type { ApiResponse } from '../types/api.types';

export const dashboardService = {
  async getStats(): Promise<ApiResponse<ExecutiveSummary>> {
    // Reuse executive summary for dashboard KPIs
    const response = await api.get('/reports/executive-summary');
    return response.data;
  },

  async getTaxpayerStats(): Promise<ApiResponse<TaxpayerStats>> {
    const response = await api.get('/taxpayers/stats');
    return response.data;
  },
};
