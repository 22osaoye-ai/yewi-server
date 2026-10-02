import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useAppTheme } from '@/hooks/useAppTheme';

export interface ProgressProps {
  value: number; // 0 to 100
  max?: number;
  height?: number;
  style?: ViewStyle;
}

export function Progress({
  value,
  max = 100,
  height = 8,
  style,
}: ProgressProps) {
  const { colors, isDark } = useAppTheme();
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));

  const progress = useSharedValue(percentage);

  React.useEffect(() => {
    progress.value = withTiming(percentage, {
      duration: 350,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [percentage]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: height / 2,
          backgroundColor: isDark ? '#27272A' : '#E2E8F0',
        },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max, now: value }}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            borderRadius: height / 2,
            backgroundColor: colors.primary,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    height: '100%',
  },
});

export default Progress;
