import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControlProps,
  ScrollView,
  StatusBar,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useScreenInsets } from '@/hooks/useScreenInsets';
import { MAX_CONTENT_WIDTH } from '@/constants/layout';

export interface ScreenProps {
  children: React.ReactNode;
  /** Cabecera fija (normalmente <ScreenHeader />). Queda fuera del scroll. */
  header?: React.ReactNode;
  /** Contenido con scroll (por defecto true). */
  scroll?: boolean;
  /** La pantalla convive con la barra de pestañas flotante. */
  hasTabBar?: boolean;
  /** Aplica el padding horizontal estándar (por defecto true). */
  padded?: boolean;
  /** Para héroes/imágenes a sangre que gestionan su propio top inset. */
  noTopInset?: boolean;
  /** Pantallas con formularios. */
  avoidKeyboard?: boolean;
  /** Barra fija inferior (CTA). Se coloca encima del safe area. */
  footer?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

/**
 * Contenedor ÚNICO de pantalla: fondo, safe areas, padding, ancho máximo,
 * espacio bajo la barra de pestañas y teclado. Ninguna pantalla debería
 * volver a calcular `insets.top + N` ni `paddingBottom: 140`.
 */
export function Screen({
  children,
  header,
  scroll = true,
  hasTabBar = false,
  padded = true,
  noTopInset = false,
  avoidKeyboard = false,
  footer,
  contentStyle,
  refreshControl,
}: ScreenProps) {
  const { colors, isDark } = useAppTheme();
  const insets = useScreenInsets({ hasTabBar });

  const inner: ViewStyle = {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: padded ? insets.horizontal : 0,
  };

  const body = scroll ? (
    <ScrollView
      style={{ flex: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
      contentContainerStyle={[inner, { paddingBottom: footer ? 16 : insets.bottom }, contentStyle]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, inner, { paddingBottom: footer ? 0 : insets.bottom }, contentStyle]}>
      {children}
    </View>
  );

  const content = (
    <>
      {body}
      {footer ? (
        <View
          style={[
            inner,
            {
              paddingTop: 12,
              paddingBottom: insets.bottom,
              backgroundColor: colors.background,
              borderTopWidth: 1,
              borderTopColor: colors.borderSubtle,
            },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: noTopInset ? 0 : insets.top }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {header}
      {avoidKeyboard ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1 }}>{content}</View>
      )}
    </View>
  );
}
