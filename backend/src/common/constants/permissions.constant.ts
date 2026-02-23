import { UserRole } from './roles.constant';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.SYSTEM_ADMIN]: [
    'municipalities:create',
    'municipalities:read',
    'municipalities:update',
    'users:create',
    'users:read',
    'users:update',
    'users:deactivate',
    'audit:read',
    'dashboard:read',
  ],
  [UserRole.MUNICIPAL_ADMIN]: [
    'users:create',
    'users:read',
    'users:update',
    'users:deactivate',
    'audit:read',
    'dashboard:read',
  ],
  [UserRole.TREASURY_OPERATOR]: [
    'dashboard:read',
  ],
  [UserRole.LEGAL_ANALYST]: [
    'dashboard:read',
    'audit:read',
  ],
  [UserRole.COMPTROLLER_AUDITOR]: [
    'audit:read',
    'dashboard:read',
  ],
};
