import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { AppCard } from './AppCard';
import { Text } from '../primitives/Text';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendText?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}


export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendText,
  icon,
  onPress,
  style,
}: MetricCardProps) {
  return (
    <AppCard
      onPress={onPress}
      variant="elevated"
      rounded="2xl"
      style={[styles.container, style]}
    >
      <View style={styles.headerRow}>
        <Text variant="label" color="textSecondary" weight="semiBold" numberOfLines={1}>
          {title}
        </Text>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
      </View>

      <Text variant="metric" color="textPrimary" weight="extraBold" style={styles.valueText}>
        {value}
      </Text>

      {(subtitle || trendText) && (
        <View style={styles.footerRow}>
          {trendText && (
            <View
              style={[
                styles.trendPill,
                {
                  backgroundColor:
                    trend === 'up'
                      ? colors.successSoft
                      : trend === 'down'
                      ? colors.dangerSoft
                      : 'rgba(255, 255, 255, 0.05)',
                },
              ]}
            >
              <Text
                variant="caption"
                weight="bold"
                style={{
                  color:
                    trend === 'up'
                      ? colors.success
                      : trend === 'down'
                      ? colors.danger
                      : colors.textSecondary,
                  fontSize: 10,
                }}
              >
                {trend === 'up' ? '↑ ' : trend === 'down' ? '↓ ' : ''}
                {trendText}
              </Text>
            </View>
          )}

          {subtitle && (
            <Text variant="caption" color="textMuted" numberOfLines={1} style={styles.subtitleText}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    marginVertical: 2,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  subtitleText: {
    flex: 1,
    fontSize: 11,
  },
});
