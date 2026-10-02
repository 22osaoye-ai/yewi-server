import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/hooks/useAppTheme';

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Checkbox({
  checked,
  onCheckedChange,
  label,
  disabled = false,
  style,
}: CheckboxProps) {
  const { colors, isDark } = useAppTheme();
  const scale = useSharedValue(checked ? 1 : 0);

  React.useEffect(() => {
    scale.value = withSpring(checked ? 1 : 0, {
      damping: 18,
      stiffness: 280,
    });
  }, [checked]);

  const animatedCheckStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  const handlePress = () => {
    if (disabled) return;
    Haptics.selectionAsync().catch(() => {});
    onCheckedChange(!checked);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      hitSlop={8}
      style={[styles.container, style]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
    >
      <View
        style={[
          styles.box,
          {
            backgroundColor: checked
              ? colors.primary
              : isDark
              ? '#1E1E24'
              : '#F1F5F9',
            borderColor: checked
              ? colors.primary
              : isDark
              ? '#2E2E38'
              : '#CBD5E1',
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Animated.View style={animatedCheckStyle}>
          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
        </Animated.View>
      </View>

      {label && (
        <Text
          numberOfLines={1}
          style={[
            styles.labelText,
            {
              color: disabled
                ? colors.textMuted
                : colors.textPrimary,
            },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    flexShrink: 1,
  },
});

export default Checkbox;
