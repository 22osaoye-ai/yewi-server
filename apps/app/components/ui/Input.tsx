import React, { useState, forwardRef } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  ViewStyle,
  TextStyle,
  StyleProp,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedTouchable } from './ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

export interface InputProps extends Omit<RNTextInputProps, 'style'> {
  style?: StyleProp<TextStyle>;
  label?: string;
  error?: string;
  hint?: string;
  status?: 'idle' | 'checking' | 'valid' | 'invalid';
  validMessage?: string;
  icon?: React.ComponentType<any>;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  rightComponent?: React.ReactNode | (() => React.ReactNode);
  isPassword?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  type?: 'input' | 'textarea';
  rows?: number;
  variant?: 'filled' | 'outline' | 'pill' | 'card';
  containerStyle?: ViewStyle;
  inputContainerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
}

export const Input = forwardRef<RNTextInput, InputProps>(
  (
    {
      style,
      label,
      error,
      hint,
      status = 'idle',
      validMessage,
      icon: LucideIcon,
      leftIcon,
      rightIcon,
      onRightIconPress,
      rightComponent,
      isPassword = false,
      clearable = false,
      disabled = false,
      type = 'input',
      rows = 4,
      variant = 'pill',
      containerStyle,
      inputContainerStyle,
      inputStyle,
      labelStyle,
      errorStyle,
      value,
      onChangeText,
      onFocus,
      onBlur,
      placeholderTextColor,
      ...props
    },
    ref
  ) => {
    const { colors, isDark } = useAppTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isTextarea = type === 'textarea' || Boolean(props.multiline);

    const handleClear = () => {
      onChangeText?.('');
    };

    const getBorderColor = () => {
      if (error || status === 'invalid') return colors.danger;
      if (status === 'valid') return '#10B981';
      if (isFocused) return colors.primary;
      if (variant === 'filled' && !isDark) return '#E4E7EC';
      return isDark ? '#2E3138' : '#E4E7EC';
    };

    const getBackgroundColor = () => {
      if (disabled) return isDark ? '#1C1D22' : '#F4F4F6';
      if (variant === 'outline') return isDark ? colors.surface : '#FFFFFF';
      if (variant === 'pill') return isDark ? colors.surface : colors.surfaceAlt;
      return isDark ? '#202227' : '#F1F3F5';
    };

    const getBorderRadius = () => {
      if (isTextarea) return 16;
      if (variant === 'pill') return 999;
      return 14;
    };

    const minHeight = isTextarea ? rows * 20 + 32 : 48;

    return (
      <View style={[{ marginBottom: 16 }, containerStyle]}>
        {/* Label */}
        {label && (
          <Text
            numberOfLines={1}
            style={[
              {
                fontSize: 13.5,
                fontFamily: 'PlusJakartaSans-Bold',
                color: error ? colors.danger : colors.textPrimary,
                marginBottom: 6,
                marginLeft: variant === 'pill' ? 6 : 2,
              },
              labelStyle,
            ]}
          >
            {label}
          </Text>
        )}

        {/* Input Container */}
        <View
          style={[
            {
              flexDirection: 'row',
              alignItems: isTextarea ? 'flex-start' : 'center',
              backgroundColor: getBackgroundColor(),
              borderRadius: getBorderRadius(),
              paddingHorizontal: 16,
              paddingVertical: isTextarea ? 12 : 0,
              minHeight,
              borderWidth: 1.5,
              borderColor: getBorderColor(),
              opacity: disabled ? 0.6 : 1,
              shadowColor: isFocused ? colors.primary : '#000',
              shadowOffset: { width: 0, height: isFocused ? 2 : 1 },
              shadowOpacity: isFocused ? 0.12 : isDark ? 0.12 : 0.03,
              shadowRadius: isFocused ? 5 : 3,
              elevation: isFocused ? 2 : 1,
            },
            inputContainerStyle,
          ]}
        >
          {/* Lucide Icon Component */}
          {LucideIcon && (
            <View style={{ marginRight: 8, marginTop: isTextarea ? 2 : 0 }}>
              <LucideIcon
                size={18}
                color={error ? colors.danger : isFocused ? colors.primary : colors.textSecondary}
              />
            </View>
          )}

          {/* Ionicons Left */}
          {!LucideIcon && leftIcon && (
            <Ionicons
              name={leftIcon}
              size={18}
              color={error ? colors.danger : isFocused ? colors.primary : colors.textSecondary}
              style={{ marginRight: 8, marginTop: isTextarea ? 2 : 0 }}
            />
          )}

          {/* Text Input */}
          <RNTextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            editable={!disabled}
            multiline={isTextarea}
            textAlignVertical={isTextarea ? 'top' : 'center'}
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
                fontSize: 14.5,
                fontFamily: 'PlusJakartaSans-Medium',
                color: colors.textPrimary,
                paddingVertical: isTextarea ? 0 : 10,
                minHeight: isTextarea ? rows * 20 : undefined,
              },
              inputStyle,
              style,
            ]}
            {...props}
          />

          {/* Clear Button */}
          {clearable && !!value && !disabled && (
            <ThemedTouchable
              onPress={handleClear}
              haptic="light"
              style={{ padding: 3, marginRight: isPassword || rightIcon ? 4 : 0 }}
            >
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </ThemedTouchable>
          )}

          {/* Password Toggle Button */}
          {isPassword && !disabled && (
            <ThemedTouchable
              onPress={() => setShowPassword(!showPassword)}
              haptic="light"
              style={{ padding: 3 }}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={19}
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
              style={{ padding: 3 }}
            >
              <Ionicons name={rightIcon} size={19} color={colors.textSecondary} />
            </ThemedTouchable>
          )}

          {/* Status Indicator Icon */}
          {!rightComponent && status === 'checking' && (
            <View style={{ marginLeft: 6 }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
          {!rightComponent && status === 'valid' && (
            <View style={{ marginLeft: 6 }}>
              <Ionicons name="checkmark-circle" size={19} color="#10B981" />
            </View>
          )}
          {!rightComponent && status === 'invalid' && !error && (
            <View style={{ marginLeft: 6 }}>
              <Ionicons name="alert-circle" size={19} color={colors.danger} />
            </View>
          )}

          {/* Right Component */}
          {rightComponent && (
            <View style={{ marginLeft: 8 }}>
              {typeof rightComponent === 'function' ? rightComponent() : rightComponent}
            </View>
          )}
        </View>

        {/* Error, Valid Message, Checking or Hint Message */}
        {error ? (
          <Text
            numberOfLines={1}
            style={[
              {
                fontSize: 12,
                fontFamily: 'PlusJakartaSans-Medium',
                color: colors.danger,
                marginTop: 4,
                marginLeft: variant === 'pill' ? 6 : 2,
              },
              errorStyle,
            ]}
          >
            {error}
          </Text>
        ) : status === 'valid' && validMessage ? (
          <Text
            numberOfLines={1}
            style={{
              fontSize: 12,
              fontFamily: 'PlusJakartaSans-Medium',
              color: '#10B981',
              marginTop: 4,
              marginLeft: variant === 'pill' ? 6 : 2,
            }}
          >
            {validMessage}
          </Text>
        ) : status === 'checking' ? (
          <Text
            numberOfLines={1}
            style={{
              fontSize: 12,
              fontFamily: 'PlusJakartaSans-Regular',
              color: colors.primary,
              marginTop: 4,
              marginLeft: variant === 'pill' ? 6 : 2,
            }}
          >
            Comprobando...
          </Text>
        ) : hint ? (
          <Text
            numberOfLines={1}
            style={{
              fontSize: 12,
              fontFamily: 'PlusJakartaSans-Regular',
              color: colors.textSecondary,
              marginTop: 4,
              marginLeft: variant === 'pill' ? 6 : 2,
            }}
          >
            {hint}
          </Text>
        ) : null}
      </View>
    );
  }
);

Input.displayName = 'Input';

export default Input;
