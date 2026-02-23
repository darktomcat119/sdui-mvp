import { UserRole } from '../constants/roles.constant';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  municipalityId: string | null;
  iat?: number;
  exp?: number;
}

export interface RequestUser {
  id: string;
  email: string;
  role: UserRole;
  municipalityId: string | null;
  firstName: string;
  lastName: string;
  avatarFilename: string | null;
}
