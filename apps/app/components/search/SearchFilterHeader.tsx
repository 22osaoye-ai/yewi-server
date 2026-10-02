import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { Input } from '@/components/ui/Input';
import { useAppTheme } from '@/hooks/useAppTheme';

interface SearchFilterHeaderProps {
  query: string;
  onChangeQuery: (query: string) => void;
  activeTab: 'categories' | 'projects' | 'professionals';
  onSelectTab: (tab: 'categories' | 'projects' | 'professionals') => void;
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;
  scrollY?: SharedValue<number>;
  headerTranslateY?: SharedValue<number>;
  children?: React.ReactNode;
}

export function SearchFilterHeader({
  query,
  onChangeQuery,
  activeTab,
  onSelectTab,
  isSearching,
  setIsSearching,
  scrollY,
  headerTranslateY,
  children,
}: SearchFilterHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const paddingTop = insets.top + 4;

  // Zalando-style quick-return header translation on GPU
  const animatedHeaderStyle = useAnimatedStyle(() => {
    const translateY = headerTranslateY && !isSearching ? headerTranslateY.value : 0;
    const isScrolled = scrollY ? scrollY.value > 15 : false;
    return {
      transform: [{ translateY }],
      borderBottomColor: isScrolled
        ? (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)')
        : 'transparent',
      borderBottomWidth: StyleSheet.hairlineWidth,
      shadowOpacity: isScrolled ? (isDark ? 0.3 : 0.08) : 0,
      elevation: isScrolled ? 3 : 0,
    };
  });

  // Smooth fade for the search bar as it slides out of view on scroll down
  const animatedCollapsibleStyle = useAnimatedStyle(() => {
    if (!headerTranslateY || isSearching) return { opacity: 1 };
    const opacity = interpolate(headerTranslateY.value, [0, -35], [1, 0], Extrapolation.CLAMP);
    return {
      opacity,
    };
  });

  return (
    <>
      {/* Status Bar Shield preventing content from bleeding behind status bar icons */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: insets.top + 4,
          backgroundColor: colors.background,
          zIndex: 110,
        }}
      />

      <Animated.View
        style={[
          styles.container,
          {
            paddingTop,
            backgroundColor: colors.background,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
          },
          animatedHeaderStyle,
        ]}
      >
        {/* MODE 1: ACTIVE SEARCH HEADER (Back arrow + Input field) */}
        {isSearching ? (
          <View style={styles.activeSearchRow}>
            {/* Back Arrow Button */}
            <ThemedTouchable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setIsSearching(false);
                onChangeQuery('');
              }}
              haptic="light"
              style={[
                styles.backButton,
                {
                  backgroundColor: isDark ? '#1C1E26' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Volver"
            >
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </ThemedTouchable>

            {/* Global Search Input */}
            <Input
              leftIcon="search-outline"
              value={query}
              onChangeText={onChangeQuery}
              placeholder="Buscar proyectos, electricistas, obras..."
              autoFocus
              returnKeyType="search"
              clearable
              containerStyle={{ flex: 1, marginBottom: 0 }}
              inputContainerStyle={{
                height: 44,
                paddingVertical: 0,
                borderRadius: 999,
                backgroundColor: isDark ? '#1C1E26' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
              }}
            />
          </View>
        ) : (
          /* MODE 2: DEFAULT EXPLORE HEADER (Compact Search Bar + Segmented Tabs) */
          <>
            {/* Row 1: Floating Search Capsule Bar (collapses on scroll down) */}
            <Animated.View style={animatedCollapsibleStyle}>
              <ThemedTouchable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setIsSearching(true);
                }}
                haptic="light"
                activeOpacity={0.88}
                style={[
                  styles.searchBar,
                  {
                    backgroundColor: isDark ? '#1C1E26' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Buscar proyectos y profesionales"
              >
                <Ionicons
                  name="search-outline"
                  size={22}
                  color={colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={[styles.searchPlaceholder, { color: colors.textMuted }]}
                  numberOfLines={1}
                >
                  Buscar proyectos, electricistas, obras...
                </Text>
              </ThemedTouchable>
            </Animated.View>

            {/* Row 2: Segmented Pill Navigation: Categorías | Servicios | Profesionales */}
            <View
              style={[
                styles.segmentedContainer,
                {
                  backgroundColor: isDark ? '#181A22' : '#F1F5F9',
                },
              ]}
            >
              {/* Tab 1: Categorías */}
              <ThemedTouchable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  onSelectTab('categories');
                }}
                activeOpacity={0.85}
                style={[
                  styles.segmentedTab,
                  activeTab === 'categories' && [
                    styles.activeSegmentedTab,
                    {
                      backgroundColor: isDark ? '#262936' : '#FFFFFF',
                      shadowColor: '#000',
                    },
                  ],
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.segmentedTabText,
                    {
                      color: activeTab === 'categories' ? colors.textPrimary : colors.textSecondary,
                      fontFamily: activeTab === 'categories' ? 'PlusJakartaSans-ExtraBold' : 'PlusJakartaSans-SemiBold',
                    },
                  ]}
                >
                  Categorías
                </Text>
              </ThemedTouchable>

              {/* Tab 2: Servicios */}
              <ThemedTouchable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  onSelectTab('projects');
                }}
                activeOpacity={0.85}
                style={[
                  styles.segmentedTab,
                  activeTab === 'projects' && [
                    styles.activeSegmentedTab,
                    {
                      backgroundColor: isDark ? '#262936' : '#FFFFFF',
                      shadowColor: '#000',
                    },
                  ],
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.segmentedTabText,
                    {
                      color: activeTab === 'projects' ? colors.textPrimary : colors.textSecondary,
                      fontFamily: activeTab === 'projects' ? 'PlusJakartaSans-ExtraBold' : 'PlusJakartaSans-SemiBold',
                    },
                  ]}
                >
                  Servicios
                </Text>
              </ThemedTouchable>

              {/* Tab 3: Profesionales */}
              <ThemedTouchable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  onSelectTab('professionals');
                }}
                activeOpacity={0.85}
                style={[
                  styles.segmentedTab,
                  activeTab === 'professionals' && [
                    styles.activeSegmentedTab,
                    {
                      backgroundColor: isDark ? '#262936' : '#FFFFFF',
                      shadowColor: '#000',
                    },
                  ],
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.segmentedTabText,
                    {
                      color: activeTab === 'professionals' ? colors.textPrimary : colors.textSecondary,
                      fontFamily: activeTab === 'professionals' ? 'PlusJakartaSans-ExtraBold' : 'PlusJakartaSans-SemiBold',
                    },
                  ]}
                >
                  Profesionales
                </Text>
              </ThemedTouchable>
            </View>

            {children}
          </>
        )}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    zIndex: 20,
  },
  activeSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 44,
    marginBottom: 8,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  searchPlaceholder: {
    fontSize: 14.5,
    fontFamily: 'PlusJakartaSans-Medium',
    flex: 1,
  },
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 3,
    marginBottom: 2,
  },
  segmentedTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSegmentedTab: {
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  segmentedTabText: {
    fontSize: 12.5,
    letterSpacing: -0.2,
  },
});

export default SearchFilterHeader;
