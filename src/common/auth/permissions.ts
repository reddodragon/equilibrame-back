import type { UserRole } from '../../generated/prisma/enums';

export const Permission = {
  CATALOG_READ: 'catalog:read',
  ADMIN_ACCESS: 'admin:access',
  CATALOG_MANAGE: 'catalog:manage',
  USERS_MANAGE: 'users:manage',
  HOME_MANAGE: 'home:manage',
  RESELLER_ACCESS: 'reseller:access',
  REQUESTS_CREATE: 'requests:create',
  REQUESTS_MANAGE: 'requests:manage',
  SALES_READ: 'sales:read',
} as const;
export type Permission = (typeof Permission)[keyof typeof Permission];

const rolePermissions: Record<UserRole, readonly Permission[]> = {
  USER: [Permission.CATALOG_READ],
  ENTREPRENEUR: [
    Permission.CATALOG_READ,
    Permission.RESELLER_ACCESS,
    Permission.REQUESTS_CREATE,
  ],
  ADMIN: Object.values(Permission),
};

export function getPermissions(role: string | undefined): Permission[] {
  if (!role || !Object.hasOwn(rolePermissions, role)) return [];
  return [...rolePermissions[role as UserRole]];
}

export function hasPermission(
  role: string | undefined,
  permission: Permission,
): boolean {
  return getPermissions(role).includes(permission);
}
