import { registerAs } from '@nestjs/config';
import { resolveDatabaseUrl } from './database-url';

export default registerAs('app', () => ({
  port: Number.parseInt(process.env.PORT ?? '3001', 10),
  databaseUrl: resolveDatabaseUrl(
    process.env.DATABASE_URL,
    process.env.DATABASE_PASS,
  ),
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL,
  frontendUrl: process.env.FRONTEND_URL,
}));
