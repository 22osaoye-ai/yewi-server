import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ThemedTouchable } from './ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useSeenStatusesStore } from '@/store/useSeenStatusesStore';
import { AuthorStatusFeedGroup } from '@/services/statusesApi';

interface HomeStatusBarProps {
  stories: AuthorStatusFeedGroup[];
  loading?: boolean;
  onSelectStory: (group: AuthorStatusFeedGroup) => void;
}

export function HomeStatusBar({
  stories,
  loading = false,
  onSelectStory,
}: HomeStatusBarProps) {
  const { colors, isDark } = useAppTheme();
  const isGroupSeen = useSeenStatusesStore((state) => state.isGroupSeen);

  // Si no hay estados disponibles para ver, no renderizar barra vacía
  if (stories.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Historias de Profesionales / Sellers */}
        {stories.map((group) => {
          const hasStories = group.statuses && group.statuses.length > 0;
          if (!hasStories) return null;

          const seen = isGroupSeen(group.statuses.map((s) => s.id));

          return (
            <View key={group.authorId} style={styles.storyItemContainer}>
              <ThemedTouchable
                onPress={() => onSelectStory(group)}
                haptic="medium"
                style={styles.avatarWrapper}
              >
                {/* Ring (Gold if new, subtle gray if already viewed) */}
                <View
                  style={[
                    styles.storyRing,
                    {
                      borderColor: seen
                        ? (isDark ? '#3F3F46' : '#CBD5E1')
                        : colors.primary,
                      borderWidth: seen ? 1.5 : 2.5,
                      opacity: seen ? 0.8 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.innerAvatarRing,
                      { borderColor: isDark ? '#0D0E12' : '#F8FAFC' },
                    ]}
                  >
                    {group.authorAvatar ? (
                      <Image
                        source={{ uri: group.authorAvatar }}
                        style={styles.sellerAvatarImage}
                        contentFit="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.sellerAvatarPlaceholder,
                          { backgroundColor: colors.primaryLight },
                        ]}
                      >
                        <Text
                          style={[
                            styles.sellerInitial,
                            { color: colors.primary },
                          ]}
                        >
                          {(group.businessName || group.authorName || 'Y')
                            .charAt(0)
                            .toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Pro Badge Indicator */}
                {group.isPro && (
                  <View
                    style={[
                      styles.proBadge,
                      {
                        backgroundColor: '#10B981',
                        borderColor: isDark ? '#0D0E12' : '#F8FAFC',
                      },
                    ]}
                  >
                    <Ionicons name="checkmark" size={9} color="#FFFFFF" />
                  </View>
                )}
              </ThemedTouchable>

              <Text
                numberOfLines={1}
                style={[styles.storyLabel, { color: colors.textPrimary }]}
              >
                {group.businessName || group.authorName}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    marginBottom: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 15,
    alignItems: 'center',
  },
  storyItemContainer: {
    alignItems: 'center',
    width: 68,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 5,
  },
  storyRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerAvatarRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  sellerAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerInitial: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },
  proBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyLabel: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans-Medium',
    textAlign: 'center',
    width: '100%',
  },
});
