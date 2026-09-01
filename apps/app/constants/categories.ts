export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
}

export const CATEGORIES_LIST: CategoryItem[] = [
  {
    id: 'cat-1',
    name: 'Electricidad',
    slug: 'electricidad',
    icon: 'flash-outline',
    description: 'Instalaciones eléctricas, boletines, cuadro de luces y reparación de averías.',
  },
  {
    id: 'cat-2',
    name: 'Fontanería',
    slug: 'fontaneria',
    icon: 'water-outline',
    description: 'Reparación de fugas, desatascos, grifería, termos y tuberías.',
  },
  {
    id: 'cat-3',
    name: 'Baños',
    slug: 'banos',
    icon: 'sparkles-outline',
    description: 'Reformas de baño, cambio de bañera por plato de ducha y mamparas.',
  },
  {
    id: 'cat-4',
    name: 'Cocina',
    slug: 'cocina',
    icon: 'restaurant-outline',
    description: 'Diseño y montaje de cocinas a medida, electrodomésticos y encimeras.',
  },
  {
    id: 'cat-5',
    name: 'Pladur',
    slug: 'pladur',
    icon: 'grid-outline',
    description: 'Tabiquería seca, techos continuos, aislamiento acústico y pladur.',
  },
  {
    id: 'cat-6',
    name: 'Pintura',
    slug: 'pintura',
    icon: 'color-palette-outline',
    description: 'Pintores profesionales para alisado de gotelé, interiores y fachadas.',
  },
  {
    id: 'cat-7',
    name: 'Manitas',
    slug: 'manitas',
    icon: 'construct-outline',
    description: 'Pequeñas reparaciones del hogar, colgado de cuadros, lámparas y cortinas.',
  },
  {
    id: 'cat-8',
    name: 'Suelos',
    slug: 'suelos',
    icon: 'layers-outline',
    description: 'Instalación de tarima flotante, parquet, vinilo, microcemento y gres.',
  },
  {
    id: 'cat-9',
    name: 'Reformas Integrales',
    slug: 'reformas',
    icon: 'hammer-outline',
    description: 'Reformas completas de viviendas, locales comerciales y albañilería.',
  },
  {
    id: 'cat-10',
    name: 'Climatización & Aire',
    slug: 'climatizacion',
    icon: 'thermometer-outline',
    description: 'Instalación de aire acondicionado, bombas de calor y aerotermia.',
  },
  {
    id: 'cat-11',
    name: 'Cerrajería',
    slug: 'cerrajeria',
    icon: 'key-outline',
    description: 'Apertura de puertas, cambio de cerraduras de seguridad y bombines.',
  },
  {
    id: 'cat-12',
    name: 'Diseño Web & Digital',
    slug: 'diseno-web',
    icon: 'laptop-outline',
    description: 'Creación de páginas web, tiendas online y posicionamiento digital.',
  },
];

export const CATEGORIES = ['Todos', ...CATEGORIES_LIST.map((c) => c.name)] as const;
export type CategoryType = typeof CATEGORIES[number];
