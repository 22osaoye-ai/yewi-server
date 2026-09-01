import React from 'react';
import { Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'dark' | 'outline';
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function AuthButton({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  variant = 'primary',
  iconName,
  iconColor,
  style,
  textStyle,
}: AuthButtonProps) {
  const { colors, isDark } = useAppTheme();

  const getBackgroundColor = () => {
    if (disabled) return colors.border;
    switch (variant) {
      case 'dark':
        return isDark ? colors.surfaceAlt : '#18181B';
      case 'outline':
        return colors.surface;
      case 'primary':
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    return variant === 'outline' ? colors.textPrimary : '#FFFFFF';
  };

  return (
    <ThemedTouchable
      onPress={onPress}
      disabled={disabled || isLoading}
      haptic="medium"
      style={[
        {
          backgroundColor: getBackgroundColor(),
          borderRadius: 999,
          paddingVertical: 16,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: colors.border,
          shadowColor: variant === 'primary' ? colors.primary : '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: variant === 'outline' ? 0.05 : isDark ? 0.3 : 0.2,
          shadowRadius: 8,
          elevation: variant === 'outline' ? 2 : 4,
        },
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {iconName && (
            <Ionicons
              name={iconName}
              size={20}
              color={iconColor || getTextColor()}
              style={{ marginRight: 10 }}
            />
          )}
          <Text
            style={[
              {
                color: getTextColor(),
                fontFamily: 'Satoshi-Bold',
                fontSize: 16,
                letterSpacing: -0.2,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </ThemedTouchable>
  );
}

export default AuthButton;
