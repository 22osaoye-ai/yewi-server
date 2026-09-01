import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  GestureResponderEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';

export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'none';

export interface ThemedTouchableProps extends TouchableOpacityProps {
  haptic?: HapticType;
  className?: string;
  children?: React.ReactNode;
}

export const ThemedTouchable = React.forwardRef<React.ElementRef<typeof TouchableOpacity>, ThemedTouchableProps>(
  (allProps, ref) => {
    const {
      haptic = 'selection',
      activeOpacity = 0.85,
      onPress,
      className,
      style,
      children,
      ...props
    } = allProps;

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
      <TouchableOpacity
        ref={ref}
        activeOpacity={activeOpacity}
        onPress={handlePress}
        className={className}
        style={style}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }
);

ThemedTouchable.displayName = 'ThemedTouchable';
export default ThemedTouchable;
