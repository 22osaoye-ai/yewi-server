import React, { useRef } from 'react';
import {
  View,
  Text,
  Animated,
  PanResponder,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface SwipeableRowProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void; // Swipe left (e.g. Delete)
  onSwipeRight?: () => void; // Swipe right (e.g. Toggle Read/Unread)
  leftActionColor?: string;
  rightActionColor?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  leftLabel?: string;
  rightLabel?: string;
  borderRadius?: number;
  disabled?: boolean;
}

export function SwipeableRow({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftActionColor = '#2563EB', // Blue / Mark read
  rightActionColor = '#DC2626', // Red / Delete
  leftIcon = 'mail-unread-outline',
  rightIcon = 'trash-outline',
  leftLabel = 'Marcar',
  rightLabel = 'Eliminar',
  borderRadius = 22,
  disabled = false,
}: SwipeableRowProps) {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const pan = useRef(new Animated.Value(0)).current;
  const isTriggered = useRef(false);
  const THRESHOLD = 85;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (disabled) return false;
        return Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
      },
      onPanResponderGrant: () => {
        isTriggered.current = false;
      },
      onPanResponderMove: (_, gestureState) => {
        pan.setValue(gestureState.dx);
        if (Math.abs(gestureState.dx) > THRESHOLD && !isTriggered.current) {
          isTriggered.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -THRESHOLD && onSwipeLeft) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          Animated.timing(pan, {
            toValue: -SCREEN_WIDTH,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            onSwipeLeft();
            pan.setValue(0);
          });
        } else if (gestureState.dx > THRESHOLD && onSwipeRight) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          Animated.timing(pan, {
            toValue: SCREEN_WIDTH,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            onSwipeRight();
            pan.setValue(0);
          });
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: true,
            friction: 7,
            tension: 40,
          }).start();
        }
      },
    })
  ).current;

  // Background action opacity: strictly 0 at rest to prevent any background color leaking
  const leftActionOpacity = pan.interpolate({
    inputRange: [0, 15, 60],
    outputRange: [0, 0.3, 1],
    extrapolate: 'clamp',
  });

  const rightActionOpacity = pan.interpolate({
    inputRange: [-60, -15, 0],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { borderRadius }]}>
      {/* Background Actions (Hidden at rest) */}
      {!disabled && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          {/* Swiping Left -> Reveals Right Action (Delete) */}
          {onSwipeLeft && (
            <Animated.View
              style={[
                styles.actionBackground,
                {
                  backgroundColor: rightActionColor,
                  justifyContent: 'flex-end',
                  paddingRight: 22,
                  borderRadius,
                  opacity: rightActionOpacity,
                },
              ]}
            >
              <View className="items-center">
                <Ionicons name={rightIcon} size={22} color="#FFFFFF" />
                {rightLabel ? (
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontFamily: 'Satoshi-Bold', marginTop: 2 }}>
                    {rightLabel}
                  </Text>
                ) : null}
              </View>
            </Animated.View>
          )}

          {/* Swiping Right -> Reveals Left Action (Mark Read / Unread) */}
          {onSwipeRight && (
            <Animated.View
              style={[
                styles.actionBackground,
                {
                  backgroundColor: leftActionColor,
                  justifyContent: 'flex-start',
                  paddingLeft: 22,
                  borderRadius,
                  opacity: leftActionOpacity,
                },
              ]}
            >
              <View className="items-center">
                <Ionicons name={leftIcon} size={22} color="#FFFFFF" />
                {leftLabel ? (
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontFamily: 'Satoshi-Bold', marginTop: 2 }}>
                    {leftLabel}
                  </Text>
                ) : null}
              </View>
            </Animated.View>
          )}
        </View>
      )}

      {/* Foreground Swipeable Content */}
      <Animated.View
        style={{ transform: [{ translateX: pan }] }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 12,
  },
  actionBackground: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default SwipeableRow;
