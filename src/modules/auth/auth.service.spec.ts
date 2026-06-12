import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import type { Response } from 'express';
import type { Profile } from 'passport-google-oauth20';
import type { User } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthProvider, UserRole } from '../../generated/prisma/enums';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

describe('AuthService', () => {
  const baseUser: User = {
    id: 'user-1',
    email: 'user@example.com',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuv',
    firstName: 'Ada',
    lastName: 'Lovelace',
    phone: null,
    role: UserRole.USER,
    provider: AuthProvider.LOCAL,
    googleId: null,
    avatarUrl: null,
    isActive: true,
    isEmailVerified: false,
    refreshTokenHash: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let prismaService: {
    user: {
      updateMany: jest.Mock;
    };
  };
  let response: {
    cookie: jest.Mock;
    clearCookie: jest.Mock;
    redirect: jest.Mock;
  };

  const toResponseDto = (user: User) => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    provider: user.provider,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });

  beforeEach(() => {
    usersService = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByGoogleId: jest.fn(),
      createLocalUser: jest.fn(),
      createGoogleUser: jest.fn(),
      updateGoogleProfile: jest.fn(),
      saveRefreshTokenHash: jest.fn(),
      clearRefreshTokenHash: jest.fn(),
      toResponseDto: jest.fn((user: User) => toResponseDto(user)),
      findPublicById: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    configService = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, string> = {
          'app.jwtSecret': 'jwt-secret-1234567890',
          'app.jwtRefreshSecret': 'refresh-secret-1234567890',
          'app.frontendUrl': 'http://localhost:3000',
        };

        return values[key];
      }),
    } as unknown as jest.Mocked<ConfigService>;

    prismaService = {
      user: {
        updateMany: jest.fn(),
      },
    };

    response = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
      redirect: jest.fn(),
    };

    authService = new AuthService(
      usersService,
      jwtService,
      configService,
      prismaService as unknown as PrismaService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('registers local users as USER and auto-logins them', async () => {
    const registerDto: RegisterDto = {
      email: '  USER@Example.com ',
      password: 'super-secret',
      firstName: 'Ada',
      lastName: 'Lovelace',
    };

    usersService.findByEmail.mockResolvedValue(null);
    usersService.createLocalUser.mockResolvedValue(baseUser);
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');
    jest
      .spyOn(bcrypt, 'hash')
      .mockResolvedValueOnce('password-hash' as never)
      .mockResolvedValueOnce('refresh-hash' as never);

    const result = await authService.register(
      registerDto,
      response as unknown as Response,
    );

    expect(usersService.createLocalUser.mock.calls[0][0]).toEqual({
      email: 'user@example.com',
      passwordHash: 'password-hash',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: undefined,
    });
    expect(result).toEqual({
      accessToken: 'access-token',
      user: toResponseDto(baseUser),
    });
    expect(response.cookie.mock.calls).toHaveLength(1);
  });

  it('rejects local login for Google-only accounts with explicit collision message', async () => {
    usersService.findByEmail.mockResolvedValue({
      ...baseUser,
      provider: AuthProvider.GOOGLE,
      passwordHash: null,
    });

    await expect(
      authService.validateLocalUser('user@example.com', 'irrelevant'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects mismatched refresh tokens without clearing the current session hash', async () => {
    usersService.findById.mockResolvedValue({
      ...baseUser,
      refreshTokenHash: 'stored-hash',
    });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

    await expect(
      authService.assertRefreshTokenMatches('user-1', 'bad-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(usersService.clearRefreshTokenHash.mock.calls).toHaveLength(0);
  });

  it('returns explicit Google provider collision when email already belongs to LOCAL account', async () => {
    const profile = {
      id: 'google-1',
      emails: [{ value: 'user@example.com', verified: true }],
      name: { givenName: 'Ada', familyName: 'Lovelace' },
      photos: [{ value: 'https://example.com/avatar.png' }],
    } as Profile;

    usersService.findByGoogleId.mockResolvedValue(null);
    usersService.findByEmail.mockResolvedValue(baseUser);

    const result = await authService.validateGoogleUser(profile);

    expect(result).toEqual({
      errorCode: 'ACCOUNT_PROVIDER_CONFLICT',
      message:
        'This email is already registered with email and password. Sign in with your password instead.',
    });
  });

  it('redirects Google callback success to frontend callback without refresh token in URL', async () => {
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('refresh-hash' as never);

    await authService.completeGoogleAuthentication(
      {
        ...baseUser,
        provider: AuthProvider.GOOGLE,
      },
      response as unknown as Response,
    );

    expect(response.redirect.mock.calls[0]).toEqual([
      'http://localhost:3000/auth/callback?accessToken=access-token',
    ]);
    expect(usersService.saveRefreshTokenHash.mock.calls[0]).toEqual([
      'user-1',
      'refresh-hash',
    ]);
  });

  it('rejects a rotated refresh token even when both tokens share the same first 72 characters', async () => {
    const currentRefreshToken = `${'a'.repeat(72)}-current-token-suffix`;
    const rotatedRefreshToken = `${'a'.repeat(72)}-stale-token-suffix`;
    const currentRefreshTokenHash = await bcrypt.hash(
      createHash('sha256').update(currentRefreshToken).digest('hex'),
      4,
    );

    usersService.findById.mockResolvedValue({
      ...baseUser,
      refreshTokenHash: currentRefreshTokenHash,
    });

    await expect(
      authService.assertRefreshTokenMatches('user-1', rotatedRefreshToken),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(usersService.clearRefreshTokenHash.mock.calls).toHaveLength(0);
  });

  it('rotates the refresh token hash atomically during refresh', async () => {
    const currentRefreshToken = 'refresh-token-current';
    const currentRefreshTokenHash = await bcrypt.hash(
      createHash('sha256').update(currentRefreshToken).digest('hex'),
      4,
    );

    usersService.findById.mockResolvedValue({
      ...baseUser,
      refreshTokenHash: currentRefreshTokenHash,
    });
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token-next');
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('refresh-hash-next' as never);
    prismaService.user.updateMany.mockResolvedValue({ count: 1 });

    const result = await authService.refresh(
      'user-1',
      currentRefreshToken,
      response as unknown as Response,
    );

    expect(result).toEqual({
      accessToken: 'access-token',
      user: toResponseDto(baseUser),
    });
    expect(prismaService.user.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'user-1',
        isActive: true,
        refreshTokenHash: currentRefreshTokenHash,
      },
      data: {
        refreshTokenHash: 'refresh-hash-next',
      },
    });
    expect(usersService.saveRefreshTokenHash.mock.calls).toHaveLength(0);
    expect(
      (jwtService.signAsync.mock.calls[1][0] as Record<string, unknown>).jti,
    ).toEqual(expect.any(String));
  });

  it('rejects a concurrent stale refresh without clearing the latest stored hash', async () => {
    const currentRefreshToken = 'refresh-token-current';
    const currentRefreshTokenHash = await bcrypt.hash(
      createHash('sha256').update(currentRefreshToken).digest('hex'),
      4,
    );

    usersService.findById.mockResolvedValue({
      ...baseUser,
      refreshTokenHash: currentRefreshTokenHash,
    });
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token-next');
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('refresh-hash-next' as never);
    prismaService.user.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      authService.refresh(
        'user-1',
        currentRefreshToken,
        response as unknown as Response,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(usersService.clearRefreshTokenHash.mock.calls).toHaveLength(0);
    expect(response.clearCookie.mock.calls).toHaveLength(1);
  });
});
