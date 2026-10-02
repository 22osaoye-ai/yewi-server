import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedTouchable } from './ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

export interface StickyBottomBarProps {
  primaryText: string;
  secondaryText?: string;
  ctaText: string;
  onCtaPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function StickyBottomBar({
  primaryText,
  secondaryText,
  ctaText,
  onCtaPress,
  loading = false,
  disabled = false,
  style,
}: StickyBottomBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#0E1015' : '#FFFFFF',
          borderTopColor: isDark ? '#27272A' : '#E5E7EB',
          paddingBottom: Math.max(insets.bottom, 14),
        },
        style,
      ]}
    >
      {/* Left: Info / Price / Status */}
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.primaryText,
            { color: colors.textPrimary },
          ]}
          numberOfLines={1}
        >
          {primaryText}
        </Text>
        {secondaryText && (
          <Text
            style={[
              styles.secondaryText,
              { color: colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            {secondaryText}
          </Text>
        )}
      </View>

      {/* Right: Solid Pill Button */}
      <ThemedTouchable
        onPress={onCtaPress}
        disabled={disabled || loading}
        haptic="medium"
        style={[
          styles.ctaButton,
          {
            backgroundColor: isDark ? colors.primary : '#0284C7',
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={ctaText}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.ctaText,
            { color: '#FFFFFF' },
          ]}
        >
          {ctaText}
        </Text>
      </ThemedTouchable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  primaryText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    letterSpacing: -0.3,
  },
  secondaryText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    marginTop: 2,
  },
  ctaButton: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ctaText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -0.2,
  },
});

export default StickyBottomBar;
