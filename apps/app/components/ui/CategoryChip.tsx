import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedTouchable } from './ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

interface CategoryChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function CategoryChip({
  label,
  isSelected,
  onPress,
  icon,
}: CategoryChipProps) {
  const { colors, isDark } = useAppTheme();

  return (
    <ThemedTouchable
      onPress={onPress}
      haptic="selection"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: isSelected
          ? isDark
            ? '#FFFFFF'
            : '#18181B'
          : isDark
          ? '#24242A'
          : '#F4F4F6',
        borderWidth: 1,
        borderColor: isSelected
          ? isDark
            ? '#FFFFFF'
            : '#18181B'
          : isDark
          ? '#2E2E34'
          : '#E5E5EA',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isSelected ? 0.12 : 0.03,
        shadowRadius: 3,
        elevation: isSelected ? 2 : 1,
      }}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={
            isSelected
              ? isDark
                ? '#121214'
                : '#FFFFFF'
              : isDark
              ? '#F4F4F5'
              : '#18181B'
          }
          style={{ marginRight: 6 }}
        />
      )}

      <Text
        style={{
          fontSize: 13.5,
          fontFamily: isSelected ? 'Satoshi-Bold' : 'Satoshi-Medium',
          color: isSelected
            ? isDark
              ? '#121214'
              : '#FFFFFF'
            : isDark
            ? '#F4F4F5'
            : '#18181B',
          marginRight: isSelected ? 6 : 0,
        }}
      >
        {label}
      </Text>

      {isSelected && (
        <Ionicons
          name="checkmark"
          size={14}
          color={isDark ? '#121214' : '#FFFFFF'}
        />
      )}
    </ThemedTouchable>
  );
}

export default CategoryChip;
