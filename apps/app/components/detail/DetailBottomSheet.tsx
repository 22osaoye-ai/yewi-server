import React from 'react';
import { View, Text, Image, useWindowDimensions, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { ThemedPressed } from '@/components/ui/ThemedPressed';
import { DimensionOption } from '@/types/detail';

interface DetailBottomSheetProps {
  title: string;
  price: string;
  description: string;
  dimensions: readonly string[];
  selectedDimension: string;
  onSelectDimension: (dim: DimensionOption) => void;
  thumbnails: any[];
  selectedImage: number;
  onSelectImage: (index: number) => void;
  onBuyNow?: () => void;
}

export function DetailBottomSheet({
  title,
  price,
  description,
  dimensions,
  selectedDimension,
  onSelectDimension,
  thumbnails,
  selectedImage,
  onSelectImage,
  onBuyNow,
}: DetailBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const waveHeight = 25;
  const sheetHeight = 380;
  const wavePath = `
    M 0, ${waveHeight}
    C ${SCREEN_WIDTH * 0.28}, ${waveHeight} ${SCREEN_WIDTH * 0.38}, 0 ${SCREEN_WIDTH * 0.5}, 0
    C ${SCREEN_WIDTH * 0.62}, 0 ${SCREEN_WIDTH * 0.72}, ${waveHeight} ${SCREEN_WIDTH}, ${waveHeight}
    L ${SCREEN_WIDTH}, ${sheetHeight}
    L 0, ${sheetHeight}
    Z
  `;

  return (
    <View
      style={{ paddingBottom: Math.max(insets.bottom, 50) }}
      className="relative shadow-2xl"
    >
      {/* SVG Wave Background with Center Crest */}
      <View style={StyleSheet.absoluteFillObject} className="overflow-hidden">
        <Svg width={SCREEN_WIDTH} height={sheetHeight}>
          <Path
            d={wavePath}
            fill="rgba(255, 255, 255, 0.95)"
          />
        </Svg>
      </View>

      {/* Content Container inside the Wave Sheet */}
      <View className="pt-2 px-6">
        {/* Top Handle Bar Centered on the Wave Peak */}
        <View className="w-9 h-[3px] rounded-full bg-white self-center mb-3.5 shadow-sm" />

        {/* 3 Square Thumbnail Cards */}
        <View className="flex-row justify-center gap-3.5 mb-4">
          {thumbnails.map((img, idx) => {
            const isSelected = selectedImage === idx;
            return (
              <ThemedTouchable
                key={idx}
                haptic="selection"
                onPress={() => onSelectImage(idx)}
                className={`w-[66px] h-[66px] rounded-[20px] bg-white/60 items-center justify-center p-1.5 border-[2px] ${
                  isSelected ? 'border-[#D95B1E] bg-white shadow-sm' : 'border-transparent'
                }`}
              >
                <Image source={img} className="w-full h-full" resizeMode="contain" />
              </ThemedTouchable>
            );
          })}
        </View>

        {/* Title & Dimension Chips */}
        <View className="flex-row justify-between items-center mb-2.5">
          <Text className="text-[21px] font-satoshi-bold text-[#18181B] flex-1 tracking-tight">
            {title}
          </Text>
          <View className="flex-row gap-2">
            {dimensions.map((dim) => {
              const isSelected = selectedDimension === dim;
              return (
                <ThemedTouchable
                  key={dim}
                  haptic="selection"
                  onPress={() => onSelectDimension(dim as DimensionOption)}
                  className={`rounded-full px-3.5 py-1.5 ${
                    isSelected
                      ? 'bg-[#E5E5EA]'
                      : 'bg-[#F2F2F4]'
                  }`}
                >
                  <Text
                    className={`text-xs font-satoshi-bold ${
                      isSelected ? 'text-[#18181B]' : 'text-[#8E8E93]'
                    }`}
                  >
                    {dim}
                  </Text>
                </ThemedTouchable>
              );
            })}
          </View>
        </View>

        {/* Description Text */}
        <Text className="text-[13px] leading-5 text-[#6B7280] font-satoshi mb-4">
          {description}
        </Text>

        {/* Action Row Inside the Sheet: Price & Buy Now Button */}
        <View className="flex-row justify-between items-center pt-1">
          <Text className="text-[26px] font-satoshi-bold text-[#18181B] tracking-tight">
            {price}
          </Text>
          <ThemedPressed
            haptic="medium"
            scaleOnPress
            onPress={onBuyNow}
            className="bg-[#C87D20] rounded-full px-8 py-3.5 shadow-md elevation-4"
          >
            <Text className="text-white text-[15px] font-satoshi-bold tracking-wide">
              Buy Now
            </Text>
          </ThemedPressed>
        </View>
      </View>
    </View>
  );
}

export default DetailBottomSheet;
