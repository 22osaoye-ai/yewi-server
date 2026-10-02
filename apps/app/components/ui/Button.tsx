import React from 'react';
import {
  Text,
  View,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Pressable,
  GestureResponderEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useAppTheme';
import { HapticType } from './ThemedTouchable';

export type ButtonVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'destructive'
  | 'danger'
  | 'success'
  | 'outline'
  | 'pill-outline'
  | 'ghost'
  | 'link';

export type ButtonSize = 'default' | 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  label?: string;
  onPress?: (e?: GestureResponderEvent | any) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ComponentType<any>;
  iconLeft?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  haptic?: HapticType | boolean;
  fullWidth?: boolean;
  animation?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
}

export const Button = React.forwardRef<View, ButtonProps>(
  (
    {
      title,
      children,
      label,
      onPress,
      variant = 'default',
      size = 'default',
      icon: IconComponent,
      iconLeft,
      iconRight,
      loading = false,
      disabled = false,
      haptic = true,
      fullWidth = false,
      animation = true,
      style,
      textStyle,
      ...props
    },
    ref
  ) => {
    const { colors, isDark } = useAppTheme();
    const scale = useSharedValue(1);

    // Normalizing variant aliases (e.g. 'primary' -> 'default', 'danger' -> 'destructive')
    const normalizedVariant: ButtonVariant =
      variant === 'primary' ? 'default' : variant === 'danger' ? 'destructive' : variant;

    // Size mappings (standard BNA UI + Yewi touch targets)
    const sizeConfig: Record<
      'sm' | 'md' | 'lg' | 'icon',
      { height: number; paddingHorizontal: number; fontSize: number; iconSize: number }
    > = {
      sm: { height: 36, paddingHorizontal: 14, fontSize: 13, iconSize: 15 },
      md: { height: 44, paddingHorizontal: 18, fontSize: 14.5, iconSize: 18 },
      lg: { height: 52, paddingHorizontal: 24, fontSize: 16, iconSize: 20 },
      icon: { height: 44, paddingHorizontal: 0, fontSize: 14, iconSize: 20 },
    };

    const resolvedSizeKey: 'sm' | 'md' | 'lg' | 'icon' =
      size === 'default' || size === 'md' ? 'md' : size;
    const currentSize = sizeConfig[resolvedSizeKey];

    // Semantic variant styles with Sky Blue primary
    const variantStyles: Record<
      string,
      { bg: string; text: string; border: string; spinner: string }
    > = {
      default: {
        bg: colors.primary,
        text: isDark ? '#09090B' : '#FFFFFF',
        border: 'transparent',
        spinner: isDark ? '#09090B' : '#FFFFFF',
      },
      secondary: {
        bg: isDark ? '#24242A' : '#F1F5F9',
        text: colors.textPrimary,
        border: isDark ? '#2E2E36' : '#E2E8F0',
        spinner: colors.textPrimary,
      },
      destructive: {
        bg: colors.danger,
        text: '#FFFFFF',
        border: 'transparent',
        spinner: '#FFFFFF',
      },
      success: {
        bg: colors.success,
        text: '#FFFFFF',
        border: 'transparent',
        spinner: '#FFFFFF',
      },
      outline: {
        bg: 'transparent',
        text: colors.primary,
        border: colors.primary,
        spinner: colors.primary,
      },
      'pill-outline': {
        bg: isDark ? '#181A20' : '#FFFFFF',
        text: colors.textPrimary,
        border: isDark ? '#2E2E36' : '#E5E7EB',
        spinner: colors.textPrimary,
      },
      ghost: {
        bg: 'transparent',
        text: colors.textPrimary,
        border: 'transparent',
        spinner: colors.textPrimary,
      },
      link: {
        bg: 'transparent',
        text: colors.primary,
        border: 'transparent',
        spinner: colors.primary,
      },
    };

    const currentVariant = variantStyles[normalizedVariant] || variantStyles.default;
    const isInteractive = !disabled && !loading;

    // Trigger haptic feedback
    const triggerHaptic = () => {
      if (!haptic || haptic === 'none') return;
      try {
        if (haptic === 'heavy' || normalizedVariant === 'destructive') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else if (haptic === 'medium' || normalizedVariant === 'default') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else if (haptic === 'selection') {
          Haptics.selectionAsync();
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch {}
    };

    const handlePressIn = (e: GestureResponderEvent) => {
      if (!isInteractive) return;
      triggerHaptic();
      if (animation) {
        scale.value = withSpring(0.96, {
          damping: 15,
          stiffness: 400,
          mass: 0.5,
        });
      }
    };

    const handlePressOut = (e: GestureResponderEvent) => {
      if (!isInteractive) return;
      if (animation) {
        scale.value = withSpring(1, {
          damping: 18,
          stiffness: 350,
          mass: 0.6,
        });
      }
    };

    const handlePress = (e: GestureResponderEvent) => {
      if (isInteractive && onPress) {
        onPress(e);
      }
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const isIconOnly = resolvedSizeKey === 'icon' || (!title && !children && (Boolean(IconComponent) || Boolean(iconLeft)));
    const contentText = title || (typeof children === 'string' ? children : null);

    return (
      <Pressable
        ref={ref}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!isInteractive}
        style={[
          {
            alignSelf: fullWidth ? 'stretch' : 'flex-start',
          },
          Array.isArray(style) ? style : [style],
        ]}
        accessibilityRole="button"
        accessibilityLabel={label || title || (typeof children === 'string' ? children : undefined)}
        accessibilityState={{ busy: loading, disabled: !isInteractive }}
        {...props}
      >
        <Animated.View
          style={[
            {
              height: normalizedVariant === 'link' ? 'auto' : currentSize.height,
              paddingHorizontal: isIconOnly
                ? 0
                : normalizedVariant === 'link'
                ? 0
                : currentSize.paddingHorizontal,
              width: isIconOnly ? currentSize.height : undefined,
              borderRadius: normalizedVariant === 'link' ? 0 : 999,
              backgroundColor: currentVariant.bg,
              borderWidth: currentVariant.border !== 'transparent' ? 1 : 0,
              borderColor: currentVariant.border,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: disabled ? 0.45 : 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: normalizedVariant === 'default' && !isDark ? 0.12 : 0,
              shadowRadius: 3,
              elevation: normalizedVariant === 'default' ? 2 : 0,
            },
            animatedStyle,
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={currentVariant.spinner} />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexShrink: 1 }}>
              {/* Lucide or Custom Icon */}
              {IconComponent && (
                <IconComponent
                  size={currentSize.iconSize}
                  color={currentVariant.text}
                  style={contentText ? { marginRight: 6 } : undefined}
                />
              )}

              {/* Ionicons Left */}
              {iconLeft && (
                <Ionicons
                  name={iconLeft}
                  size={currentSize.iconSize}
                  color={currentVariant.text}
                  style={contentText ? { marginRight: 6 } : undefined}
                />
              )}

              {/* Text content or Children */}
              {contentText ? (
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[
                    {
                      fontSize: currentSize.fontSize,
                      fontFamily: 'PlusJakartaSans-Bold',
                      color: currentVariant.text,
                      letterSpacing: -0.2,
                      textDecorationLine: normalizedVariant === 'link' ? 'underline' : 'none',
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

              {/* Ionicons Right */}
              {iconRight && (
                <Ionicons
                  name={iconRight}
                  size={currentSize.iconSize}
                  color={currentVariant.text}
                  style={contentText ? { marginLeft: 6 } : undefined}
                />
              )}
            </View>
          )}
        </Animated.View>
      </Pressable>
    );
  }
);

Button.displayName = 'Button';

export default Button;
