import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { rethrowPrismaWriteError } from '../../common/errors/prisma-write-error';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
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

const ADMIN_PRODUCT_INCLUDE = {
  category: {
    select: { id: true, name: true, slug: true },
  },
  variants: {
    orderBy: { price: 'asc' },
  },
  images: {
    orderBy: { sortOrder: 'asc' },
  },
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof PRODUCT_INCLUDE;
}>;

type AdminProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof ADMIN_PRODUCT_INCLUDE;
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

  async findAllAdmin() {
    const products = await this.prisma.product.findMany({
      include: ADMIN_PRODUCT_INCLUDE,
      orderBy: { name: 'asc' },
    });

    return products.map((product) => this.toAdminResponse(product));
  }

  async findOneAdmin(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: ADMIN_PRODUCT_INCLUDE,
    });

    if (!product) {
      throw new NotFoundException(`Producto ${id} no encontrado.`);
    }

    return this.toAdminResponse(product);
  }

  async create(dto: CreateProductDto) {
    const { categoryId, variants, images = [], ...productData } = dto;
    this.assertHasActiveVariant(variants);
    const variantData = variants.map(({ id: variantId, ...variant }) => {
      void variantId;
      return variant;
    });
    try {
      const product = await this.prisma.product.create({
        data: {
          ...productData,
          category: { connect: { id: categoryId } },
          variants: { create: variantData },
          images: { create: images },
        },
        include: ADMIN_PRODUCT_INCLUDE,
      });

      return this.toAdminResponse(product);
    } catch (error: unknown) {
      rethrowPrismaWriteError(error, 'El producto');
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    try {
      const product = await this.prisma.$transaction(async (transaction) => {
        const existing = await transaction.product.findUnique({
          where: { id },
          select: { id: true },
        });

        if (!existing) {
          throw new NotFoundException(`Producto ${id} no encontrado.`);
        }

        const { categoryId, variants, images, ...productData } = dto;
        if (variants) {
          this.assertHasActiveVariant(variants);
        }
        await transaction.product.update({
          where: { id },
          data: {
            ...productData,
            ...(categoryId
              ? { category: { connect: { id: categoryId } } }
              : {}),
          },
        });

        if (variants) {
          await transaction.productVariant.updateMany({
            where: { productId: id },
            data: { isActive: false },
          });

          for (const variant of variants) {
            const { id: variantId, ...variantData } = variant;
            if (variantId) {
              const result = await transaction.productVariant.updateMany({
                where: { id: variantId, productId: id },
                data: variantData,
              });
              if (result.count === 0) {
                throw new BadRequestException(
                  `La variante ${variantId} no pertenece al producto ${id}.`,
                );
              }
            } else {
              await transaction.productVariant.create({
                data: { ...variantData, productId: id },
              });
            }
          }
        }

        if (images) {
          await transaction.productImage.deleteMany({
            where: { productId: id },
          });
          if (images.length > 0) {
            await transaction.productImage.createMany({
              data: images.map((image) => ({ ...image, productId: id })),
            });
          }
        }

        return transaction.product.findUniqueOrThrow({
          where: { id },
          include: ADMIN_PRODUCT_INCLUDE,
        });
      });

      return this.toAdminResponse(product);
    } catch (error: unknown) {
      rethrowPrismaWriteError(error, 'El producto');
    }
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(`Producto ${id} no encontrado.`);
    }

    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
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

  private toAdminResponse(product: AdminProductWithRelations) {
    return {
      ...product,
      variants: product.variants.map((variant) => ({
        ...variant,
        price: Number(variant.price),
        priceEntrepreneur:
          variant.priceEntrepreneur === null
            ? null
            : Number(variant.priceEntrepreneur),
        priceWholesale:
          variant.priceWholesale === null
            ? null
            : Number(variant.priceWholesale),
      })),
    };
  }

  private assertHasActiveVariant(
    variants: ReadonlyArray<{ isActive?: boolean }>,
  ): void {
    if (!variants.some((variant) => variant.isActive !== false)) {
      throw new BadRequestException(
        'El producto debe conservar al menos una variante activa.',
      );
    }
  }
}
