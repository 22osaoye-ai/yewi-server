import React from 'react';
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

export const FloatingActionButton = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const unreadCount = useRealtimeStore((state) => state.unreadCount);

  // Spacing comfortably positioned above the floating tab bar
  const BASE_BOTTOM = Math.max(insets.bottom, 16) + 85;

  const firstValue = useSharedValue(BASE_BOTTOM);
  const secondValue = useSharedValue(BASE_BOTTOM);
  const thirdValue = useSharedValue(BASE_BOTTOM);
  const fourthValue = useSharedValue(BASE_BOTTOM);

  const firstWidth = useSharedValue(56);
  const secondWidth = useSharedValue(56);
  const thirdWidth = useSharedValue(56);
  const fourthWidth = useSharedValue(56);

  const isOpen = useSharedValue(false);
  const opacity = useSharedValue(0);

  const progress = useDerivedValue(() =>
    isOpen.value ? withTiming(1) : withTiming(0)
  );

  const handlePress = () => {
    const config = {
      easing: Easing.bezier(0.68, -0.6, 0.32, 1.6),
      duration: 400,
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
      fourthWidth.value = withTiming(56, { duration: 100 }, (finish) => {
        if (finish) fourthValue.value = withDelay(120, withTiming(BASE_BOTTOM, config));
      });
      opacity.value = withTiming(0, { duration: 100 });
    } else {
      firstValue.value = withDelay(250, withSpring(BASE_BOTTOM + 65));
      secondValue.value = withDelay(180, withSpring(BASE_BOTTOM + 130));
      thirdValue.value = withDelay(100, withSpring(BASE_BOTTOM + 195));
      fourthValue.value = withSpring(BASE_BOTTOM + 260);

      firstWidth.value = withDelay(500, withSpring(170));
      secondWidth.value = withDelay(420, withSpring(170));
      thirdWidth.value = withDelay(340, withSpring(170));
      fourthWidth.value = withDelay(260, withSpring(170));

      opacity.value = withDelay(450, withSpring(1));
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
  const fourthWidthStyle = useAnimatedStyle(() => ({
    width: fourthWidth.value,
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

  const fourthIcon = useAnimatedStyle(() => {
    const scale = interpolate(
      fourthValue.value,
      [BASE_BOTTOM, BASE_BOTTOM + 260],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      bottom: fourthValue.value,
      transform: [{ scale }],
    };
  });

  const plusIcon = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 45}deg` }],
  }));

  const itemBg = isDark ? '#1F1F24' : '#FFFFFF';
  const itemBorder = isDark ? '#2E2E34' : '#F1F5F9';

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Fourth Action: Notificaciones */}
      <Animated.View
        style={[
          styles.contentContainer,
          fourthIcon,
          fourthWidthStyle,
          { backgroundColor: itemBg, borderColor: itemBorder },
        ]}
      >
        <Pressable
          style={styles.actionPressable}
          onPress={() => {
            closeMenu();
            router.push('/notifications');
          }}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="notifications-outline" size={22} color={colors.primary} />
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
                <Animated.Text style={{ color: '#FFFFFF', fontSize: 9, fontFamily: 'Satoshi-Black' }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Animated.Text>
              </View>
            )}
          </View>
          <Animated.Text
            style={[styles.text, opacityText, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            Notificaciones
          </Animated.Text>
        </Pressable>
      </Animated.View>

      {/* Third Action: Mensajes / Chat */}
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
            router.push('/chat');
          }}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="chatbubbles-outline" size={22} color={colors.primary} />
          </View>
          <Animated.Text
            style={[styles.text, opacityText, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            Mensajes
          </Animated.Text>
        </Pressable>
      </Animated.View>

      {/* Second Action: Buscar */}
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

      {/* First Action: Solicitud */}
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
            router.push('/(tabs)/requests');
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
  );
};

export default FloatingActionButton;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
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
    fontFamily: 'Satoshi-Bold',
    paddingRight: 16,
  },
});
