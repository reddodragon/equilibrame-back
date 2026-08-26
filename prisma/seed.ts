import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { AuthProvider, UserRole } from '../src/generated/prisma/enums';
import { resolveDatabaseUrl } from '../src/config/database-url';
import { CATEGORY_SEEDS } from '../src/shared/constants/categories';

function getRequiredEnv(name: 'DATABASE_URL'): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

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

  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@equli.com' },
    update: {},
    create: {
      email: 'admin@equli.com',
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'Equli',
      role: UserRole.ADMIN,
      provider: AuthProvider.LOCAL,
      isEmailVerified: true,
    },
  });

  // 3. Seed Test Product with multiple images and variants
  const homeFragCategory = await prisma.category.findUnique({
    where: { slug: 'home-fragrances' },
  });

  if (homeFragCategory) {
    const testProduct = await prisma.product.upsert({
      where: { slug: 'aroma-textil-calma' },
      update: {
        description:
          'Aromatizante para ropa y ambientes con notas suaves para equilibrar la rutina y favorecer el descanso.',
        olfactoryFamily: 'AMADERADO',
        categoryId: homeFragCategory.id,
        isFeatured: true,
        isActive: true,
      },
      create: {
        id: 'aroma-textil-calma',
        name: 'Aroma textil calma',
        slug: 'aroma-textil-calma',
        description:
          'Aromatizante para ropa y ambientes con notas suaves para equilibrar la rutina y favorecer el descanso.',
        olfactoryFamily: 'AMADERADO',
        categoryId: homeFragCategory.id,
        isFeatured: true,
        isActive: true,
      },
    });

    await prisma.productVariant.upsert({
      where: { id: 'variant-calma-250ml' },
      update: {
        price: 18900,
        stock: 50,
      },
      create: {
        id: 'variant-calma-250ml',
        productId: testProduct.id,
        format: '250ml',
        price: 18900,
        stock: 50,
        sku: 'CALMA-250',
      },
    });

    // Delete existing images to avoid duplication on re-run, and insert new test images
    await prisma.productImage.deleteMany({
      where: { productId: testProduct.id },
    });

    await prisma.productImage.createMany({
      data: [
        {
          productId: testProduct.id,
          url: 'https://images.unsplash.com/photo-1635870224044-b508144c710c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
          alt: 'Aroma textil calma vista principal',
          sortOrder: 0,
        },
        {
          productId: testProduct.id,
          url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
          alt: 'Bruma de aromaterapia y relajación',
          sortOrder: 1,
        },
        {
          productId: testProduct.id,
          url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
          alt: 'Detalle de ambiente de spa y bienestar',
          sortOrder: 2,
        },
      ],
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
