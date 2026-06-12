import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request, Response } from 'express';
import type {
  AuthenticatedUser,
  JwtPayload,
} from '../../../shared/types/auth.types';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request | undefined) =>
          request ? AuthService.extractRefreshTokenFromRequest(request) : null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('app.jwtRefreshSecret'),
      passReqToCallback: true,
    });
  }

  async validate(
    request: Request & { res?: Response },
    payload: JwtPayload,
  ): Promise<AuthenticatedUser> {
    const refreshToken = AuthService.extractRefreshTokenFromRequest(request);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token cookie is missing.');
    }

    try {
      await this.authService.assertRefreshTokenMatches(
        payload.sub,
        refreshToken,
      );
    } catch (error) {
      this.authService.clearRefreshTokenCookie(request.res);
      throw error;
    }

    const user = await this.usersService.findPublicById(payload.sub);

    if (!user || !user.isActive) {
      this.authService.clearRefreshTokenCookie(request.res);
      throw new UnauthorizedException('Refresh token is no longer valid.');
    }

    return user;
  }
}
