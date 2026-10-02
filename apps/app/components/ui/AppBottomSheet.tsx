import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from 'expo-glass-effect';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from './ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

function triggerLightHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export interface AppBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number;
}

export function AppBottomSheet({
  visible,
  onClose,
  title,
  children,
  footer,
}: AppBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const translateY = useSharedValue(600);
  const contextY = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  const handleAnimatedClose = () => {
    translateY.value = withTiming(
      600,
      { duration: 200, easing: Easing.in(Easing.cubic) },
      (finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(onClose);
        }
      }
    );
    backdropOpacity.value = withTiming(0, { duration: 160 });
  };

  useEffect(() => {
    if (visible) {
      translateY.value = 600;
      backdropOpacity.value = 0;
      translateY.value = withSpring(0, {
        damping: 22,
        stiffness: 240,
        mass: 0.8,
      });
      backdropOpacity.value = withTiming(1, {
        duration: 180,
        easing: Easing.out(Easing.quad),
      });
    } else {
      translateY.value = 600;
      backdropOpacity.value = 0;
    }
  }, [visible]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([0, 10])
        .onStart(() => {
          contextY.value = translateY.value;
        })
        .onUpdate((e) => {
          const nextY = contextY.value + e.translationY;
          translateY.value = nextY >= 0 ? nextY : nextY * 0.15;
        })
        .onEnd((e) => {
          if (translateY.value > 120 || e.velocityY > 500) {
            translateY.value = withSpring(
              600,
              {
                velocity: e.velocityY,
                damping: 20,
                stiffness: 200,
              },
              (finished) => {
                'worklet';
                if (finished) {
                  scheduleOnRN(onClose);
                }
              }
            );
            backdropOpacity.value = withTiming(0, { duration: 150 });
          } else {
            translateY.value = withSpring(0, {
              velocity: e.velocityY,
              damping: 22,
              stiffness: 260,
            });
            scheduleOnRN(triggerLightHaptic);
          }
        }),
    [onClose]
  );

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => {
    const dragFade = interpolate(
      translateY.value,
      [0, 320],
      [1, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity: backdropOpacity.value * dragFade,
    };
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleAnimatedClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.rootGestureView}>
        <View style={styles.modalOverlay}>
          {/* Animated Dark Backdrop */}
          <Animated.View
            style={[
              styles.backdrop,
              backdropAnimatedStyle,
            ]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={handleAnimatedClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar modal"
            />
          </Animated.View>

          {/* Draggable Bottom Sheet with Width 100% */}
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[
                styles.sheetContainer,
                {
                  paddingBottom: Math.max(insets.bottom + 16, 28),
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                  overflow: 'hidden',
                },
                cardAnimatedStyle,
              ]}
            >
              {/* Frosted Glass Background */}
              <GlassView
                glassEffectStyle="regular"
                colorScheme={isDark ? 'dark' : 'light'}
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: isDark ? 'rgba(28, 28, 30, 0.88)' : 'rgba(255, 255, 255, 0.88)',
                    ...(Platform.OS === 'web'
                      ? ({
                          backdropFilter: 'blur(24px) saturate(180%)',
                          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                        } as any)
                      : {}),
                  },
                ]}
              />

              {/* Drag Indicator Handle (Pill) */}
              <View style={styles.dragHandleWrapper}>
                <View
                  style={[
                    styles.dragHandlePill,
                    { backgroundColor: isDark ? '#48484A' : '#D1D5DB' },
                  ]}
                />
              </View>

              {/* Header Row: Title & Top-Right Circular Close Button */}
              <View style={styles.headerRow}>
                {title ? (
                  <Text
                    style={[
                      styles.title,
                      { color: isDark ? '#F9FAFB' : '#111827' },
                    ]}
                    numberOfLines={1}
                  >
                    {title}
                  </Text>
                ) : (
                  <View style={{ flex: 1 }} />
                )}

                <ThemedTouchable
                  onPress={handleAnimatedClose}
                  haptic="light"
                  style={[
                    styles.closeCircleButton,
                    { backgroundColor: isDark ? '#2A2A2E' : '#F0F0F2' },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar opciones"
                >
                  <Ionicons
                    name="close"
                    size={15}
                    color={isDark ? '#A1A1AA' : '#6B7280'}
                  />
                </ThemedTouchable>
              </View>

              {/* Body Content */}
              <View style={styles.bodyContent}>{children}</View>

              {/* Optional Footer */}
              {footer && <View style={styles.footerContainer}>{footer}</View>}
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  rootGestureView: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 0, // 100% full width, edge-to-edge
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheetContainer: {
    width: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingTop: 8,
    paddingHorizontal: 22,
    borderTopWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  dragHandleWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    marginBottom: 8,
  },
  dragHandlePill: {
    width: 38,
    height: 4.5,
    borderRadius: 999,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    fontSize: 21,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -0.4,
    flex: 1,
    marginRight: 12,
  },
  closeCircleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyContent: {
    width: '100%',
  },
  footerContainer: {
    marginTop: 20,
    width: '100%',
  },
});

export default AppBottomSheet;
