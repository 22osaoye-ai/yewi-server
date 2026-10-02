import React from 'react';
import {
  Pressable,
  PressableProps,
  GestureResponderEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'none';

export interface ThemedTouchableProps extends Omit<PressableProps, 'style'> {
  haptic?: HapticType;
  activeOpacity?: number;
  scaleOnPress?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ThemedTouchable = React.forwardRef<any, ThemedTouchableProps>(
  (allProps, ref) => {
    const {
      haptic = 'selection',
      activeOpacity = 0.88,
      scaleOnPress = true,
      onPress,
      onPressIn,
      onPressOut,
      className,
      style,
      children,
      ...props
    } = allProps;

    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }));

    const handlePressIn = (e: GestureResponderEvent) => {
      if (scaleOnPress) {
        scale.value = withSpring(0.965, {
          damping: 16,
          stiffness: 350,
          mass: 0.5,
        });
      }
      opacity.value = withTiming(activeOpacity, { duration: 75, easing: Easing.out(Easing.quad) });
      onPressIn?.(e);
    };

    const handlePressOut = (e: GestureResponderEvent) => {
      if (scaleOnPress) {
        scale.value = withSpring(1, {
          damping: 14,
          stiffness: 300,
          mass: 0.5,
        });
      }
      opacity.value = withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) });
      onPressOut?.(e);
    };

    const handlePress = (e: GestureResponderEvent) => {
      if (haptic !== 'none') {
        switch (haptic) {
          case 'light':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            break;
          case 'medium':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            break;
          case 'heavy':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
            break;
          case 'selection':
          default:
            Haptics.selectionAsync().catch(() => {});
            break;
        }
      }
      onPress?.(e);
    };

    return (
      <AnimatedPressable
        ref={ref}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={className}
        style={[style, animatedStyle]}
        {...props}
      >
        {children}
      </AnimatedPressable>
    );
  }
);

ThemedTouchable.displayName = 'ThemedTouchable';
export default ThemedTouchable;
