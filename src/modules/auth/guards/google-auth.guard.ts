import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { GoogleAuthError } from '../../../shared/types/auth.types';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    void context;

    return {
      accessType: 'offline',
      prompt: 'select_account',
      scope: ['email', 'profile'],
      session: false,
    };
  }

  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser | false,
    info: { message?: string } | string | undefined,
  ): TUser | GoogleAuthError {
    if (err) {
      return {
        errorCode: 'GOOGLE_AUTH_FAILED',
        message:
          err instanceof Error ? err.message : 'Google authentication failed.',
      };
    }

    if (!user) {
      const message =
        typeof info === 'string'
          ? info
          : (info?.message ?? 'Google authentication failed.');

      return {
        errorCode: 'GOOGLE_AUTH_FAILED',
        message,
      };
    }

    return user;
  }
}
