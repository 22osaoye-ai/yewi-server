import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
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
  SharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { OnboardingSlide } from '@/types/onboarding';
import { ONBOARDING_SLIDES } from '@/constants/onboarding';
import { FluidOnboardingBackground, SLIDE_BACKGROUND_COLORS } from '@/components/onboarding/FluidOnboardingBackground';
import { useAuthStore } from '@/store/useAuthStore';

function YewiIcon({ size = 24, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.5L20 9.8V19C20 19.8 19.3 20.5 18.5 20.5H5.5C4.7 20.5 4 19.8 4 19V9.8L12 3.5Z"
        stroke={color}
        strokeWidth="2"
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

function OnboardingItem({
  item,
  index,
  x,
}: {
  item: OnboardingSlide;
  index: number;
  x: SharedValue<number>;
}) {
  const { width: rawWidth } = useWindowDimensions();
  const SCREEN_WIDTH = rawWidth > 0 ? rawWidth : 390;

  // Slide Transition for Title
  const titleAnimationStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      x.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [50, 0, -50],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      x.value,
      [(index - 0.7) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 0.7) * SCREEN_WIDTH],
      [0, 1, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  return (
    <View
      style={{ width: SCREEN_WIDTH }}
      className="flex-1 justify-between pt-24 pb-32 px-7 relative overflow-hidden"
    >
      {/* Morphing Fluid Background Blobs */}
      <FluidOnboardingBackground index={index} x={x} />

      {/* Clean Motivational Big Bold Titles with Safe Vertical Padding to PREVENT ANY LETTER CLIPPING (g, y, j) */}
      <Animated.View style={titleAnimationStyle} className="my-auto z-10 pr-2">
        <Text
          style={{
            fontSize: 34,
            lineHeight: 48,
            paddingBottom: 6,
            paddingTop: 2,
            fontFamily: 'Satoshi-Black',
            color: '#18181B',
            letterSpacing: -0.5,
          }}
        >
          {item.title1}
        </Text>
        <Text
          style={{
            fontSize: 34,
            lineHeight: 48,
            paddingBottom: 6,
            paddingTop: 2,
            fontFamily: 'Satoshi-Black',
            color: '#18181B',
            letterSpacing: -0.5,
          }}
        >
          {item.title2}
        </Text>
        <Text
          style={{
            fontSize: 34,
            lineHeight: 48,
            paddingBottom: 8,
            paddingTop: 2,
            marginBottom: 12,
            fontFamily: 'Satoshi-Black',
            color: '#18181B',
            letterSpacing: -0.5,
          }}
        >
          {item.title3}
        </Text>

        <Text
          style={{
            fontSize: 15,
            lineHeight: 24,
            fontFamily: 'Satoshi-Medium',
            color: 'rgba(24, 24, 27, 0.85)',
          }}
        >
          {item.description}
        </Text>
      </Animated.View>
    </View>
  );
}

function StepperDot({ index, x }: { index: number; x: SharedValue<number> }) {
  const { width: rawWidth } = useWindowDimensions();
  const SCREEN_WIDTH = rawWidth > 0 ? rawWidth : 390;

  const dotAnimatedStyle = useAnimatedStyle(() => {
    const width = interpolate(
      x.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [8, 28, 8],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      x.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [0.35, 1, 0.35],
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
          backgroundColor: '#18181B',
          marginHorizontal: 3,
        },
        dotAnimatedStyle,
      ]}
    />
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { width: rawWidth } = useWindowDimensions();
  const SCREEN_WIDTH = rawWidth > 0 ? rawWidth : 390;
  const flatListRef = useAnimatedRef<Animated.FlatList<OnboardingSlide>>();
  const x = useSharedValue(0);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const { isAuthenticated, isLoading, hasSeenOnboarding, setHasSeenOnboarding } = useAuthStore();

  if (isLoading || isAuthenticated || hasSeenOnboarding) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F8F8FA',
        }}
      >
        <ActivityIndicator size="large" color="#C87D20" />
      </View>
    );
  }


  const buttonWaveScale = useSharedValue(0);
  const buttonWaveOpacity = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      x.value = event.contentOffset.x;
    },
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
    const currentPage = Math.round(x.value / SCREEN_WIDTH);
    const nextIndex = currentPage + 1;
    if (nextIndex < ONBOARDING_SLIDES.length) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      buttonWaveOpacity.value = 1;
      buttonWaveScale.value = withSequence(
        withTiming(36, { duration: 340, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        withTiming(36, { duration: 80 }, () => {
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


  const handleFinish = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    await setHasSeenOnboarding(true);
    if (!isAuthenticated) {
      router.replace('/auth/login');
    } else {
      router.replace('/(tabs)');
    }
  };

  const currentSlideColor = SLIDE_BACKGROUND_COLORS[activePageIndex] || '#F59E0B';
  const nextSlideColor = SLIDE_BACKGROUND_COLORS[activePageIndex + 1] || currentSlideColor;

  return (
    <View style={{ flex: 1, backgroundColor: currentSlideColor }}>
      {/* Liquid Screen Wave Transition Effect */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            bottom: 35,
            right: 24,
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: nextSlideColor,
            zIndex: 45,
          },
          buttonWaveStyle,
        ]}
      />

      {/* Horizontal Animated Carousel */}
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
          />
        )}
      />

      {/* Bottom Controls: Stepper Dots & Action Button */}
      <View
        style={{
          position: 'absolute',
          bottom: 40,
          left: 24,
          right: 24,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 50,
        }}
        pointerEvents="box-none"
      >
        {/* Stepper Dots */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {ONBOARDING_SLIDES.map((_, i) => (
            <StepperDot key={i} index={i} x={x} />
          ))}
        </View>

        {/* Dynamic Next Button */}
        <ThemedTouchable
          onPress={handleNext}
          haptic="medium"
          style={{
            width: 148,
            height: 58,
            borderRadius: 29,
            backgroundColor: '#18181B',
            padding: 4,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 4,
            }}
          >

            <YewiIcon color="#18181B" size={24} />
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingRight: 8, position: 'relative' }}>
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
              Siguiente
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
              Empezar
            </Animated.Text>
          </View>
        </ThemedTouchable>
      </View>
    </View>
  );
}

