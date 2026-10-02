import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useAppTheme';

export interface AttributeRangeBarProps {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  valuePercent: number; // 0 to 100
  indicatorWidthPercent?: number;
  leftLabel: string;
  rightLabel: string;
  style?: ViewStyle;
}

export function AttributeRangeBar({
  icon,
  label,
  valuePercent,
  indicatorWidthPercent = 28,
  leftLabel,
  rightLabel,
  style,
}: AttributeRangeBarProps) {
  const { colors, isDark } = useAppTheme();

  // Clamp the indicator position so it never extends beyond the track
  const maxLeft = 100 - indicatorWidthPercent;
  const clampedLeft = Math.max(0, Math.min(valuePercent, maxLeft));

  return (
    <View style={[styles.container, style]}>
      {/* Top Header Row: Icon + Uppercase Label */}
      <View style={styles.headerRow}>
        {icon && (
          <Ionicons
            name={icon}
            size={16}
            color={colors.textPrimary}
            style={{ marginRight: 6 }}
          />
        )}
        <Text style={[styles.labelText, { color: colors.textPrimary }]}>
          {label.toUpperCase()}
        </Text>
      </View>

      {/* Visual Range Track (Pour Moi Inspired) */}
      <View
        style={[
          styles.track,
          { backgroundColor: isDark ? '#27272A' : '#E5E7EB' },
        ]}
      >
        <View
          style={[
            styles.indicator,
            {
              left: `${clampedLeft}%`,
              width: `${indicatorWidthPercent}%`,
              backgroundColor: colors.primary,
            },
          ]}
        />
      </View>

      {/* Extremity Labels */}
      <View style={styles.labelsRow}>
        <Text style={[styles.extremityText, { color: colors.textSecondary }]}>
          {leftLabel}
        </Text>
        <Text style={[styles.extremityText, { color: colors.textSecondary }]}>
          {rightLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    letterSpacing: 0.8,
  },
  track: {
    height: 6,
    borderRadius: 3,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 6,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 3,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  extremityText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Medium',
  },
});

export default AttributeRangeBar;
