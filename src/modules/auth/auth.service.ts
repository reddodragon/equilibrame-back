import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import type { CookieOptions, Request, Response } from 'express';
import type { Profile } from 'passport-google-oauth20';
import { type User } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthProvider } from '../../generated/prisma/enums';
import type {
  GoogleAuthError,
  JwtPayload,
  TokenPair,
} from '../../shared/types/auth.types';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RegisterDto } from './dto/register.dto';
import {
  ACCESS_TOKEN_TTL,
  FRONTEND_AUTH_CALLBACK_PATH,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_PATH,
  REFRESH_TOKEN_TTL,
} from './auth.constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  static extractRefreshTokenFromRequest(request: Request): string | null {
    const cookies = request.cookies as Record<string, unknown> | undefined;
    const token = cookies?.[REFRESH_TOKEN_COOKIE_NAME];

    return typeof token === 'string' && token.length > 0 ? token : null;
  }

  async register(
    registerDto: RegisterDto,
    response: Response,
  ): Promise<AuthResponseDto> {
    const email = this.normalizeEmail(registerDto.email);
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      if (existingUser.provider === AuthProvider.GOOGLE) {
        throw new ConflictException(
          'This email is already registered with Google. Continue with Google Sign-In.',
        );
      }

      throw new ConflictException('This email is already registered.');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.createLocalUser({
      email,
      passwordHash,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phone: registerDto.phone,
    });

    return this.issueAuthSession(user, response);
  }

  async validateLocalUser(email: string, password: string): Promise<User> {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.provider === AuthProvider.GOOGLE || !user.passwordHash) {
      throw new ConflictException(
        'This email uses Google Sign-In. Continue with Google instead of a password.',
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return user;
  }

  async login(user: User, response: Response): Promise<AuthResponseDto> {
    return this.issueAuthSession(user, response);
  }

  async refresh(
    userId: string,
    refreshToken: string,
    response: Response,
  ): Promise<AuthResponseDto> {
    try {
      const { user, currentRefreshTokenHash } =
        await this.validateStoredRefreshToken(userId, refreshToken);

      return await this.issueAuthSession(
        user,
        response,
        currentRefreshTokenHash,
      );
    } catch (error) {
      this.clearRefreshTokenCookie(response);
      throw error;
    }
  }

  async logout(
    request: Request,
    response: Response,
  ): Promise<{ message: string }> {
    const refreshToken = AuthService.extractRefreshTokenFromRequest(request);

    if (refreshToken) {
      try {
        const payload = await this.jwtService.verifyAsync<JwtPayload>(
          refreshToken,
          {
            secret: this.configService.getOrThrow<string>(
              'app.jwtRefreshSecret',
            ),
          },
        );

        await this.usersService.clearRefreshTokenHash(payload.sub);
      } catch {
        // Cookie is still cleared below even if verification fails.
      }
    }

    this.clearRefreshTokenCookie(response);

    return {
      message: 'Logged out successfully.',
    };
  }

  async assertRefreshTokenMatches(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    await this.validateStoredRefreshToken(userId, refreshToken);
  }

  async validateGoogleUser(profile: Profile): Promise<User | GoogleAuthError> {
    const primaryEmail =
      profile.emails?.find((email) => email.verified)?.value ??
      profile.emails?.[0]?.value;

    if (!primaryEmail) {
      return {
        errorCode: 'GOOGLE_EMAIL_REQUIRED',
        message: 'Google did not return a verified email address.',
      };
    }

    const email = this.normalizeEmail(primaryEmail);
    const existingByGoogleId = profile.id
      ? await this.usersService.findByGoogleId(profile.id)
      : null;

    if (existingByGoogleId) {
      return this.usersService.updateGoogleProfile(existingByGoogleId.id, {
        firstName: profile.name?.givenName,
        lastName: profile.name?.familyName,
        avatarUrl: profile.photos?.[0]?.value,
        isEmailVerified: true,
      });
    }

    const existingByEmail = await this.usersService.findByEmail(email);

    if (existingByEmail) {
      if (existingByEmail.provider === AuthProvider.LOCAL) {
        return {
          errorCode: 'ACCOUNT_PROVIDER_CONFLICT',
          message:
            'This email is already registered with email and password. Sign in with your password instead.',
        };
      }

      if (
        existingByEmail.provider === AuthProvider.GOOGLE &&
        existingByEmail.googleId &&
        existingByEmail.googleId !== profile.id
      ) {
        return {
          errorCode: 'GOOGLE_ACCOUNT_CONFLICT',
          message:
            'This Google account does not match the existing Google user for this email.',
        };
      }

      return this.usersService.updateGoogleProfile(existingByEmail.id, {
        googleId: profile.id,
        firstName: profile.name?.givenName,
        lastName: profile.name?.familyName,
        avatarUrl: profile.photos?.[0]?.value,
        isEmailVerified: true,
      });
    }

    return this.usersService.createGoogleUser({
      email,
      googleId: profile.id,
      firstName: profile.name?.givenName,
      lastName: profile.name?.familyName,
      avatarUrl: profile.photos?.[0]?.value,
      isEmailVerified: true,
    });
  }

  async completeGoogleAuthentication(
    googleUserOrError: User | GoogleAuthError,
    response: Response,
  ): Promise<void> {
    if (this.isGoogleAuthError(googleUserOrError)) {
      response.redirect(
        this.buildFrontendCallbackUrl({
          error: googleUserOrError.errorCode,
        }),
      );
      return;
    }

    const authResponse = await this.issueAuthSession(
      googleUserOrError,
      response,
    );

    response.redirect(
      this.buildFrontendCallbackUrl({
        accessToken: authResponse.accessToken,
      }),
    );
  }

  clearRefreshTokenCookie(response?: Response): void {
    if (!response) {
      return;
    }

    response.clearCookie(
      REFRESH_TOKEN_COOKIE_NAME,
      this.getRefreshTokenCookieOptions(),
    );
  }

  private async issueAuthSession(
    user: User,
    response: Response,
    currentRefreshTokenHash?: string,
  ): Promise<AuthResponseDto> {
    const tokenPair = await this.generateTokenPair(user);
    const refreshTokenHash = await this.hashRefreshToken(
      tokenPair.refreshToken,
    );

    if (currentRefreshTokenHash) {
      await this.rotateRefreshTokenHash(
        user.id,
        currentRefreshTokenHash,
        refreshTokenHash,
      );
    } else {
      await this.usersService.saveRefreshTokenHash(user.id, refreshTokenHash);
    }

    response.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      tokenPair.refreshToken,
      this.getRefreshTokenCookieOptions(),
    );

    return {
      accessToken: tokenPair.accessToken,
      user: this.usersService.toResponseDto(user),
    };
  }

  private async generateTokenPair(user: User): Promise<TokenPair> {
    const accessTokenPayload = this.createJwtPayload(user);
    const refreshTokenPayload = {
      ...accessTokenPayload,
      jti: randomUUID(),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: this.configService.getOrThrow<string>('app.jwtSecret'),
        expiresIn: ACCESS_TOKEN_TTL,
      }),
      this.jwtService.signAsync(refreshTokenPayload, {
        secret: this.configService.getOrThrow<string>('app.jwtRefreshSecret'),
        expiresIn: REFRESH_TOKEN_TTL,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private createJwtPayload(user: User): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      provider: user.provider,
    };
  }

  private async validateStoredRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<{ user: User; currentRefreshTokenHash: string }> {
    const user = await this.usersService.findById(userId);

    if (!user || !user.isActive || !user.refreshTokenHash) {
      if (user) {
        await this.usersService.clearRefreshTokenHash(user.id);
      }

      throw new UnauthorizedException('Refresh token is no longer valid.');
    }

    const tokenMatches = await this.refreshTokenHashMatches(
      refreshToken,
      user.refreshTokenHash,
    );

    if (!tokenMatches) {
      throw new UnauthorizedException('Refresh token mismatch detected.');
    }

    return {
      user,
      currentRefreshTokenHash: user.refreshTokenHash,
    };
  }

  private async rotateRefreshTokenHash(
    userId: string,
    currentRefreshTokenHash: string,
    nextRefreshTokenHash: string,
  ): Promise<void> {
    const updateResult = await this.prismaService.user.updateMany({
      where: {
        id: userId,
        isActive: true,
        refreshTokenHash: currentRefreshTokenHash,
      },
      data: {
        refreshTokenHash: nextRefreshTokenHash,
      },
    });

    if (updateResult.count !== 1) {
      throw new UnauthorizedException('Refresh token was already rotated.');
    }
  }

  private async hashRefreshToken(refreshToken: string): Promise<string> {
    return bcrypt.hash(this.createRefreshTokenFingerprint(refreshToken), 10);
  }

  private async refreshTokenHashMatches(
    refreshToken: string,
    storedHash: string,
  ): Promise<boolean> {
    const matchesFingerprint = await bcrypt.compare(
      this.createRefreshTokenFingerprint(refreshToken),
      storedHash,
    );

    if (matchesFingerprint) {
      return true;
    }

    return bcrypt.compare(refreshToken, storedHash);
  }

  private createRefreshTokenFingerprint(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  private getRefreshTokenCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: REFRESH_TOKEN_COOKIE_PATH,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }

  private buildFrontendCallbackUrl(params: {
    accessToken?: string;
    error?: GoogleAuthError['errorCode'];
  }): string {
    const frontendUrl =
      this.configService.getOrThrow<string>('app.frontendUrl');
    const redirectUrl = new URL(FRONTEND_AUTH_CALLBACK_PATH, frontendUrl);

    if (params.accessToken) {
      redirectUrl.searchParams.set('accessToken', params.accessToken);
    }

    if (params.error) {
      redirectUrl.searchParams.set('error', params.error);
    }

    return redirectUrl.toString();
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private isGoogleAuthError(
    value: User | GoogleAuthError,
  ): value is GoogleAuthError {
    return 'errorCode' in value;
  }
}
