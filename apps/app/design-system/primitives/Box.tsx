import React from 'react';
import { View, ViewProps, StyleSheet, ViewStyle } from 'react-native';
import { spacing } from '../tokens/spacing';

export interface BoxProps extends ViewProps {
  p?: keyof typeof spacing;
  px?: keyof typeof spacing;
  py?: keyof typeof spacing;
  m?: keyof typeof spacing;
  mx?: keyof typeof spacing;
  my?: keyof typeof spacing;
  gap?: keyof typeof spacing;
  row?: boolean;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  flex?: number;
}

export function Box({
  children,
  style,
  p,
  px,
  py,
  m,
  mx,
  my,
  gap,
  row = false,
  align,
  justify,
  flex,
  ...props
}: BoxProps) {
  const dynamicStyle: ViewStyle = {
    flexDirection: row ? 'row' : 'column',
    ...(p !== undefined && { padding: spacing[p] }),
    ...(px !== undefined && { paddingHorizontal: spacing[px] }),
    ...(py !== undefined && { paddingVertical: spacing[py] }),
    ...(m !== undefined && { margin: spacing[m] }),
    ...(mx !== undefined && { marginHorizontal: spacing[mx] }),
    ...(my !== undefined && { marginVertical: spacing[my] }),
    ...(gap !== undefined && { gap: spacing[gap] }),
    ...(align !== undefined && { alignItems: align }),
    ...(justify !== undefined && { justifyContent: justify }),
    ...(flex !== undefined && { flex }),
  };

  return (
    <View style={[dynamicStyle, style]} {...props}>
      {children}
    </View>
  );
}
