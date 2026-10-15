import React, { memo } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useRealtimeStore } from '@/store/useRealtimeStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';

// 1. Home / Inicio Icon (Crisp geometric house)
function HomeIcon({ color = '#FFFFFF', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.5L20 9.8V19C20 19.8 19.3 20.5 18.5 20.5H5.5C4.7 20.5 4 19.8 4 19V9.8L12 3.5Z"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 16.5H14"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// 2. Search / Explorar Icon (Magnifying glass)
function SearchIcon({ color = '#E4E4E7', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.9" />
      <Path d="M20 20L16 16" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </Svg>
  );
}

// 3. Requests / Solicitudes Icon (Document / Clipboard with task lines)
function RequestsIcon({ color = '#E4E4E7', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="17" rx="3" stroke={color} strokeWidth="1.9" />
      <Path d="M9 2H15V5H9V2Z" stroke={color} strokeWidth="1.9" strokeLinejoin="round" />
      <Path d="M8 10H16" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Path d="M8 14H14" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Path d="M8 18H11" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </Svg>
  );
}

// 4. Chat / Mensajes Icon (Crisp geometric speech bubble)
function ChatIcon({ color = '#E4E4E7', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15C21 16.1046 20.1046 17 19 17H7L3 21V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V15Z"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 5. Profile / Perfil Icon (User silhouette)
function ProfileIcon({ color = '#E4E4E7', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="7.5" r="4" stroke={color} strokeWidth="1.9" />
      <Path
        d="M4.5 19.5C5.8 16.8 8.6 15 12 15C15.4 15 18.2 16.8 19.5 19.5"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </Svg>
  );
}

interface AnimatedTabItemProps {
  tab: { name: string; icon: any };
  label: string;
  isFocused: boolean;
  badgeCount?: number;
  onPress: () => void;
  isDark: boolean;
  primaryColor: string;
}

const AnimatedTabItem = memo(function AnimatedTabItem({
  tab,
  label,
  isFocused,
  badgeCount,
  onPress,
  isDark,
}: AnimatedTabItemProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.90, {
      damping: 15,
      stiffness: 400,
      mass: 0.5,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 16,
      stiffness: 350,
      mass: 0.5,
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const IconComponent = tab.icon;

  const activeCircleBg = isDark ? 'rgba(255, 255, 255, 0.16)' : '#0F172A';
  const activeIconColor = '#FFFFFF';
  const inactiveIconColor = isDark ? 'rgba(255, 255, 255, 0.55)' : 'rgba(15, 23, 42, 0.50)';

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.tabButton,
          isFocused && {
            backgroundColor: activeCircleBg,
          },
        ]}
        accessibilityRole="tab"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={label}
      >
        <IconComponent
          color={isFocused ? activeIconColor : inactiveIconColor}
          size={22}
        />
        {Boolean(badgeCount && badgeCount > 0) && (
          <View style={styles.badgeDotContainer}>
            <Animated.Text style={styles.badgeCountText}>
              {badgeCount! > 99 ? '99+' : badgeCount}
            </Animated.Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
});

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { t, isDark } = useAppTheme();
  const unseenLeadsCount = useRealtimeStore((s) => s.unseenLeadsCount);
  const user = useAuthStore((s) => s.user);
  const conversations = useChatStore((s) => s.conversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);

  const unreadChatCount = React.useMemo(() => {
    if (!conversations || conversations.length === 0) return 0;
    const myId = user?.id;
    return conversations.reduce((acc, c) => {
      const unread = c.messages?.filter((m) => !m.isRead && m.senderId !== myId).length || 0;
      return acc + unread;
    }, 0);
  }, [conversations, user?.id]);

  // Hide bottom tab bar if currently inside a nested sub-screen
  const currentTabRoute = state.routes[state.index];
  if (currentTabRoute?.state) {
    const nestedState = currentTabRoute.state;
    const currentNestedRoute = nestedState.routes[nestedState.index];
    if (currentNestedRoute && currentNestedRoute.name !== 'index') {
      return null;
    }
  }

  // Hide bottom tab bar if currently inside an active 1-on-1 chat conversation
  const currentRoute = state.routes[state.index];
  if (currentRoute?.name === 'chat' && Boolean(activeConversationId)) {
    return null;
  }

  const router = useRouter();
  if (currentRoute?.name === 'profile' && router.canGoBack()) {
    return null;
  }

  // Proper semantic tab configurations matching the 5 tabs of Yewi
  const tabConfigs: Record<string, { label: string; icon: any; badgeCount?: number }> = {
    index: { label: t.tabHome || 'Inicio', icon: HomeIcon },
    search: { label: t.tabSearch || 'Buscar', icon: SearchIcon },
    requests: { label: t.tabRequests || 'Solicitudes', icon: RequestsIcon, badgeCount: unseenLeadsCount },
    chat: { label: t.tabChat || 'Mensajes', icon: ChatIcon, badgeCount: unreadChatCount },
    profile: { label: t.tabProfile || 'Perfil', icon: ProfileIcon },
  };

  return (
    <View
      style={[
        styles.dockWrapper,
        {
          bottom: Math.max(insets.bottom, 16),
        },
      ]}
      pointerEvents="box-none"
    >
      {/* Floating Capsule Dock - Pure Clean Solid Flat Surface (Zero Shadow) */}
      <View
        style={[
          styles.dockContainer,
          {
            backgroundColor: isDark ? '#18181B' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.07)',
          },
        ]}
      >
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const config = tabConfigs[route.name];

          if (!config) return null;

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

            if (route.name === 'requests') {
              useRealtimeStore.getState().markLeadsAsSeen();
            }

            if (route.name === 'chat' && isFocused) {
              useChatStore.getState().setActiveConversationId(null);
            }

            if (!isFocused) {
              navigation.navigate(route.name);
            }
          };

          return (
            <AnimatedTabItem
              key={route.key}
              tab={{ name: route.name, icon: config.icon }}
              label={config.label}
              isFocused={isFocused}
              badgeCount={config.badgeCount}
              onPress={onPress}
              isDark={isDark}
              primaryColor=""
            />
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        freezeOnBlur: true,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="requests" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  dockWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  dockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 6,
    borderWidth: 1.2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  tabButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDotContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeCountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    lineHeight: 11,
  },
});

