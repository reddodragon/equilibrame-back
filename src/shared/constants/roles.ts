import { UserRole } from '../../generated/prisma/enums';

export const ALL_USER_ROLES: UserRole[] = [
  UserRole.USER,
  UserRole.ENTREPRENEUR,
  UserRole.ADMIN,
];

export const ADMIN_ONLY_ROLES: UserRole[] = [UserRole.ADMIN];
