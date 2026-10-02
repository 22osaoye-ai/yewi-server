import React from 'react';
import { View, Text, ScrollView, ViewStyle } from 'react-native';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { CATEGORIES } from '@/constants/categories';
import { useAppTheme } from '@/hooks/useAppTheme';

interface CategoryTabsProps {
  categories?: readonly string[] | string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  variant?: 'solid' | 'subtle' | 'neutral';
}

export function CategoryTabs({
  categories = CATEGORIES,
  selectedCategory,
  onSelectCategory,
  style,
  contentContainerStyle,
  variant = 'neutral',
}: CategoryTabsProps) {
  const { isDark } = useAppTheme();

  return (
    <View style={[{ marginVertical: 6 }, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          { paddingHorizontal: 20, gap: 8 },
          contentContainerStyle,
        ]}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;

          // Zalando high-contrast editorial color tokens
          const bg = isSelected
            ? isDark
              ? '#FFFFFF'
              : '#09090B'
            : isDark
            ? '#1E293B'
            : '#F4F4F5';

          const border = isSelected
            ? isDark
              ? '#FFFFFF'
              : '#09090B'
            : isDark
            ? 'rgba(255, 255, 255, 0.08)'
            : '#E4E4E7';

          const textColor = isSelected
            ? isDark
              ? '#09090B'
              : '#FFFFFF'
            : isDark
            ? '#94A3B8'
            : '#52525B';

          return (
            <ThemedTouchable
              key={cat}
              haptic="selection"
              activeOpacity={0.85}
              onPress={() => onSelectCategory(cat)}
              style={{
                backgroundColor: bg,
                paddingHorizontal: 18,
                paddingVertical: 9,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: border,
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  color: textColor,
                  fontFamily: 'PlusJakartaSans-Bold',
                  fontSize: 13,
                  letterSpacing: -0.2,
                }}
              >
                {cat}
              </Text>
            </ThemedTouchable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default CategoryTabs;
