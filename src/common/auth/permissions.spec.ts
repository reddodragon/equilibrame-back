import { getPermissions, hasPermission, Permission } from './permissions';
import { UserRole } from '../../generated/prisma/enums';

describe('role permissions', () => {
  it.each(['USER', 'EMPLOYEE', 'ENTREPRENEUR'])(
    'does not grant admin access to %s',
    (role) => {
      expect(hasPermission(role, Permission.ADMIN_ACCESS)).toBe(false);
      expect(hasPermission(role, Permission.USERS_MANAGE)).toBe(false);
    },
  );

  it('grants admin all explicitly declared capabilities', () => {
    for (const permission of Object.values(Permission)) {
      expect(hasPermission('ADMIN', permission)).toBe(true);
    }
  });

  it('defines exactly the three supported roles and rejects employee', () => {
    expect(Object.values(UserRole).sort()).toEqual([
      'ADMIN',
      'ENTREPRENEUR',
      'USER',
    ]);
    expect(getPermissions('EMPLOYEE')).toEqual([]);
  });

  it('reserves reseller capabilities for validated reseller/admin roles', () => {
    expect(hasPermission('ENTREPRENEUR', Permission.RESELLER_ACCESS)).toBe(
      true,
    );
    expect(hasPermission('USER', Permission.RESELLER_ACCESS)).toBe(false);
  });

  it.each(['UNKNOWN', 'constructor', '__proto__', '', undefined])(
    'fails closed for unknown role %s',
    (role) => {
      expect(getPermissions(role)).toEqual([]);
    },
  );

  it('returns a copy to avoid accidental privilege mutation', () => {
    getPermissions('USER').push(Permission.USERS_MANAGE);
    expect(hasPermission('USER', Permission.USERS_MANAGE)).toBe(false);
  });
});
