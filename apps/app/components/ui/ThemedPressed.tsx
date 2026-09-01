import React from 'react';
import {
  Pressable,
  PressableProps,
  GestureResponderEvent,
  StyleProp,
  ViewStyle,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'none';

export interface ThemedPressedProps extends PressableProps {
  haptic?: HapticType;
  scaleOnPress?: boolean;
  opacityOnPress?: boolean;
  children?: React.ReactNode | ((state: { pressed: boolean }) => React.ReactNode);
  className?: string;
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
}

export const ThemedPressed = React.forwardRef<View, ThemedPressedProps>(
  (
    {
      haptic = 'light',
      scaleOnPress = false,
      opacityOnPress = true,
      onPress,
      children,
      style,
      ...props
    },
    ref
  ) => {
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
            Haptics.selectionAsync().catch(() => {});
            break;
          default:
            break;
        }
      }
      onPress?.(e);
    };

    return (
      <Pressable
        ref={ref as any}
        onPress={handlePress}
        style={(state) => {
          const userStyle = typeof style === 'function' ? style(state) : style;
          if (!state.pressed) return userStyle;

          const pressedStyle: ViewStyle = {};
          if (opacityOnPress) {
            pressedStyle.opacity = 0.85;
          }
          if (scaleOnPress) {
            pressedStyle.transform = [{ scale: 0.96 }];
          }

          return [userStyle, pressedStyle];
        }}
        {...props}
      >
        {children}
      </Pressable>
    );
  }
);

ThemedPressed.displayName = 'ThemedPressed';
export default ThemedPressed;
