import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedTouchable } from './ThemedTouchable';
import { Badge, BadgeVariant } from './Badge';
import { useAppTheme } from '@/hooks/useAppTheme';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onActionPress?: () => void;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  badge?: string;
  badgeVariant?: BadgeVariant;
  style?: ViewStyle;
}

export function SectionHeader({
  title,
  subtitle,
  actionText,
  onActionPress,
  actionIcon = 'arrow-forward',
  badge,
  badgeVariant = 'primary',
  style,
}: SectionHeaderProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        },
        style,
      ]}
    >
      <View style={{ flex: 1, marginRight: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 20,
              fontFamily: 'PlusJakartaSans-ExtraBold',
              color: colors.textPrimary,
              letterSpacing: -0.4,
              flexShrink: 1,
            }}
          >
            {title}
          </Text>
          {badge && (
            <Badge
              label={badge}
              variant={badgeVariant}
              size="sm"
            />
          )}
        </View>

        {subtitle && (
          <Text
            numberOfLines={1}
            style={{
              fontSize: 12,
              fontFamily: 'PlusJakartaSans-Medium',
              color: colors.textSecondary,
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {actionText && onActionPress && (
        <ThemedTouchable
          onPress={onActionPress}
          haptic="light"
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surfaceAlt,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            borderWidth: 0,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'PlusJakartaSans-Bold',
              color: colors.textPrimary,
              marginRight: 4,
            }}
          >
            {actionText}
          </Text>
          <Ionicons name={actionIcon} size={13} color={colors.textPrimary} />
        </ThemedTouchable>
      )}
    </View>
  );
}

export default SectionHeader;
