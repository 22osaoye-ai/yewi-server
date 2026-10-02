import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useAppTheme';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'destructive'
  | 'danger'
  | 'success'
  | 'warning'
  | 'info'
  | 'neutral'
  | 'outline'
  | 'pro';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  label?: string;
  children?: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: keyof typeof Ionicons.glyphMap;
  dot?: boolean;
  pill?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({
  label,
  children,
  variant = 'default',
  size = 'md',
  icon,
  dot = false,
  pill = true,
  style,
  textStyle,
}: BadgeProps) {
  const { colors, isDark } = useAppTheme();

  // Normalize variant aliases
  const normalizedVariant =
    variant === 'primary' ? 'default' : variant === 'danger' ? 'destructive' : variant;

  // Color mappings adhering to WCAG 4.5:1 contrast with Sky Blue primary
  const colorMap: Record<
    string,
    { bg: string; text: string; border: string; dot: string }
  > = {
    default: {
      bg: isDark ? colors.primaryLight : '#E0F2FE',
      text: isDark ? '#38BDF8' : '#0369A1',
      border: isDark ? '#075985' : '#BAE6FD',
      dot: isDark ? '#38BDF8' : '#0284C7',
    },
    secondary: {
      bg: isDark ? '#222227' : '#F1F5F9',
      text: isDark ? '#D4D4D8' : '#475569',
      border: isDark ? '#2E2E36' : '#E2E8F0',
      dot: '#71717A',
    },
    outline: {
      bg: 'transparent',
      text: colors.primary,
      border: colors.primary,
      dot: colors.primary,
    },
    pro: {
      bg: isDark ? '#2F210B' : '#FEF3C7',
      text: isDark ? '#FBBF24' : '#B45309',
      border: isDark ? '#78350F' : '#FDE68A',
      dot: '#F59E0B',
    },
    success: {
      bg: isDark ? colors.successBg : '#DCFCE7',
      text: isDark ? '#4ADE80' : '#15803D',
      border: isDark ? '#14532D' : '#BBF7D0',
      dot: '#16A34A',
    },
    warning: {
      bg: isDark ? colors.warningBg : '#FEF3C7',
      text: isDark ? '#FBBF24' : '#B45309',
      border: isDark ? '#78350F' : '#FDE68A',
      dot: '#F59E0B',
    },
    destructive: {
      bg: isDark ? colors.dangerBg : '#FEE2E2',
      text: isDark ? '#F87171' : '#B91C1C',
      border: isDark ? '#7F1D1D' : '#FECACA',
      dot: '#EF4444',
    },
    info: {
      bg: isDark ? colors.infoBg : '#EFF6FF',
      text: isDark ? '#38BDF8' : '#0284C7',
      border: isDark ? '#0369A1' : '#BFDBFE',
      dot: '#0284C7',
    },
    neutral: {
      bg: isDark ? '#222227' : '#F1F5F9',
      text: isDark ? '#D4D4D8' : '#475569',
      border: isDark ? '#2E2E36' : '#E2E8F0',
      dot: '#71717A',
    },
  };

  const currentColors = colorMap[normalizedVariant] || colorMap.default;

  // Size mappings
  const sizeConfig: Record<
    BadgeSize,
    {
      height: number;
      paddingHorizontal: number;
      fontSize: number;
      iconSize: number;
      dotSize: number;
    }
  > = {
    sm: {
      height: 20,
      paddingHorizontal: 7,
      fontSize: 10,
      iconSize: 10,
      dotSize: 5,
    },
    md: {
      height: 25,
      paddingHorizontal: 10,
      fontSize: 12,
      iconSize: 12,
      dotSize: 6,
    },
    lg: {
      height: 30,
      paddingHorizontal: 13,
      fontSize: 13.5,
      iconSize: 14,
      dotSize: 7,
    },
  };

  const currentSize = sizeConfig[size];
  const contentText = label || (typeof children === 'string' ? children : null);

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          height: currentSize.height,
          paddingHorizontal: currentSize.paddingHorizontal,
          borderRadius: pill ? 999 : 8,
          backgroundColor: currentColors.bg,
          borderWidth: 1,
          borderColor: currentColors.border,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      {dot && (
        <View
          style={{
            width: currentSize.dotSize,
            height: currentSize.dotSize,
            borderRadius: currentSize.dotSize / 2,
            backgroundColor: currentColors.dot,
            marginRight: 5,
          }}
        />
      )}

      {icon && (
        <Ionicons
          name={icon}
          size={currentSize.iconSize}
          color={currentColors.text}
          style={{ marginRight: 4 }}
        />
      )}

      {contentText ? (
        <Text
          numberOfLines={1}
          style={[
            {
              fontSize: currentSize.fontSize,
              fontFamily: 'PlusJakartaSans-Bold',
              color: currentColors.text,
              letterSpacing: -0.2,
              flexShrink: 1,
            },
            textStyle,
          ]}
        >
          {contentText}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

export default Badge;
