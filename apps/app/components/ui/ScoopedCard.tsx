import React, { memo } from 'react';
import { View, ViewStyle, StyleSheet, StyleProp } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export interface ScoopedCardProps {
  width: number;
  height: number;
  backgroundColor: string;
  borderColor?: string;
  borderWidth?: number;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Mathematically continuous C1 path carving an open circular scoop / cutout in the bottom-left corner
 * where the circular action button or avatar nests, opening a clean uniform gap around it.
 *
 * Parametric geometry matching CategoryLookbookCarousel (Image 4):
 * - Corner radius: R = 26
 * - Cutout arc: R = 25 centered at (30, height - 30)
 * - Nested circle: diameter 44 (R = 22) positioned at left = 8, bottom = 8
 * - Clean 3px concentric gap hugging the circle
 * - Tangent quad fillets: R = 16 at (0, height - 55) and (55, height)
 */
export function getScoopedCardPath(width: number, height: number): string {
  const r = 26;
  return `
    M 0 ${r}
    A ${r} ${r} 0 0 1 ${r} 0
    L ${width - r} 0
    A ${r} ${r} 0 0 1 ${width} ${r}
    L ${width} ${height - r}
    A ${r} ${r} 0 0 1 ${width - r} ${height}
    L 71 ${height}
    Q 55 ${height} 55 ${height - 16}
    L 55 ${height - 30}
    A 25 25 0 0 0 30 ${height - 55}
    L 16 ${height - 55}
    Q 0 ${height - 55} 0 ${height - 71}
    L 0 ${r}
    Z
  `.replace(/\s+/g, ' ').trim();
}

export const ScoopedCard = memo(function ScoopedCard({
  width,
  height,
  backgroundColor,
  borderColor,
  borderWidth = 1,
  children,
  style,
}: ScoopedCardProps) {
  const path = getScoopedCardPath(width, height);

  return (
    <View style={[{ width, height, position: 'relative' }, style]}>
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={StyleSheet.absoluteFill}
      >
        <Path
          d={path}
          fill={backgroundColor}
          stroke={borderColor}
          strokeWidth={borderColor ? borderWidth : 0}
        />
      </Svg>
      {children}
    </View>
  );
});

export default ScoopedCard;
