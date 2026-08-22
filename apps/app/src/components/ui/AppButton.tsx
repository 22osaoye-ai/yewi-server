import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Shadows } from '../Theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  containerStyle,
  textStyle,
  disabled,
  ...rest
}) => {
  const { colors, isDark } = useTheme();

  const getVariantStyles = (): { button: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'secondary':
        return {
          button: {
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          },
          text: {
            color: colors.text,
          },
        };
      case 'outline':
        return {
          button: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: colors.primary,
          },
          text: {
            color: colors.primary,
          },
        };
      case 'ghost':
        return {
          button: {
            backgroundColor: 'transparent',
          },
          text: {
            color: colors.text,
          },
        };
      case 'danger':
        return {
          button: {
            backgroundColor: colors.danger,
          },
          text: {
            color: '#FFFFFF',
          },
        };
      case 'primary':
      default:
        return {
          button: {
            backgroundColor: isDark ? '#FFFFFF' : '#111813',
          },
          text: {
            color: isDark ? '#111813' : '#FFFFFF',
          },
        };
    }
  };

  const getSizeStyles = (): { button: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          button: { height: 40, paddingHorizontal: 16 },
          text: { fontSize: 12 },
        };
      case 'lg':
        return {
          button: { height: 58, paddingHorizontal: 28 },
          text: { fontSize: 16 },
        };
      case 'md':
      default:
        return {
          button: { height: 52, paddingHorizontal: 22 },
          text: { fontSize: 14 },
        };
    }
  };

  const vStyles = getVariantStyles();
  const sStyles = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        styles.baseButton,
        vStyles.button,
        sStyles.button,
        disabled || isLoading ? styles.disabled : null,
        variant === 'primary' ? Shadows.floating : Shadows.subtle,
        containerStyle,
      ]}
      disabled={disabled || isLoading}
      activeOpacity={0.88}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={vStyles.text.color as string}
        />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
          <Text style={[styles.baseText, vStyles.text, sStyles.text, textStyle]}>
            {title}
          </Text>
          {rightIcon ? <View style={styles.rightIcon}>{rightIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: 9999, // 100% Capsule Rounded Everywhere
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  baseText: {
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  leftIcon: {
    marginRight: 2,
  },
  rightIcon: {
    marginLeft: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});
