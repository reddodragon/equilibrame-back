import { NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { OlfactoryFamily } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const product = {
    id: 'aroma-textil-calma',
    slug: 'aroma-textil-calma',
    name: 'Aroma textil calma',
    description: 'Descripción',
    usageInstructions: 'Pulverizar a distancia.',
    ritual: 'Respirar profundo.',
    topNotes: 'Lavanda',
    heartNotes: 'Manzanilla',
    baseNotes: 'Sándalo',
    olfactoryFamily: OlfactoryFamily.AMADERADO,
    categoryId: 'category-1',
    isFeatured: true,
    isBestSeller: false,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    category: {
      id: 'category-1',
      name: 'Home Sprays',
      slug: 'home-sprays',
    },
    variants: [
      {
        id: 'variant-1',
        productId: 'aroma-textil-calma',
        format: '250ml',
        price: 18900,
        priceEntrepreneur: null,
        priceWholesale: null,
        stock: 50,
        sku: 'CALMA-250',
        isActive: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ],
    images: [
      {
        id: 'image-1',
        productId: 'aroma-textil-calma',
        url: 'https://example.com/calma.jpg',
        alt: 'Calma',
        sortOrder: 0,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ],
  };

  const createService = () => {
    let capturedFindManyArgs: Prisma.ProductFindManyArgs | undefined;
    const findMany = jest.fn((args: Prisma.ProductFindManyArgs) => {
      capturedFindManyArgs = args;
      return Promise.resolve([product]);
    });
    const count = jest.fn((args: Prisma.ProductCountArgs) => {
      void args;
      return Promise.resolve(1);
    });
    const findFirst = jest.fn((args: Prisma.ProductFindFirstArgs) => {
      void args;
      return Promise.resolve<typeof product | null>(product);
    });
    const prisma = {
      product: {
        findMany,
        count,
        findFirst,
      },
    };

    return {
      prisma,
      service: new ProductsService(prisma as unknown as PrismaService),
      getFindManyArgs: () => capturedFindManyArgs,
    };
  };

  it('filters active products and maps database relations to the public contract', async () => {
    const { service, getFindManyArgs } = createService();

    const result = await service.findAll({
      category: 'home-sprays',
      scentProfile: 'madera',
      featured: true,
      page: 1,
      limit: 12,
    });

    const findManyArgs = getFindManyArgs();
    expect(findManyArgs?.where).toEqual({
      isActive: true,
      olfactoryFamily: OlfactoryFamily.AMADERADO,
      isFeatured: true,
      category: { isActive: true, slug: 'home-sprays' },
      variants: { some: { isActive: true } },
    });
    expect(findManyArgs?.skip).toBe(0);
    expect(findManyArgs?.take).toBe(12);
    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.items[0]?.id).toBe('aroma-textil-calma');
    expect(result.items[0]?.price).toBe(18900);
    expect(result.items[0]?.category.slug).toBe('home-sprays');
    expect(result.items[0]?.scentProfile).toBe('madera');
    expect(result.items[0]?.imageUrl).toBe('https://example.com/calma.jpg');
  });

  it('returns storefront filter metadata', () => {
    const { service } = createService();

    expect(service.getFilters().scentProfiles).toEqual(
      expect.arrayContaining([
        { slug: 'madera', name: 'Madera / Terroso' },
        { slug: 'citrico', name: 'Cítrico / Vibrante' },
      ]),
    );
  });

  it('throws when a public product cannot be found', async () => {
    const { prisma, service } = createService();
    prisma.product.findFirst.mockResolvedValueOnce(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
