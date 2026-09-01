import React, { useState } from 'react';
import {
  View,
  Text,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { OnboardingSlide } from '@/types/onboarding';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';

interface OnboardingItemProps {
  item: OnboardingSlide;
  index: number;
  x: SharedValue<number>;
  onNext: () => void;
}

export function OnboardingItem({
  item,
  index,
  x,
  onNext,
}: OnboardingItemProps) {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const [activeColor, setActiveColor] = useState(0);

  // Content Slide Parallax Animation
  const contentAnimationStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      x.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [60, 0, -60],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      x.value,
      [
        (index - 0.7) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 0.7) * SCREEN_WIDTH,
      ],
      [0, 1, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  // Card Parallax Animation
  const cardAnimationStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      x.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [90, 0, -90],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      x.value,
      [
        (index - 0.6) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 0.6) * SCREEN_WIDTH,
      ],
      [0, 1, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  return (
    <View style={{ width: SCREEN_WIDTH }} className="flex-1 overflow-hidden">
      <ImageBackground
        source={item.image}
        className="flex-1 justify-between pt-14 pb-10 px-6"
        resizeMode="cover"
      >
        {/* Top Header with Vertical Text and Title */}
        <Animated.View style={contentAnimationStyle} className="flex-row items-start mt-4 z-10">
          {/* Vertical Rotated Text */}
          <View className="mr-4 -rotate-90 -ml-5 mt-7">
            <Text className="text-white/80 font-satoshi-medium text-xs tracking-widest uppercase">
              {item.tag}
            </Text>
          </View>

          {/* Main Title */}
          <View className="flex-1">
            <Text className="text-[40px] font-satoshi-black text-white leading-[44px] tracking-tight">
              {item.title1}
            </Text>
            <Text className="text-[40px] font-satoshi-black text-[#F3EFEA] leading-[44px] tracking-tight">
              {item.title2}
            </Text>
            <Text className="text-[40px] font-satoshi-black text-white leading-[44px] tracking-tight">
              {item.title3}
            </Text>
          </View>
        </Animated.View>

        {/* Center Frosted Glassmorphism Card */}
        <Animated.View style={cardAnimationStyle} className="relative self-start w-[245px] mb-8 z-10">
          <View className="bg-white/25 backdrop-blur-2xl rounded-[28px] p-4 border border-white/40 shadow-2xl elevation-12">
            {/* Category Pill */}
            <View className="self-start bg-black/30 rounded-full px-2.5 py-0.5 mb-2">
              <Text className="text-white font-satoshi-medium text-[11px]">
                {item.category}
              </Text>
            </View>

            {/* Chair Title */}
            <Text className="text-white font-satoshi-bold text-base tracking-tight mb-1">
              {item.productName}
            </Text>

            {/* Available Colors */}
            <Text className="text-white/85 font-satoshi text-xs mb-1.5">
              Available Color:
            </Text>
            <View className="flex-row items-center gap-2 mb-3.5">
              {item.colors?.map((c, idx) => (
                <ThemedTouchable
                  key={idx}
                  haptic="selection"
                  onPress={() => setActiveColor(idx)}
                  style={{ backgroundColor: c }}
                  className={`w-4 h-4 rounded-full ${
                    activeColor === idx ? 'border-2 border-white scale-110 shadow-sm' : 'opacity-80'
                  }`}
                />
              ))}
            </View>

            {/* Price & Arrow Button */}
            <View className="flex-row justify-between items-center">
              <Text className="text-white font-satoshi-black text-lg tracking-tight">
                {item.price}
              </Text>
              <ThemedTouchable
                haptic="light"
                onPress={onNext}
                className="w-9 h-9 rounded-full bg-white/35 items-center justify-center border border-white/50 shadow-sm"
              >
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </ThemedTouchable>
            </View>
          </View>

          {/* Pointer Dot & Connecting Line to the Chair */}
          <View className="absolute -right-7 bottom-6 flex-row items-center">
            <View className="w-5 h-[1.5px] bg-white/80" />
            <View className="w-3.5 h-3.5 rounded-full bg-white/40 border border-white items-center justify-center shadow-md">
              <View className="w-1.5 h-1.5 rounded-full bg-white" />
            </View>
          </View>
        </Animated.View>

        {/* Bottom spacer matching bottom controls */}
        <View className="h-[58px]" />
      </ImageBackground>
    </View>
  );
}

export default OnboardingItem;
