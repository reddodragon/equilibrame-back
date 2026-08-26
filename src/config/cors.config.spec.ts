import { getCorsConfig } from './cors.config';

describe('getCorsConfig', () => {
  it('permite únicamente el origen configurado', () => {
    expect(getCorsConfig('https://equli.example.com').origin).toEqual([
      'https://equli.example.com',
    ]);
  });

  it('no agrega localhost implícitamente en producción', () => {
    expect(getCorsConfig('https://equli.example.com').origin).not.toContain(
      'http://localhost:3000',
    );
  });
});
