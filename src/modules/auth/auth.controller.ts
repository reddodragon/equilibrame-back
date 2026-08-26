import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { User } from '../../generated/prisma/client';
import type {
  AuthenticatedUser,
  GoogleAuthError,
} from '../../shared/types/auth.types';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

type LocalAuthRequest = Request & { user: User };
type GoogleAuthRequest = Request & { user: User | GoogleAuthError };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    return this.authService.register(registerDto, response);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(
    @Req() request: LocalAuthRequest,
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    void loginDto;
    return this.authService.login(request.user, response);
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  refresh(
    @Req() request: Request,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const refreshToken = AuthService.extractRefreshTokenFromRequest(request);

    if (!refreshToken) {
      throw new InternalServerErrorException(
        'Refresh token guard allowed a request without cookie.',
      );
    }

    return this.authService.refresh(user.id, refreshToken, response);
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('logout')
  logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    return this.authService.logout(request, response);
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  googleAuth(): void {}

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(
    @Req() request: GoogleAuthRequest,
    @Res() response: Response,
  ): Promise<void> {
    await this.authService.completeGoogleAuthentication(request.user, response);
  }

  @Get('profile')
  profile(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }
}
