import { Injectable } from '@nestjs/common';
import { Prisma, type User } from '../../generated/prisma/client';
import { AuthProvider, UserRole } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../shared/types/auth.types';
import { UserResponseDto } from './dto/user-response.dto';

interface CreateLocalUserInput {
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface CreateGoogleUserInput {
  email: string;
  googleId: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  isEmailVerified?: boolean;
}

interface UpdateGoogleProfileInput {
  googleId?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  isEmailVerified?: boolean;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { googleId },
    });
  }

  async createLocalUser(input: CreateLocalUserInput): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        role: UserRole.USER,
        provider: AuthProvider.LOCAL,
      },
    });
  }

  async createGoogleUser(input: CreateGoogleUserInput): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: input.email,
        googleId: input.googleId,
        firstName: input.firstName,
        lastName: input.lastName,
        avatarUrl: input.avatarUrl,
        isEmailVerified: input.isEmailVerified ?? true,
        role: UserRole.USER,
        provider: AuthProvider.GOOGLE,
      },
    });
  }

  async updateGoogleProfile(
    userId: string,
    input: UpdateGoogleProfileInput,
  ): Promise<User> {
    const data: Prisma.UserUpdateInput = {
      googleId: input.googleId,
      firstName: input.firstName,
      lastName: input.lastName,
      avatarUrl: input.avatarUrl,
      isEmailVerified: input.isEmailVerified,
    };

    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async saveRefreshTokenHash(
    userId: string,
    refreshTokenHash: string | null,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshTokenHash,
      },
    });
  }

  async clearRefreshTokenHash(userId: string): Promise<void> {
    await this.saveRefreshTokenHash(userId, null);
  }

  toResponseDto(user: User): UserResponseDto {
    const response = new UserResponseDto();

    response.id = user.id;
    response.email = user.email;
    response.firstName = user.firstName;
    response.lastName = user.lastName;
    response.phone = user.phone;
    response.role = user.role;
    response.provider = user.provider;
    response.avatarUrl = user.avatarUrl;
    response.isActive = user.isActive;
    response.isEmailVerified = user.isEmailVerified;
    response.createdAt = user.createdAt;
    response.updatedAt = user.updatedAt;

    return response;
  }

  async findPublicById(id: string): Promise<AuthenticatedUser | null> {
    const user = await this.findById(id);

    return user ? this.toResponseDto(user) : null;
  }
}
