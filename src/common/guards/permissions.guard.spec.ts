import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { Permission } from '../auth/permissions';

describe('PermissionsGuard', () => {
  function check(
    user?: { role: string; isActive: boolean },
    required: Permission[] = [Permission.ADMIN_ACCESS],
  ) {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(required),
    };
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
    return new PermissionsGuard(reflector as unknown as Reflector).canActivate(
      context,
    );
  }

  it('allows public/unannotated endpoints to continue through other guards', () => {
    expect(check(undefined, [])).toBe(true);
  });
  it('rejects missing and inactive users', () => {
    expect(check()).toBe(false);
    expect(check({ role: 'ADMIN', isActive: false })).toBe(false);
  });
  it('requires every declared permission', () => {
    expect(check({ role: 'ADMIN', isActive: true })).toBe(true);
    expect(
      check({ role: 'USER', isActive: true }, [
        Permission.CATALOG_READ,
        Permission.ADMIN_ACCESS,
      ]),
    ).toBe(false);
  });
});
