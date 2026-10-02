import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from './ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

import { getScoopedCardPath } from './ScoopedCard';

export const CARD_WIDTH = 200;
export const CARD_HEIGHT = 240;

export const CARD_CUTOUT_PATH = getScoopedCardPath(CARD_WIDTH, CARD_HEIGHT);

export interface CategoryLookbookItem {
  id: string;
  name: string;
  categoryFilter: string;
  bgColorLight: string;
  bgColorDark: string;
  pillBgLight: string;
  accentColor: string;
  iconName: keyof typeof Ionicons.glyphMap;
}

export const LOOKBOOK_CATEGORIES: CategoryLookbookItem[] = [
  {
    id: 'cat-reformas',
    name: 'Reformas',
    categoryFilter: 'Reformas',
    bgColorLight: '#93C5FD', // Soft Sky Blue
    bgColorDark: '#1E3A5F',
    pillBgLight: '#FFFFFF',
    accentColor: '#1D4ED8',
    iconName: 'construct',
  },
  {
    id: 'cat-electricidad',
    name: 'Electricidad',
    categoryFilter: 'Electricidad',
    bgColorLight: '#FDE68A', // Soft Warm Amber
    bgColorDark: '#451A03',
    pillBgLight: '#FFFFFF',
    accentColor: '#B45309',
    iconName: 'flash',
  },
  {
    id: 'cat-fontaneria',
    name: 'Fontanería',
    categoryFilter: 'Fontanería',
    bgColorLight: '#C7D2FE', // Soft Indigo Mist
    bgColorDark: '#312E81',
    pillBgLight: '#FFFFFF',
    accentColor: '#4338CA',
    iconName: 'water',
  },
  {
    id: 'cat-clima',
    name: 'Climatización',
    categoryFilter: 'Climatización',
    bgColorLight: '#99F6E4', // Soft Aqua / Mint
    bgColorDark: '#134E4A',
    pillBgLight: '#FFFFFF',
    accentColor: '#0F766E',
    iconName: 'snow',
  },
  {
    id: 'cat-pintura',
    name: 'Pintura',
    categoryFilter: 'Pintura',
    bgColorLight: '#E9D5FF', // Soft Lilac / Lavender
    bgColorDark: '#581C87',
    pillBgLight: '#FFFFFF',
    accentColor: '#7E22CE',
    iconName: 'color-palette',
  },
];

/**
 * Static Category Icon with clean subtle ambient halo.
 * Auto-animation completely removed per user instruction: "quita la autoanimación".
 */
function StaticCategoryIcon({
  iconName,
  accentColor,
  isDark,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  accentColor: string;
  isDark: boolean;
}) {
  return (
    <View style={styles.iconAreaWrapper}>
      {/* Soft Ambient Halo */}
      <View
        style={[
          styles.ambientHalo,
          {
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(255, 255, 255, 0.55)',
          },
        ]}
      />

      {/* Main Static Category Icon */}
      <View style={styles.iconMainContainer}>
        <Ionicons name={iconName} size={48} color={accentColor} />
      </View>
    </View>
  );
}

export interface CategoryLookbookCarouselProps {
  title?: string;
  seeAllText?: string;
  onSelectCategory?: (category: string) => void;
  onSeeAll?: () => void;
}

export function CategoryLookbookCarousel({
  title = 'Especialidades',
  seeAllText = 'Ver todo',
  onSelectCategory,
  onSeeAll,
}: CategoryLookbookCarouselProps) {
  const { colors, isDark } = useAppTheme();

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {title}
        </Text>
        {onSeeAll && (
          <ThemedTouchable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onSeeAll();
            }}
            haptic="light"
            style={styles.seeAllBtn}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              {seeAllText}
            </Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </ThemedTouchable>
        )}
      </View>

      {/* Horizontal Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
      >
        {LOOKBOOK_CATEGORIES.map((cat) => {
          const cardBg = isDark ? cat.bgColorDark : cat.bgColorLight;
          const pillBg = isDark ? '#1E293B' : cat.pillBgLight;
          const textColor = isDark ? '#FFFFFF' : '#0F172A';

          return (
            <ThemedTouchable
              key={cat.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onSelectCategory?.(cat.categoryFilter);
              }}
              haptic="light"
              activeOpacity={0.92}
              style={styles.cardContainer}
            >
              {/* Scooped Cutout Background Card Shape - Leaves open hole at bottom-left */}
              <Svg
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}
                style={StyleSheet.absoluteFill}
              >
                <Path d={CARD_CUTOUT_PATH} fill={cardBg} />
              </Svg>

              {/* Upper Area: Static Vector Icon */}
              <View style={styles.iconArea}>
                <StaticCategoryIcon
                  iconName={cat.iconName}
                  accentColor={cat.accentColor}
                  isDark={isDark}
                />
              </View>

              {/* Circular Black Button nestled in the cutout hole */}
              <View style={styles.circularBtn}>
                <Ionicons
                  name="arrow-up"
                  size={18}
                  color="#FFFFFF"
                  style={{ transform: [{ rotate: '45deg' }] }}
                />
              </View>

              {/* Category Pill: Full width, centered text, auto-fitted, maximum legibility */}
              <View
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: pillBg,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                    borderWidth: 1,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  style={[
                    styles.categoryName,
                    { color: textColor },
                  ]}
                >
                  {cat.name}
                </Text>
              </View>
            </ThemedTouchable>
          );
        })}

        {/* Card 6: "Ver más" Card at the end */}
        <ThemedTouchable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            onSeeAll?.();
          }}
          haptic="medium"
          activeOpacity={0.92}
          style={styles.cardContainer}
        >
          {/* Scooped Cutout Background Card Shape in Dark Charcoal */}
          <Svg
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}
            style={StyleSheet.absoluteFill}
          >
            <Path d={CARD_CUTOUT_PATH} fill={isDark ? '#18181B' : '#09090B'} />
          </Svg>

          {/* Upper Area: Static Grid Icon */}
          <View style={styles.iconArea}>
            <StaticCategoryIcon
              iconName="grid-outline"
              accentColor="#FFFFFF"
              isDark={isDark}
            />
          </View>

          {/* Circular Button in Cutout */}
          <View style={[styles.circularBtn, { backgroundColor: '#27272A' }]}>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </View>

          {/* Pill with 'Ver más' */}
          <View
            style={[
              styles.categoryPill,
              {
                backgroundColor: isDark ? '#27272A' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                borderWidth: 1,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              style={[
                styles.categoryName,
                { color: isDark ? '#FFFFFF' : '#09090B' },
              ]}
            >
              Ver más
            </Text>
          </View>
        </ThemedTouchable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 14,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -0.4,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  seeAllText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    position: 'relative',
  },
  iconArea: {
    width: CARD_WIDTH,
    height: 165,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 14,
  },
  iconAreaWrapper: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ambientHalo: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
  },
  iconMainContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularBtn: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#111113',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryPill: {
    position: 'absolute',
    left: 58,
    right: 8,
    bottom: 8,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    zIndex: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  categoryName: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
});

export default CategoryLookbookCarousel;
