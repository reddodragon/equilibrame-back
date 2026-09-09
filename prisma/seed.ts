import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { AuthProvider, UserRole } from '../src/generated/prisma/enums';
import { resolveDatabaseUrl } from '../src/config/database-url';
import { getDemoSeedOptions } from '../src/config/demo-seed';
import { CATEGORY_SEEDS } from '../src/shared/constants/categories';
import { PRODUCT_SEEDS } from '../src/shared/constants/products';

function getRequiredEnv(name: 'DATABASE_URL'): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const seedOptions = getDemoSeedOptions(process.env);

const pool = new Pool({
  connectionString: resolveDatabaseUrl(
    getRequiredEnv('DATABASE_URL'),
    process.env.DATABASE_PASS,
  ),
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function main() {
  console.log('Seeding database...');

  // 1. Seed Categories
  for (const cat of CATEGORY_SEEDS) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }

  // Optional demo account; never ship a shared/default administrator password.
  // Existing accounts are deliberately left unchanged.
  if (seedOptions.admin) {
    const { email, password } = seedOptions.admin;
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash,
        firstName: 'Admin',
        lastName: 'Equli',
        role: UserRole.ADMIN,
        provider: AuthProvider.LOCAL,
        isEmailVerified: true,
      },
    });
  }

  // 3. Seed storefront products, variants and images
  for (const productSeed of PRODUCT_SEEDS) {
    const category = await prisma.category.findUniqueOrThrow({
      where: { slug: productSeed.categorySlug },
    });
    const product = await prisma.product.upsert({
      where: { slug: productSeed.id },
      update: {
        name: productSeed.name,
        description: productSeed.description,
        usageInstructions: productSeed.usageInstructions,
        ritual: productSeed.ritual,
        topNotes: productSeed.notes.top,
        heartNotes: productSeed.notes.heart,
        baseNotes: productSeed.notes.base,
        olfactoryFamily: productSeed.olfactoryFamily,
        categoryId: category.id,
        isFeatured: productSeed.isFeatured ?? false,
        isActive: true,
      },
      create: {
        id: productSeed.id,
        slug: productSeed.id,
        name: productSeed.name,
        description: productSeed.description,
        usageInstructions: productSeed.usageInstructions,
        ritual: productSeed.ritual,
        topNotes: productSeed.notes.top,
        heartNotes: productSeed.notes.heart,
        baseNotes: productSeed.notes.base,
        olfactoryFamily: productSeed.olfactoryFamily,
        categoryId: category.id,
        isFeatured: productSeed.isFeatured ?? false,
        isActive: true,
      },
    });

    await prisma.productVariant.upsert({
      where: { id: `variant-${productSeed.id}` },
      update: {
        format: productSeed.format,
        price: productSeed.price,
        stock: productSeed.stock,
        sku: productSeed.sku,
        isActive: true,
      },
      create: {
        id: `variant-${productSeed.id}`,
        productId: product.id,
        format: productSeed.format,
        price: productSeed.price,
        stock: productSeed.stock,
        sku: productSeed.sku,
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: productSeed.images.map((url, sortOrder) => ({
        productId: product.id,
        url,
        alt: `${productSeed.name} - imagen ${sortOrder + 1}`,
        sortOrder,
      })),
    });
  }

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
