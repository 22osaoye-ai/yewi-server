import { useWindowDimensions } from 'react-native';
import { MAX_CONTENT_WIDTH, SCREEN_PADDING } from '@/constants/layout';

/**
 * Ancho de cada elemento de una rejilla/carrusel, reactivo a rotación,
 * split-screen y plegables. Reemplaza a:
 *   const { width } = Dimensions.get('window');   // se calcula UNA vez
 *   const CARD_WIDTH = (width - 40 - 12) / 2;      // supone padding 20 y gap 12
 */
export function useGridItemWidth({
  columns = 2,
  gap = 12,
  horizontalPadding = SCREEN_PADDING,
  maxContentWidth = MAX_CONTENT_WIDTH,
}: {
  columns?: number;
  gap?: number;
  horizontalPadding?: number;
  maxContentWidth?: number;
} = {}) {
  const { width } = useWindowDimensions();
  const content = Math.min(width, maxContentWidth) - horizontalPadding * 2;
  return Math.max(0, Math.floor((content - gap * (columns - 1)) / columns));
}

/** Ancho de una tarjeta a "sangre" (p. ej. carruseles de una sola tarjeta). */
export function useCardWidth({
  peek = 24,
  horizontalPadding = SCREEN_PADDING,
  maxCardWidth = 440,
}: { peek?: number; horizontalPadding?: number; maxCardWidth?: number } = {}) {
  const { width } = useWindowDimensions();
  return Math.min(width - horizontalPadding - peek, maxCardWidth);
}
