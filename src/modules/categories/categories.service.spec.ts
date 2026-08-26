import { PrismaService } from '../../prisma/prisma.service';
import { CategoriesService } from './categories.service';

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
