import React, { useEffect } from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useAppTheme } from '@/hooks/useAppTheme';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  children,
}: SkeletonProps) {
  const { isDark } = useAppTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.75, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const backgroundColor = isDark ? '#27272A' : '#E2E8F0';

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor,
        },
        animatedStyle,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

export function SkeletonBanner({
  height = 140,
  borderRadius = 20,
  style,
}: {
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { isDark, colors } = useAppTheme();

  return (
    <View
      style={[
        {
          height,
          borderRadius,
          backgroundColor: isDark ? '#18181B' : '#F4F4F5',
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
          justifyContent: 'space-between',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width={120} height={18} borderRadius={6} />
        <Skeleton width={50} height={18} borderRadius={999} />
      </View>
      <View style={{ gap: 8 }}>
        <Skeleton width="75%" height={22} borderRadius={6} />
        <Skeleton width="90%" height={14} borderRadius={4} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Skeleton width={100} height={32} borderRadius={16} />
      </View>
    </View>
  );
}

export function SkeletonCard({
  height = 110,
  borderRadius = 16,
  style,
}: {
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { isDark, colors } = useAppTheme();

  return (
    <View
      style={[
        {
          height,
          borderRadius,
          backgroundColor: isDark ? '#18181B' : '#FFFFFF',
          borderWidth: 1,
          borderColor: colors.border,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        },
        style,
      ]}
    >
      <Skeleton width={70} height={70} borderRadius={14} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="60%" height={16} borderRadius={4} />
        <Skeleton width="85%" height={12} borderRadius={4} />
        <Skeleton width="40%" height={14} borderRadius={4} />
      </View>
    </View>
  );
}
