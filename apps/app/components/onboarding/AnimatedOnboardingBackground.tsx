import React, { useEffect } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

interface AnimatedBackgroundProps {
  index: number;
  x: SharedValue<number>;
}

export function AnimatedOnboardingBackground({ index, x }: AnimatedBackgroundProps) {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();

  // Looping continuous ambient animations
  const pulseScale = useSharedValue(1);
  const rotationDeg = useSharedValue(0);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    rotationDeg.value = withRepeat(
      withTiming(360, { duration: 24000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const animatedRotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationDeg.value}deg` }],
  }));

  // Parallax translation based on horizontal scroll position
  const parallaxStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      x.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [-60, 0, 60],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      x.value,
      [(index - 0.8) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 0.8) * SCREEN_WIDTH],
      [0.2, 1, 0.2],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateX }],
    };
  });

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        backgroundColor: '#F8F8FA',
      }}
      pointerEvents="none"
    >
      {/* Animated Glowing Light Spheres */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -80,
            right: -80,
            width: SCREEN_WIDTH * 0.9,
            height: SCREEN_WIDTH * 0.9,
            borderRadius: (SCREEN_WIDTH * 0.9) / 2,
            backgroundColor: 'rgba(200, 125, 32, 0.12)',
          },
          animatedGlowStyle,
        ]}
      />

      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 120,
            left: -100,
            width: SCREEN_WIDTH * 0.85,
            height: SCREEN_WIDTH * 0.85,
            borderRadius: (SCREEN_WIDTH * 0.85) / 2,
            backgroundColor: 'rgba(200, 125, 32, 0.08)',
          },
          animatedGlowStyle,
        ]}
      />

      {/* Complex Geometric SVG Mesh Pattern with Parallax & Rotation */}
      <Animated.View style={[{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }, parallaxStyle]}>
        <AnimatedSvg
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          viewBox={`0 0 ${SCREEN_WIDTH} ${SCREEN_HEIGHT}`}
          fill="none"
          style={animatedRotateStyle}
        >
          <Defs>
            <RadialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#C87D20" stopOpacity="0.15" />
              <Stop offset="100%" stopColor="#C87D20" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* 4-Pointed Starburst Shape (Inspired by Reference Image 3 Background) */}
          <Path
            d={`M ${SCREEN_WIDTH * 0.5} 80 
               Q ${SCREEN_WIDTH * 0.5} 160 ${SCREEN_WIDTH * 0.75} 160 
               Q ${SCREEN_WIDTH * 0.5} 160 ${SCREEN_WIDTH * 0.5} 240 
               Q ${SCREEN_WIDTH * 0.5} 160 ${SCREEN_WIDTH * 0.25} 160 
               Q ${SCREEN_WIDTH * 0.5} 160 ${SCREEN_WIDTH * 0.5} 80 Z`}
            fill="url(#bgGrad)"
          />

          <Path
            d={`M ${SCREEN_WIDTH * 0.2} 420 
               Q ${SCREEN_WIDTH * 0.2} 480 ${SCREEN_WIDTH * 0.4} 480 
               Q ${SCREEN_WIDTH * 0.2} 480 ${SCREEN_WIDTH * 0.2} 540 
               Q ${SCREEN_WIDTH * 0.2} 480 0 480 
               Q ${SCREEN_WIDTH * 0.2} 480 ${SCREEN_WIDTH * 0.2} 420 Z`}
            fill="url(#bgGrad)"
          />

          {/* Concentric Floating Rings */}
          <Circle
            cx={SCREEN_WIDTH * 0.8}
            cy={SCREEN_HEIGHT * 0.35}
            r="90"
            stroke="#C87D20"
            strokeWidth="1.5"
            strokeDasharray="6 8"
            strokeOpacity="0.25"
          />

          <Circle
            cx={SCREEN_WIDTH * 0.15}
            cy={SCREEN_HEIGHT * 0.65}
            r="120"
            stroke="#18181B"
            strokeWidth="1"
            strokeDasharray="4 6"
            strokeOpacity="0.08"
          />
        </AnimatedSvg>
      </Animated.View>
    </View>
  );
}

export default AnimatedOnboardingBackground;
