import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedTouchable } from './ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';
import { FONT_SIZE, HEADER_HEIGHT, MIN_TOUCH, SCREEN_PADDING } from '@/constants/layout';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Por defecto: router.back() si hay historial. Pasa `false` para ocultar el botón. */
  onBack?: (() => void) | false;
  /** Acción a la derecha (icono o botón). Debe medir al menos 44x44. */
  right?: React.ReactNode;
}

/**
 * Cabecera ÚNICA para pantallas internas (detalle, ajustes, formularios...).
 * Altura fija, botón atrás de 44x44, título con elipsis (nunca se sale de pantalla).
 * Úsala dentro de <Screen header={<ScreenHeader title="..." />}>.
 */
export function ScreenHeader({ title, subtitle, onBack, right }: ScreenHeaderProps) {
  const router = useRouter();
  const { colors } = useAppTheme();

  const showBack = onBack !== false;
  const handleBack = () => {
    if (typeof onBack === 'function') return onBack();
    if (router.canGoBack()) router.back();
  };

  return (
    <View
      style={{
        height: HEADER_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SCREEN_PADDING - 8,
        backgroundColor: colors.headerBg,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle,
      }}
    >
      <View style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
        {showBack ? (
          <ThemedTouchable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </ThemedTouchable>
        ) : null}
      </View>

      {/* flex:1 + minWidth:0 => el texto se recorta en vez de empujar los iconos fuera */}
      <View style={{ flex: 1, minWidth: 0, paddingHorizontal: 4 }}>
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          style={{ fontSize: FONT_SIZE.title, fontWeight: '700', color: colors.textPrimary }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={{ fontSize: FONT_SIZE.caption, color: colors.textSecondary }}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={{ minWidth: MIN_TOUCH, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
        {right}
      </View>
    </View>
  );
}
