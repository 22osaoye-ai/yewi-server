import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';

export interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  style?: ViewStyle;
}

export function Separator({
  orientation = 'horizontal',
  style,
}: SeparatorProps) {
  const { colors, isDark } = useAppTheme();
  const isHorizontal = orientation === 'horizontal';

  return (
    <View
      style={[
        isHorizontal ? styles.horizontal : styles.vertical,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        },
        style,
      ]}
      accessibilityRole="none"
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    width: '100%',
    height: StyleSheet.hairlineWidth || 1,
  },
  vertical: {
    height: '100%',
    width: StyleSheet.hairlineWidth || 1,
  },
});

export default Separator;
