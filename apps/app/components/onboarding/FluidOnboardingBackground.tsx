import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';

interface FluidBackgroundProps {
  index: number;
  x: SharedValue<number>;
}

// Background Colors matching Reference Image 1
export const SLIDE_BACKGROUND_COLORS = [
  '#F59E0B', // Slide 0: Warm Golden Amber
  '#A78BFA', // Slide 1: Soft Pastel Lavender
  '#F97316', // Slide 2: Vibrant Coral Orange
];

export function FluidOnboardingBackground({ index, x }: FluidBackgroundProps) {
  const { width: rawWidth, height: rawHeight } = useWindowDimensions();
  const SCREEN_WIDTH = rawWidth > 0 ? rawWidth : 390;
  const SCREEN_HEIGHT = rawHeight > 0 ? rawHeight : 844;

  // Morphing Organic Wave 1 Animation (Matching Reference Image 2)
  const wave1Style = useAnimatedStyle(() => {
    const translateX = interpolate(
      x.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [-SCREEN_WIDTH * 0.4, 0, SCREEN_WIDTH * 0.4],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      x.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [40, 0, -40],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      x.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [0.85, 1, 1.15],
      Extrapolation.CLAMP
    );

    const rotate = interpolate(
      x.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [-20, 0, 20],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX },
        { translateY },
        { scale },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  // Morphing Organic Wave 2 Animation
  const wave2Style = useAnimatedStyle(() => {
    const translateX = interpolate(
      x.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [SCREEN_WIDTH * 0.3, 0, -SCREEN_WIDTH * 0.3],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      x.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [-30, 0, 30],
      Extrapolation.CLAMP
    );

    const rotate = interpolate(
      x.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [15, 0, -15],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX },
        { translateY },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const bgColor = SLIDE_BACKGROUND_COLORS[index] || '#F59E0B';

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: bgColor,
        overflow: 'hidden',
      }}
      pointerEvents="none"
    >
      {/* Wave Blob 1: Top Fluid Organic Curve (Matching Reference Image 2) */}
      <Animated.View style={[{ position: 'absolute', top: -50, left: -40, width: SCREEN_WIDTH * 1.3, height: SCREEN_HEIGHT * 0.55 }, wave1Style]}>
        <Svg width={SCREEN_WIDTH * 1.3} height={SCREEN_HEIGHT * 0.55} viewBox="0 0 400 450" fill="none">
          <Defs>
            <LinearGradient id={`fluidGrad1_${index}`} x1="0" y1="0" x2="400" y2="450">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.08" />
            </LinearGradient>
          </Defs>

          <Path
            d="M -20 0 C 120 80, 240 -40, 350 120 C 420 220, 280 380, 180 420 C 60 460, -40 320, -20 0 Z"
            fill={`url(#fluidGrad1_${index})`}
          />
        </Svg>
      </Animated.View>

      {/* Wave Blob 2: Bottom Fluid Organic Curve */}
      <Animated.View style={[{ position: 'absolute', bottom: -80, right: -60, width: SCREEN_WIDTH * 1.4, height: SCREEN_HEIGHT * 0.6 }, wave2Style]}>
        <Svg width={SCREEN_WIDTH * 1.4} height={SCREEN_HEIGHT * 0.6} viewBox="0 0 450 500" fill="none">
          <Defs>
            <LinearGradient id={`fluidGrad2_${index}`} x1="0" y1="0" x2="450" y2="500">
              <Stop offset="0%" stopColor="#000000" stopOpacity="0.18" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0.03" />
            </LinearGradient>
          </Defs>

          <Path
            d="M 120 500 C 50 350, 180 220, 320 180 C 450 140, 480 320, 450 500 Z"
            fill={`url(#fluidGrad2_${index})`}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

export default FluidOnboardingBackground;
