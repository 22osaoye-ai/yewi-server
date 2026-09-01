import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Animated,
  PanResponder,
  Easing,
  ActivityIndicator,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  G,
  Rect,
  Line,
} from 'react-native-svg';
import { Ionicons, Feather } from '@expo/vector-icons';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useRouter, useFocusEffect } from 'expo-router';
import { promotionsApi, SellerPromotion } from '@/services/promotionsApi';

export interface PromoAdData {
  id: string;
  badge?: string;
  title: string;
  description: string;
  ctaText?: string;
  discountBadge?: string;
  variant?: 'promo' | 'seller' | 'pro';
  category?: string;
  bgGradStart?: string;
  bgGradEnd?: string;
  professionalId?: string;
  professionalUserId?: string;
  professionalName?: string;
}

const CARD_HEIGHT = 178;

export function HomePromoBannerCard({
  ad,
  cardWidth,
  onPress,
  onCtaPress,
}: {
  ad: PromoAdData;
  cardWidth: number;
  onPress?: () => void;
  onCtaPress?: () => void;
}) {
  const { isDark } = useAppTheme();

  const w = cardWidth;
  const h = CARD_HEIGHT;
  const cornerR = 24;
  const notchR = 14;
  const centerY = h / 2;
  const dashedX = w - 106;

  const ticketPath = `
    M 0, ${cornerR}
    A ${cornerR},${cornerR} 0 0,1 ${cornerR},0
    L ${w - cornerR},0
    A ${cornerR},${cornerR} 0 0,1 ${w},${cornerR}
    L ${w},${centerY - notchR}
    A ${notchR},${notchR} 0 0,0 ${w},${centerY + notchR}
    L ${w},${h - cornerR}
    A ${cornerR},${cornerR} 0 0,1 ${w - cornerR},${h}
    L ${cornerR},${h}
    A ${cornerR},${cornerR} 0 0,1 0,${h - cornerR}
    L 0,${centerY + notchR}
    A ${notchR},${notchR} 0 0,0 0,${centerY - notchR}
    Z
  `;

  const bgStart = isDark ? '#2D1B4E' : ad.bgGradStart || '#E8D5F5';
  const bgEnd = isDark ? '#23153D' : ad.bgGradEnd || '#E0CCF2';

  return (
    <View style={{ width: w, height: h, position: 'relative' }}>
      {/* SVG Ticket Background with Cutouts */}
      <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={`grad-${ad.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={bgStart} />
            <Stop offset="100%" stopColor={bgEnd} />
          </LinearGradient>
          <LinearGradient id={`trophy-${ad.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FDE047" />
            <Stop offset="100%" stopColor="#EAB308" />
          </LinearGradient>
        </Defs>

        <Path
          d={ticketPath}
          fill={`url(#grad-${ad.id})`}
          stroke={isDark ? '#4C2D7E' : 'rgba(255, 255, 255, 0.85)'}
          strokeWidth={1.5}
        />

        {/* Vertical Coupon Dashed Line */}
        <Line
          x1={dashedX}
          y1={14}
          x2={dashedX}
          y2={h - 14}
          stroke={isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(124, 58, 237, 0.2)'}
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />

        {/* Sunburst Rays */}
        <G opacity={isDark ? 0.15 : 0.24} stroke={isDark ? '#FFFFFF' : '#8B5CF6'} strokeWidth="1.2">
          <Line x1={dashedX + 45} y1={centerY} x2={dashedX - 60} y2={20} strokeDasharray="3,3" />
          <Line x1={dashedX + 45} y1={centerY} x2={dashedX - 80} y2={60} />
          <Line x1={dashedX + 45} y1={centerY} x2={dashedX - 70} y2={100} strokeDasharray="3,3" />
          <Line x1={dashedX + 45} y1={centerY} x2={dashedX - 40} y2={140} />
        </G>

        <Circle
          cx={dashedX + 45}
          cy={centerY}
          r="46"
          fill={isDark ? '#4C2D7E' : '#FCE7F3'}
          opacity={isDark ? 0.35 : 0.55}
        />
      </Svg>

      {/* Content */}
      <View style={styles.contentRow}>
        {/* Left Column: Badge, Title, Description, Conventional Pill Button */}
        <View style={styles.leftColumn}>
          {ad.badge && (
            <View
              style={[
                styles.badgeContainer,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.12)'
                    : 'rgba(255, 255, 255, 0.88)',
                },
              ]}
            >
              <Ionicons
                name="sparkles"
                size={11}
                color={isDark ? '#FDE047' : '#7E22CE'}
                style={{ marginRight: 4 }}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.badgeText,
                  { color: isDark ? '#E9D5FF' : '#6D28D9' },
                ]}
              >
                {ad.badge}
              </Text>
            </View>
          )}

          <Text
            style={[
              styles.title,
              { color: isDark ? '#FFFFFF' : '#1E1B4B' },
            ]}
            numberOfLines={1}
          >
            {ad.title}
          </Text>

          <Text
            style={[
              styles.description,
              { color: isDark ? 'rgba(255, 255, 255, 0.85)' : '#4B5563' },
            ]}
            numberOfLines={2}
          >
            {ad.description}
          </Text>

          {/* Generously sized Conventional Pill CTA */}
          <ThemedTouchable
            onPress={onCtaPress || onPress}
            haptic="medium"
            activeOpacity={0.88}
            style={[
              styles.ctaButton,
              {
                backgroundColor: isDark ? '#FFFFFF' : '#18181B',
              },
            ]}
          >
            <Text
              style={[
                styles.ctaText,
                { color: isDark ? '#18181B' : '#FFFFFF' },
              ]}
            >
              {ad.ctaText || 'Solicitar'}
            </Text>
            <Feather
              name="arrow-right"
              size={15}
              color={isDark ? '#18181B' : '#FFFFFF'}
              style={{ marginLeft: 6 }}
            />
          </ThemedTouchable>
        </View>

        {/* Right Column: Celebratory Artwork */}
        <View style={styles.rightColumn} pointerEvents="none">
          <Svg width="112" height="112" viewBox="0 0 115 115">
            <Path
              d="M20 30 L22 25 L27 23 L22 21 L20 16 L18 21 L13 23 L18 25 Z"
              fill="#FBBF24"
            />
            <Path
              d="M95 24 L96.5 20 L101 18.5 L96.5 17 L95 12.5 L93.5 17 L89 18.5 L93.5 20 Z"
              fill="#F59E0B"
            />

            <G transform="translate(18, 22)">
              <Path
                d="M38 12 L12 34 L18 34 L18 64 L58 64 L58 34 L64 34 Z"
                fill={isDark ? '#6D28D9' : '#8B5CF6'}
                stroke={isDark ? '#A78BFA' : '#7C3AED'}
                strokeWidth="2"
              />
              <Rect x="46" y="16" width="7" height="12" fill={isDark ? '#5B21B6' : '#6D28D9'} rx="1" />
              <Rect x="32" y="44" width="13" height="20" fill={isDark ? '#312E81' : '#4C1D95'} rx="2" />
              <Circle cx="42" cy="54" r="1.5" fill="#FDE047" />
              <Rect x="23" y="38" width="10" height="10" fill="#FEF08A" rx="2" />
              <Line x1="28" y1="38" x2="28" y2="48" stroke="#CA8A04" strokeWidth="1" />
              <Line x1="23" y1="43" x2="33" y2="43" stroke="#CA8A04" strokeWidth="1" />
            </G>

            <G transform="translate(56, 46)">
              <Path
                d="M10 8 L32 8 L29 23 C29 28 24 32 21 32 C18 32 13 28 13 23 Z"
                fill={`url(#trophy-${ad.id})`}
                stroke="#D97706"
                strokeWidth="1.5"
              />
              <Path
                d="M10 11 C5 11 5 19 11 20 M32 11 C37 11 37 19 31 20"
                stroke="#D97706"
                strokeWidth="1.5"
                fill="none"
              />
              <Rect x="19" y="32" width="4" height="6" fill="#D97706" />
              <Rect x="14" y="38" width="14" height="5" fill="#B45309" rx="1.5" />
              <Circle cx="21" cy="18" r="9" fill="#DC2626" stroke="#FFFFFF" strokeWidth="1.5" />
            </G>
          </Svg>

          {ad.discountBadge && (
            <View style={styles.floatingDiscountBadge}>
              <Text style={styles.floatingDiscountText}>
                {ad.discountBadge}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function SeeMoreCardContent({
  cardWidth,
  onPress,
}: {
  cardWidth: number;
  onPress: () => void;
}) {
  const { isDark } = useAppTheme();
  return (
    <ThemedTouchable
      onPress={onPress}
      haptic="medium"
      activeOpacity={0.92}
      style={[
        styles.seeMoreCard,
        {
          width: cardWidth,
          backgroundColor: isDark ? '#1F1A2C' : '#18181B',
          borderColor: isDark ? '#3B2D5A' : '#27272A',
        },
      ]}
    >
      <View className="flex-1 justify-between p-6">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}
            >
              <Ionicons name="pricetags" size={20} color="#FDE047" />
            </View>
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'Satoshi-Bold',
                color: '#FDE047',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              Cupones & Promos
            </Text>
          </View>

          <View
            style={{
              backgroundColor: '#F59E0B',
              paddingHorizontal: 9,
              paddingVertical: 3.5,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontFamily: 'Satoshi-Black' }}>
              OFERTAS
            </Text>
          </View>
        </View>

        <View>
          <Text
            style={{
              fontSize: 20,
              fontFamily: 'Satoshi-Black',
              color: '#FFFFFF',
              letterSpacing: -0.4,
              marginBottom: 4,
            }}
          >
            Explora todas las Promociones
          </Text>
          <Text
            style={{
              fontSize: 12.5,
              fontFamily: 'Satoshi-Medium',
              color: 'rgba(255, 255, 255, 0.78)',
              lineHeight: 17,
            }}
          >
            Descubre descuentos directos por tiempo limitado ofrecidos por profesionales en Yewi.
          </Text>
        </View>

        <ThemedTouchable
          onPress={onPress}
          haptic="selection"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 999,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
            elevation: 3,
          }}
        >
          <Text
            style={{
              color: '#18181B',
              fontFamily: 'Satoshi-Black',
              fontSize: 13.5,
            }}
          >
            Ver todas las ofertas
          </Text>
          <Feather
            name="arrow-right"
            size={15}
            color="#18181B"
            style={{ marginLeft: 6 }}
          />
        </ThemedTouchable>
      </View>
    </ThemedTouchable>
  );
}

import { useAuthStore } from '@/store/useAuthStore';

export function HomePromoCarousel() {
  const router = useRouter();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();

  const [promosList, setPromosList] = useState<PromoAdData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<any>(null);

  const cardWidth = Math.min(SCREEN_WIDTH - 44, 440);
  const cardGap = 12;
  const snapInterval = cardWidth + cardGap;

  const fetchPromos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await promotionsApi.getActivePromotions();
      if (data && data.length > 0) {
        // Excluir promociones creadas por el propio usuario registrado
        const currentUserId = useAuthStore.getState().user?.id;
        const validPromos = data.filter(
          (item: SellerPromotion) =>
            !currentUserId || item.professional?.userId !== currentUserId
        );

        const mapped: PromoAdData[] = validPromos.map((item: SellerPromotion) => ({
          id: item.id,
          badge: item.badge || 'OFERTA DESTACADA',
          title: item.title,
          description: item.description,
          discountBadge: item.discountPercent
            ? `-${item.discountPercent}%`
            : item.discountAmount
            ? `-${item.discountAmount}€`
            : undefined,
          ctaText: 'Solicitar Oferta',
          category: item.category || 'General',
          professionalId: item.professional?.id,
          professionalUserId: item.professional?.userId,
          professionalName: item.professional?.name,
          bgGradStart: '#E8D5F5',
          bgGradEnd: '#E0CCF2',
        }));
        setPromosList(mapped);
      } else {
        setPromosList([]);
      }
    } catch {
      setPromosList([]);
    } finally {
      setLoading(false);
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
      router.push('/vouchers');
      return;
    }

    const targetId = promo.professionalUserId || promo.professionalId;
    if (targetId) {
      const discountTxt = promo.discountBadge ? ` con descuento de ${promo.discountBadge}` : '';
      const initialMessage = `¡Hola! He visto tu promoción "${promo.title}"${discountTxt} en Yewi y estoy interesado en solicitarla. ¿Podrías darme más información para aplicarla?`;
      router.push({
        pathname: '/chat',
        params: {
          id: targetId,
          targetName: promo.professionalName || promo.title,
          initialMessage,
        },
      });
    } else {
      router.push('/vouchers');
    }
  };

  const handleCtaPress = (promo: PromoAdData) => {
    handlePromoPress(promo);
  };

  const handleSeeAllPromos = () => {
    router.push('/vouchers');
  };

  // Combinar tarjetas de promociones + tarjeta final "Ver más cupones"
  const carouselItems = [...promosList, { id: '__see_more__' } as PromoAdData];

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / snapInterval);
    if (index >= 0 && index < carouselItems.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  if (loading && promosList.length === 0) {
    return (
      <View style={{ height: CARD_HEIGHT + 24, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ width: '100%', marginTop: 6, marginBottom: 12 }}>
      {/* NATIVE 60FPS HORIZONTAL SNAP CAROUSEL */}
      <Animated.FlatList
        ref={flatListRef}
        data={carouselItems}
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
          paddingVertical: 4,
        }}
        keyExtractor={(item, index) => item.id || `promo-card-${index}`}
        renderItem={({ item, index }) => {
          const isSeeMore = item.id === '__see_more__';
          return (
            <View
              style={{
                width: cardWidth,
                height: CARD_HEIGHT,
                shadowColor: '#7C3AED',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: isDark ? 0.25 : 0.12,
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              {isSeeMore ? (
                <SeeMoreCardContent
                  cardWidth={cardWidth}
                  onPress={handleSeeAllPromos}
                />
              ) : (
                <HomePromoBannerCard
                  ad={item}
                  cardWidth={cardWidth}
                  onPress={() => handlePromoPress(item)}
                  onCtaPress={() => handleCtaPress(item)}
                />
              )}
            </View>
          );
        }}
      />

      {/* PAGINATION DOTS INDICATOR */}
      {carouselItems.length > 1 && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 10,
            gap: 5,
          }}
        >
          {carouselItems.map((_, i) => (
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
  stackWrapper: {
    width: '100%',
    paddingHorizontal: 22,
    marginTop: 8,
    marginBottom: 10,
    height: CARD_HEIGHT + 14,
    position: 'relative',
  },
  stackedLayerBack: {
    position: 'absolute',
    left: 28,
    right: 28,
    top: 0,
    height: CARD_HEIGHT,
    borderRadius: 26,
    borderWidth: 1,
    transform: [{ rotate: '-2.2deg' }],
    opacity: 0.85,
  },
  stackedLayerMiddle: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 5,
    height: CARD_HEIGHT,
    borderRadius: 26,
    borderWidth: 1,
    transform: [{ rotate: '1.8deg' }],
    opacity: 0.92,
  },
  underlyingCardContainer: {
    position: 'absolute',
    left: 22,
    top: 10,
    right: 22,
    height: CARD_HEIGHT,
    zIndex: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  activeCardContainer: {
    position: 'absolute',
    left: 22,
    top: 10,
    right: 22,
    height: CARD_HEIGHT,
    zIndex: 10,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    height: '100%',
  },
  leftColumn: {
    flex: 1,
    paddingRight: 14,
    justifyContent: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Satoshi-Bold',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 19,
    fontFamily: 'Satoshi-Black',
    letterSpacing: -0.4,
    lineHeight: 23,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    fontFamily: 'Satoshi-Medium',
    lineHeight: 16.5,
    marginBottom: 12,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 3,
  },
  ctaText: {
    fontSize: 14,
    fontFamily: 'Satoshi-Black',
    letterSpacing: -0.2,
  },
  rightColumn: {
    width: 95,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  floatingDiscountBadge: {
    position: 'absolute',
    bottom: 12,
    right: 0,
    backgroundColor: '#DC2626',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  floatingDiscountText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontFamily: 'Satoshi-Black',
  },
  seeMoreCard: {
    height: CARD_HEIGHT,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 3,
  },
});

export default HomePromoCarousel;
