import React, { useState } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useAnimatedRef,
  interpolate,
  Extrapolation,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { OnboardingSlide } from '@/types/onboarding';
import { ONBOARDING_SLIDES } from '@/constants/onboarding';
import { OnboardingItem } from '@/components/onboarding/OnboardingItem';
import { StepperDot } from '@/components/onboarding/StepperDot';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { ThemedPressed } from '@/components/ui/ThemedPressed';

function HomeIcon({ color = '#C87D20', size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.5L20 9.8V19C20 19.8 19.3 20.5 18.5 20.5H5.5C4.7 20.5 4 19.8 4 19V9.8L12 3.5Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 16.5H14"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function OnboardingTemplate() {
  const router = useRouter();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const flatListRef = useAnimatedRef<Animated.FlatList<OnboardingSlide>>();
  const x = useSharedValue(0);
  const [activePageIndex, setActivePageIndex] = useState(0);

  const buttonWaveScale = useSharedValue(0);
  const buttonWaveOpacity = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      x.value = event.contentOffset.x;
    },
  });

  const swipeSplashStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      x.value,
      [
        0,
        0.5 * SCREEN_WIDTH,
        1.0 * SCREEN_WIDTH,
        1.5 * SCREEN_WIDTH,
        2.0 * SCREEN_WIDTH,
      ],
      [0, 32, 0, 32, 0],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      x.value,
      [
        0,
        0.15 * SCREEN_WIDTH,
        0.35 * SCREEN_WIDTH,
        0.65 * SCREEN_WIDTH,
        0.85 * SCREEN_WIDTH,
        1.0 * SCREEN_WIDTH,
        1.15 * SCREEN_WIDTH,
        1.35 * SCREEN_WIDTH,
        1.65 * SCREEN_WIDTH,
        1.85 * SCREEN_WIDTH,
        2.0 * SCREEN_WIDTH,
      ],
      [0, 0.85, 1, 1, 0.85, 0, 0.85, 1, 1, 0.85, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const buttonWaveStyle = useAnimatedStyle(() => ({
    opacity: buttonWaveOpacity.value,
    transform: [{ scale: buttonWaveScale.value }],
  }));

  const textStartStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      x.value,
      [(ONBOARDING_SLIDES.length - 2) * SCREEN_WIDTH, (ONBOARDING_SLIDES.length - 1) * SCREEN_WIDTH],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const textNextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      x.value,
      [(ONBOARDING_SLIDES.length - 2) * SCREEN_WIDTH, (ONBOARDING_SLIDES.length - 1) * SCREEN_WIDTH],
      [1, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const handleNext = () => {
    const nextIndex = activePageIndex + 1;
    if (nextIndex < ONBOARDING_SLIDES.length) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      buttonWaveOpacity.value = 1;
      buttonWaveScale.value = withSequence(
        withTiming(34, { duration: 320, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        withTiming(34, { duration: 80 }, () => {
          runOnJS(setActivePageIndex)(nextIndex);
        }),
        withTiming(0, { duration: 320, easing: Easing.out(Easing.quad) }, () => {
          buttonWaveOpacity.value = 0;
        })
      );

      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: false,
        });
      }, 340);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    buttonWaveOpacity.value = 1;
    buttonWaveScale.value = withTiming(34, { duration: 300, easing: Easing.inOut(Easing.quad) });
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 280);
  };

  return (
    <View className="flex-1 bg-[#1A1816]">
      {/* Top Right Skip Button */}
      <View className="absolute top-14 right-6 z-50">
        <ThemedTouchable
          onPress={handleFinish}
          haptic="light"
          className="bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20"
        >
          <Text className="text-white/90 font-satoshi-bold text-xs">
            Skip
          </Text>
        </ThemedTouchable>
      </View>

      {/* Swipe-Driven Golden Wave Layer */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            bottom: 25,
            right: 25,
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: '#C87D20',
            zIndex: 40,
          },
          swipeSplashStyle,
        ]}
      />

      {/* Button-Press Golden Wave Sweep Layer */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            bottom: 25,
            right: 25,
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: '#C87D20',
            zIndex: 45,
          },
          buttonWaveStyle,
        ]}
      />

      {/* Horizontal Reanimated Paging Carousel */}
      <Animated.FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActivePageIndex(newIndex);
        }}
        renderItem={({ item, index }) => (
          <OnboardingItem
            item={item}
            index={index}
            x={x}
            onNext={handleNext}
          />
        )}
      />

      {/* Bottom Floating Controls */}
      <View className="absolute bottom-10 left-6 right-6 flex-row justify-between items-center z-50 pointer-events-box-none">
        <View className="flex-row items-center">
          {ONBOARDING_SLIDES.map((_, i) => (
            <StepperDot key={i} index={i} x={x} />
          ))}
        </View>

        <ThemedPressed
          onPress={handleNext}
          haptic="medium"
          className="w-[135px] h-[58px] rounded-full bg-[#C87D20] p-1 flex-row items-center justify-between shadow-2xl elevation-12"
        >
          <View className="w-[48px] h-[48px] rounded-full bg-white items-center justify-center shadow-md elevation-4">
            <HomeIcon color="#C87D20" size={24} />
          </View>
          <View className="flex-1 items-center justify-center pr-2 relative">
            <Animated.Text
              style={[
                {
                  fontFamily: 'Satoshi-Bold',
                  color: '#FFFFFF',
                  fontSize: 15,
                  letterSpacing: -0.3,
                  position: 'absolute',
                },
                textNextStyle,
              ]}
            >
              Next
            </Animated.Text>
            <Animated.Text
              style={[
                {
                  fontFamily: 'Satoshi-Bold',
                  color: '#FFFFFF',
                  fontSize: 15,
                  letterSpacing: -0.3,
                  position: 'absolute',
                },
                textStartStyle,
              ]}
            >
              Start
            </Animated.Text>
          </View>
        </ThemedPressed>
      </View>
    </View>
  );
}

export default OnboardingTemplate;
