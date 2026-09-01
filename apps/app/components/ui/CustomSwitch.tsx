import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, ViewStyle, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

interface CustomSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  activeColor?: string;
  inactiveColor?: string;
  style?: ViewStyle;
  disabled?: boolean;
}

export function CustomSwitch({
  value,
  onValueChange,
  activeColor = '#34C759', // Authentic iOS Green
  inactiveColor = '#E9E9EA', // Authentic iOS Light Gray
  disabled = false,
}: CustomSwitchProps) {
  const animValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: value ? 1 : 0,
      useNativeDriver: false,
      bounciness: 3,
      speed: 16,
    }).start();
  }, [value]);

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onValueChange(!value);
  };

  const backgroundColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [inactiveColor, activeColor],
  });

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      <Animated.View style={[styles.container, { backgroundColor }]}>
        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 51,
    height: 31,
    borderRadius: 16.5,
    justifyContent: 'center',
  },
  thumb: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});

export default CustomSwitch;
