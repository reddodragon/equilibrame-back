import type { AuthProvider, UserRole } from '../../../generated/prisma/enums';
import type { AuthenticatedUser } from '../../../shared/types/auth.types';

export class UserResponseDto implements AuthenticatedUser {
  id!: string;
  email!: string;
  firstName!: string | null;
  lastName!: string | null;
  phone!: string | null;
  role!: UserRole;
  provider!: AuthProvider;
  avatarUrl!: string | null;
  isActive!: boolean;
  isEmailVerified!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
