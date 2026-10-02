import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useAppTheme } from '@/hooks/useAppTheme';

const DURATION = 650;

interface AnimatedSplashOverlayProps {
  isReady: boolean;
  onAnimationComplete?: () => void;
}

export function AnimatedSplashOverlay({ isReady, onAnimationComplete }: AnimatedSplashOverlayProps) {
  const [visible, setVisible] = useState(true);
  const [animating, setAnimating] = useState(false);
  const { isDark } = useAppTheme();

  useEffect(() => {
    if (isReady && visible) {
      SplashScreen.hideAsync()
        .then(() => {
          setAnimating(true);
        })
        .catch(() => {
          setAnimating(true);
        });
    }
  }, [isReady, visible]);

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: {
      transform: [{ scale: 1 }],
      opacity: 1,
    },
    25: {
      transform: [{ scale: 1.05 }],
      opacity: 1,
    },
    75: {
      opacity: 0,
      transform: [{ scale: 0.96 }],
      easing: Easing.out(Easing.cubic),
    },
    100: {
      opacity: 0,
      transform: [{ scale: 0.92 }],
      easing: Easing.out(Easing.cubic),
    },
  });

  const backgroundColor = isDark ? '#09090B' : '#FFFFFF';

  return animating ? (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
          if (onAnimationComplete) {
            scheduleOnRN(onAnimationComplete);
          }
        }
      })}
      style={[styles.splashOverlay, { backgroundColor }]}
      pointerEvents="none"
    >
      <Image
        style={styles.image}
        source={require('../../assets/images/splash-icon.png')}
        contentFit="contain"
      />
    </Animated.View>
  ) : (
    <View style={[styles.splashOverlay, { backgroundColor }]} pointerEvents="none">
      <Image
        style={styles.image}
        source={require('../../assets/images/splash-icon.png')}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  image: {
    width: 140,
    height: 140,
  },
});
