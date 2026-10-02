import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';

interface DetailHeaderProps {
  onBack: () => void;
  isFavorite?: boolean;
  onFavorite?: () => void;
}

export function DetailHeader({ onBack, isFavorite = false, onFavorite }: DetailHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ paddingTop: Math.max(insets.top, 16) }}
      className="px-6 flex-row justify-between items-center z-40"
    >
      <ThemedTouchable
        onPress={onBack}
        haptic="light"
        className="w-12 h-12 rounded-full bg-white items-center justify-center border border-[#E5E5EA] shadow-md elevation-3"
      >
        <Ionicons name="chevron-back" size={24} color="#18181B" />
      </ThemedTouchable>

      <Text className="text-[17px] font-sans-bold text-[#18181B]">Details</Text>

      <ThemedTouchable
        onPress={onFavorite}
        haptic="selection"
        className="w-12 h-12 rounded-full bg-white items-center justify-center border border-[#E5E5EA] shadow-md elevation-3"
      >
        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={24}
          color={isFavorite ? '#EF4444' : '#18181B'}
        />
      </ThemedTouchable>
    </View>
  );
}

export default DetailHeader;
