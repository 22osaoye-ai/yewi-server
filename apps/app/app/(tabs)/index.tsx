import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { CATEGORIES_LIST } from '@/constants/categories';
import { useAuthStore } from '@/store/useAuthStore';
import { useRealtimeStore } from '@/store/useRealtimeStore';
import { TypewriterText } from '@/components/ui/TypewriterText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { HomePromoCarousel } from '@/components/ui/HomePromoCarousel';
import { ServiceActivityCard } from '@/components/ui/ServiceActivityCard';
import { gigsApi, GigDetail } from '@/services/gigsApi';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { HomeStatusBar } from '@/components/ui/HomeStatusBar';
import { StatusViewerModal } from '@/components/chat/StatusViewerModal';
import { CreateStatusModal } from '@/components/chat/CreateStatusModal';
import { statusesApi, AuthorStatusFeedGroup } from '@/services/statusesApi';
import { realtimeService } from '@/services/realtimeService';

const SEARCH_PLACEHOLDERS = [
  'Buscar electricistas urgentes...',
  'Buscar fontanería y desatascos...',
  'Buscar reformas de baños y cocinas...',
  'Buscar pintores profesionales...',
  'Buscar climatización y aire...',
  'Buscar cerrajeros 24h...',
  'Buscar carpintería a medida...',
];

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();
  const unreadCount = useRealtimeStore((state) => state.unreadCount);

  const [featuredProjects, setFeaturedProjects] = useState<GigDetail[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const [stories, setStories] = useState<AuthorStatusFeedGroup[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [selectedStoryGroup, setSelectedStoryGroup] = useState<AuthorStatusFeedGroup | null>(null);
  const [isCreateStatusOpen, setIsCreateStatusOpen] = useState(false);

  const fetchStories = useCallback(async () => {
    try {
      setLoadingStories(true);
      const feed = await statusesApi.getFeed();
      setStories(Array.isArray(feed) ? feed : []);
    } catch {
      setStories([]);
    } finally {
      setLoadingStories(false);
    }
  }, []);

  const fetchFeaturedProjects = useCallback(async () => {
    try {
      setLoadingProjects(true);
      const data = await gigsApi.getAll({ limit: 6 });
      setFeaturedProjects(Array.isArray(data) ? data : []);
    } catch {
      setFeaturedProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFeaturedProjects();
      fetchStories();
    }, [fetchFeaturedProjects, fetchStories])
  );

  useEffect(() => {
    fetchFeaturedProjects();
    fetchStories();
  }, [fetchFeaturedProjects, fetchStories]);

  // Realtime subscription for instant story updates
  useEffect(() => {
    const unsub = realtimeService.on('status:new', (data) => {
      if (data?.authorGroup) {
        setStories((prev) => {
          const filtered = prev.filter((g) => g.authorId !== data.authorGroup.authorId);
          return [data.authorGroup, ...filtered];
        });
      } else {
        fetchStories();
      }
    });

    return () => {
      unsub();
    };
  }, [fetchStories]);

  const handleSearchPress = (query?: string) => {
    router.push({
      pathname: '/(tabs)/search',
      params: query ? { q: query } : undefined,
    });
  };

  const handleCategoryDirectPress = (categoryName: string) => {
    router.push({
      pathname: '/(tabs)/search',
      params: { category: categoryName },
    });
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 50, paddingBottom: 130 }}
      >
        {/* Top Header with App Name Yewi. and Notification Bell + Avatar */}
        <View className="flex-row justify-between items-center px-[22px] mb-[18px]">
          <View className="flex-row items-center">
            <Text
              style={{
                fontSize: 30,
                fontFamily: 'Satoshi-Black',
                color: colors.textPrimary,
                letterSpacing: -0.8,
              }}
            >
              Yewi
            </Text>
            <Text
              style={{
                fontSize: 30,
                fontFamily: 'Satoshi-Black',
                color: colors.primary,
              }}
            >
              .
            </Text>
          </View>

          <View className="flex-row items-center gap-3">
            {/* Notification Bell Icon */}
            <ThemedTouchable
              onPress={() => router.push('/notifications')}
              haptic="light"
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.border,
                position: 'relative',
              }}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={colors.textPrimary}
              />
              {unreadCount > 0 && (
                <View
                  style={{
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
                    borderColor: colors.background,
                  }}
                >
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 10,
                      fontFamily: 'Satoshi-Black',
                      lineHeight: 12,
                    }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </ThemedTouchable>

            {/* User Avatar */}
            <ThemedTouchable
              onPress={() => router.push('/(tabs)/profile')}
              haptic="light"
              className="relative"
            >
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    borderWidth: 2,
                    borderColor: colors.primary,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.primaryLight,
                    borderWidth: 2,
                    borderColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="person" size={20} color={colors.primary} />
                </View>
              )}
              <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#10B981] border-2 border-white" />
            </ThemedTouchable>
          </View>
        </View>

        {/* Stories / Statuses Bar (Instagram Style with Yewi Design) */}
        <HomeStatusBar
          stories={stories}
          loading={loadingStories}
          onSelectStory={(group) => setSelectedStoryGroup(group)}
          onAddStoryPress={() => setIsCreateStatusOpen(true)}
        />


        {/* Search Bar Touchable */}
        <View className="flex-row items-center px-[22px] mb-2">
          <ThemedTouchable
            onPress={() => handleSearchPress()}
            haptic="light"
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderRadius: 999,
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderWidth: 1,
              borderColor: colors.border,
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isDark ? 0.2 : 0.05,
              shadowRadius: 4,
            }}
          >
            <Ionicons
              name="search-outline"
              size={22}
              color={colors.textMuted}
            />
            <TypewriterText
              phrases={SEARCH_PLACEHOLDERS}
              style={{
                marginLeft: 8,
                fontSize: 14.5,
                color: colors.textSecondary,
                fontFamily: 'Satoshi-Bold',
              }}
              cursorColor={colors.primary}
              typingSpeed={60}
              deletingSpeed={30}
              pauseTime={1600}
            />
          </ThemedTouchable>
        </View>

        {/* Home Promo Stacked Carousel (10 Promos + 11th See More Promos Card) */}
        <HomePromoCarousel />

        {/* Section Header */}
        <View className="flex-row justify-between items-center px-[22px] mt-2 mb-3.5">
          <View>
            <Text
              style={{
                fontSize: 20,
                fontFamily: 'Satoshi-Black',
                color: colors.textPrimary,
                letterSpacing: -0.4,
              }}
            >
              Categorías Destacadas
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Satoshi-Medium',
                color: colors.textSecondary,
                marginTop: 1,
              }}
            >
              Servicios profesionales para tu hogar
            </Text>
          </View>
          <ThemedTouchable
            onPress={() => handleSearchPress()}
            haptic="light"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surfaceAlt,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 16,
              borderWidth: isDark ? 1 : 0,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Satoshi-Bold',
                color: colors.textPrimary,
                marginRight: 4,
              }}
            >
              Ver todas
            </Text>
            <Ionicons
              name="arrow-forward"
              size={14}
              color={colors.textPrimary}
            />
          </ThemedTouchable>
        </View>

        {/* Top 3 Service Activity Cards (Horizontal Scroll to fit without vertical page scroll) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 22,
            paddingTop: 4,
            paddingBottom: 14,
          }}
        >
          {CATEGORIES_LIST.slice(0, 3).map((cat, index) => {
            const PALETTE = [
              { cardBg: '#DED4F5' },
              { cardBg: '#FEF3C7' },
              { cardBg: '#E0F2FE' },
            ];

            const styleConfig = PALETTE[index % PALETTE.length];

            return (
              <ServiceActivityCard
                key={cat.id}
                item={{
                  id: cat.id,
                  name: cat.name,
                  slug: cat.slug,
                  cardBg: styleConfig.cardBg,
                  iconColor: '#C87D20',
                }}
                onPress={() => handleCategoryDirectPress(cat.name)}
              />
            );
          })}
        </ScrollView>

        {/* Section: Trabajos y Proyectos Destacados (Real Gigs Published by Sellers) */}
        {featuredProjects.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <View className="flex-row justify-between items-center px-[22px] mb-3">
              <View>
                <Text
                  style={{
                    fontSize: 20,
                    fontFamily: 'Satoshi-Black',
                    color: colors.textPrimary,
                    letterSpacing: -0.4,
                  }}
                >
                  Proyectos a Precio Cerrado
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Satoshi-Medium',
                    color: colors.textSecondary,
                    marginTop: 1,
                  }}
                >
                  Servicios y reformas con plazo y precio cerrado
                </Text>
              </View>
              <ThemedTouchable
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/search',
                    params: { tab: 'projects' },
                  })
                }
                haptic="light"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.surfaceAlt,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 16,
                  borderWidth: isDark ? 1 : 0,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Satoshi-Bold',
                    color: colors.textPrimary,
                    marginRight: 4,
                  }}
                >
                  Ver todos
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={14}
                  color={colors.textPrimary}
                />
              </ThemedTouchable>
            </View>

            <View style={{ paddingHorizontal: 22 }}>
              {featuredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onPress={() =>
                    router.push({
                      pathname: '/detail',
                      params: { id: project.id, entityType: 'gig' },
                    })
                  }
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Visor de Historias Inmersivo */}
      <StatusViewerModal
        visible={Boolean(selectedStoryGroup)}
        storyGroup={selectedStoryGroup}
        onClose={() => setSelectedStoryGroup(null)}
        onStoryUpdated={fetchStories}
      />

      {/* Modal de Publicación de Estado (Yewi Pro) */}
      <CreateStatusModal
        visible={isCreateStatusOpen}
        onClose={() => setIsCreateStatusOpen(false)}
        onStatusCreated={fetchStories}
      />
    </View>
  );
}
