import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Text } from '../primitives/Text';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';

export interface PriceBadgeProps {
  amount: number | string;
  currency?: string;
  period?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendPercent?: number;
  variant?: 'solid' | 'subtle' | 'accent';
  style?: StyleProp<ViewStyle>;
}


export function PriceBadge({
  amount,
  currency = '€',
  period,
  trend,
  trendPercent,
  variant = 'subtle',
  style,
}: PriceBadgeProps) {
  const getBadgeColors = () => {
    switch (variant) {
      case 'accent':
        return {
          bg: colors.accentSoft,
          border: colors.accent,
          text: colors.accent,
        };
      case 'solid':
        return {
          bg: colors.surfaceElevated,
          border: colors.borderMedium,
          text: colors.textPrimary,
        };
      case 'subtle':
      default:
        return {
          bg: 'rgba(255, 255, 255, 0.05)',
          border: colors.borderSubtle,
          text: colors.textPrimary,
        };
    }
  };

  const badgeTheme = getBadgeColors();
  const formattedAmount =
    typeof amount === 'number'
      ? amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : amount;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: badgeTheme.bg,
          borderColor: badgeTheme.border,
        },
        style,
      ]}
    >
      <Text
        variant="label"
        weight="extraBold"
        style={{ color: badgeTheme.text, fontSize: 13 }}
      >
        {formattedAmount} {currency}
        {period ? `/${period}` : ''}
      </Text>

      {trend && trendPercent !== undefined && (
        <View style={styles.trendRow}>
          <Text
            variant="caption"
            weight="bold"
            style={{
              color: trend === 'down' ? colors.success : trend === 'up' ? colors.danger : colors.textMuted,
              fontSize: 10.5,
              marginLeft: 4,
            }}
          >
            {trend === 'down' ? '↓' : trend === 'up' ? '↑' : '•'} {Math.abs(trendPercent)}%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
