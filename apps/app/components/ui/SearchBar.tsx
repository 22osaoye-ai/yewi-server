import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input, InputProps } from './Input';
import { ThemedTouchable } from './ThemedTouchable';

interface SearchBarProps extends InputProps {
  onFilterPress?: () => void;
}

export function SearchBar({ onFilterPress, ...props }: SearchBarProps) {
  return (
    <View className="px-6 py-3.5 flex-row items-center gap-3">
      {/* Global Pill Search Input */}
      <Input
        leftIcon="search-outline"
        placeholder="Buscar servicios, muebles..."
        containerStyle={{ flex: 1, marginBottom: 0 }}
        {...props}
      />

      {/* Optional Filter Button */}
      {onFilterPress && (
        <ThemedTouchable
          onPress={onFilterPress}
          haptic="light"
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#E5E5EA',
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
          }}
        >
          <Ionicons name="options-outline" size={20} color="#18181B" />
        </ThemedTouchable>
      )}
    </View>
  );
}

export default SearchBar;