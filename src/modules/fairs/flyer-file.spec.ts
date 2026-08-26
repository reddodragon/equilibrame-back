import { getFlyerExtension, hasValidFlyerSignature } from './flyer-file';

describe('flyer file validation', () => {
  it.each([
    ['image/jpeg', '.jpg'],
    ['image/png', '.png'],
    ['image/webp', '.webp'],
  ])('maps %s to a controlled extension', (mimeType, extension) => {
    expect(getFlyerExtension(mimeType)).toBe(extension);
  });

  it('rejects unsupported MIME types', () => {
    expect(getFlyerExtension('image/svg+xml')).toBeUndefined();
  });

  it.each([
    ['image/jpeg', Buffer.from([0xff, 0xd8, 0xff, 0xe0])],
    [
      'image/png',
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ],
    ['image/webp', Buffer.from('RIFF0000WEBP', 'ascii')],
  ])('accepts a valid %s signature', (mimeType, bytes) => {
    expect(hasValidFlyerSignature(bytes, mimeType)).toBe(true);
  });

  it('rejects content whose signature does not match its MIME type', () => {
    expect(
      hasValidFlyerSignature(
        Buffer.from('<script>alert(1)</script>'),
        'image/png',
      ),
    ).toBe(false);
  });
});
