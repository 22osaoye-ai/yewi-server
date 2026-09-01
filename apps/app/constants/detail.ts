import { ColorOption } from '@/types/detail';

export const DETAIL_COLORS: ColorOption[] = [
  { name: 'Blue', hex: '#0044FF', y: 38, liquidColor: 'rgba(0, 68, 255, 0.42)' },
  { name: 'Orange', hex: '#D95B1E', y: 82, liquidColor: 'rgba(217, 91, 30, 0.48)' },
  { name: 'Purple', hex: '#8B5CF6', y: 128, liquidColor: 'rgba(139, 92, 246, 0.42)' },
  { name: 'Lime', hex: '#D4F800', y: 174, liquidColor: 'rgba(212, 248, 0, 0.45)' },
];

export const DETAIL_DIMENSIONS = ['3x3', '3x5'] as const;

export const DETAIL_THUMBNAILS = [
  require('@/assets/images/orange_armchair.png'),
  require('@/assets/images/orange_side.png'),
  require('@/assets/images/orange_armchair.png'),
];
