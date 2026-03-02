import api from './api.service';
import type { ExecutiveSummary } from '../types/sdui.types';
import type { ApiResponse } from '../types/api.types';

export const reportsService = {
  async getExecutiveSummary(): Promise<ApiResponse<ExecutiveSummary>> {
    const response = await api.get('/reports/executive-summary');
    return response.data;
  },

  async exportCsv(): Promise<Blob> {
    const response = await api.get('/reports/determinations/csv', {
      responseType: 'blob',
    });
    return response.data;
  },

  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
