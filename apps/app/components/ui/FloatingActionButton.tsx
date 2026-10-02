import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useRealtimeStore } from '@/store/useRealtimeStore';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from '@/store/useToastStore';

export const FloatingActionButton = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const unreadCount = useRealtimeStore((state) => state.unreadCount);
  const { user, isAuthenticated, isProfessional, isClient } = useUserRole();

  // Spacing comfortably positioned above the floating tab bar
  const BASE_BOTTOM = Math.max(insets.bottom, 16) + 85;

  const firstValue = useSharedValue(BASE_BOTTOM);
  const secondValue = useSharedValue(BASE_BOTTOM);
  const thirdValue = useSharedValue(BASE_BOTTOM);

  const firstWidth = useSharedValue(56);
  const secondWidth = useSharedValue(56);
  const thirdWidth = useSharedValue(56);

  const isOpen = useSharedValue(false);
  const opacity = useSharedValue(0);

  const progress = useDerivedValue(() =>
    isOpen.value ? withTiming(1) : withTiming(0)
  );

  const handlePress = () => {
    const config = {
      easing: Easing.bezier(0.68, -0.6, 0.32, 1.6),
      duration: 350,
    };

    if (isOpen.value) {
      firstWidth.value = withTiming(56, { duration: 100 }, (finish) => {
        if (finish) firstValue.value = withTiming(BASE_BOTTOM, config);
      });
      secondWidth.value = withTiming(56, { duration: 100 }, (finish) => {
        if (finish) secondValue.value = withDelay(40, withTiming(BASE_BOTTOM, config));
      });
      thirdWidth.value = withTiming(56, { duration: 100 }, (finish) => {
        if (finish) thirdValue.value = withDelay(80, withTiming(BASE_BOTTOM, config));
      });
      opacity.value = withTiming(0, { duration: 100 });
    } else {
      firstValue.value = withDelay(140, withSpring(BASE_BOTTOM + 65));
      secondValue.value = withDelay(70, withSpring(BASE_BOTTOM + 130));
      thirdValue.value = withSpring(BASE_BOTTOM + 195);

      firstWidth.value = withDelay(380, withSpring(146));
      secondWidth.value = withDelay(300, withSpring(146));
      thirdWidth.value = withDelay(220, withSpring(146));

      opacity.value = withDelay(280, withSpring(1));
    }
    isOpen.value = !isOpen.value;
  };

  const closeMenu = () => {
    if (isOpen.value) {
      handlePress();
    }
  };

  const opacityText = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const firstWidthStyle = useAnimatedStyle(() => ({
    width: firstWidth.value,
  }));
  const secondWidthStyle = useAnimatedStyle(() => ({
    width: secondWidth.value,
  }));
  const thirdWidthStyle = useAnimatedStyle(() => ({
    width: thirdWidth.value,
  }));

  const firstIcon = useAnimatedStyle(() => {
    const scale = interpolate(
      firstValue.value,
      [BASE_BOTTOM, BASE_BOTTOM + 65],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      bottom: firstValue.value,
      transform: [{ scale }],
    };
  });

  const secondIcon = useAnimatedStyle(() => {
    const scale = interpolate(
      secondValue.value,
      [BASE_BOTTOM, BASE_BOTTOM + 130],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      bottom: secondValue.value,
      transform: [{ scale }],
    };
  });

  const thirdIcon = useAnimatedStyle(() => {
    const scale = interpolate(
      thirdValue.value,
      [BASE_BOTTOM, BASE_BOTTOM + 195],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      bottom: thirdValue.value,
      transform: [{ scale }],
    };
  });

  const plusIcon = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 45}deg` }],
  }));

  const itemBg = isDark ? '#1F1F24' : '#FFFFFF';
  const itemBorder = isDark ? '#2E2E34' : '#F1F5F9';

  return (
    <>
      <View style={styles.container} pointerEvents="box-none">
        {/* 
          Both CLIENT and PROFESSIONAL have 3 options:
          - thirdIcon (195): Mensajes (Both)
          - secondIcon (130): Buscar (Both)
          - firstIcon (65): 
              * Client: "Solicitud" (navigates to /(tabs)/requests)
              * Professional: "Publicar proyecto" (opens PublishProjectModal)
        */}

        {/* --- Action 3: Mensajes (Both, top position) --- */}
        <Animated.View
          style={[
            styles.contentContainer,
            thirdIcon,
            thirdWidthStyle,
            { backgroundColor: itemBg, borderColor: itemBorder },
          ]}
        >
          <Pressable
            style={styles.actionPressable}
            onPress={() => {
              closeMenu();
              if (!isAuthenticated) {
                router.push('/auth/login');
                return;
              }
              router.push('/chat');
            }}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="chatbubbles-outline" size={22} color={colors.primary} />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: '#EF4444',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 3,
                  }}
                >
                  <Animated.Text style={{ color: '#FFFFFF', fontSize: 9, fontFamily: 'PlusJakartaSans-ExtraBold' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Animated.Text>
                </View>
              )}
            </View>
            <Animated.Text
              style={[styles.text, opacityText, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              Mensajes
            </Animated.Text>
          </Pressable>
        </Animated.View>

        {/* --- Action 2: Buscar (Both, middle position) --- */}
        <Animated.View
          style={[
            styles.contentContainer,
            secondIcon,
            secondWidthStyle,
            { backgroundColor: itemBg, borderColor: itemBorder },
          ]}
        >
          <Pressable
            style={styles.actionPressable}
            onPress={() => {
              closeMenu();
              router.push('/(tabs)/search');
            }}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="search-outline" size={22} color={colors.primary} />
            </View>
            <Animated.Text
              style={[styles.text, opacityText, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              Buscar
            </Animated.Text>
          </Pressable>
        </Animated.View>

        {/* --- Action 1: Role-specific action (Bottom position above FAB) --- */}
        {isClient ? (
          /* Client: Crear Solicitud */
          <Animated.View
            style={[
              styles.contentContainer,
              firstIcon,
              firstWidthStyle,
              { backgroundColor: itemBg, borderColor: itemBorder },
            ]}
          >
            <Pressable
              style={styles.actionPressable}
              onPress={() => {
                closeMenu();
                if (!isAuthenticated) {
                  router.push('/auth/login');
                  return;
                }
                router.push({ pathname: '/publish', params: { type: 'request' } });
              }}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
              </View>
              <Animated.Text
                style={[styles.text, opacityText, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                Solicitud
              </Animated.Text>
            </Pressable>
          </Animated.View>
        ) : (
          /* Professional: Publicar Servicio (Fiverr Gig de precio cerrado) */
          <Animated.View
            style={[
              styles.contentContainer,
              firstIcon,
              firstWidthStyle,
              { backgroundColor: itemBg, borderColor: itemBorder },
            ]}
          >
            <Pressable
              style={styles.actionPressable}
              onPress={() => {
                closeMenu();
                if (!isAuthenticated) {
                  router.push('/auth/login');
                  return;
                }
                router.push({ pathname: '/publish', params: { type: 'service' } });
              }}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="add" size={24} color={colors.primary} />
              </View>
              <Animated.Text
                style={[styles.text, opacityText, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                Servicio
              </Animated.Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Main Trigger FAB */}
        <Pressable
          style={[
            styles.contentContainer,
            {
              bottom: BASE_BOTTOM,
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
          ]}
          onPress={handlePress}
        >
          <Animated.View style={[styles.iconContainer, plusIcon]}>
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </Animated.View>
        </Pressable>
      </View>
    </>
  );
};

export default FloatingActionButton;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 99,
  },
  contentContainer: {
    position: 'absolute',
    right: 24,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
  },
  actionPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 56,
  },
  iconContainer: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
    paddingRight: 16,
  },
});
