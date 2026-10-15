import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SCREEN_PADDING, SPACING, TAB_BAR, TAB_BAR_HEIGHT } from '@/constants/layout';

/**
 * Devuelve los márgenes seguros de la pantalla ya calculados.
 * - `bottom` reserva el espacio de la barra de pestañas flotante cuando `hasTabBar`.
 *   Úsalo como paddingBottom del scroll en vez de 90/120/140 a mano.
 */
export function useScreenInsets({ hasTabBar = false }: { hasTabBar?: boolean } = {}) {
  const insets = useSafeAreaInsets();

  const bottom = hasTabBar
    ? Math.max(insets.bottom, TAB_BAR.minBottomOffset) + TAB_BAR_HEIGHT + TAB_BAR.gap
    : Math.max(insets.bottom, SPACING.lg);

  return {
    top: insets.top,
    bottom,
    left: Math.max(insets.left, SCREEN_PADDING),
    right: Math.max(insets.right, SCREEN_PADDING),
    horizontal: SCREEN_PADDING,
  };
}
