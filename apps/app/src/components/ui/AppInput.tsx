import { Eye, EyeOff } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Shadows } from '../Theme';

export interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputWrapperStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  multiline?: boolean;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  isPassword = false,
  containerStyle,
  inputWrapperStyle,
  inputStyle,
  multiline = false,
  ...rest
}) => {
  const { colors, isDark } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      ) : null}

      <View
        style={[
          styles.inputWrapper,
          multiline ? styles.multilineWrapper : styles.singlelineWrapper,
          {
            backgroundColor: colors.inputBg,
            borderColor: error
              ? colors.danger
              : isFocused
                ? colors.primary
                : colors.border,
          },
          Shadows.subtle,
          inputWrapperStyle,
        ]}
      >
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}

        <TextInput
          style={[
            styles.input,
            multiline ? styles.multilineInput : styles.singlelineInput,
            { color: colors.text },
            inputStyle,
          ]}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline={multiline}
          {...rest}
        />

        {isPassword ? (
          <TouchableOpacity
            style={styles.rightIconBtn}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showPassword ? (
              <EyeOff size={18} color={colors.textSecondary} />
            ) : (
              <Eye size={18} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIcon}>{rightIcon}</View>
        ) : null}
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: colors.danger }]}>
          {error}
        </Text>
      ) : helperText ? (
        <Text style={[styles.helperText, { color: colors.textSecondary }]}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
  singlelineWrapper: {
    height: 52,
    borderRadius: 9999, // 100% capsule rounded everywhere
  },
  multilineWrapper: {
    minHeight: 90,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  singlelineInput: {
    height: '100%',
  },
  multilineInput: {
    textAlignVertical: 'top',
    height: '100%',
  },
  leftIcon: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIcon: {
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIconBtn: {
    marginLeft: 10,
    padding: 4,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
  },
});
