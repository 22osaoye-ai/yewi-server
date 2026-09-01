import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedTouchable } from './ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

export interface InputProps extends RNTextInputProps {
  label?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  isPassword?: boolean;
  clearable?: boolean;
  error?: string;
  hint?: string;
  variant?: 'pill' | 'card'; // Default 'pill' (exact search bar style)
  containerStyle?: ViewStyle;
  inputContainerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}

export function Input({
  label,
  leftIcon,
  rightIcon,
  onRightIconPress,
  isPassword = false,
  clearable = true,
  error,
  hint,
  variant = 'pill',
  containerStyle,
  inputContainerStyle,
  inputStyle,
  labelStyle,
  value,
  onChangeText,
  onFocus,
  onBlur,
  placeholderTextColor,
  ...props
}: InputProps) {
  const { colors, isDark } = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleClear = () => {
    onChangeText?.('');
  };

  const getBorderColor = () => {
    if (error) return colors.danger;
    if (isFocused) return colors.primary;
    return colors.border;
  };

  return (
    <View style={[{ marginBottom: 16 }, containerStyle]}>
      {/* Label */}
      {label && (
        <Text
          style={[
            {
              fontSize: 13.5,
              fontFamily: 'Satoshi-Bold',
              color: colors.textPrimary,
              marginBottom: 6,
              marginLeft: variant === 'pill' ? 4 : 0,
            },
            labelStyle,
          ]}
        >
          {label}
        </Text>
      )}

      {/* Input Container (Pill, Card, or Flat Seamless Textarea) */}
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: props.multiline ? 'flex-start' : 'center',
            backgroundColor: colors.surface,
            borderRadius: props.multiline ? 0 : variant === 'pill' ? 999 : 20,
            paddingHorizontal: 16,
            paddingVertical: props.multiline ? 14 : 13,
            borderWidth: props.multiline ? 0 : 1,
            borderColor: props.multiline ? 'transparent' : getBorderColor(),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: props.multiline ? 0 : isFocused ? (isDark ? 0.2 : 0.08) : (isDark ? 0.15 : 0.04),
            shadowRadius: props.multiline ? 0 : 6,
            elevation: props.multiline ? 0 : 2,
          },
          inputContainerStyle,
        ]}
      >
        {/* Left Icon */}
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={18}
            color={error ? colors.danger : isFocused ? colors.primary : colors.textSecondary}
            style={{ marginRight: 8, marginTop: props.multiline ? 2 : 0 }}
          />
        )}


        {/* Text Input */}
        <RNTextInput
          {...props}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !showPassword}
          placeholderTextColor={placeholderTextColor || colors.textMuted}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          style={[
            {
              flex: 1,
              fontSize: 15,
              fontFamily: 'Satoshi-Bold',
              color: colors.textPrimary,
              padding: 0,
            },
            inputStyle,
          ]}
        />

        {/* Clear Button */}
        {clearable && !!value && (
          <ThemedTouchable
            onPress={handleClear}
            haptic="light"
            style={{ padding: 2, marginRight: isPassword || rightIcon ? 6 : 0 }}
          >
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </ThemedTouchable>
        )}

        {/* Password Toggle Button */}
        {isPassword && (
          <ThemedTouchable
            onPress={() => setShowPassword(!showPassword)}
            haptic="light"
            style={{ padding: 2 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </ThemedTouchable>
        )}

        {/* Custom Right Icon */}
        {!isPassword && rightIcon && (
          <ThemedTouchable
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            haptic="light"
            style={{ padding: 2 }}
          >
            <Ionicons name={rightIcon} size={20} color={colors.textSecondary} />
          </ThemedTouchable>
        )}
      </View>

      {/* Error Message */}
      {error ? (
        <Text
          style={{
            fontSize: 12,
            fontFamily: 'Satoshi-Medium',
            color: colors.danger,
            marginTop: 4,
            marginLeft: 8,
          }}
        >
          {error}
        </Text>
      ) : hint ? (
        <Text
          style={{
            fontSize: 12,
            fontFamily: 'Satoshi-Regular',
            color: colors.textSecondary,
            marginTop: 4,
            marginLeft: 8,
          }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export default Input;
