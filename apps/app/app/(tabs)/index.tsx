import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  FadeInDown,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { useAuth, useUser } from '@clerk/expo';

import { useAuthStore } from '@/store/useAuthStore';
import { useRealtimeStore } from '@/store/useRealtimeStore';
import { useAppTheme } from '@/hooks/useAppTheme';
import { gigsApi, GigDetail } from '@/services/gigsApi';
import { AppHeader } from '@/components/ui/AppHeader';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { isUserProfessional } from '@/hooks/useUserRole';
import { PublishBottomSheet } from '@/components/ui/PublishBottomSheet';
import { ChooseCollectionCarousel } from '@/components/ui/ChooseCollectionCarousel';
import { ExclusiveOffersBanner, DEFAULT_PRO_OFFER, ProfessionalOfferData } from '@/components/ui/ExclusiveOffersBanner';
import { CategoryLookbookCarousel } from '@/components/ui/CategoryLookbookCarousel';
import { SAMPLE_PROJECTS } from '@/constants/sampleData';
import { promotionsApi, SellerPromotion } from '@/services/promotionsApi';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { user, isLoading: isAuthStoreLoading } = useAuthStore();
  const { isLoaded: isClerkLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const unreadCount = useRealtimeStore((state) => state.unreadCount);
  const unseenLeadsCount = useRealtimeStore((state) => state.unseenLeadsCount);

  const isCurrentUserPro = isUserProfessional(user);

  // Determine if user identity is currently loading or synchronizing (shows skeletons)
  const isUserLoading =
    isAuthStoreLoading ||
    !isClerkLoaded ||
    Boolean(isSignedIn && !user && !clerkUser?.firstName);

  // Reanimated UI-thread shared value driving the collapsible header
  const scrollY = useSharedValue(0);
  // Shared value synchronizing carousel horizontal swipe with header background color
  const carouselScrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const [featuredProjects, setFeaturedProjects] = useState<GigDetail[]>(SAMPLE_PROJECTS);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [activePromotion, setActivePromotion] = useState<SellerPromotion | null>(null);

  const [isPublishActionSheetOpen, setIsPublishActionSheetOpen] = useState(false);

  useEffect(() => {
    gigsApi.getCachedGigs().then((cached) => {
      if (cached && cached.length > 0) {
        setFeaturedProjects(cached.slice(0, 10));
      }
    }).catch(() => {});
  }, []);

  const fetchFeaturedProjects = useCallback(async () => {
    try {
      const data = await gigsApi.getAll({ limit: 10 });
      if (Array.isArray(data) && data.length > 0) {
        setFeaturedProjects(data);
      }
    } catch {
      // Keep existing cached data
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const fetchPromotions = useCallback(async () => {
    try {
      const promos = await promotionsApi.getActivePromotions();
      if (Array.isArray(promos) && promos.length > 0) {
        setActivePromotion(promos[0]);
      } else {
        setActivePromotion(null);
      }
    } catch {
      setActivePromotion(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFeaturedProjects();
      fetchPromotions();
    }, [fetchFeaturedProjects, fetchPromotions])
  );

  const handleSearchPress = (query?: string) => {
    router.push({
      pathname: '/(tabs)/search',
      params: query ? { q: query } : undefined,
    });
  };

  const displayProjects = useMemo((): GigDetail[] => {
    if (featuredProjects.length > 0) {
      return featuredProjects;
    }
    return SAMPLE_PROJECTS;
  }, [featuredProjects]);

  const offerData: ProfessionalOfferData = useMemo(() => {
    if (activePromotion) {
      const pct = activePromotion.discountPercent || 20;
      return {
        id: activePromotion.id,
        eyebrow: activePromotion.isPermanent ? 'OFERTA PERMANENTE' : 'OFERTA LIMITADA',
        title: `-${pct}% DTO.`,
        subtitle: activePromotion.title || 'Descuento Profesional',
        discount: `-${pct}%`,
        discountedPrice: 'Descuento directo',
        originalPrice: activePromotion.professional?.name || 'Profesional Top',
        ctaText: 'Aprovechar',
      };
    }
    return DEFAULT_PRO_OFFER;
  }, [activePromotion]);

  const greetingName = useMemo(() => {
    if (isUserLoading) return undefined;
    const name =
      user?.firstName ||
      clerkUser?.firstName ||
      user?.email?.split('@')[0] ||
      clerkUser?.primaryEmailAddress?.emailAddress?.split('@')[0];
    if (!name || name.toLowerCase() === 'hola') return undefined;
    return name;
  }, [user, clerkUser, isUserLoading]);

  const avatarUri = user?.avatarUrl || clerkUser?.imageUrl || (user as any)?.profile?.avatarUrl;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Sleek Minimalist AppHeader: Avatar + Greeting on Left, Search + Notifications on Right */}
      <AppHeader
        title="Yewi"
        isLoading={isUserLoading}
        greeting={greetingName ? `Hola, ${greetingName} 👋` : undefined}
        avatarUri={avatarUri}
        avatarInitial={greetingName}
        isOnline={true}
        onAvatarPress={() => router.push('/(tabs)/profile')}
        scrollY={scrollY}
        carouselScrollX={carouselScrollX}
        carouselItemCount={displayProjects.length + 1}
        onSearchPress={() => router.push('/(tabs)/search')}
        onNotificationsPress={() => router.push('/notifications')}
        notificationsIcon="bell"
        notificationsCount={unreadCount}
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 70,
          paddingBottom: 120,
        }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* 1. Colección Destacada 3D Reanimated (Directamente debajo del Header) */}
        <Animated.View
          entering={FadeInDown.duration(240).delay(20).easing(Easing.out(Easing.cubic))}
        >
          <ChooseCollectionCarousel
            items={displayProjects}
            scrollX={carouselScrollX}
            onSelectItem={(item) =>
              router.push({
                pathname: '/detail',
                params: { id: item.id, entityType: 'gig' },
              })
            }
            onSeeAll={() =>
              router.push({
                pathname: '/(tabs)/search',
                params: { tab: 'projects' },
              })
            }
          />
        </Animated.View>

        {/* 2. Card de Oferta Exclusiva con Descuento Real */}
        <Animated.View
          entering={FadeInDown.duration(220).delay(40).easing(Easing.out(Easing.cubic))}
        >
          <ExclusiveOffersBanner
            offer={offerData}
            onCtaPress={() => {
              Haptics.selectionAsync().catch(() => {});
              if (activePromotion?.professional?.id) {
                router.push({
                  pathname: '/detail',
                  params: { id: activePromotion.professional.id, entityType: 'professional' },
                });
              } else {
                router.push({
                  pathname: '/(tabs)/search',
                  params: { tab: 'projects', q: 'reforma' },
                });
              }
            }}
          />
        </Animated.View>

        {/* 3. Categorías / Especialidades Lookbook */}
        <Animated.View
          entering={FadeInDown.duration(220).delay(60).easing(Easing.out(Easing.cubic))}
        >
          <CategoryLookbookCarousel
            title="Especialidades"
            seeAllText="Ver todo"
            onSelectCategory={(category) => {
              router.push({
                pathname: '/(tabs)/search',
                params: { category },
              });
            }}
            onSeeAll={() => {
              router.push({
                pathname: '/(tabs)/search',
                params: { tab: 'categories' },
              });
            }}
          />
        </Animated.View>
      </Animated.ScrollView>

      {/* BottomSheet: Publicar solicitud o servicio */}
      <PublishBottomSheet
        visible={isPublishActionSheetOpen}
        onClose={() => setIsPublishActionSheetOpen(false)}
        onSelectRequest={() => {
          if (!isCurrentUserPro) {
            router.push({ pathname: '/publish', params: { type: 'request' } });
          }
        }}
        onSelectProject={() => router.push({ pathname: '/publish', params: { type: 'service' } })}
      />
    </View>
  );
}

const styles = StyleSheet.create({});
