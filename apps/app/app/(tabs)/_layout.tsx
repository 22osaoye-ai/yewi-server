import { Tabs } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { View, Pressable, Animated, LayoutAnimation } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { useRealtimeStore } from '@/store/useRealtimeStore';

const CUSTOM_SPRING_ANIMATION = {
  duration: 300,
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: {
    type: LayoutAnimation.Types.spring,
    springDamping: 0.78,
  },
  delete: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
};

// Custom SVG Icons
function HomeIcon({ color = '#FFFFFF', size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.5L20 9.8V19C20 19.8 19.3 20.5 18.5 20.5H5.5C4.7 20.5 4 19.8 4 19V9.8L12 3.5Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 16.5H14"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function SearchIcon({ color = '#E4E4E7', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.5" />
      <Path d="M20 20L16 16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function RequestsIcon({ color = '#E4E4E7', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="17" rx="3" stroke={color} strokeWidth="1.5" />
      <Path d="M9 2H15V5H9V2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <Path d="M8 10H16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M8 14H14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M8 18H11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function ProfileIcon({ color = '#E4E4E7', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="7.5" r="4" stroke={color} strokeWidth="1.5" />
      <Path
        d="M4.5 19.5C5.8 16.8 8.6 15 12 15C15.4 15 18.2 16.8 19.5 19.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function AnimatedTabItem({
  tab,
  label,
  isFocused,
  badgeCount,
  onPress,
  isDark,
}: {
  tab: { name: string; icon: any };
  label: string;
  isFocused: boolean;
  badgeCount?: number;
  onPress: () => void;
  isDark: boolean;
}) {
  const animValue = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: isFocused ? 1 : 0,
      friction: 7,
      tension: 65,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const IconComponent = tab.icon;

  if (isFocused) {
    const textOpacity = animValue.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [0, 0, 1],
    });

    const textTranslateX = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [-8, 0],
    });

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDark ? '#232328' : '#F4F4F5',
            borderRadius: 999,
            padding: 4,
            paddingRight: 18,
            elevation: isDark ? 4 : 2,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.2 : 0.08,
            shadowRadius: 4,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#C87D20',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <IconComponent color="#FFFFFF" size={22} />
            {Boolean(badgeCount && badgeCount > 0) && (
              <View
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: '#EF4444',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 3,
                  borderWidth: 1.5,
                  borderColor: '#FFFFFF',
                }}
              >
                <Animated.Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 9,
                    fontFamily: 'Satoshi-Black',
                    lineHeight: 11,
                  }}
                >
                  {badgeCount! > 99 ? '99+' : badgeCount}
                </Animated.Text>
              </View>
            )}
          </View>
          <Animated.Text
            style={{
              fontFamily: 'Satoshi-Bold',
              color: isDark ? '#FFFFFF' : '#18181B',
              fontSize: 14.5,
              marginLeft: 10,
              letterSpacing: -0.3,
              opacity: textOpacity,
              transform: [{ translateX: textTranslateX }],
            }}
          >
            {label}
          </Animated.Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <IconComponent color={isDark ? '#71717A' : '#71717A'} size={24} />
        {Boolean(badgeCount && badgeCount > 0) && (
          <View
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: '#EF4444',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 3,
              borderWidth: 1.5,
              borderColor: isDark ? '#141416' : '#FFFFFF',
            }}
          >
            <Animated.Text
              style={{
                color: '#FFFFFF',
                fontSize: 9,
                fontFamily: 'Satoshi-Black',
                lineHeight: 11,
              }}
            >
              {badgeCount! > 99 ? '99+' : badgeCount}
            </Animated.Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { t, isDark } = useAppTheme();
  const unseenLeadsCount = useRealtimeStore((s) => s.unseenLeadsCount);

  // Hide bottom tab bar if currently inside a nested sub-screen (e.g. /profile/account)
  const currentTabRoute = state.routes[state.index];
  if (currentTabRoute?.state) {
    const nestedState = currentTabRoute.state;
    const currentNestedRoute = nestedState.routes[nestedState.index];
    if (currentNestedRoute && currentNestedRoute.name !== 'index') {
      return null;
    }
  }

  const tabLabels: Record<string, { label: string; icon: any; badgeCount?: number }> = {
    index: { label: t.tabHome, icon: HomeIcon },
    search: { label: t.tabSearch, icon: SearchIcon },
    requests: { label: t.tabRequests, icon: RequestsIcon, badgeCount: unseenLeadsCount },
    profile: { label: t.tabProfile, icon: ProfileIcon },
  };

  const isProfileTab = currentTabRoute?.name === 'profile';

  return (
    <>
      <View
        style={{
          position: 'absolute',
          bottom: Math.max(insets.bottom, 16),
          left: 18,
          right: 18,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isDark ? '#141416' : '#FFFFFF',
            borderWidth: 1,
            borderColor: isDark ? '#27272A' : '#E4E4E7',
            borderRadius: 999,
            padding: 8,
            width: '100%',
            elevation: isDark ? 16 : 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDark ? 0.35 : 0.1,
            shadowRadius: 14,
          }}
        >
          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;
            const tabConfig = tabLabels[route.name];

            if (!tabConfig) {
              return null;
            }

            const onPress = () => {
              LayoutAnimation.configureNext(CUSTOM_SPRING_ANIMATION);

              if (route.name === 'requests') {
                useRealtimeStore.getState().markLeadsAsSeen();
              }

              if (!isFocused) {
                navigation.navigate(route.name);
              }
            };

            return (
              <AnimatedTabItem
                key={route.key}
                tab={{ name: route.name, icon: tabConfig.icon }}
                label={tabConfig.label}
                isFocused={isFocused}
                badgeCount={tabConfig.badgeCount}
                onPress={onPress}
                isDark={isDark}
              />
            );
          })}
        </View>
      </View>
      {!isProfileTab && <FloatingActionButton />}
    </>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="requests" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
