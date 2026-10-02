import React, { createContext, useContext } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/hooks/useAppTheme';

interface RadioGroupContextType {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextType | null>(null);

export interface RadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
}

export function RadioGroup({
  value,
  onValueChange,
  children,
  disabled = false,
  style,
}: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange, disabled }}>
      <View style={[styles.group, style]}>{children}</View>
    </RadioGroupContext.Provider>
  );
}

export interface RadioItemProps {
  value: string;
  label?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function RadioItem({
  value,
  label,
  disabled: itemDisabled,
  style,
}: RadioItemProps) {
  const context = useContext(RadioGroupContext);
  if (!context) {
    throw new Error('RadioItem must be used within a RadioGroup');
  }

  const { colors, isDark } = useAppTheme();
  const isSelected = context.value === value;
  const disabled = context.disabled || itemDisabled;

  const dotScale = useSharedValue(isSelected ? 1 : 0);

  React.useEffect(() => {
    dotScale.value = withSpring(isSelected ? 1 : 0, {
      damping: 18,
      stiffness: 280,
    });
  }, [isSelected]);

  const animatedDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotScale.value,
  }));

  const handlePress = () => {
    if (disabled) return;
    Haptics.selectionAsync().catch(() => {});
    context.onValueChange(value);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      hitSlop={8}
      style={[styles.itemContainer, style]}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected, disabled }}
      accessibilityLabel={label}
    >
      <View
        style={[
          styles.outerCircle,
          {
            borderColor: isSelected
              ? colors.primary
              : isDark
              ? '#2E2E38'
              : '#CBD5E1',
            backgroundColor: isDark ? '#1C1C22' : '#FFFFFF',
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.innerDot,
            { backgroundColor: colors.primary },
            animatedDotStyle,
          ]}
        />
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
  group: {
    gap: 12,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  outerCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerDot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
  },
  labelText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    flexShrink: 1,
  },
});

export default RadioGroup;
