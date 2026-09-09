import { Controller, Get } from '@nestjs/common';
import { getPermissions, Permission } from '../../common/auth/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../shared/types/auth.types';

@Controller('admin/access')
@RequirePermissions(Permission.ADMIN_ACCESS)
export class AdminAccessController {
  @Get()
  getAccess(@CurrentUser() user: AuthenticatedUser) {
    return { role: user.role, permissions: getPermissions(user.role) };
  }
}
