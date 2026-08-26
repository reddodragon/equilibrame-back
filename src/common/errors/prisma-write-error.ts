import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';

export function rethrowPrismaWriteError(
  error: unknown,
  resourceName: string,
): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new ConflictException(
        `${resourceName} ya existe con uno de los valores únicos enviados.`,
      );
    }

    if (error.code === 'P2003') {
      throw new BadRequestException(
        `${resourceName} referencia un recurso inexistente.`,
      );
    }

    if (error.code === 'P2025') {
      throw new NotFoundException(`${resourceName} no encontrado.`);
    }
  }

  throw error;
}
