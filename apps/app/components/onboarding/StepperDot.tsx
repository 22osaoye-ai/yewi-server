import React from 'react';
import { useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';

interface StepperDotProps {
  index: number;
  x: SharedValue<number>;
}

export function StepperDot({ index, x }: StepperDotProps) {
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const dotAnimatedStyle = useAnimatedStyle(() => {
    const width = interpolate(
      x.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [8, 28, 8],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      x.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [0.4, 1, 0.4],
      Extrapolation.CLAMP
    );

    return {
      width,
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          height: 6,
          borderRadius: 3,
          backgroundColor: '#FFFFFF',
          marginHorizontal: 3,
        },
        dotAnimatedStyle,
      ]}
    />
  );
}

export default StepperDot;
