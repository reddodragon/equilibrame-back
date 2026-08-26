import { OlfactoryFamily } from '../../generated/prisma/enums';

export const SCENT_PROFILE_OPTIONS = [
  { slug: 'floral', name: 'Floral / Delicado', family: OlfactoryFamily.FLORAL },
  {
    slug: 'madera',
    name: 'Madera / Terroso',
    family: OlfactoryFamily.AMADERADO,
  },
  {
    slug: 'citrico',
    name: 'Cítrico / Vibrante',
    family: OlfactoryFamily.CITRICO,
  },
  { slug: 'dulce', name: 'Dulce / Envolvente', family: OlfactoryFamily.DULCE },
  { slug: 'frutal', name: 'Frutal', family: OlfactoryFamily.FRUTAL },
  { slug: 'fresco', name: 'Fresco / Limpio', family: OlfactoryFamily.FRESCO },
  { slug: 'herbal', name: 'Herbal', family: OlfactoryFamily.HERBAL },
  { slug: 'especiado', name: 'Especiado', family: OlfactoryFamily.ESPECIADO },
] as const;

export const SCENT_PROFILE_SLUGS = SCENT_PROFILE_OPTIONS.map(
  ({ slug }) => slug,
);

export function getOlfactoryFamily(scentProfile?: string) {
  return SCENT_PROFILE_OPTIONS.find(({ slug }) => slug === scentProfile)
    ?.family;
}

export function getScentProfile(family: OlfactoryFamily | null) {
  return (
    SCENT_PROFILE_OPTIONS.find((option) => option.family === family)?.slug ??
    null
  );
}
