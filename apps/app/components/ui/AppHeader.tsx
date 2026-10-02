import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from 'expo-glass-effect';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  interpolateColor,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { ThemedTouchable } from './ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';
import { PASTEL_PALETTE, SNAP_INTERVAL } from './ChooseCollectionCarousel';
import { Skeleton } from './Skeleton';

export interface AppHeaderNavItem {
  label: string;
  onPress?: () => void;
  hasDropdown?: boolean;
}

export interface AppHeaderActionCTA {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  loading?: boolean;
}

export type TimeOfDay = 'day' | 'sunset' | 'night';

export interface TimeOfDayTheme {
  period: TimeOfDay;
  greetingPrefix: string;
  badgeLabel: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  secondaryIcon?: keyof typeof Ionicons.glyphMap;
  secondaryIconColor?: string;
  glassBgLight: string;
  glassBgDark: string;
  glassBorderLight: string;
  glassBorderDark: string;
  skyTintLight: string;
  skyTintDark: string;
}

export function getTimeOfDayTheme(
  override?: TimeOfDay,
  hour: number = new Date().getHours()
): TimeOfDayTheme {
  const period: TimeOfDay =
    override || (hour >= 6 && hour < 13 ? 'day' : hour >= 13 && hour < 21 ? 'sunset' : 'night');

  if (period === 'day') {
    // 06:00 - 12:59 -> Sol saliente / Mañana
    return {
      period: 'day',
      greetingPrefix: 'Buenos días',
      badgeLabel: 'Día',
      iconName: 'sunny',
      iconColor: '#F59E0B',
      glassBgLight: 'rgba(254, 243, 199, 0.75)',
      glassBgDark: 'rgba(30, 41, 59, 0.75)',
      glassBorderLight: 'rgba(251, 191, 36, 0.40)',
      glassBorderDark: 'rgba(251, 191, 36, 0.25)',
      skyTintLight: 'rgba(254, 243, 199, 0.22)',
      skyTintDark: 'rgba(15, 23, 42, 0.20)',
    };
  } else if (period === 'sunset') {
    // 13:00 - 20:59 -> Sol poniente / Tarde
    return {
      period: 'sunset',
      greetingPrefix: 'Buenas tardes',
      badgeLabel: 'Tarde',
      iconName: 'partly-sunny',
      iconColor: '#F97316',
      glassBgLight: 'rgba(255, 237, 213, 0.75)',
      glassBgDark: 'rgba(45, 25, 35, 0.75)',
      glassBorderLight: 'rgba(249, 115, 22, 0.40)',
      glassBorderDark: 'rgba(249, 115, 22, 0.25)',
      skyTintLight: 'rgba(255, 237, 213, 0.22)',
      skyTintDark: 'rgba(35, 18, 28, 0.20)',
    };
  } else {
    // 21:00 - 05:59 -> Luna con estrellas / Noche
    return {
      period: 'night',
      greetingPrefix: 'Buenas noches',
      badgeLabel: 'Noche',
      iconName: 'moon',
      iconColor: '#A5B4FC',
      secondaryIcon: 'sparkles',
      secondaryIconColor: '#FDE047',
      glassBgLight: 'rgba(224, 231, 255, 0.75)',
      glassBgDark: 'rgba(30, 27, 75, 0.75)',
      glassBorderLight: 'rgba(165, 180, 252, 0.40)',
      glassBorderDark: 'rgba(129, 140, 248, 0.30)',
      skyTintLight: 'rgba(238, 242, 255, 0.28)',
      skyTintDark: 'rgba(15, 23, 42, 0.35)',
    };
  }
}

export interface AppHeaderProps {
  /** Custom logo title or defaults to 'Yewi' */
  title?: string;
  /** Direct personal greeting (e.g. "Hola, Aisha 👋") rendered next to the avatar on the left */
  greeting?: string;
  /** Whether the user profile / greeting is currently loading (renders skeletons) */
  isLoading?: boolean;
  /** Optional override for time-of-day theme */
  timeOfDayOverride?: TimeOfDay;
  /** Navigation links (middle or subtitle row) */
  navItems?: AppHeaderNavItem[];
  /** Search icon press handler */
  onSearchPress?: () => void;
  /** Primary action (rendered as clean circular '+' button) */
  actionCTA?: AppHeaderActionCTA;
  /** Dedicated handler for the '+' button */
  onAddPress?: () => void;
  /** Handler for the briefcase/bag button */
  onBagPress?: () => void;
  /** Bag/briefcase badge count */
  bagBadgeCount?: number;
  /** Notifications icon press handler */
  onNotificationsPress?: () => void;
  /** Notifications unread count */
  notificationsCount?: number;
  /** Avatar image URL */
  avatarUri?: string;
  /** Fallback avatar initial */
  avatarInitial?: string;
  /** Whether the user status indicator is online */
  isOnline?: boolean;
  /** Avatar press callback */
  onAvatarPress?: () => void;
  /** Whether to show a bottom hairline border */
  showBorder?: boolean;
  /** SharedValue driving dynamic carousel ambient background sync */
  carouselScrollX?: SharedValue<number>;
  /** Total item count in the carousel for color interpolation */
  carouselItemCount?: number;
  /** SharedValue from react-native-reanimated driving background opacity */
  scrollY?: SharedValue<number>;
  /** Type of icon for notifications or menu action */
  notificationsIcon?: 'bell' | 'menu' | 'bag';
  /** Additional container style */
  style?: ViewStyle;
}

export function AppHeader({
  title = 'Yewi',
  greeting,
  isLoading = false,
  timeOfDayOverride,
  navItems,
  onSearchPress,
  actionCTA,
  onAddPress,
  onBagPress,
  bagBadgeCount,
  onNotificationsPress,
  notificationsCount = 0,
  notificationsIcon = 'bell',
  avatarUri,
  avatarInitial = 'Y',
  isOnline = true,
  onAvatarPress,
  showBorder = false,
  scrollY,
  carouselScrollX,
  carouselItemCount,
  style,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  // Determine current time-of-day greeting (automatic based on real hour)
  const currentHour = new Date().getHours();
  const timeTheme = getTimeOfDayTheme(timeOfDayOverride, currentHour);

  // Fallback shared value if parent doesn't provide scrollY
  const fallbackScrollY = useSharedValue(0);
  const activeScrollY = scrollY || fallbackScrollY;

  // Header Height configuration: standard clean 70px bar for generous avatar and large icons
  const HEADER_HEIGHT = insets.top + 70;
  const SCROLL_DISTANCE = 30;

  // Precompute carousel background color range outside worklet to avoid Remote Function call on UI runtime
  const { bgInputRange, bgColors } = useMemo(() => {
    const count = carouselItemCount ?? 0;
    if (!carouselScrollX || count <= 0) {
      return {
        bgInputRange: [0, 1],
        bgColors: [colors.background, colors.background],
      };
    }

    const range =
      count > 1
        ? Array.from({ length: count }, (_, i) => i * SNAP_INTERVAL)
        : [0, 1];

    const palette =
      count > 1
        ? Array.from({ length: count }, (_, i) =>
            isDark
              ? PASTEL_PALETTE[i % PASTEL_PALETTE.length].ambientDark
              : PASTEL_PALETTE[i % PASTEL_PALETTE.length].ambientLight
          )
        : [
            isDark
              ? PASTEL_PALETTE[0].ambientDark
              : PASTEL_PALETTE[0].ambientLight,
            isDark
              ? PASTEL_PALETTE[0].ambientDark
              : PASTEL_PALETTE[0].ambientLight,
          ];

    return { bgInputRange: range, bgColors: palette };
  }, [carouselScrollX, carouselItemCount, isDark, colors.background]);

  // Real-time synchronization of header background with collections carousel ambient stage
  const headerBgAnimatedStyle = useAnimatedStyle(() => {
    if (!carouselScrollX || (carouselItemCount ?? 0) <= 0) {
      return {
        backgroundColor: colors.background,
      };
    }

    const backgroundColor = interpolateColor(
      carouselScrollX.value,
      bgInputRange,
      bgColors
    );

    return { backgroundColor };
  });

  // Background and border opacity as user scrolls vertically
  const borderAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      activeScrollY.value,
      [0, SCROLL_DISTANCE],
      [showBorder ? 1 : 0, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity,
    };
  });

  // Frosted glassmorphism layer fading in on vertical scroll
  const glassOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      activeScrollY.value,
      [8, 48],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity,
    };
  });

  // Clean greeting display name - completely prevent displaying dummy user 'Hola'
  const displayName = useMemo(() => {
    if (!greeting) return '';
    const cleaned = greeting.replace(/^Hola,?\s*/i, '').replace(/👋/g, '').trim();
    if (!cleaned || cleaned.toLowerCase() === 'hola') return '';
    return cleaned;
  }, [greeting]);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.headerContainer,
        {
          paddingTop: insets.top,
          height: HEADER_HEIGHT,
        },
        headerBgAnimatedStyle,
        style,
      ]}
    >
      {/* Frosted Glass Background Layer on Vertical Scroll */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          glassOverlayStyle,
        ]}
        pointerEvents="none"
      >
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark ? 'rgba(15, 17, 23, 0.80)' : 'rgba(255, 255, 255, 0.82)',
              ...(Platform.OS === 'web'
                ? ({
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  } as any)
                : {}),
            },
          ]}
        />
      </Animated.View>

      {/* Top Main Row: 70px high row containing Title or Greeting and Utility Actions */}
      <View style={styles.topRow}>
        {/* Left: Loading Skeleton, Greeting with Avatar, or Brand Title */}
        {isLoading ? (
          <View style={styles.greetingBrandContainer}>
            <Skeleton
              width={52}
              height={52}
              borderRadius={26}
            />
            <View style={styles.greetingTextCol}>
              <Skeleton
                width={68}
                height={12}
                borderRadius={4}
                style={{ marginBottom: 6 }}
              />
              <Skeleton
                width={100}
                height={16}
                borderRadius={4}
              />
            </View>
          </View>
        ) : greeting && displayName ? (
          <ThemedTouchable
            onPress={onAvatarPress}
            haptic="light"
            activeOpacity={0.8}
            style={styles.greetingBrandContainer}
            accessibilityRole="button"
            accessibilityLabel={`Perfil de ${displayName}`}
          >
            <View
              style={[
                styles.greetingAvatarBorder,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <Text
                  style={[
                    styles.avatarInitial,
                    { color: colors.primary },
                  ]}
                >
                  {(avatarInitial && avatarInitial.toLowerCase() !== 'hola' ? avatarInitial : displayName).charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.greetingTextCol}>
              {/* Clean text-only greeting with zero background/pill */}
              <Text
                style={[
                  styles.greetingSubtitle,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                {timeTheme.greetingPrefix}
              </Text>

              <Text
                style={[
                  styles.greetingText,
                  { color: isDark ? '#F8FAFC' : '#0D0C22' },
                ]}
                numberOfLines={1}
              >
                {displayName}
              </Text>
            </View>
          </ThemedTouchable>
        ) : (
          <View style={styles.brandContainer}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isDark ? 'rgba(56, 189, 248, 0.18)' : '#E0F2FE',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 9,
              }}
            >
              <Ionicons name="sparkles" size={19} color={colors.primary} />
            </View>
            <Text
              style={[
                styles.brandText,
                { color: isDark ? '#F8FAFC' : '#0D0C22' },
              ]}
            >
              {title}
            </Text>
          </View>
        )}

        {/* Center: Navigation Links (When provided) */}
        {navItems && navItems.length > 0 && (
          <View style={styles.navRow}>
            {navItems.map((item, idx) => (
              <ThemedTouchable
                key={idx}
                onPress={item.onPress}
                haptic="selection"
                style={styles.navItemButton}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <Text
                  style={[
                    styles.navItemText,
                    { color: isDark ? '#E2E8F0' : '#1E293B' },
                  ]}
                >
                  {item.label}
                </Text>
                {item.hasDropdown && (
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color={isDark ? '#94A3B8' : '#64748B'}
                    style={{ marginLeft: 3 }}
                  />
                )}
              </ThemedTouchable>
            ))}
          </View>
        )}

        {/* Right: Action Utilities Cluster (Clean circular icons: Search, Add, Notifications, Avatar) */}
        <View style={styles.actionsCluster}>
          {/* 0. Search Quick Action */}
          {onSearchPress && (
            <ThemedTouchable
              onPress={onSearchPress}
              haptic="light"
              style={[
                styles.iconButton,
                {
                  backgroundColor: isDark ? '#27272A' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Buscar"
            >
              <Ionicons
                name="search-outline"
                size={22}
                color={isDark ? '#F1F5F9' : '#0D0C22'}
              />
            </ThemedTouchable>
          )}

          {/* 1. Circular '+' Button (Añadir / Publicar) */}
          {(actionCTA || onAddPress) && (
            <ThemedTouchable
              onPress={actionCTA?.onPress || onAddPress}
              haptic="medium"
              style={[
                styles.iconButton,
                {
                  backgroundColor: isDark ? '#27272A' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={actionCTA?.label || 'Añadir / Publicar'}
            >
              <Ionicons
                name="add"
                size={22}
                color={isDark ? '#F8FAFC' : '#0D0C22'}
              />
            </ThemedTouchable>
          )}

          {/* 1b. Bag / Briefcase Quick Action (Ralph Howell style) */}
          {onBagPress && (
            <ThemedTouchable
              onPress={onBagPress}
              haptic="light"
              style={[
                styles.iconButton,
                {
                  backgroundColor: isDark ? '#27272A' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Solicitudes"
            >
              <Ionicons
                name="bag-handle-outline"
                size={22}
                color={isDark ? '#F1F5F9' : '#0D0C22'}
              />
              {bagBadgeCount !== undefined && bagBadgeCount > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>
                    {bagBadgeCount > 99 ? '99+' : bagBadgeCount}
                  </Text>
                </View>
              )}
            </ThemedTouchable>
          )}

          {/* 2. Notification Bell or Bag Quick Action */}
          {onNotificationsPress && (
            <ThemedTouchable
              onPress={onNotificationsPress}
              haptic="light"
              style={[
                styles.iconButton,
                {
                  backgroundColor: isDark ? '#27272A' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Notificaciones"
            >
              <Ionicons
                name={
                  notificationsIcon === 'menu'
                    ? 'menu-outline'
                    : notificationsIcon === 'bag'
                    ? 'bag-handle-outline'
                    : 'notifications-outline'
                }
                size={22}
                color={isDark ? '#F1F5F9' : '#0D0C22'}
              />
              {notificationsCount > 0 && (
                <View
                  style={
                    notificationsIcon === 'menu'
                      ? styles.redDotBadge
                      : styles.badgeContainer
                  }
                >
                  {notificationsIcon !== 'menu' && (
                    <Text style={styles.badgeText}>
                      {notificationsCount > 99 ? '99+' : notificationsCount}
                    </Text>
                  )}
                </View>
              )}
            </ThemedTouchable>
          )}

          {/* 3. User Avatar with Online Status (Only rendered on the right when greeting is NOT provided) */}
          {!greeting && onAvatarPress && (
            <ThemedTouchable
              onPress={onAvatarPress}
              haptic="light"
              style={styles.avatarWrapper}
              accessibilityRole="button"
              accessibilityLabel="Perfil de usuario"
            >
              <View
                style={[
                  styles.avatarBorder,
                  {
                    backgroundColor: colors.primaryLight,
                  },
                ]}
              >
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <Text
                    style={[
                      styles.avatarInitial,
                      { color: colors.primary },
                    ]}
                  >
                    {avatarInitial.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>

              {/* Online status indicator dot */}
              {isOnline && (
                <View
                  style={[
                    styles.onlineDot,
                    {
                      borderColor: colors.background,
                    },
                  ]}
                />
              )}
            </ThemedTouchable>
          )}
        </View>
      </View>

      {/* Subtle Hairline Bottom Divider (Fades in on scroll) */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.hairlineBorder,
          { backgroundColor: isDark ? '#1F222A' : '#E5E7EB' },
          borderAnimatedStyle,
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    overflow: 'hidden',
  },
  topRow: {
    height: 70,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingBrandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    maxWidth: '65%',
  },
  greetingAvatarBorder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingTextCol: {
    justifyContent: 'center',
  },
  greetingSubtitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  greetingText: {
    fontSize: 17,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    letterSpacing: -0.4,
    lineHeight: 22,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandText: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    letterSpacing: -0.6,
  },
  brandAccentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 2,
    marginBottom: 4,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 12,
  },
  navItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  navItemText: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -0.2,
  },
  actionsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  badgeContainer: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    lineHeight: 12,
  },
  redDotBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarBorder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 0,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#10B981',
    borderWidth: 2,
  },
  hairlineBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
});

export default AppHeader;
