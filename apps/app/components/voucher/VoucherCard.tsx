import React from 'react';
import { View, Text, Image, useWindowDimensions } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { VoucherItem } from '@/types/voucher';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';

interface VoucherCardProps {
  voucher: VoucherItem;
  onPress?: () => void;
}

export function VoucherCard({ voucher, onPress }: VoucherCardProps) {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const cardWidth = SCREEN_WIDTH - 36; // Padding 18 on each side for larger ticket feel
  const cardHeight = 185;
  const notchR = 26; // Subtle circular cutout notch matching target design
  const cornerR = 28; // Soft rounded corners
  const centerY = cardHeight / 2;
  const dashedLineX = 118;

  // Exact ticket path with right-edge concave circular bite
  const ticketPath = `
    M 0, ${cornerR}
    A ${cornerR},${cornerR} 0 0,1 ${cornerR},0
    L ${cardWidth - cornerR},0
    A ${cornerR},${cornerR} 0 0,1 ${cardWidth},${cornerR}
    L ${cardWidth},${centerY - notchR}
    A ${notchR},${notchR} 0 0,0 ${cardWidth},${centerY + notchR}
    L ${cardWidth},${cardHeight - cornerR}
    A ${cornerR},${cornerR} 0 0,1 ${cardWidth - cornerR},${cardHeight}
    L ${cornerR},${cardHeight}
    A ${cornerR},${cornerR} 0 0,1 0,${cardHeight - cornerR}
    Z
  `;

  return (
    <ThemedTouchable
      onPress={onPress}
      haptic="selection"
      activeOpacity={0.92}
      className="self-center shadow-md elevation-4"
      style={{
        width: cardWidth,
        height: cardHeight,
        marginBottom: 16,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* SVG Background Ticket Shape + Precise Dashed Line */}
      <Svg
        width={cardWidth}
        height={cardHeight}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <Path d={ticketPath} fill={voucher.backgroundColor} />
        <Line
          x1={dashedLineX}
          y1={0}
          x2={dashedLineX}
          y2={cardHeight}
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth={2}
          strokeDasharray="6 5"
        />
      </Svg>

      {/* Card Content Overlay - Absolutely Positioned over SVG */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
        }}
      >
        {/* Left Section: Product Image */}
        <View
          className="h-full items-center justify-center px-2"
          style={{ width: dashedLineX }}
        >
          <Image
            source={voucher.image}
            className="w-[90px] h-[130px]"
            resizeMode="contain"
          />
        </View>

        {/* Right Section: Brand, Subtitle, Price & Credits Pill */}
        <View className="flex-1 h-full justify-between pl-4 pr-9 py-1.5">
          {/* Top Titles */}
          <View>
            <Text className="text-[25px] font-satoshi-bold text-white tracking-tight leading-snug">
              {voucher.brand}
            </Text>
            <Text className="text-[14px] font-satoshi-medium text-white/85 mt-0.5 tracking-normal">
              {voucher.subtitle}
            </Text>
          </View>

          {/* Bottom Row: Price + Credits Pill */}
          <View className="flex-row justify-between items-end pb-0.5">
            {/* Price */}
            <View className="flex-row items-baseline">
              <Text className="text-[26px] font-satoshi-black text-white tracking-tight">
                {voucher.price}
              </Text>
              <Text className="text-[15px] font-satoshi-bold text-white ml-1">
                {voucher.currency}
              </Text>
            </View>

            {/* White Credits Badge Pill */}
            <View className="bg-white rounded-full px-3.5 py-1.5 shadow-sm elevation-2 mb-0.5">
              <Text className="text-[12px] font-satoshi-bold text-[#18181B]">
                {voucher.credits} cred.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ThemedTouchable>
  );
}

export default VoucherCard;


