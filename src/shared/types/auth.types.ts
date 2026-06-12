import type { AuthProvider, UserRole } from '../../generated/prisma/enums';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  provider: AuthProvider;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: UserRole;
  provider: AuthProvider;
  avatarUrl: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface GoogleAuthError {
  errorCode:
    | 'GOOGLE_AUTH_FAILED'
    | 'GOOGLE_EMAIL_REQUIRED'
    | 'ACCOUNT_PROVIDER_CONFLICT'
    | 'GOOGLE_ACCOUNT_CONFLICT';
  message: string;
}
