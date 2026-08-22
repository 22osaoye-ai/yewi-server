import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

interface AppSwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  activeColor?: string;
  inActiveColor?: string;
  style?: ViewStyle;
}

export const AppSwitch: React.FC<AppSwitchProps> = ({
  value,
  onValueChange,
  activeColor = '#111813',
  inActiveColor = '#E8E2D5',
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value ? 1 : 0,
      damping: 18,
      stiffness: 180,
      mass: 0.8,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 24],
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [inActiveColor, activeColor],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onValueChange(!value)}
      style={[style]}
    >
      <Animated.View style={[styles.container, { backgroundColor }]}>
        <Animated.View
          style={[
            styles.circle,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 1,
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.18,
    shadowRadius: 2.5,
    elevation: 3,
  },
});
