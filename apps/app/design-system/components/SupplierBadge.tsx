import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Text } from '../primitives/Text';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';

export interface SupplierBadgeProps {
  name: string;
  isVerified?: boolean;
  deliveryTime?: string;
  style?: StyleProp<ViewStyle>;
}

export function SupplierBadge({
  name,
  isVerified = true,
  deliveryTime,
  style,
}: SupplierBadgeProps) {
  return (
    <View style={[styles.badge, style]}>
      <Text variant="caption" weight="bold" color="textPrimary" numberOfLines={1}>
        {name}
      </Text>
      {isVerified && (
        <View style={styles.verifiedDot}>
          <Text variant="caption" style={styles.checkText}>✓</Text>
        </View>
      )}
      {deliveryTime && (
        <Text variant="caption" color="textMuted" style={{ fontSize: 10 }}>
          · {deliveryTime}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignSelf: 'flex-start',
  },
  verifiedDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: colors.success,
    fontSize: 9,
    fontFamily: 'PlusJakartaSans-Bold',
    lineHeight: 12,
  },
});
