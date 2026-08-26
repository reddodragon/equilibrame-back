import { PrismaService } from '../../prisma/prisma.service';
import { CategoriesService } from './categories.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('CategoriesService', () => {
  it('returns active categories in storefront order', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const service = new CategoriesService({
      category: { findMany },
    } as unknown as PrismaService);

    await service.findAll();

    expect(findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  });
});

describe('CategoriesService admin operations', () => {
  const createService = () => {
    const category = {
      findUnique: jest.fn().mockResolvedValue({ id: 'category-1' }),
      update: jest.fn().mockResolvedValue({ id: 'category-1' }),
    };
    const product = { count: jest.fn().mockResolvedValue(0) };

    return {
      category,
      product,
      service: new CategoriesService({
        category,
        product,
      } as unknown as PrismaService),
    };
  };

  it('soft deletes an empty category', async () => {
    const { category, service } = createService();

    await service.remove('category-1');

    expect(category.update).toHaveBeenCalledWith({
      where: { id: 'category-1' },
      data: { isActive: false },
    });
  });

  it('prevents disabling categories that still have active products', async () => {
    const { product, service } = createService();
    product.count.mockResolvedValueOnce(1);

    await expect(service.remove('category-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects updates for missing categories', async () => {
    const { category, service } = createService();
    category.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.update('missing', { name: 'Nueva categoría' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
