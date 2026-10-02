import React, { memo } from 'react';
import {
  View,
  Text,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
  ViewProps as RNViewProps,
  TextProps as RNTextProps,
} from 'react-native';
import { ThemedTouchable, HapticType } from './ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

export type CardVariant = 'elevated' | 'outlined' | 'flat';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardRadius = 'sm' | 'md' | 'lg';

export interface CardProps extends RNViewProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  borderRadius?: CardRadius;
  onPress?: (e: GestureResponderEvent) => void;
  haptic?: HapticType;
  style?: ViewStyle | ViewStyle[];
}

export const Card = memo(function Card({
  children,
  variant = 'elevated',
  padding = 'md',
  borderRadius = 'lg',
  onPress,
  haptic = 'selection',
  style,
  ...props
}: CardProps) {
  const { colors, isDark } = useAppTheme();

  const paddingMap: Record<CardPadding, number> = {
    none: 0,
    sm: 12,
    md: 16,
    lg: 20,
  };

  const radiusMap: Record<CardRadius, number> = {
    sm: 14,
    md: 18,
    lg: 24,
  };

  const resolvedRadius = radiusMap[borderRadius];
  const resolvedPadding = paddingMap[padding];

  const cardStyle: ViewStyle = {
    borderRadius: resolvedRadius,
    padding: resolvedPadding,
    backgroundColor: colors.surface,
    ...(variant === 'elevated' && {
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: isDark ? '#000000' : '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.35 : 0.04,
      shadowRadius: 8,
      elevation: isDark ? 1 : 2,
    }),
    ...(variant === 'outlined' && {
      borderWidth: 1,
      borderColor: colors.border,
    }),
    ...(variant === 'flat' && {
      backgroundColor: colors.surfaceAlt,
      borderWidth: 0,
    }),
  };

  if (onPress) {
    return (
      <ThemedTouchable
        onPress={onPress}
        haptic={haptic}
        style={[cardStyle, style]}
        {...props}
      >
        {children}
      </ThemedTouchable>
    );
  }

  return (
    <View style={[cardStyle, style]} {...props}>
      {children}
    </View>
  );
});

export interface CardHeaderProps extends RNViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardHeader = memo(function CardHeader({
  children,
  style,
  ...props
}: CardHeaderProps) {
  return (
    <View style={[{ marginBottom: 10 }, style]} {...props}>
      {children}
    </View>
  );
});

export interface CardTitleProps extends RNTextProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export const CardTitle = memo(function CardTitle({
  children,
  style,
  ...props
}: CardTitleProps) {
  const { colors } = useAppTheme();
  return (
    <Text
      style={[
        {
          fontSize: 18,
          fontFamily: 'PlusJakartaSans-Bold',
          color: colors.textPrimary,
          letterSpacing: -0.3,
          marginBottom: 4,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
});

export interface CardDescriptionProps extends RNTextProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export const CardDescription = memo(function CardDescription({
  children,
  style,
  ...props
}: CardDescriptionProps) {
  const { colors } = useAppTheme();
  return (
    <Text
      style={[
        {
          fontSize: 13.5,
          fontFamily: 'PlusJakartaSans-Regular',
          color: colors.textSecondary,
          lineHeight: 18,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
});

export interface CardContentProps extends RNViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardContent = memo(function CardContent({
  children,
  style,
  ...props
}: CardContentProps) {
  return (
    <View style={style} {...props}>
      {children}
    </View>
  );
});

export interface CardFooterProps extends RNViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardFooter = memo(function CardFooter({
  children,
  style,
  ...props
}: CardFooterProps) {
  return (
    <View
      style={[
        {
          marginTop: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
});

export default Card;
