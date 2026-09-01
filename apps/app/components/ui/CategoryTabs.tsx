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
}

export function CategoryTabs({
  categories = CATEGORIES,
  selectedCategory,
  onSelectCategory,
  style,
  contentContainerStyle,
}: CategoryTabsProps) {
  const { colors, isDark } = useAppTheme();

  return (
    <View style={[{ marginVertical: 6 }, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          { paddingHorizontal: 22, gap: 8 },
          contentContainerStyle,
        ]}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <ThemedTouchable
              key={cat}
              haptic="selection"
              onPress={() => onSelectCategory(cat)}
              style={{
                backgroundColor: isSelected
                  ? isDark
                    ? '#F4F4F5'
                    : '#18181B'
                  : colors.surface,
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: isSelected
                  ? isDark
                    ? '#F4F4F5'
                    : '#18181B'
                  : colors.border,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isSelected ? 0.15 : 0.03,
                shadowRadius: 3,
                elevation: isSelected ? 2 : 1,
              }}
            >
              <Text
                style={{
                  color: isSelected
                    ? isDark
                      ? '#121214'
                      : '#FFFFFF'
                    : colors.textPrimary,
                  fontFamily: 'Satoshi-Bold',
                  fontSize: 13,
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
