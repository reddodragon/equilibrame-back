import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const validEnv = {
    PORT: '3001',
    DATABASE_URL: 'postgresql://postgres@localhost:5432/equli?schema=public',
    DATABASE_PASS: 'unit-test-db-password',
    JWT_SECRET: 'super-secret-jwt-key-replace-in-production',
    JWT_REFRESH_SECRET: 'super-secret-refresh-key-replace-in-production',
    GOOGLE_CLIENT_ID: 'google-client-id',
    GOOGLE_CLIENT_SECRET: 'google-client-secret',
    GOOGLE_CALLBACK_URL: 'http://localhost:3001/api/auth/google/callback',
    FRONTEND_URL: 'http://localhost:3000',
  };

  it('convierte y devuelve variables válidas', () => {
    const env = validateEnv(validEnv);

    expect(env.PORT).toBe(3001);
    expect(env.DATABASE_URL).toContain('postgresql://');
  });

  it('falla rápido cuando DATABASE_URL no es postgres', () => {
    expect(() =>
      validateEnv({
        ...validEnv,
        DATABASE_URL: 'mysql://localhost:3306/equli',
      }),
    ).toThrow(/DATABASE_URL debe empezar con postgres:\/\/ o postgresql:\/\//);
  });
});
