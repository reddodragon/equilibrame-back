import { resolveDatabaseUrl } from './database-url';

describe('resolveDatabaseUrl', () => {
  it('inyecta y codifica DATABASE_PASS en DATABASE_URL', () => {
    expect(
      resolveDatabaseUrl(
        'postgresql://postgres@localhost:5432/equli?schema=public',
        'master:key',
      ),
    ).toBe(
      'postgresql://postgres:master%3Akey@localhost:5432/equli?schema=public',
    );
  });

  it('mantiene la URL cuando no hay password separada', () => {
    const databaseUrl =
      'postgresql://postgres@localhost:5432/equli?schema=public';

    expect(resolveDatabaseUrl(databaseUrl, undefined)).toBe(databaseUrl);
  });
});
