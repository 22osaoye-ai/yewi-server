import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { ColorOption } from '@/types/detail';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';

interface LiquidColorPickerProps {
  colors: ColorOption[];
  selectedColor: number;
  onSelectColor: (index: number) => void;
}

export function LiquidColorPicker({
  colors,
  selectedColor,
  onSelectColor,
}: LiquidColorPickerProps) {
  const activeColorObj = colors[selectedColor] || colors[1];
  const targetY = activeColorObj.y;

  // Slender liquid palette path with thin horizontal stick stem ("palito")
  const liquidPath = `
    M 126, 38
    A 20,20 0 0,1 166, 38
    L 166, 174
    A 20,20 0 0,1 126, 174
    L 126, ${targetY + 16}
    C 124, ${targetY + 12} 118, ${targetY + 2.5} 110, ${targetY + 2.5}
    L 35, ${targetY + 2.5}
    A 2.5,2.5 0 0,1 35, ${targetY - 2.5}
    L 110, ${targetY - 2.5}
    C 118, ${targetY - 2.5} 124, ${targetY - 12} 126, ${targetY - 16}
    Z
  `;

  return (
    <View className="absolute right-4 top-14 z-30 pointer-events-box-none">
      <Svg width={180} height={220} viewBox="0 0 180 220">
        <Defs>
          <RadialGradient id="focalGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.95} />
            <Stop offset="45%" stopColor="#FFFFFF" stopOpacity={0.5} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Slender Fluid Shape */}
        <Path
          d={liquidPath}
          fill={activeColorObj.liquidColor}
        />

        {/* Translucent Halo at the Droplet Tip */}
        <Circle
          cx={35}
          cy={targetY}
          r={11}
          fill={activeColorObj.liquidColor}
        />

        {/* White Focal Dot on the Chair Cushion */}
        <Circle
          cx={35}
          cy={targetY}
          r={7.5}
          fill="url(#focalGlow)"
        />
        <Circle
          cx={35}
          cy={targetY}
          r={4}
          fill="#FFFFFF"
        />

        {/* 4 Interactive Color Swatches */}
        {colors.map((c, idx) => {
          const isSelected = selectedColor === idx;
          return (
            <Circle
              key={c.name}
              cx={146}
              cy={c.y}
              r={12.5}
              fill={c.hex}
              stroke={isSelected ? '#FFFFFF' : 'transparent'}
              strokeWidth={isSelected ? 2.5 : 0}
            />
          );
        })}
      </Svg>

      {/* Hitbox Overlay for Swatch Taps */}
      <View className="absolute right-1 top-0 w-[44px] h-[220px] justify-between py-2">
        {colors.map((_, idx) => (
          <ThemedTouchable
            key={idx}
            haptic="selection"
            onPress={() => onSelectColor(idx)}
            className="w-[44px] h-[44px] items-center justify-center"
          />
        ))}
      </View>
    </View>
  );
}

export default LiquidColorPicker;
