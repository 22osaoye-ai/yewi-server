import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  SharedValue,
} from 'react-native-reanimated';

import { ThemedTouchable } from './ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';
import { GigDetail } from '@/services/gigsApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Proportional card dimensions ensuring the active card is wide (80% width) and adjacent cards peek out cleanly
export const CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.80);
export const SPACING = 12;
export const SNAP_INTERVAL = CARD_WIDTH + SPACING;

export interface ChooseCollectionCarouselProps {
  title?: string;
  seeAllText?: string;
  items?: GigDetail[];
  onSelectItem?: (item: GigDetail) => void;
  onSeeAll?: () => void;
  scrollX?: SharedValue<number>;
  style?: ViewStyle;
}

export const PASTEL_PALETTE = [
  {
    ambientLight: '#EBF4FF', // Soft Sky Blue
    ambientDark: '#0C1B2A',
    accent: '#0284C7',
  },
  {
    ambientLight: '#E8F5E9', // Soft Botanical Mint
    ambientDark: '#0D2618',
    accent: '#16A34A',
  },
  {
    ambientLight: '#FFF3E0', // Soft Warm Peach
    ambientDark: '#2C1810',
    accent: '#EA580C',
  },
  {
    ambientLight: '#F3E8FF', // Soft Lavender
    ambientDark: '#1E1435',
    accent: '#7C3AED',
  },
  {
    ambientLight: '#FEF9C3', // Soft Amber
    ambientDark: '#2D1F08',
    accent: '#D97706',
  },
];

/**
 * AnimatedTitle:
 * Synchronized with carousel scrollX timeline.
 * Implements the official centered editorial hierarchy:
 * - Line 1: Category eyebrow in theme accent color (centered, uppercase, tracking).
 * - Line 2: Main project title in PlusJakartaSans-ExtraBold (centered, prominent).
 * - Line 3: Professional name / Business in muted tone (centered).
 *
 * Mathematical Zero-Overlap Guarantee:
 * Each title only renders within abs(offset) < 0.5.
 * Fades out completely by abs(offset) = 0.35, ensuring outgoing titles
 * are 100% invisible before the incoming title enters.
 */
function AnimatedTitle({
  item,
  index,
  scrollX,
  isDark,
}: {
  item: GigDetail;
  index: number;
  scrollX: SharedValue<number>;
  isDark: boolean;
}) {
  const accentColor = PASTEL_PALETTE[index % PASTEL_PALETTE.length].accent;

  const animatedStyle = useAnimatedStyle(() => {
    const offset = scrollX.value / SNAP_INTERVAL - index;
    const absOffset = Math.abs(offset);

    // Hard cutoff: strictly zero opacity beyond half-step
    if (absOffset >= 0.5) {
      return {
        opacity: 0,
        transform: [{ translateY: offset > 0 ? -8 : 8 }],
      };
    }

    // Zero-overlap fade: outgoing title drops to 0 at 0.35
    const opacity = interpolate(
      absOffset,
      [0, 0.35],
      [1, 0],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      offset,
      [-0.35, 0, 0.35],
      [8, 0, -8],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const proName =
    item.professionalProfile?.businessName ||
    item.professionalProfile?.user?.profile?.displayName ||
    (item.id === '__see_all__' ? 'Explorar catálogo completo' : 'Profesional Verificado');

  const categoryName =
    item.category?.name ||
    (item.id === '__see_all__' ? 'Catálogo' : 'Reformas');

  return (
    <Animated.View
      style={[
        styles.titleAbsolute,
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <View style={styles.titleCenteredCol}>
        {/* Category Eyebrow: Centered in Theme Accent */}
        <Text style={[styles.eyebrowText, { color: accentColor }]}>
          {categoryName.toUpperCase()}
        </Text>

        {/* Main Title: Large Bold Centered Headline */}
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[
            styles.mainTitleText,
            { color: isDark ? '#F8FAFC' : '#0F172A' },
          ]}
        >
          {item.title}
        </Text>

        {/* Subtitle / Professional Business Name: Centered in Muted Tone */}
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[
            styles.proNameText,
            { color: isDark ? '#94A3B8' : '#64748B' },
          ]}
        >
          {proName}
        </Text>
      </View>
    </Animated.View>
  );
}

/**
 * AnimatedCard:
 * Full-width Instagram-style card with 3D perspective tilt, natural lighting,
 * and high-fidelity photo presentation.
 */
function AnimatedCard({
  item,
  index,
  scrollX,
  onSelectItem,
  isDark,
}: {
  item: GigDetail;
  index: number;
  scrollX: SharedValue<number>;
  onSelectItem?: (item: GigDetail) => void;
  isDark: boolean;
}) {
  const coverImage =
    item.coverImages?.[0] ||
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80';
  const startingPrice =
    item.packages?.[0]?.price ?? (item as any)?.price ?? 890;
  const rating = item.professionalProfile?.avgRating
    ? Number(item.professionalProfile.avgRating).toFixed(1)
    : '5.0';

  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SNAP_INTERVAL,
      index * SNAP_INTERVAL,
      (index + 1) * SNAP_INTERVAL,
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.93, 1, 0.93],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [12, 0, 12],
      Extrapolation.CLAMP
    );

    const rotate = interpolate(
      scrollX.value,
      inputRange,
      [-5, 0, 5],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.82, 1, 0.82],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { perspective: 1000 },
        { translateY },
        { rotateY: `${rotate}deg` },
        { scale },
      ],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.cardOuter, animatedStyle]}>
      <ThemedTouchable
        onPress={() => onSelectItem?.(item)}
        haptic="light"
        activeOpacity={0.95}
        style={[
          styles.card,
          {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        {/* Full Card Background Image */}
        <Image
          source={{ uri: coverImage }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />


        {/* Subtle Bottom Scrim for Contrast */}
        <Svg
          width="100%"
          height={90}
          style={styles.bottomGradient}
          pointerEvents="none"
        >
          <Defs>
            <LinearGradient id={`card-scrim-${item.id}-${index}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#000000" stopOpacity="0" />
              <Stop offset="1" stopColor="#000000" stopOpacity="0.45" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height={90} fill={`url(#card-scrim-${item.id}-${index})`} />
        </Svg>

        {/* Floating Bottom Row: Price Tag in White Pill + Circular White Floating Button */}
        <View style={styles.cardFloatingBottomRow} pointerEvents="box-none">
          <View style={styles.pricePill}>
            <Text style={styles.pricePrefix}>Desde </Text>
            <Text style={styles.priceNumber}>{startingPrice} €</Text>
          </View>

          <View style={styles.actionBtn}>
            <Ionicons
              name="arrow-up"
              size={17}
              color="#0F172A"
              style={{ transform: [{ rotate: '45deg' }] }}
            />
          </View>
        </View>
      </ThemedTouchable>
    </Animated.View>
  );
}

/**
 * AnimatedSeeAllCard:
 * Final card inviting the user to explore the full catalog.
 */
function AnimatedSeeAllCard({
  index,
  scrollX,
  onSeeAll,
  isDark,
}: {
  index: number;
  scrollX: SharedValue<number>;
  onSeeAll?: () => void;
  isDark: boolean;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SNAP_INTERVAL,
      index * SNAP_INTERVAL,
      (index + 1) * SNAP_INTERVAL,
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.93, 1, 0.93],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [12, 0, 12],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateY }, { scale }],
    };
  });

  return (
    <Animated.View style={[styles.cardOuter, animatedStyle]}>
      <ThemedTouchable
        onPress={onSeeAll}
        haptic="medium"
        activeOpacity={0.92}
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#18181B' : '#09090B',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 22,
          },
        ]}
      >
        <View
          style={{
            width: 68,
            height: 68,
            borderRadius: 34,
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.18)',
          }}
        >
          <Ionicons name="arrow-forward" size={30} color="#FFFFFF" />
        </View>

        <Text
          style={{
            fontSize: 24,
            fontFamily: 'PlusJakartaSans-ExtraBold',
            color: '#FFFFFF',
            letterSpacing: -0.5,
            textAlign: 'center',
            marginBottom: 6,
          }}
        >
          Ver más
        </Text>

        <Text
          style={{
            fontSize: 13,
            fontFamily: 'PlusJakartaSans-Medium',
            color: '#A1A1AA',
            textAlign: 'center',
            lineHeight: 18,
            maxWidth: 210,
            marginBottom: 20,
          }}
        >
          Explora todos los proyectos y obras verificadas
        </Text>

        <View
          style={{
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 20,
            paddingVertical: 9,
            borderRadius: 999,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Text
            style={{
              fontSize: 12.5,
              fontFamily: 'PlusJakartaSans-Bold',
              color: '#09090B',
            }}
          >
            Explorar todo
          </Text>
          <Ionicons name="arrow-forward" size={14} color="#09090B" />
        </View>
      </ThemedTouchable>
    </Animated.View>
  );
}

export function ChooseCollectionCarousel({
  title = 'Colección Destacada',
  seeAllText = 'Ver todo',
  items = [],
  onSelectItem,
  onSeeAll,
  scrollX,
  style,
}: ChooseCollectionCarouselProps) {
  const { colors, isDark } = useAppTheme();

  // Append a dedicated "Ver más" card at the end of the items
  const carouselItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    return [
      ...items,
      {
        id: '__see_all__',
        title: 'Explorar Todo',
        category: { name: 'Catálogo' },
        professionalProfile: { businessName: 'Todos los proyectos' },
      } as any,
    ];
  }, [items]);

  const internalScrollX = useSharedValue(0);
  const activeScrollX = scrollX || internalScrollX;

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      activeScrollX.value = event.contentOffset.x;
    },
  });

  // Layer: Dynamic ambient background color crossfade
  const bgInputRange = useMemo(
    () => Array.from({ length: carouselItems.length }, (_, i) => i * SNAP_INTERVAL),
    [carouselItems.length]
  );

  const bgColors =
    carouselItems.length > 1
      ? carouselItems.map((_: any, i: number) =>
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

  const ambientBgStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      activeScrollX.value,
      bgInputRange,
      bgColors
    );
    return { backgroundColor };
  });

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.ambientStage, ambientBgStyle, style]}>
      {/* Synchronized Titles Layer: Clean Centered Hierarchy with Mathematical Zero-Overlap */}
      <View style={styles.titleContainer}>
        {carouselItems.map((item: any, index: number) => {
          return (
            <AnimatedTitle
              key={item.id}
              item={item}
              index={index}
              scrollX={activeScrollX}
              isDark={isDark}
            />
          );
        })}
      </View>

      {/* Horizontal Carousel */}
      <Animated.FlatList
        data={carouselItems}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        bounces={false}
        contentContainerStyle={{
          paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2,
          paddingVertical: 10,
        }}
        ItemSeparatorComponent={() => <View style={{ width: SPACING }} />}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          if (item.id === '__see_all__') {
            return (
              <AnimatedSeeAllCard
                index={index}
                scrollX={activeScrollX}
                onSeeAll={onSeeAll}
                isDark={isDark}
              />
            );
          }

          return (
            <AnimatedCard
              item={item}
              index={index}
              scrollX={activeScrollX}
              onSelectItem={onSelectItem}
              isDark={isDark}
            />
          );
        }}
      />

      {/* Bottom Gradient Fade (smooth ambient-to-content transition) */}
      <View style={styles.bottomGradient} pointerEvents="none">
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="ambientBottomFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.background} stopOpacity="0" />
              <Stop offset="0.35" stopColor={colors.background} stopOpacity="0.25" />
              <Stop offset="0.7" stopColor={colors.background} stopOpacity="0.7" />
              <Stop offset="1" stopColor={colors.background} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#ambientBottomFade)" />
        </Svg>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ambientStage: {
    width: '100%',
    paddingTop: 8,
    paddingBottom: 22,
    position: 'relative',
  },
  titleContainer: {
    height: 96,
    position: 'relative',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 18,
    overflow: 'hidden',
  },
  titleAbsolute: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleCenteredCol: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  eyebrowText: {
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: 1.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  mainTitleText: {
    fontSize: 25,
    lineHeight: 31,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    letterSpacing: -0.5,
    marginBottom: 3,
    textAlign: 'center',
  },
  proNameText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'PlusJakartaSans-Medium',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  cardOuter: {
    width: CARD_WIDTH,
  },
  card: {
    width: CARD_WIDTH,
    height: 385,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    padding: 0,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    justifyContent: 'flex-end',
    position: 'relative',
  },
  cardFloatingTopRow: {
    paddingTop: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingVal: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#0F172A',
  },
  cardFloatingBottomRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 10,
  },
  pricePill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pricePrefix: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#64748B',
    marginRight: 2,
  },
  priceNumber: {
    fontSize: 15.5,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    zIndex: 5,
  },
});

export default ChooseCollectionCarousel;
