import { getDemoSeedOptions } from './demo-seed';

describe('demo seed safety', () => {
  it('requires explicit opt-in', () => {
    expect(() => getDemoSeedOptions({})).toThrow('ALLOW_DEMO_SEED');
  });

  it('rejects production even with opt-in', () => {
    expect(() =>
      getDemoSeedOptions({ NODE_ENV: 'production', ALLOW_DEMO_SEED: 'true' }),
    ).toThrow('production');
  });

  it('does not create a default administrator', () => {
    expect(getDemoSeedOptions({ ALLOW_DEMO_SEED: 'true' })).toEqual({});
  });

  it('requires paired, valid credentials', () => {
    for (const credentials of [
      { SEED_ADMIN_EMAIL: 'admin@example.test' },
      { SEED_ADMIN_PASSWORD: 'long-test-password' },
      {
        SEED_ADMIN_EMAIL: 'invalid',
        SEED_ADMIN_PASSWORD: 'long-test-password',
      },
      { SEED_ADMIN_EMAIL: 'admin@example.test', SEED_ADMIN_PASSWORD: 'short' },
      {
        SEED_ADMIN_EMAIL: 'admin@example.test',
        SEED_ADMIN_PASSWORD: 'ñ'.repeat(40),
      },
    ]) {
      expect(() =>
        getDemoSeedOptions({ ALLOW_DEMO_SEED: 'true', ...credentials }),
      ).toThrow();
    }
  });

  it('accepts explicit demo administrator credentials', () => {
    expect(
      getDemoSeedOptions({
        ALLOW_DEMO_SEED: 'true',
        SEED_ADMIN_EMAIL: 'admin@example.test',
        SEED_ADMIN_PASSWORD: 'long-test-password',
      }),
    ).toEqual({
      admin: { email: 'admin@example.test', password: 'long-test-password' },
    });
  });
});
