import {
  Briefcase,
  Coins,
  Compass,
  FileText,
  Home,
  LayoutGrid,
  PackageCheck,
  User,
  Zap,
} from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows } from './Theme';

const { width } = Dimensions.get('window');

const getTabIcon = (routeName: string, isFocused: boolean) => {
  const color = isFocused ? '#FFFFFF' : '#8E9892';
  const size = 20;

  switch (routeName) {
    case 'home':
      return <Home size={size} color={color} />;
    case 'requests':
      return <FileText size={size} color={color} />;
    case 'orders':
      return <PackageCheck size={size} color={color} />;
    case 'profile':
      return <User size={size} color={color} />;
    case 'opportunities':
      return <Zap size={size} color={color} />;
    case 'gigs':
      return <LayoutGrid size={size} color={color} />;
    case 'wallet':
      return <Coins size={size} color={color} />;
    default:
      return <Compass size={size} color={color} />;
  }
};

export const CustomBottomTab: React.FC<any> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const TAB_BAR_WIDTH = Math.min(width - 48, 320);
  const PADDING_CONTAINER = 6;
  const USABLE_WIDTH = TAB_BAR_WIDTH - 2 * PADDING_CONTAINER;
  const TAB_WIDTH = USABLE_WIDTH / state.routes.length;

  const translateX = useRef(new Animated.Value(PADDING_CONTAINER)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: PADDING_CONTAINER + TAB_WIDTH * state.index,
      friction: 7,
      tension: 50,
      useNativeDriver: true,
    }).start();
  }, [state.index, TAB_WIDTH]);

  return (
    <View
      style={[
        styles.container,
        {
          width: TAB_BAR_WIDTH,
          bottom: Math.max(insets.bottom, 16) + 4,
        },
      ]}
    >
      {/* Sliding Active Dark Pill (Estilo Imagen 4) */}
      <Animated.View
        style={[
          styles.activePillContainer,
          {
            width: TAB_WIDTH,
            transform: [{ translateX }],
          },
        ]}
      >
        <View style={styles.activePill} />
      </Animated.View>

      {/* Tab Buttons */}
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, { merge: true });
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.tabButton}
            activeOpacity={0.85}
          >
            {getTabIcon(route.name, isFocused)}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 58,
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E8E2D5',
    zIndex: 999,
    ...Shadows.floating,
  },
  activePillContainer: {
    position: 'absolute',
    top: 5,
    bottom: 5,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    width: '88%',
    height: '100%',
    backgroundColor: '#111813',
    borderRadius: 9999,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
});
