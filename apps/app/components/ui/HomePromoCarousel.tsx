import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useRouter, useFocusEffect } from 'expo-router';
import { promotionsApi, SellerPromotion } from '@/services/promotionsApi';
import { useAuthStore } from '@/store/useAuthStore';

export interface PromoAdData {
  id: string;
  badge?: string;
  title: string;
  description: string;
  ctaText?: string;
  discountBadge?: string;
  category?: string;
  imageUrl?: string;
  professionalId?: string;
  professionalUserId?: string;
  professionalName?: string;
  professionalAvatar?: string;
}

const CARD_HEIGHT = 188;

export function HomePromoBannerCard({
  ad,
  cardWidth,
  onPress,
}: {
  ad: PromoAdData;
  cardWidth: number;
  onPress?: () => void;
}) {
  const { isDark } = useAppTheme();
  const bgImage = ad.imageUrl || ad.professionalAvatar || null;

  return (
    <ThemedTouchable
      onPress={onPress}
      haptic="medium"
      activeOpacity={0.92}
      style={[
        styles.promoCardContainer,
        {
          width: cardWidth,
          height: CARD_HEIGHT,
          backgroundColor: isDark ? '#1C1C22' : '#27272A',
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${ad.title}, ${ad.description}`}
    >
      {/* Background Image (If provided by the professional) */}
      {bgImage && (
        <Image
          source={{ uri: bgImage }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      )}

      {/* Subtle Dark Vignette Gradient Overlay (Shop by Mobbin style) */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id={`cardVignette-${ad.id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#000000" stopOpacity="0.35" />
            <Stop offset="40%" stopColor="#000000" stopOpacity="0.1" />
            <Stop offset="65%" stopColor="#000000" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0.85" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#cardVignette-${ad.id})`} />
      </Svg>

      {/* Top Badge (if any discount badge defined in DB) */}
      <View style={styles.cardTopRow}>
        {ad.discountBadge ? (
          <View style={styles.cardDiscountBadge}>
            <Text style={styles.cardDiscountText}>{ad.discountBadge}</Text>
          </View>
        ) : ad.badge ? (
          <View style={styles.cardDiscountBadge}>
            <Text style={styles.cardDiscountText}>{ad.badge}</Text>
          </View>
        ) : null}
      </View>

      {/* Bottom Content Row (Exact Shop by Mobbin Layout) */}
      <View style={styles.cardBottomRow}>
        <View style={styles.cardTextCol}>
          <Text numberOfLines={1} style={styles.cardTitleText}>
            {ad.title}
          </Text>
          {Boolean(ad.description) && (
            <Text numberOfLines={1} style={styles.cardSubtitleText}>
              {ad.description}
            </Text>
          )}
        </View>

        {/* Circular Translucent Glass Arrow Button */}
        <View style={styles.circularGlassArrow}>
          <Feather name="arrow-right" size={18} color="#FFFFFF" />
        </View>
      </View>
    </ThemedTouchable>
  );
}

export function HomePromoCarousel() {
  const router = useRouter();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();

  const [promosList, setPromosList] = useState<PromoAdData[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<any>(null);

  const cardWidth = Math.min(SCREEN_WIDTH - 44, 440);
  const cardGap = 12;
  const snapInterval = cardWidth + cardGap;

  // CERO DATOS INVENTADOS: Only fetch genuine promotions from the database
  const fetchPromos = useCallback(async () => {
    try {
      const data = await promotionsApi.getActivePromotions();
      if (data && Array.isArray(data) && data.length > 0) {
        const currentUserId = useAuthStore.getState().user?.id;
        const validPromos = data.filter(
          (item: SellerPromotion) =>
            !currentUserId || item.professional?.userId !== currentUserId
        );

        const mapped: PromoAdData[] = validPromos.map((item: SellerPromotion) => ({
          id: item.id,
          badge: item.badge || undefined,
          title: item.title,
          description: item.description,
          discountBadge: item.discountPercent
            ? `-${item.discountPercent}%`
            : item.discountAmount
            ? `-${item.discountAmount}€`
            : undefined,
          ctaText: 'Solicitar',
          category: item.category || undefined,
          professionalId: item.professional?.id,
          professionalUserId: item.professional?.userId,
          professionalName: item.professional?.name,
          professionalAvatar: item.professional?.avatarUrl || undefined,
        }));
        setPromosList(mapped);
      } else {
        setPromosList([]);
      }
    } catch {
      setPromosList([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPromos();
    }, [fetchPromos])
  );

  useEffect(() => {
    fetchPromos();
  }, [fetchPromos]);

  const handlePromoPress = (promo: PromoAdData) => {
    const currentUserId = user?.id;
    if (promo.professionalUserId && currentUserId && promo.professionalUserId === currentUserId) {
      router.push('/(tabs)/profile');
      return;
    }

    const targetId = promo.professionalUserId || promo.professionalId;
    if (targetId) {
      const discountTxt = promo.discountBadge ? ` con descuento de ${promo.discountBadge}` : '';
      const initialMessage = `¡Hola! He visto tu promoción "${promo.title}"${discountTxt} en Yewi y estoy interesado en solicitarla. ¿Podrías darme más información?`;
      router.push({
        pathname: '/chat',
        params: {
          id: targetId,
          targetName: promo.professionalName || promo.title,
          initialMessage,
        },
      });
    } else {
      router.push('/(tabs)/requests');
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / snapInterval);
    if (index >= 0 && index < promosList.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  // If there are no real promotions in the database, render NOTHING.
  if (promosList.length === 0) {
    return null;
  }

  return (
    <View style={{ width: '100%', marginTop: 8, marginBottom: 14 }}>
      {/* 60FPS HORIZONTAL SNAP CAROUSEL */}
      <Animated.FlatList
        ref={flatListRef}
        data={promosList}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapInterval}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum={true}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingHorizontal: 22,
          gap: cardGap,
          paddingVertical: 2,
        }}
        keyExtractor={(item, index) => item.id || `promo-card-${index}`}
        renderItem={({ item }) => (
          <HomePromoBannerCard
            ad={item}
            cardWidth={cardWidth}
            onPress={() => handlePromoPress(item)}
          />
        )}
      />

      {/* PAGINATION DOTS INDICATOR */}
      {promosList.length > 1 && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 10,
            gap: 5,
          }}
        >
          {promosList.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === activeIndex ? 16 : 5,
                height: 5,
                borderRadius: 2.5,
                backgroundColor:
                  i === activeIndex
                    ? colors.primary
                    : isDark
                    ? '#3F3F46'
                    : '#D4D4D8',
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  promoCardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardDiscountBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 999,
  },
  cardDiscountText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    letterSpacing: 0.5,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTextCol: {
    flex: 1,
  },
  cardTitleText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    letterSpacing: -0.4,
  },
  cardSubtitleText: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Medium',
    marginTop: 2,
    lineHeight: 17,
  },
  circularGlassArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomePromoCarousel;
