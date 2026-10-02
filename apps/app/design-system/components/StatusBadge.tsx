import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { AppText } from '../primitives/Text';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent';

export interface StatusBadgeProps {
  label: string; // Strictly 1 or 2 words (Rule 5 Zero-Overflow)
  variant?: StatusVariant;
  showDot?: boolean;
  style?: StyleProp<ViewStyle>;
}

const variantStyles: Record<
  StatusVariant,
  { bg: string; border: string; text: string; dot: string }
> = {
  success: {
    bg: 'rgba(57, 217, 138, 0.12)',
    border: 'rgba(57, 217, 138, 0.25)',
    text: colors.success,
    dot: colors.success,
  },
  warning: {
    bg: 'rgba(229, 185, 78, 0.12)',
    border: 'rgba(229, 185, 78, 0.25)',
    text: colors.warning,
    dot: colors.warning,
  },
  danger: {
    bg: 'rgba(255, 107, 107, 0.12)',
    border: 'rgba(255, 107, 107, 0.25)',
    text: colors.danger,
    dot: colors.danger,
  },
  info: {
    bg: 'rgba(79, 163, 255, 0.12)',
    border: 'rgba(79, 163, 255, 0.25)',
    text: colors.info,
    dot: colors.info,
  },
  accent: {
    bg: colors.accentSoft,
    border: 'rgba(36, 213, 196, 0.3)',
    text: colors.accent,
    dot: colors.accent,
  },
  neutral: {
    bg: 'rgba(255, 255, 255, 0.06)',
    border: colors.borderSubtle,
    text: colors.textSecondary,
    dot: colors.textMuted,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'neutral',
  showDot = true,
  style,
}) => {
  const config = variantStyles[variant];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg, borderColor: config.border },
        style,
      ]}
    >
      {showDot && <View style={[styles.dot, { backgroundColor: config.dot }]} />}
      <AppText
        variant="caption"
        weight="semibold"
        numberOfLines={1}
        style={{ color: config.text }}
      >
        {label}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
});
