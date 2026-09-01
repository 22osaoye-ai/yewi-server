import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';

interface VoucherHeaderProps {
  userName: string;
  credits: number;
}

export function VoucherHeader({ userName, credits }: VoucherHeaderProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top + 8, 28);

  return (
    <View className="px-[22px] pb-6" style={{ paddingTop }}>
      {/* Top Barcode Icon Action Button */}
      <View className="flex-row justify-end mb-3">
        <ThemedTouchable
          haptic="light"
          className="w-10 h-10 rounded-full bg-[#F4F4F6] items-center justify-center"
        >
          <MaterialCommunityIcons name="barcode-scan" size={20} color="#9CA3AF" />
        </ThemedTouchable>
      </View>

      {/* Greeting Title */}
      <Text className="text-[29px] font-satoshi-black text-[#18181B] leading-[35px] tracking-tight">
        {userName},
      </Text>
      <Text className="text-[29px] font-satoshi-black text-[#18181B] leading-[35px] tracking-tight">
        you have {credits} credits
      </Text>
    </View>
  );
}

export default VoucherHeader;

