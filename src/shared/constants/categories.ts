export type CategorySeed = {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
};

export const CATEGORY_SEEDS: readonly CategorySeed[] = [
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
    name: 'Difusores',
    slug: 'difusores',
    description: 'Difusores para ambientar espacios con fragancias continuas.',
    sortOrder: 3,
  },
  {
    name: 'Esencias puras',
    slug: 'esencias-puras',
    description: 'Esencias concentradas para uso en hogar y ambientación.',
    sortOrder: 4,
  },
  {
    name: 'Hornillos',
    slug: 'hornillos',
    description:
      'Hornillos para difusión de esencias y aromatización de espacios.',
    sortOrder: 5,
  },
  {
    name: 'Combos Emprendedores',
    slug: 'combos-emprendedores',
    description: 'Packs promocionales y combos exclusivos para revendedores.',
    sortOrder: 6,
  },
] as const;
