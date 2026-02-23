export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: Array<{ field: string; message: string }>;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  municipalityId: string | null;
  userId: string;
  userName: string;
  userRole: string;
  timestamp: string;
  sourceIp: string | null;
  action: string;
  module: string;
  entityType: string | null;
  entityId: string | null;
  dataBefore: Record<string, any> | null;
  dataAfter: Record<string, any> | null;
  metadata: Record<string, any>;
  createdAt: string;
}
