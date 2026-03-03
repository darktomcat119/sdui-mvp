import api from './api.service';
import type { ApiResponse } from '../types/api.types';

export interface DocumentMeta {
  id: string;
  hashSha256: string;
  nombreArchivo: string;
  tamanoBytes: number;
}

export interface DocumentVerification {
  valid: boolean;
  document: {
    id: string;
    tipo: string;
    nombreArchivo: string;
    createdAt: string;
    tamanoBytes: number;
  } | null;
}

export const documentsService = {
  async generateDictamen(
    determinationId: string,
  ): Promise<ApiResponse<DocumentMeta>> {
    const response = await api.post('/documents/dictamen', {
      determinationId,
    });
    return response.data;
  },

  async download(documentId: string): Promise<Blob> {
    const response = await api.get(`/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async verify(hash: string): Promise<ApiResponse<DocumentVerification>> {
    const response = await api.get(`/documents/verify/${hash}`);
    return response.data;
  },
};
