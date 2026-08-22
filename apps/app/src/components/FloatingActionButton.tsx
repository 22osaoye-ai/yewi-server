import { useRouter } from 'expo-router';
import {
  FileText,
  MessageSquare,
  Plus,
  Search,
  Wrench,
  Zap,
} from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/auth.store';
import { Colors, Shadows } from './Theme';

export const FloatingActionButton: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeRole } = useAuthStore();

  const [isOpen, setIsOpen] = useState(false);

  // Animation values
  const animation = useRef(new Animated.Value(0)).current;
  const widthAnim1 = useRef(new Animated.Value(56)).current;
  const widthAnim2 = useRef(new Animated.Value(56)).current;
  const widthAnim3 = useRef(new Animated.Value(56)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    if (isOpen) {
      // Closing sequence
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.timing(widthAnim1, {
          toValue: 56,
          duration: 120,
          useNativeDriver: false,
        }),
        Animated.timing(widthAnim2, {
          toValue: 56,
          duration: 120,
          useNativeDriver: false,
        }),
        Animated.timing(widthAnim3, {
          toValue: 56,
          duration: 120,
          useNativeDriver: false,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 320,
          easing: Easing.bezier(0.68, -0.6, 0.32, 1.6),
          useNativeDriver: false,
        }),
      ]).start(() => setIsOpen(false));
    } else {
      // Opening sequence
      setIsOpen(true);
      Animated.sequence([
        Animated.spring(animation, {
          toValue: 1,
          friction: 6,
          tension: 45,
          useNativeDriver: false,
        }),
        Animated.parallel([
          Animated.spring(widthAnim1, {
            toValue: 175,
            friction: 7,
            tension: 50,
            useNativeDriver: false,
          }),
          Animated.spring(widthAnim2, {
            toValue: 175,
            friction: 7,
            tension: 50,
            useNativeDriver: false,
          }),
          Animated.spring(widthAnim3, {
            toValue: 175,
            friction: 7,
            tension: 50,
            useNativeDriver: false,
          }),
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 180,
            useNativeDriver: false,
          }),
        ]),
      ]).start();
    }
  };

  const handleAction = (path: string) => {
    toggleMenu();
    router.push(path as any);
  };

  const BASE_BOTTOM = Math.max(insets.bottom, 16) + 75;

  // Transforms
  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const action1Bottom = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [BASE_BOTTOM, BASE_BOTTOM + 65],
  });

  const action2Bottom = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [BASE_BOTTOM, BASE_BOTTOM + 130],
  });

  const action3Bottom = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [BASE_BOTTOM, BASE_BOTTOM + 195],
  });

  const action1Scale = animation.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.7, 1],
  });

  const action2Scale = animation.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 0.8, 1],
  });

  const action3Scale = animation.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [0, 0.9, 1],
  });

  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      {/* Action 3: Mis Pedidos */}
      <Animated.View
        style={[
          styles.actionItem,
          {
            bottom: action3Bottom,
            width: widthAnim3,
            transform: [{ scale: action3Scale }],
            opacity: animation,
          },
        ]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <TouchableOpacity
          style={styles.actionPressable}
          onPress={() => handleAction('/(client)/orders')}
          activeOpacity={0.85}
        >
          <View style={styles.iconContainer}>
            <MessageSquare size={20} color="#111813" />
          </View>
          <Animated.Text
            style={[styles.actionText, { opacity: textOpacity }]}
            numberOfLines={1}
          >
            Mis Pedidos
          </Animated.Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Action 2: Buscador */}
      <Animated.View
        style={[
          styles.actionItem,
          {
            bottom: action2Bottom,
            width: widthAnim2,
            transform: [{ scale: action2Scale }],
            opacity: animation,
          },
        ]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <TouchableOpacity
          style={styles.actionPressable}
          onPress={() => handleAction('/search')}
          activeOpacity={0.85}
        >
          <View style={styles.iconContainer}>
            <Search size={20} color="#111813" />
          </View>
          <Animated.Text
            style={[styles.actionText, { opacity: textOpacity }]}
            numberOfLines={1}
          >
            Buscador
          </Animated.Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Action 1: Solicitud / Oportunidades */}
      <Animated.View
        style={[
          styles.actionItem,
          {
            bottom: action1Bottom,
            width: widthAnim1,
            transform: [{ scale: action1Scale }],
            opacity: animation,
          },
        ]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <TouchableOpacity
          style={styles.actionPressable}
          onPress={() =>
            handleAction(
              activeRole === 'PROFESSIONAL'
                ? '/(pro)/opportunities'
                : '/requests/new',
            )
          }
          activeOpacity={0.85}
        >
          <View style={styles.iconContainer}>
            <Wrench size={20} color={Colors.primary} />
          </View>
          <Animated.Text
            style={[styles.actionText, { opacity: textOpacity }]}
            numberOfLines={1}
          >
            {activeRole === 'PROFESSIONAL' ? 'Oportunidades' : 'Solicitud'}
          </Animated.Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Main Trigger FAB (Ónice Oscuro) */}
      <TouchableOpacity
        style={[styles.mainFab, { bottom: BASE_BOTTOM }]}
        onPress={toggleMenu}
        activeOpacity={0.9}
      >
        <Animated.View
          style={[
            styles.iconContainer,
            { transform: [{ rotate: rotation }] },
          ]}
        >
          <Plus size={26} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  actionItem: {
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    right: 20,
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E2D5',
    ...Shadows.card,
  },
  actionPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: '#111813',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginLeft: 2,
  },
  mainFab: {
    backgroundColor: '#111813',
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Shadows.floating,
  },
});
