import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { AuthProvider, UserRole } from '../src/generated/prisma/enums';
import { resolveDatabaseUrl } from '../src/config/database-url';

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
  const categories = [
    {
      name: 'Perfumes',
      slug: 'perfumes',
      description:
        'Fragancias finas de alta gama para hombres, mujeres y unisex.',
      sortOrder: 1,
    },
    {
      name: 'Home Fragrances',
      slug: 'home-fragrances',
      description: 'Aromas para el hogar, difusores, velas y sprays.',
      sortOrder: 2,
    },
    {
      name: 'Combos Emprendedores',
      slug: 'combos-emprendedores',
      description: 'Packs promocionales y combos exclusivos para revendedores.',
      sortOrder: 3,
    },
  ];

  for (const cat of categories) {
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
