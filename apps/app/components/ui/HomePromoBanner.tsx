import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
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
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

export interface PromoAdData {
  id: string;
  badge?: string;
  title: string;
  description: string;
  ctaText?: string;
  discountBadge?: string;
  variant?: 'promo' | 'seller' | 'pro';
}

export const DEFAULT_PROMO_AD: PromoAdData = {
  id: 'reformas-ebenezer',
  badge: 'OFERTA DESTACADA',
  title: 'Reformas Ebenezer',
  discountBadge: '-20%',
  description: '20% de descuento en reformas integrales para los primeros clientes',
  ctaText: 'Solicitar',
  variant: 'promo',
};

interface HomePromoBannerProps {
  ad?: PromoAdData;
  onPress?: () => void;
  onCtaPress?: () => void;
  style?: any;
}

export function HomePromoBanner({
  ad = DEFAULT_PROMO_AD,
  onPress,
  onCtaPress,
  style,
}: HomePromoBannerProps) {
  const { isDark } = useAppTheme();
  const [cardWidth, setCardWidth] = useState<number>(340);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0 && Math.abs(width - cardWidth) > 1) {
      setCardWidth(width);
    }
  };

  const handlePress = () => {
    if (onPress) onPress();
    else if (onCtaPress) onCtaPress();
  };

  const handleCta = () => {
    if (onCtaPress) onCtaPress();
    else if (onPress) onPress();
  };

  const w = cardWidth;
  const h = 152;
  const cornerR = 24;
  const notchR = 14;
  const centerY = h / 2;
  const dashedX = w - 108;

  // Exact Ticket Path with Coupon Circular Notches / Bites on Left and Right Edges
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

  const variant = ad.variant || (ad.id === 'become-seller' ? 'seller' : ad.id === 'yewi-pro-profile' ? 'pro' : 'promo');

  return (
    <View onLayout={handleLayout} style={[styles.outerContainer, style]}>
      <ThemedTouchable
        onPress={handlePress}
        haptic="light"
        activeOpacity={0.94}
        style={{ width: '100%', height: h, position: 'relative' }}
      >
        {/* Ticket Coupon SVG Background with Cutout Notches */}
        <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="ticketBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop
                offset="0%"
                stopColor={
                  isDark
                    ? '#2D1B4E'
                    : variant === 'seller'
                    ? '#FEF3C7'
                    : variant === 'pro'
                    ? '#EDE6FA'
                    : '#E8D5F5'
                }
              />
              <Stop
                offset="100%"
                stopColor={
                  isDark
                    ? '#23153D'
                    : variant === 'seller'
                    ? '#FDE68A'
                    : variant === 'pro'
                    ? '#DDD6FE'
                    : '#E0CCF2'
                }
              />
            </LinearGradient>

            <LinearGradient id="trophyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FDE047" />
              <Stop offset="100%" stopColor="#EAB308" />
            </LinearGradient>
          </Defs>

          {/* Ticket Body Path */}
          <Path
            d={ticketPath}
            fill="url(#ticketBgGrad)"
            stroke={isDark ? '#4C2D7E' : 'rgba(255, 255, 255, 0.7)'}
            strokeWidth={1.5}
          />

          {/* Vertical Coupon Dashed Line */}
          <Line
            x1={dashedX}
            y1={12}
            x2={dashedX}
            y2={h - 12}
            stroke={isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(124, 58, 237, 0.18)'}
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />

          {/* Decorative Sunburst Rays & Circles */}
          <G opacity={isDark ? 0.15 : 0.22} stroke={isDark ? '#FFFFFF' : '#8B5CF6'} strokeWidth="1.2">
            <Line x1={dashedX + 45} y1={centerY} x2={dashedX - 60} y2={20} strokeDasharray="3,3" />
            <Line x1={dashedX + 45} y1={centerY} x2={dashedX - 80} y2={60} />
            <Line x1={dashedX + 45} y1={centerY} x2={dashedX - 70} y2={100} strokeDasharray="3,3" />
            <Line x1={dashedX + 45} y1={centerY} x2={dashedX - 40} y2={140} />
          </G>

          <Circle
            cx={dashedX + 45}
            cy={centerY}
            r="42"
            fill={isDark ? '#4C2D7E' : '#FCE7F3'}
            opacity={isDark ? 0.35 : 0.55}
          />
        </Svg>

        {/* Content Layout */}
        <View style={styles.contentRow}>
          {/* Left Column: Badge, Title, Description, CTA */}
          <View style={styles.leftColumn}>
            {/* Top Badge (Guaranteed no overflow) */}
            {ad.badge && (
              <View
                style={[
                  styles.badgeContainer,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(255, 255, 255, 0.8)',
                  },
                ]}
              >
                <Ionicons
                  name={variant === 'seller' ? 'briefcase' : 'sparkles'}
                  size={10.5}
                  color={isDark ? '#FDE047' : variant === 'seller' ? '#D97706' : '#7E22CE'}
                  style={{ marginRight: 4 }}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.badgeText,
                    {
                      color: isDark
                        ? '#E9D5FF'
                        : variant === 'seller'
                        ? '#B45309'
                        : '#6D28D9',
                    },
                  ]}
                >
                  {ad.badge}
                </Text>
              </View>
            )}

            {/* Title */}
            <Text
              style={[
                styles.title,
                { color: isDark ? '#FFFFFF' : '#1E1B4B' },
              ]}
              numberOfLines={1}
            >
              {ad.title}
            </Text>

            {/* Description */}
            <Text
              style={[
                styles.description,
                { color: isDark ? 'rgba(255, 255, 255, 0.85)' : '#4B5563' },
              ]}
              numberOfLines={2}
            >
              {ad.description}
            </Text>

            {/* Dark Pill CTA Button */}
            <ThemedTouchable
              onPress={handleCta}
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
                size={13}
                color={isDark ? '#18181B' : '#FFFFFF'}
                style={{ marginLeft: 4 }}
              />
            </ThemedTouchable>
          </View>

          {/* Right Column: Illustration + Floating Discount/Pro Pill */}
          <View style={styles.rightColumn} pointerEvents="none">
            {variant === 'seller' ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <MaterialCommunityIcons
                  name="storefront-outline"
                  size={56}
                  color={isDark ? '#FDE047' : '#D97706'}
                />
              </View>
            ) : variant === 'pro' ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Ionicons
                  name="sparkles"
                  size={54}
                  color={isDark ? '#FDE047' : '#7C3AED'}
                />
              </View>
            ) : (
              <Svg width="105" height="105" viewBox="0 0 115 115">
                {/* Decorative Sparkle Stars */}
                <Path
                  d="M20 30 L22 25 L27 23 L22 21 L20 16 L18 21 L13 23 L18 25 Z"
                  fill="#FBBF24"
                />
                <Path
                  d="M95 24 L96.5 20 L101 18.5 L96.5 17 L95 12.5 L93.5 17 L89 18.5 L93.5 20 Z"
                  fill="#F59E0B"
                />

                {/* House Architecture */}
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

                {/* Golden Trophy Cup */}
                <G transform="translate(56, 46)">
                  <Path
                    d="M10 8 L32 8 L29 23 C29 28 24 32 21 32 C18 32 13 28 13 23 Z"
                    fill="url(#trophyGrad)"
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
            )}

            {/* Floating Tag Pill (e.g. -20%, PRO, SELLER) */}
            {ad.discountBadge && (
              <View
                style={[
                  styles.floatingDiscountBadge,
                  {
                    backgroundColor:
                      variant === 'seller'
                        ? '#D97706'
                        : variant === 'pro'
                        ? '#7C3AED'
                        : '#DC2626',
                  },
                ]}
              >
                <Text style={styles.floatingDiscountText}>
                  {ad.discountBadge}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ThemedTouchable>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
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
    paddingRight: 16,
    justifyContent: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 5,
  },
  badgeText: {
    fontSize: 9.5,
    fontFamily: 'Satoshi-Bold',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18.5,
    fontFamily: 'Satoshi-Black',
    letterSpacing: -0.4,
    lineHeight: 22,
    marginBottom: 4,
  },
  description: {
    fontSize: 11.5,
    fontFamily: 'Satoshi-Medium',
    lineHeight: 15,
    marginBottom: 9,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  ctaText: {
    fontSize: 12,
    fontFamily: 'Satoshi-Bold',
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
    right: 2,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  floatingDiscountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Satoshi-Black',
  },
});

export default HomePromoBanner;
