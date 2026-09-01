import React from 'react';
import { View } from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';

interface VoucherBottomNavProps {
  onPressHome?: () => void;
  onPressCart?: () => void;
  onPressDeals?: () => void;
}

export function VoucherBottomNav({
  onPressHome,
  onPressCart,
  onPressDeals,
}: VoucherBottomNavProps) {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, 16);

  return (
    <View
      className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[28px] pt-2.5 px-6 flex-row justify-between items-center shadow-xl elevation-12 z-50"
      style={{ paddingBottom }}
    >
      {/* Icon 1: Home */}
      <ThemedTouchable
        onPress={onPressHome}
        haptic="light"
        className="w-11 h-11 items-center justify-center"
      >
        <Ionicons name="home-outline" size={22} color="#9CA3AF" />
      </ThemedTouchable>

      {/* Icon 2: Layers Stack */}
      <ThemedTouchable
        haptic="light"
        className="w-11 h-11 items-center justify-center"
      >
        <Feather name="layers" size={22} color="#9CA3AF" />
      </ThemedTouchable>

      {/* Icon 3 (Center): Elevated Floating Red Cart Button with Peach Halo Ring */}
      <View className="items-center justify-center -mt-8">
        {/* Outer Glowing Halo Ring */}
        <View className="w-[86px] h-[86px] rounded-full bg-[#FFB48C]/45 items-center justify-center">
          {/* Middle Ring */}
          <View className="w-[72px] h-[72px] rounded-full bg-[#FFC8AA]/65 items-center justify-center">
            {/* Inner Red Cart Button */}
            <ThemedTouchable
              onPress={onPressCart}
              haptic="heavy"
              activeOpacity={0.85}
              className="w-[56px] h-[56px] rounded-full bg-[#FF2442] items-center justify-center shadow-lg elevation-8"
            >
              <Ionicons name="cart" size={26} color="#FFFFFF" />
            </ThemedTouchable>
          </View>
        </View>
      </View>

      {/* Icon 4: Discount Percentage Tag (%) in Red */}
      <ThemedTouchable
        onPress={onPressDeals}
        haptic="light"
        className="w-11 h-11 items-center justify-center"
      >
        <View className="w-7 h-6 rounded-md bg-[#FF2442] items-center justify-center">
          <MaterialIcons name="percent" size={16} color="#FFFFFF" />
        </View>
      </ThemedTouchable>

      {/* Icon 5: Two-dot / More Menu */}
      <ThemedTouchable
        haptic="light"
        className="w-11 h-11 items-center justify-center"
      >
        <View className="w-6 h-6 rounded-md bg-[#C7D2FE] flex-row items-center justify-center gap-0.5">
          <View className="w-1 h-1 rounded-full bg-white" />
          <View className="w-1 h-1 rounded-full bg-white" />
        </View>
      </ThemedTouchable>
    </View>
  );
}

export default VoucherBottomNav;

