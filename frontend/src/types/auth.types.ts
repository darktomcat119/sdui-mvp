export const UserRole = {
  SYSTEM_ADMIN: 'system_admin',
  MUNICIPAL_ADMIN: 'municipal_admin',
  TREASURY_OPERATOR: 'treasury_operator',
  LEGAL_ANALYST: 'legal_analyst',
  COMPTROLLER_AUDITOR: 'comptroller_auditor',
  VALIDADOR_TECNICO: 'validador_tecnico',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  municipalityId: string | null;
  municipalityName?: string | null;
  avatarFilename?: string | null;
  status?: string;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
