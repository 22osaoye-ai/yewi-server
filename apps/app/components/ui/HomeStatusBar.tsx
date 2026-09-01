import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ThemedTouchable } from './ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuthStore } from '@/store/useAuthStore';
import { useSeenStatusesStore } from '@/store/useSeenStatusesStore';
import { AuthorStatusFeedGroup } from '@/services/statusesApi';

interface HomeStatusBarProps {
  stories: AuthorStatusFeedGroup[];
  loading?: boolean;
  onSelectStory: (group: AuthorStatusFeedGroup) => void;
  onAddStoryPress: () => void;
}

export function HomeStatusBar({
  stories,
  loading = false,
  onSelectStory,
  onAddStoryPress,
}: HomeStatusBarProps) {
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();
  const isGroupSeen = useSeenStatusesStore((state) => state.isGroupSeen);

  const isCurrentUserPro = Boolean(user?.isPro || (user as any)?.professionalProfile?.isPro);
  const myAvatar = user?.avatarUrl;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Tu Estado (Crear o Ver si es Pro) */}
        <View style={styles.storyItemContainer}>
          <ThemedTouchable
            onPress={onAddStoryPress}
            haptic="medium"
            style={styles.avatarWrapper}
          >
            <View
              style={[
                styles.avatarCircle,
                {
                  borderColor: isDark ? '#27272A' : '#E4E4E7',
                  backgroundColor: isDark ? '#1F2432' : '#F1F5F9',
                },
              ]}
            >
              {myAvatar ? (
                <Image
                  source={{ uri: myAvatar }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <View
                  style={[
                    styles.avatarPlaceholder,
                    { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Ionicons name="person" size={24} color={colors.primary} />
                </View>
              )}
            </View>

            {/* Plus Icon Badge */}
            <View
              style={[
                styles.plusBadge,
                {
                  backgroundColor: colors.primary,
                  borderColor: isDark ? '#0D0E12' : '#F8FAFC',
                },
              ]}
            >
              <Ionicons name="add" size={13} color="#FFFFFF" />
            </View>
          </ThemedTouchable>

          <Text
            numberOfLines={1}
            style={[styles.storyLabel, { color: colors.textPrimary }]}
          >
            Tu estado
          </Text>
        </View>

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
  avatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontFamily: 'Satoshi-Black',
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
    fontFamily: 'Satoshi-Medium',
    textAlign: 'center',
    width: '100%',
  },
});
