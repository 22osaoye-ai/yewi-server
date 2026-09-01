// src/components/ui/CurvedCard.tsx
import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export interface CurvedCardProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
  children?: React.ReactNode;
  className?: string;
}

export function CurvedCard({
  width = 260,
  height = 360,
  backgroundColor = '#DE7C60',
  children,
  className = '',
}: CurvedCardProps) {
  const d = `
    M 0 36
    A 36 36 0 0 1 36 0
    L ${width - 36} 0
    A 36 36 0 0 1 ${width} 36
    L ${width} 280
    Q ${width} 310 ${width - 20} 310
    L 171 310
    Q 151 310 152 340
    Q 151 360 120 360
    L 36 360
    A 36 36 0 0 1 0 324
    L 0 36
    Z
  `;

  return (
    <View
      style={{ width, height }}
      className={`relative shadow-xl elevation-6 ${className}`}
    >
      <Svg width={width} height={height} className="absolute inset-0">
        <Path d={d} fill={backgroundColor} />
      </Svg>
      <View className="absolute inset-0 p-[22px] justify-between">
        {children}
      </View>
    </View>
  );
}

export default CurvedCard;
