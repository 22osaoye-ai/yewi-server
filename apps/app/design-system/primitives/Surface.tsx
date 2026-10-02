import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';

export interface SurfaceProps extends ViewProps {
  variant?: 'base' | 'elevated' | 'highlight' | 'input' | 'borderless';
  rounded?: keyof typeof radius;
  hasBorder?: boolean;
}

export function Surface({
  children,
  style,
  variant = 'base',
  rounded = '2xl',
  hasBorder = true,
  ...props
}: SurfaceProps) {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'elevated':
        return colors.surfaceElevated;
      case 'highlight':
        return colors.surfaceHighlight;
      case 'input':
        return colors.surfaceInput;
      case 'borderless':
        return 'transparent';
      case 'base':
      default:
        return colors.surface;
    }
  };

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: getBackgroundColor(),
          borderRadius: radius[rounded],
          borderWidth: hasBorder && variant !== 'borderless' ? 1 : 0,
          borderColor: colors.borderSubtle,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
