import React from 'react';
import {
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from '../primitives/Text';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { motion } from '../tokens/motion';

export interface AppButtonProps {
  label: string; // Máximo 1-2 palabras (Zero-Overflow)
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}


const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
}: AppButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    scale.value = withSpring(0.97, motion.spring.snappy);
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    scale.value = withSpring(1, motion.spring.snappy);
  };

  const getVariantStyles = (): { btn: ViewStyle; text: TextStyle; spinner: string } => {
    switch (variant) {
      case 'primary':
        return {
          btn: {
            backgroundColor: colors.accent,
            borderColor: colors.accent,
          },
          text: {
            color: colors.textInverse,
            fontFamily: 'PlusJakartaSans-Bold',
          },
          spinner: colors.textInverse,
        };
      case 'secondary':
        return {
          btn: {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.borderMedium,
          },
          text: {
            color: colors.textPrimary,
            fontFamily: 'PlusJakartaSans-Bold',
          },
          spinner: colors.textPrimary,
        };
      case 'outline':
        return {
          btn: {
            backgroundColor: 'transparent',
            borderColor: colors.borderMedium,
          },
          text: {
            color: colors.textPrimary,
            fontFamily: 'PlusJakartaSans-SemiBold',
          },
          spinner: colors.textPrimary,
        };
      case 'danger':
        return {
          btn: {
            backgroundColor: colors.danger,
            borderColor: colors.danger,
          },
          text: {
            color: '#FFFFFF',
            fontFamily: 'PlusJakartaSans-Bold',
          },
          spinner: '#FFFFFF',
        };
      case 'ghost':
      default:
        return {
          btn: {
            backgroundColor: 'transparent',
            borderColor: 'transparent',
          },
          text: {
            color: colors.accent,
            fontFamily: 'PlusJakartaSans-SemiBold',
          },
          spinner: colors.accent,
        };
    }
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return { height: 36, paddingHorizontal: 12 };
      case 'lg':
        return { height: 50, paddingHorizontal: 22 };
      case 'md':
      default:
        return { height: 44, paddingHorizontal: 16 };
    }
  };

  const theme = getVariantStyles();
  const sizeStyle = getSizeStyles();

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.base,
        sizeStyle,
        theme.btn,
        (disabled || loading) && styles.disabled,
        animatedStyle,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.spinner} />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text
            variant="body"
            style={[
              styles.labelText,
              theme.text,
              size === 'sm' && { fontSize: 12 },
              size === 'lg' && { fontSize: 15 },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    gap: 8,
  },
  labelText: {
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
