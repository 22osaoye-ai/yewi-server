import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useAppTheme } from '@/hooks/useAppTheme';

/**
 * AmbientScreenBackground:
 * Multi-stop ambient vertical gradient inspired by Reference Design.
 * Clean, luminous turquoise / cyan / sky wash transitioning smoothly down the screen.
 */
export function AmbientScreenBackground() {
  const { isDark, colors } = useAppTheme();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="ambientScreenGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop
              offset="0%"
              stopColor={isDark ? '#082F49' : '#72E5D9'}
              stopOpacity={isDark ? 0.95 : 0.70}
            />
            <Stop
              offset="25%"
              stopColor={isDark ? '#0A3B5C' : '#8FECE4'}
              stopOpacity={isDark ? 0.90 : 0.60}
            />
            <Stop
              offset="50%"
              stopColor={isDark ? '#0C2D46' : '#B8F2EC'}
              stopOpacity={isDark ? 0.85 : 0.48}
            />
            <Stop
              offset="75%"
              stopColor={isDark ? '#0E2236' : '#DCF7F5'}
              stopOpacity={isDark ? 0.80 : 0.35}
            />
            <Stop
              offset="100%"
              stopColor={isDark ? colors.background : '#F0FDFD'}
              stopOpacity={1}
            />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#ambientScreenGrad)" />
      </Svg>
    </View>
  );
}

export default AmbientScreenBackground;
