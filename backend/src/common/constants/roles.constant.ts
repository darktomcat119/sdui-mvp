export enum UserRole {
  SYSTEM_ADMIN = 'system_admin',
  MUNICIPAL_ADMIN = 'municipal_admin',
  TREASURY_OPERATOR = 'treasury_operator',
  LEGAL_ANALYST = 'legal_analyst',
  COMPTROLLER_AUDITOR = 'comptroller_auditor',
  VALIDADOR_TECNICO = 'validador_tecnico',
}

export const USER_ROLES = Object.values(UserRole);
