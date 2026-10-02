import { Ionicons } from '@expo/vector-icons';

export interface CategoryThemeToken {
  id: string;
  name: string;
  title: string;
  categoryFilter: string;
  subtitle: string;
  bgColorLight: string;
  bgColorDark: string;
  pillBgLight: string;
  accentColor: string;
  dotColor: string;
  badgeBgLight: string;
  badgeBgDark: string;
  iconName: keyof typeof Ionicons.glyphMap;
}

/**
 * Paleta cromática oficial de Yewi: colores vivos, saturados y determinantes
 * Idéntica a la utilizada en la pantalla de Inicio (Home Lookbook y Promos).
 */
export const CATEGORY_THEME_TOKENS: CategoryThemeToken[] = [
  {
    id: 'reformas',
    name: 'Reformas',
    title: 'Reformas',
    categoryFilter: 'Reformas',
    subtitle: 'Integrales y albañilería',
    bgColorLight: '#93C5FD', // Soft Vivid Sky Blue
    bgColorDark: '#1E3A5F',
    pillBgLight: '#FFFFFF',
    accentColor: '#1D4ED8',
    dotColor: '#2563EB',
    badgeBgLight: '#DBEAFE',
    badgeBgDark: '#1E3A5F',
    iconName: 'construct',
  },
  {
    id: 'electricidad',
    name: 'Electricidad',
    title: 'Electricidad',
    categoryFilter: 'Electricidad',
    subtitle: 'Instalaciones y cuadros',
    bgColorLight: '#FDE68A', // Soft Warm Amber
    bgColorDark: '#451A03',
    pillBgLight: '#FFFFFF',
    accentColor: '#B45309',
    dotColor: '#D97706',
    badgeBgLight: '#FEF3C7',
    badgeBgDark: '#451A03',
    iconName: 'flash',
  },
  {
    id: 'fontaneria',
    name: 'Fontanería',
    title: 'Fontanería',
    categoryFilter: 'Fontanería',
    subtitle: 'Tuberías y desatascos',
    bgColorLight: '#C7D2FE', // Soft Vivid Indigo Mist
    bgColorDark: '#312E81',
    pillBgLight: '#FFFFFF',
    accentColor: '#4338CA',
    dotColor: '#4F46E5',
    badgeBgLight: '#E0E7FF',
    badgeBgDark: '#312E81',
    iconName: 'water',
  },
  {
    id: 'climatizacion',
    name: 'Climatización',
    title: 'Clima',
    categoryFilter: 'Climatización',
    subtitle: 'Bombas y aerotermia',
    bgColorLight: '#99F6E4', // Soft Mint / Aqua
    bgColorDark: '#134E4A',
    pillBgLight: '#FFFFFF',
    accentColor: '#0F766E',
    dotColor: '#0D9488',
    badgeBgLight: '#CCFBF1',
    badgeBgDark: '#134E4A',
    iconName: 'snow',
  },
  {
    id: 'pintura',
    name: 'Pintura',
    title: 'Pintura',
    categoryFilter: 'Pintura',
    subtitle: 'Alisado y gotelé',
    bgColorLight: '#E9D5FF', // Soft Vivid Lilac
    bgColorDark: '#581C87',
    pillBgLight: '#FFFFFF',
    accentColor: '#7E22CE',
    dotColor: '#9333EA',
    badgeBgLight: '#F3E8FF',
    badgeBgDark: '#581C87',
    iconName: 'color-palette',
  },
  {
    id: 'banos',
    name: 'Baños',
    title: 'Baños',
    categoryFilter: 'Baños',
    subtitle: 'Platos ducha y mamparas',
    bgColorLight: '#BAE6FD', // Soft Cyan
    bgColorDark: '#082F49',
    pillBgLight: '#FFFFFF',
    accentColor: '#0284C7',
    dotColor: '#0284C7',
    badgeBgLight: '#E0F2FE',
    badgeBgDark: '#082F49',
    iconName: 'sparkles',
  },
  {
    id: 'cocina',
    name: 'Cocina',
    title: 'Cocina',
    categoryFilter: 'Cocina',
    subtitle: 'Muebles y encimeras',
    bgColorLight: '#FED7AA', // Soft Vivid Coral
    bgColorDark: '#431407',
    pillBgLight: '#FFFFFF',
    accentColor: '#EA580C',
    dotColor: '#EA580C',
    badgeBgLight: '#FFEDD5',
    badgeBgDark: '#431407',
    iconName: 'restaurant',
  },
  {
    id: 'carpinteria',
    name: 'Carpintería',
    title: 'Carpintería',
    categoryFilter: 'Carpintería',
    subtitle: 'Puertas y armarios',
    bgColorLight: '#FEF08A', // Warm Honey Gold
    bgColorDark: '#382005',
    pillBgLight: '#FFFFFF',
    accentColor: '#A16207',
    dotColor: '#CA8A04',
    badgeBgLight: '#FEF9C3',
    badgeBgDark: '#382005',
    iconName: 'hammer',
  },
  {
    id: 'suelos',
    name: 'Suelos',
    title: 'Suelos',
    categoryFilter: 'Suelos',
    subtitle: 'Tarima y parquet',
    bgColorLight: '#FECDD3', // Soft Rose Coral
    bgColorDark: '#4C0519',
    pillBgLight: '#FFFFFF',
    accentColor: '#E11D48',
    dotColor: '#E11D48',
    badgeBgLight: '#FFE4E6',
    badgeBgDark: '#4C0519',
    iconName: 'grid',
  },
  {
    id: 'pladur',
    name: 'Pladur',
    title: 'Pladur',
    categoryFilter: 'Pladur',
    subtitle: 'Tabiques y techos',
    bgColorLight: '#CBD5E1', // Modern Crisp Slate
    bgColorDark: '#1E293B',
    pillBgLight: '#FFFFFF',
    accentColor: '#334155',
    dotColor: '#475569',
    badgeBgLight: '#F1F5F9',
    badgeBgDark: '#1E293B',
    iconName: 'apps',
  },
  {
    id: 'manitas',
    name: 'Manitas',
    title: 'Manitas',
    categoryFilter: 'Manitas',
    subtitle: 'Montajes y arreglos',
    bgColorLight: '#FDE047', // Vivid Sun Yellow
    bgColorDark: '#352102',
    pillBgLight: '#FFFFFF',
    accentColor: '#A16207',
    dotColor: '#CA8A04',
    badgeBgLight: '#FEF08A',
    badgeBgDark: '#352102',
    iconName: 'build',
  },
  {
    id: 'cerrajeria',
    name: 'Cerrajería',
    title: 'Cerrajería',
    categoryFilter: 'Cerrajería',
    subtitle: 'Aperturas y llaves',
    bgColorLight: '#DDD6FE', // Soft Vivid Violet
    bgColorDark: '#2E1065',
    pillBgLight: '#FFFFFF',
    accentColor: '#6D28D9',
    dotColor: '#7C3AED',
    badgeBgLight: '#EDE9FE',
    badgeBgDark: '#2E1065',
    iconName: 'key',
  },
  {
    id: 'limpieza',
    name: 'Limpieza',
    title: 'Limpieza',
    categoryFilter: 'Limpieza',
    subtitle: 'Fin de obra y hogar',
    bgColorLight: '#A7F3D0', // Soft Vivid Emerald Mint
    bgColorDark: '#064E3B',
    pillBgLight: '#FFFFFF',
    accentColor: '#047857',
    dotColor: '#059669',
    badgeBgLight: '#D1FAE5',
    badgeBgDark: '#064E3B',
    iconName: 'sparkles',
  },
];

const DEFAULT_CATEGORY_TOKEN: CategoryThemeToken = {
  id: 'general',
  name: 'General',
  title: 'General',
  categoryFilter: 'General',
  subtitle: 'Servicios del hogar',
  bgColorLight: '#BAE6FD',
  bgColorDark: '#082F49',
  pillBgLight: '#FFFFFF',
  accentColor: '#0284C7',
  dotColor: '#0284C7',
  badgeBgLight: '#E0F2FE',
  badgeBgDark: '#082F49',
  iconName: 'construct',
};

/**
 * Normaliza cualquier nombre o slug de categoría y devuelve su token cromático completo
 */
export function getCategoryTheme(categoryNameOrSlug?: string | null): CategoryThemeToken {
  if (!categoryNameOrSlug) return DEFAULT_CATEGORY_TOKEN;

  const normalized = categoryNameOrSlug
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (normalized.includes('reform') || normalized.includes('obra')) {
    return CATEGORY_THEME_TOKENS[0]; // Reformas
  }
  if (normalized.includes('electr') || normalized.includes('luz') || normalized.includes('cuadro')) {
    return CATEGORY_THEME_TOKENS[1]; // Electricidad
  }
  if (normalized.includes('fontan') || normalized.includes('agua') || normalized.includes('tub')) {
    return CATEGORY_THEME_TOKENS[2]; // Fontanería
  }
  if (normalized.includes('clima') || normalized.includes('aire') || normalized.includes('calefa') || normalized.includes('aeroterm')) {
    return CATEGORY_THEME_TOKENS[3]; // Climatización
  }
  if (normalized.includes('pint') || normalized.includes('gotele') || normalized.includes('alisad')) {
    return CATEGORY_THEME_TOKENS[4]; // Pintura
  }
  if (normalized.includes('ban') || normalized.includes('duch') || normalized.includes('mampar')) {
    return CATEGORY_THEME_TOKENS[5]; // Baños
  }
  if (normalized.includes('cocin') || normalized.includes('encimer')) {
    return CATEGORY_THEME_TOKENS[6]; // Cocina
  }
  if (normalized.includes('carpint') || normalized.includes('mader') || normalized.includes('armari') || normalized.includes('puert')) {
    return CATEGORY_THEME_TOKENS[7]; // Carpintería
  }
  if (normalized.includes('suel') || normalized.includes('tarim') || normalized.includes('parquet')) {
    return CATEGORY_THEME_TOKENS[8]; // Suelos
  }
  if (normalized.includes('pladur') || normalized.includes('tabiq') || normalized.includes('tech')) {
    return CATEGORY_THEME_TOKENS[9]; // Pladur
  }
  if (normalized.includes('manit') || normalized.includes('arregl') || normalized.includes('montaj')) {
    return CATEGORY_THEME_TOKENS[10]; // Manitas
  }
  if (normalized.includes('cerraj') || normalized.includes('llav') || normalized.includes('cerradur')) {
    return CATEGORY_THEME_TOKENS[11]; // Cerrajería
  }
  if (normalized.includes('limp')) {
    return CATEGORY_THEME_TOKENS[12]; // Limpieza
  }

  const found = CATEGORY_THEME_TOKENS.find(
    (t) =>
      t.id.toLowerCase() === normalized ||
      t.name.toLowerCase() === normalized ||
      t.categoryFilter.toLowerCase() === normalized
  );

  return found || DEFAULT_CATEGORY_TOKEN;
}
