import { open, unlink } from 'node:fs/promises';

const FLYER_EXTENSIONS_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
} as const;

export type FlyerMimeType = keyof typeof FLYER_EXTENSIONS_BY_MIME;

export function getFlyerExtension(mimeType: string): string | undefined {
  return FLYER_EXTENSIONS_BY_MIME[mimeType as FlyerMimeType];
}

export function hasValidFlyerSignature(
  bytes: Uint8Array,
  mimeType: string,
): boolean {
  if (mimeType === 'image/jpeg') {
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }

  if (mimeType === 'image/png') {
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return pngSignature.every((value, index) => bytes[index] === value);
  }

  if (mimeType === 'image/webp') {
    return (
      bytes.length >= 12 &&
      Buffer.from(bytes.subarray(0, 4)).toString('ascii') === 'RIFF' &&
      Buffer.from(bytes.subarray(8, 12)).toString('ascii') === 'WEBP'
    );
  }

  return false;
}

export async function validateFlyerFile(
  file: Express.Multer.File,
): Promise<boolean> {
  const handle = await open(file.path, 'r');

  try {
    const bytes = Buffer.alloc(12);
    const { bytesRead } = await handle.read(bytes, 0, bytes.length, 0);
    return hasValidFlyerSignature(bytes.subarray(0, bytesRead), file.mimetype);
  } finally {
    await handle.close();
  }
}

export async function removeFlyerFile(path: string): Promise<void> {
  await unlink(path).catch(() => undefined);
}
