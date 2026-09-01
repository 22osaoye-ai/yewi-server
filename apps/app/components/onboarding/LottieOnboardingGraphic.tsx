import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

interface LottieGraphicProps {
  slideId: number;
}

export function LottieOnboardingGraphic({ slideId }: LottieGraphicProps) {
  const scale = useSharedValue(1);
  const floatY = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    floatY.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 2800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: floatY.value }],
  }));

  if (slideId === 0) {
    // Slide 0: Connecting People & Professionals (Matching Reference Image 1 Cartoon Art Style)
    return (
      <Animated.View style={[{ width: 260, height: 260, alignItems: 'center', justifyContent: 'center' }, animatedStyle]}>
        <Svg width="260" height="260" viewBox="0 0 260 260" fill="none">
          <Defs>
            <LinearGradient id="lotGrad0" x1="0" y1="0" x2="260" y2="260">
              <Stop offset="0%" stopColor="#18181B" />
              <Stop offset="100%" stopColor="#27272A" />
            </LinearGradient>
          </Defs>

          <Circle cx="130" cy="130" r="110" fill="#FFFFFF" fillOpacity="0.95" />
          <Circle cx="130" cy="130" r="95" stroke="#18181B" strokeWidth="2.5" strokeDasharray="8 6" strokeOpacity="0.25" />

          {/* Client Avatar */}
          <Circle cx="85" cy="120" r="32" fill="url(#lotGrad0)" />
          <Path d="M73 112 C73 104, 97 104, 97 112 C97 120, 73 120, 73 112 Z" fill="#FFFFFF" />
          <Circle cx="85" cy="138" r="14" fill="#FFFFFF" />

          {/* Professional Avatar */}
          <Circle cx="175" cy="120" r="32" fill="#18181B" />
          <Path d="M163 112 C163 104, 187 104, 187 112 C187 120, 163 120, 163 112 Z" fill="#FFFFFF" />
          <Rect x="165" y="128" width="20" height="18" rx="4" fill="#FFFFFF" />

          {/* Central Handshake / Connection Badge */}
          <Circle cx="130" cy="120" r="18" fill="#18181B" />
          <Path d="M123 120 L128 125 L138 115" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Animated.View>
    );
  }

  if (slideId === 1) {
    // Slide 1: Business Growth (Matching Lavender Background)
    return (
      <Animated.View style={[{ width: 260, height: 260, alignItems: 'center', justifyContent: 'center' }, animatedStyle]}>
        <Svg width="260" height="260" viewBox="0 0 260 260" fill="none">
          <Circle cx="130" cy="130" r="110" fill="#FFFFFF" fillOpacity="0.95" />

          {/* Rising Chart Bars */}
          <Rect x="70" y="140" width="24" height="45" rx="8" fill="#E5E5EA" />
          <Rect x="106" y="115" width="24" height="70" rx="8" fill="#7C3AED" fillOpacity="0.3" />
          <Rect x="142" y="85" width="24" height="100" rx="8" fill="#6D28D9" />
          <Rect x="178" y="55" width="24" height="130" rx="8" fill="#18181B" />

          {/* Rocket Arrow */}
          <Path d="M60 155 L120 105 L160 115 L205 50" stroke="#18181B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M185 50 H205 V70" stroke="#18181B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Animated.View>
    );
  }

  // Slide 2: Quality & Security (Matching Coral Orange Background)
  return (
    <Animated.View style={[{ width: 260, height: 260, alignItems: 'center', justifyContent: 'center' }, animatedStyle]}>
      <Svg width="260" height="260" viewBox="0 0 260 260" fill="none">
        <Circle cx="130" cy="130" r="110" fill="#FFFFFF" fillOpacity="0.95" />

        {/* Quality Shield */}
        <Path
          d="M130 55 L190 80 V130 C190 170, 130 195, 130 195 C130 195, 70 170, 70 130 V80 L130 55 Z"
          fill="#18181B"
        />

        {/* Checkmark Star */}
        <Circle cx="130" cy="120" r="22" fill="#FFFFFF" />
        <Path d="M120 120 L127 127 L142 112" stroke="#18181B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Animated.View>
  );
}

export default LottieOnboardingGraphic;
