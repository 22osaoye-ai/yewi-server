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
  variant?: 'primary' | 'neutral';
}

export function CategoryChip({
  label,
  isSelected,
  onPress,
  icon,
  variant = 'primary',
}: CategoryChipProps) {
  const { colors, isDark } = useAppTheme();

  let activeBg = colors.primary;
  let activeBorder = colors.primary;
  let activeText = '#FFFFFF';

  if (variant === 'neutral') {
    activeBg = isDark ? '#FFFFFF' : '#18181B';
    activeBorder = isDark ? '#FFFFFF' : '#18181B';
    activeText = isDark ? '#121214' : '#FFFFFF';
  }

  return (
    <ThemedTouchable
      onPress={onPress}
      haptic="selection"
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 42,
        paddingVertical: 9,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: isSelected
          ? activeBg
          : isDark
          ? '#24242A'
          : '#F4F4F6',
        borderWidth: 1,
        borderColor: isSelected
          ? activeBorder
          : isDark
          ? '#2E2E34'
          : '#E5E5EA',
        shadowColor: isSelected ? (variant === 'primary' ? colors.primary : '#000') : '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isSelected ? 0.2 : 0.02,
        shadowRadius: isSelected ? 4 : 2,
        elevation: isSelected ? 3 : 1,
      }}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={
            isSelected
              ? activeText
              : isDark
              ? '#F4F4F5'
              : '#18181B'
          }
          style={{ marginRight: 6 }}
        />
      )}

      <Text
        numberOfLines={1}
        style={{
          fontSize: 13.5,
          fontFamily: isSelected ? 'PlusJakartaSans-Bold' : 'PlusJakartaSans-Medium',
          color: isSelected
            ? activeText
            : isDark
            ? '#F4F4F5'
            : '#18181B',
          marginRight: isSelected ? 6 : 0,
          flexShrink: 1,
        }}
      >
        {label}
      </Text>

      {isSelected && (
        <Ionicons
          name="checkmark"
          size={14}
          color={activeText}
        />
      )}
    </ThemedTouchable>
  );
}

export default CategoryChip;
