import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { rethrowPrismaWriteError } from './prisma-write-error';

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('Database error', {
    code,
    clientVersion: '7.8.0',
  });
}

describe('rethrowPrismaWriteError', () => {
  it.each([
    ['P2002', ConflictException],
    ['P2003', BadRequestException],
    ['P2025', NotFoundException],
  ])('maps %s to an HTTP exception', (code, ExceptionType) => {
    expect(() =>
      rethrowPrismaWriteError(prismaError(code), 'El recurso'),
    ).toThrow(ExceptionType);
  });

  it('preserves unexpected errors', () => {
    const error = new Error('unexpected');

    expect(() => rethrowPrismaWriteError(error, 'El recurso')).toThrow(error);
  });
});
