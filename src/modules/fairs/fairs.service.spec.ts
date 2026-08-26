import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FairsService } from './fairs.service';

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

  it('checks existence before updating', async () => {
    const { prisma, service } = createService();

    await service.update('fair-1', { title: 'Nueva feria' });

    expect(prisma.fair.findUnique).toHaveBeenCalledWith({
      where: { id: 'fair-1' },
    });
    expect(prisma.fair.update).toHaveBeenCalledWith({
      where: { id: 'fair-1' },
      data: { title: 'Nueva feria' },
    });
  });

  it('checks existence before deleting', async () => {
    const { prisma, service } = createService();

    await expect(service.remove('fair-1')).resolves.toEqual({ success: true });
    expect(prisma.fair.delete).toHaveBeenCalledWith({
      where: { id: 'fair-1' },
    });
  });
});
