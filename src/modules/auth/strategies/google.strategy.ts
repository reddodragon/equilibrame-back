import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
  type Profile,
  Strategy,
  type VerifyCallback,
} from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('app.googleClientId'),
      clientSecret: configService.getOrThrow<string>('app.googleClientSecret'),
      callbackURL: configService.getOrThrow<string>('app.googleCallbackUrl'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    void accessToken;
    void refreshToken;

    const user = await this.authService.validateGoogleUser(profile);
    done(null, user);
  }
}
