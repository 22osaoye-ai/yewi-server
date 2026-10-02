import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input, InputProps } from './Input';
import { ThemedTouchable } from './ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

interface SearchBarProps extends InputProps {
  onFilterPress?: () => void;
}

export function SearchBar({ onFilterPress, ...props }: SearchBarProps) {
  const { colors, isDark } = useAppTheme();

  return (
    <View className="px-6 py-3.5 flex-row items-center gap-3">
      {/* Global Pill Search Input */}
      <Input
        leftIcon="search-outline"
        placeholder="Buscar..."
        containerStyle={{ flex: 1, marginBottom: 0 }}
        {...props}
      />

      {/* Optional Filter Button */}
      {onFilterPress && (
        <ThemedTouchable
          onPress={onFilterPress}
          haptic="light"
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: isDark ? '#2E2E34' : '#E2E8F0',
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.2 : 0.05,
            shadowRadius: 4,
          }}
        >
          <Ionicons name="options-outline" size={20} color={colors.textPrimary} />
        </ThemedTouchable>
      )}
    </View>
  );
}

export default SearchBar;