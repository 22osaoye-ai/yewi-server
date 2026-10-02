import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ThemedTouchable } from './ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

export interface AccordionSectionProps {
  title: string;
  subtitle?: string;
  badge?: string;
  initialOpen?: boolean;
  bulletPoints?: string[];
  children?: React.ReactNode;
  noBorder?: boolean;
  iconType?: 'plus-close' | 'chevron';
  style?: ViewStyle;
}

export function AccordionSection({
  title,
  subtitle,
  badge,
  initialOpen = false,
  bulletPoints,
  children,
  noBorder = false,
  iconType = 'chevron',
  style,
}: AccordionSectionProps) {
  const { colors, isDark } = useAppTheme();
  const [isOpen, setIsOpen] = useState(initialOpen);

  const rotation = useSharedValue(initialOpen ? 1 : 0);

  useEffect(() => {
    rotation.value = withTiming(isOpen ? 1 : 0, {
      duration: 200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [isOpen]);

  const chevronAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 180}deg` }],
  }));

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  const dividerColor = isDark ? '#27272A' : '#E5E7EB';

  return (
    <View
      style={[
        styles.container,
        !noBorder && { borderBottomColor: dividerColor, borderBottomWidth: 1 },
        style,
      ]}
    >
      <ThemedTouchable
        onPress={toggleOpen}
        haptic="light"
        style={styles.headerRow}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        <View style={styles.titleContainer}>
          <Text
            numberOfLines={1}
            style={[styles.titleText, { color: colors.textPrimary }]}
          >
            {title}
          </Text>
          {badge && (
            <View
              style={[
                styles.badge,
                { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#E0F2FE' },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[styles.badgeText, { color: colors.primary }]}
              >
                {badge}
              </Text>
            </View>
          )}
          {subtitle && (
            <Text
              numberOfLines={2}
              style={[styles.subtitleText, { color: colors.textSecondary }]}
            >
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.iconContainer}>
          {iconType === 'chevron' ? (
            <Animated.View style={chevronAnimatedStyle}>
              <Ionicons
                name="chevron-down"
                size={18}
                color={colors.textSecondary}
              />
            </Animated.View>
          ) : (
            <Ionicons
              name={isOpen ? 'close' : 'add'}
              size={20}
              color={colors.textPrimary}
            />
          )}
        </View>
      </ThemedTouchable>

      {isOpen && (
        <View style={styles.contentContainer}>
          {bulletPoints && bulletPoints.length > 0 && (
            <View style={styles.bulletList}>
              {bulletPoints.map((point, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, { color: colors.primary }]}>•</Text>
                  <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
                    {point}
                  </Text>
                </View>
              ))}
            </View>
          )}
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  titleText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -0.2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  subtitleText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Regular',
    width: '100%',
    marginTop: 2,
  },
  iconContainer: {
    paddingLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  bulletList: {
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletDot: {
    fontSize: 14,
    marginRight: 8,
    lineHeight: 18,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Medium',
    lineHeight: 18,
  },
});

export default AccordionSection;
