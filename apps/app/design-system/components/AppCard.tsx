import React from 'react';
import { Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { motion } from '../tokens/motion';
import { shadows } from '../tokens/shadows';

export interface AppCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'base' | 'elevated' | 'highlight';
  rounded?: keyof typeof radius;
  hasGlow?: boolean;
  disabled?: boolean;
}


const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AppCard({
  children,
  onPress,
  style,
  variant = 'base',
  rounded = '2xl',
  hasGlow = false,
  disabled = false,
}: AppCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled || !onPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    scale.value = withSpring(0.98, motion.spring.snappy);
  };

  const handlePressOut = () => {
    if (disabled || !onPress) return;
    scale.value = withSpring(1, motion.spring.snappy);
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'elevated':
        return colors.surfaceElevated;
      case 'highlight':
        return colors.surfaceHighlight;
      case 'base':
      default:
        return colors.surface;
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || !onPress}
      style={[
        styles.card,
        shadows.subtle,
        {
          backgroundColor: getBackgroundColor(),
          borderRadius: radius[rounded],
          borderColor: hasGlow ? colors.accent : colors.borderSubtle,
        },
        hasGlow && shadows.glowTurquoise,
        animatedStyle,
        style,
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
