import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import {
  getOlfactoryFamily,
  getScentProfile,
  SCENT_PROFILE_OPTIONS,
} from './scent-profiles';

const PRODUCT_INCLUDE = {
  category: {
    select: { id: true, name: true, slug: true },
  },
  variants: {
    where: { isActive: true },
    orderBy: { price: 'asc' },
  },
  images: {
    orderBy: { sortOrder: 'asc' },
  },
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof PRODUCT_INCLUDE;
}>;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FindProductsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 24;
    const olfactoryFamily = getOlfactoryFamily(query.scentProfile);
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      category: {
        isActive: true,
        ...(query.category ? { slug: query.category } : {}),
      },
      variants: { some: { isActive: true } },
      ...(olfactoryFamily ? { olfactoryFamily } : {}),
      ...(query.featured === undefined ? {} : { isFeatured: query.featured }),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: products.map((product) => this.toResponse(product)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        isActive: true,
        category: { isActive: true },
        variants: { some: { isActive: true } },
      },
      include: PRODUCT_INCLUDE,
    });

    if (!product) {
      throw new NotFoundException(`Producto ${slug} no encontrado.`);
    }

    return this.toResponse(product);
  }

  getFilters() {
    return {
      scentProfiles: SCENT_PROFILE_OPTIONS.map(({ slug, name }) => ({
        slug,
        name,
      })),
    };
  }

  private toResponse(product: ProductWithRelations) {
    const variant = product.variants[0];
    const images = product.images.map(({ url }) => url);
    const hasNotes =
      product.topNotes || product.heartNotes || product.baseNotes;

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description ?? '',
      price: Number(variant.price),
      category: product.category,
      scentProfile: getScentProfile(product.olfactoryFamily),
      size: variant.format,
      imageUrl: images[0] ?? null,
      images,
      notes: hasNotes
        ? {
            top: product.topNotes ?? '',
            heart: product.heartNotes ?? '',
            base: product.baseNotes ?? '',
          }
        : null,
      usageInstructions: product.usageInstructions,
      ritual: product.ritual,
      isFeatured: product.isFeatured,
      isBestSeller: product.isBestSeller,
      stock: variant.stock,
    };
  }
}
