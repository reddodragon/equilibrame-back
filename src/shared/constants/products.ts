import { OlfactoryFamily } from '../../generated/prisma/enums';

export interface ProductSeed {
  id: string;
  name: string;
  description: string;
  price: number;
  categorySlug: string;
  olfactoryFamily: OlfactoryFamily;
  format: string;
  sku: string;
  stock: number;
  isFeatured?: boolean;
  usageInstructions?: string;
  ritual?: string;
  notes: {
    top: string;
    heart: string;
    base: string;
  };
  images: readonly string[];
}

export const PRODUCT_SEEDS: readonly ProductSeed[] = [
  {
    id: 'aroma-textil-calma',
    name: 'Aroma textil calma',
    description:
      'Aromatizante para ropa y ambientes con notas suaves para equilibrar la rutina y favorecer el descanso.',
    price: 18900,
    categorySlug: 'home-sprays',
    olfactoryFamily: OlfactoryFamily.AMADERADO,
    format: '250ml',
    sku: 'CALMA-250',
    stock: 50,
    isFeatured: true,
    usageInstructions:
      'Pulverizar a unos 30 cm de distancia sobre sábanas, cortinas, ropa de cama o directamente en el aire para envolver el ambiente con una sensación de paz instantánea.',
    ritual:
      'Ventilá la habitación y realizá tres pulverizaciones sobre la almohada. Respirá hondo y dejá que el aroma prepare tu mente para el reposo.',
    notes: {
      top: 'Lavanda silvestre, Bergamota',
      heart: 'Manzanilla, Eucalipto dulce',
      base: 'Sándalo, Almizcle blanco',
    },
    images: [
      'https://images.unsplash.com/photo-1635870224044-b508144c710c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1603006905003-be475563bc59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    ],
  },
  {
    id: 'bruma-lino-imperial',
    name: 'Bruma de lino imperial',
    description:
      'Fragancia envolvente para textiles con salida limpia y fondo cálido. Perfecta para sábanas y cortinas.',
    price: 24500,
    categorySlug: 'home-sprays',
    olfactoryFamily: OlfactoryFamily.FRESCO,
    format: '250ml',
    sku: 'LINO-250',
    stock: 40,
    isFeatured: true,
    notes: {
      top: 'Algodón puro, Hojas verdes',
      heart: 'Jazmín del Cabo, Lirio de los valles',
      base: 'Ámbar gris, Cedro dulce',
    },
    images: [
      'https://images.unsplash.com/photo-1636410515179-20af87a59b1a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    ],
  },
  {
    id: 'vela-ritual-noche',
    name: 'Vela ritual de noche',
    description:
      'Vela de cera de soja aromática vertida a mano, pensada para bajar el ritmo y preparar el descanso al final del día.',
    price: 31900,
    categorySlug: 'velas',
    olfactoryFamily: OlfactoryFamily.DULCE,
    format: '220g',
    sku: 'VELA-NOCHE-220',
    stock: 35,
    isFeatured: true,
    notes: {
      top: 'Vainilla Bourbon, Flor de azahar',
      heart: 'Coco tostado, Haba tonka',
      base: 'Ámbar, Patchouli suave',
    },
    images: [
      'https://images.unsplash.com/photo-1608518246944-ff70bc1b9dbd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    ],
  },
  {
    id: 'difusor-aura-terracota',
    name: 'Difusor aura terracota',
    description:
      'Difusor decorativo de varillas con presencia cálida para mesas, estantes y recibidores de la casa.',
    price: 32900,
    categorySlug: 'difusores',
    olfactoryFamily: OlfactoryFamily.AMADERADO,
    format: '200ml',
    sku: 'DIF-AURA-200',
    stock: 30,
    isFeatured: true,
    notes: {
      top: 'Cardamomo, Pimienta rosa',
      heart: 'Sándalo amyris, Hojas de tabaco',
      base: 'Cuero fino, Cedro de Virginia',
    },
    images: [
      'https://images.unsplash.com/photo-1651197227567-1f7066bd3d02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    ],
  },
  {
    id: 'lampara-sal-himalaya',
    name: 'Lámpara de sal del Himalaya',
    description:
      'Lámpara tallada en roca de sal natural. Aporta una luz cálida y relajante ideal para meditación.',
    price: 45000,
    categorySlug: 'lamparas-de-sal',
    olfactoryFamily: OlfactoryFamily.FRESCO,
    format: 'Mediana (2-3 kg)',
    sku: 'SAL-HIMALAYA-M',
    stock: 20,
    notes: {
      top: 'Aire de montaña',
      heart: 'Minerales puros',
      base: 'Sal marina',
    },
    images: [
      'https://images.unsplash.com/photo-1633730427321-f49ab5067971?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    ],
  },
  {
    id: 'perfume-luminous-serenity',
    name: 'Luminous Serenity',
    description:
      'Nuestra fragancia insignia. Notas de sándalo y ámbar con un sutil toque cítrico para vestir tu piel con calma.',
    price: 59000,
    categorySlug: 'perfumes',
    olfactoryFamily: OlfactoryFamily.CITRICO,
    format: '100ml',
    sku: 'LUMINOUS-100',
    stock: 25,
    isFeatured: true,
    notes: {
      top: 'Nerolí, Mandarina verde',
      heart: 'Ámbar dorado, Jazmín de Sambac',
      base: 'Sándalo australiano, Vainilla de Madagascar',
    },
    images: [
      'https://images.unsplash.com/photo-1759793500391-24a07d5a1269?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    ],
  },
  {
    id: 'vela-bosque-niebla',
    name: 'Vela bosque de niebla',
    description:
      'Evocación a un paseo matutino entre pinos y rocío. Cera de soja natural en envase cerámico reutilizable.',
    price: 29800,
    categorySlug: 'velas',
    olfactoryFamily: OlfactoryFamily.FRESCO,
    format: '200g',
    sku: 'VELA-BOSQUE-200',
    stock: 30,
    notes: {
      top: 'Pino silvestre, Agujas de abeto',
      heart: 'Rocío de la mañana, Eucalipto',
      base: 'Musgo de roble, Cedro húmedo',
    },
    images: [
      'https://images.unsplash.com/photo-1621256425101-7cd9a5df22d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    ],
  },
  {
    id: 'difusor-citrus-zen',
    name: 'Difusor Citrus Zen',
    description:
      'Notas cítricas de limón y verbena combinadas con el toque calmante del té verde. Revitaliza tus mañanas.',
    price: 27500,
    categorySlug: 'difusores',
    olfactoryFamily: OlfactoryFamily.CITRICO,
    format: '200ml',
    sku: 'DIF-CITRUS-200',
    stock: 45,
    notes: {
      top: 'Verbena de limón, Pomelo rosado',
      heart: 'Té verde, Lemongrass',
      base: 'Jengibre, Cedro blanco',
    },
    images: [
      'https://images.unsplash.com/photo-1660853142046-fd8c78d2b264?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    ],
  },
];
