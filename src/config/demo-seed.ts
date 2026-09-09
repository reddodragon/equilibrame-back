interface DemoSeedOptions {
  admin?: { email: string; password: string };
}

// Validate before constructing a database client. Never seed a real environment
// implicitly: the demo catalog upserts existing products and replaces images.
export function getDemoSeedOptions(env: NodeJS.ProcessEnv): DemoSeedOptions {
  if (env.NODE_ENV === 'production') {
    throw new Error('Demo seed is forbidden in production.');
  }
  if (env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error(
      'Set ALLOW_DEMO_SEED=true only for a disposable demo database.',
    );
  }

  const email = env.SEED_ADMIN_EMAIL?.trim();
  const password = env.SEED_ADMIN_PASSWORD;
  if (!email && !password) return {};
  if (!email || !password || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Provide both SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD.');
  }
  if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error(
      'SEED_ADMIN_PASSWORD must be at least 12 characters and at most 72 bytes.',
    );
  }
  return { admin: { email, password } };
}
