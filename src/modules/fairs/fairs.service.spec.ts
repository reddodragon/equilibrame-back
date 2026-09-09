import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FairsService } from './fairs.service';
import { Prisma } from '../../generated/prisma/client';

describe('FairsService', () => {
  const fair = {
    id: 'fair-1',
    title: 'Feria Equli',
    date: '2026-09-01',
    location: 'CABA',
    hours: '10 a 18',
    description: 'Encuentro',
    tag: 'Próxima',
    imageUrl: null,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
  };

  const createService = () => {
    const prisma = {
      fair: {
        findMany: jest.fn().mockResolvedValue([fair]),
        findUnique: jest.fn().mockResolvedValue(fair),
        create: jest.fn().mockResolvedValue(fair),
        update: jest.fn().mockResolvedValue(fair),
        delete: jest.fn().mockResolvedValue(fair),
      },
    };

    return {
      prisma,
      service: new FairsService(prisma as unknown as PrismaService),
    };
  };

  it('orders public fairs newest first', async () => {
    const { prisma, service } = createService();

    await service.findAll();

    expect(prisma.fair.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
    });
  });

  it('rejects missing fairs', async () => {
    const { prisma, service } = createService();
    prisma.fair.findUnique.mockResolvedValueOnce(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates atomically without a separate existence check', async () => {
    const { prisma, service } = createService();

    await service.update('fair-1', { title: 'Nueva feria' });

    expect(prisma.fair.findUnique).not.toHaveBeenCalled();
    expect(prisma.fair.update).toHaveBeenCalledWith({
      where: { id: 'fair-1' },
      data: { title: 'Nueva feria' },
    });
  });

  it('deletes atomically without a separate existence check', async () => {
    const { prisma, service } = createService();

    await expect(service.remove('fair-1')).resolves.toBeUndefined();
    expect(prisma.fair.findUnique).not.toHaveBeenCalled();
    expect(prisma.fair.delete).toHaveBeenCalledWith({
      where: { id: 'fair-1' },
    });
  });

  it.each(['update', 'remove'] as const)(
    'maps missing/concurrently removed fairs to 404 on %s',
    async (operation) => {
      const { prisma, service } = createService();
      const write =
        operation === 'update' ? prisma.fair.update : prisma.fair.delete;
      write.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('Record not found', {
          code: 'P2025',
          clientVersion: '7',
        }),
      );
      const result =
        operation === 'update'
          ? service.update('missing', { title: 'New title' })
          : service.remove('missing');
      await expect(result).rejects.toBeInstanceOf(NotFoundException);
    },
  );

  it('does not mislabel unexpected database failures as missing records', async () => {
    const { prisma, service } = createService();
    const error = new Error('Database unavailable');
    prisma.fair.update.mockRejectedValueOnce(error);
    await expect(service.update('fair-1', {})).rejects.toBe(error);
  });
});
