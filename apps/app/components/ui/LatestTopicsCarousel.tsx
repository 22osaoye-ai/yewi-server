import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ThemedTouchable } from './ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

export interface LatestTopicItem {
  id: string;
  title: string;
  categorySlug?: string;
  imageUrl: string;
  verified?: boolean;
}

const DEFAULT_TOPICS: LatestTopicItem[] = [
  {
    id: 'topic-1',
    title: 'Reformas',
    categorySlug: 'reformas',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    verified: true,
  },
  {
    id: 'topic-2',
    title: 'Electricidad',
    categorySlug: 'electricidad',
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    verified: true,
  },
  {
    id: 'topic-3',
    title: 'Fontanería',
    categorySlug: 'fontaneria',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    verified: true,
  },
  {
    id: 'topic-4',
    title: 'Climatización',
    categorySlug: 'climatizacion',
    imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80',
    verified: true,
  },
  {
    id: 'topic-5',
    title: 'Pintura',
    categorySlug: 'pintura',
    imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=600&q=80',
    verified: true,
  },
];

interface LatestTopicsCarouselProps {
  topics?: LatestTopicItem[];
  onSelectTopic: (topic: LatestTopicItem) => void;
  onShowAll?: () => void;
}

export function LatestTopicsCarousel({
  topics = DEFAULT_TOPICS,
  onSelectTopic,
  onShowAll,
}: LatestTopicsCarouselProps) {
  const { colors, isDark } = useAppTheme();

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Latest Topics
        </Text>
        {onShowAll && (
          <ThemedTouchable
            onPress={onShowAll}
            haptic="light"
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.showAllText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Show All
            </Text>
          </ThemedTouchable>
        )}
      </View>

      {/* Horizontal Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={172}
      >
        {topics.map((topic) => (
          <ThemedTouchable
            key={topic.id}
            onPress={() => onSelectTopic(topic)}
            haptic="selection"
            scaleOnPress
            activeOpacity={0.9}
            style={styles.cardContainer}
            accessibilityRole="button"
            accessibilityLabel={topic.title}
          >
            {/* Background Image */}
            <Image
              source={{ uri: topic.imageUrl }}
              style={styles.cardImage}
              contentFit="cover"
              transition={200}
            />

            {/* Subtle dark vignette overlay */}
            <View style={styles.vignetteOverlay} />

            {/* Verified Badge (Top Right) */}
            {topic.verified && (
              <View style={styles.verifiedBadgeContainer}>
                <View style={styles.verifiedBadgeCircle}>
                  <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                </View>
              </View>
            )}

            {/* Bottom Caption Pill */}
            <View style={styles.bottomCaptionWrapper}>
              <View style={styles.captionFrostedPill}>
                <Text style={styles.captionText} numberOfLines={1}>
                  {topic.title}
                </Text>
              </View>
            </View>
          </ThemedTouchable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -0.4,
  },
  showAllText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingRight: 10,
    gap: 12,
  },
  cardContainer: {
    width: 160,
    height: 175,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    ...StyleSheet.absoluteFill,
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  verifiedBadgeContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 3,
  },
  verifiedBadgeCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  bottomCaptionWrapper: {
    position: 'absolute',
    bottom: 12,
    left: 10,
    right: 10,
    zIndex: 3,
  },
  captionFrostedPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -0.2,
  },
});
