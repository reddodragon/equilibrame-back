import { BadRequestException, NotFoundException } from '@nestjs/common';
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
    const create = jest.fn((args: Prisma.ProductCreateArgs) => {
      void args;
      return Promise.resolve(product);
    });
    const findUnique = jest.fn().mockResolvedValue({ id: product.id });
    const update = jest.fn().mockResolvedValue(product);
    const prisma = {
      product: {
        findMany,
        count,
        findFirst,
        create,
        findUnique,
        update,
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

  it('creates an admin product with nested variants and images', async () => {
    const { prisma, service } = createService();

    const result = await service.create({
      name: 'Aroma textil calma',
      slug: 'aroma-textil-calma',
      categoryId: 'category-1',
      variants: [
        { format: '250ml', price: '18900', stock: 50, sku: 'CALMA-250' },
      ],
      images: [{ url: 'https://example.com/calma.jpg', sortOrder: 0 }],
    });

    expect(prisma.product.create.mock.calls[0]?.[0]).toEqual({
      data: {
        name: 'Aroma textil calma',
        slug: 'aroma-textil-calma',
        category: { connect: { id: 'category-1' } },
        variants: {
          create: [
            {
              format: '250ml',
              price: '18900',
              stock: 50,
              sku: 'CALMA-250',
            },
          ],
        },
        images: {
          create: [{ url: 'https://example.com/calma.jpg', sortOrder: 0 }],
        },
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: {
          orderBy: { price: 'asc' },
        },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });
    expect(result.variants[0]?.price).toBe(18900);
  });

  it('soft deletes an existing product', async () => {
    const { prisma, service } = createService();

    await service.remove(product.id);

    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: product.id },
      data: { isActive: false },
    });
  });

  it('rejects products without an active variant', async () => {
    const { service } = createService();

    await expect(
      service.create({
        name: 'Producto inactivo',
        slug: 'producto-inactivo',
        categoryId: 'category-1',
        variants: [
          { format: '100ml', price: '1000', stock: 0, isActive: false },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects deleting a missing product', async () => {
    const { prisma, service } = createService();
    prisma.product.findUnique.mockResolvedValueOnce(null);

    await expect(service.remove('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
