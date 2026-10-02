import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, G } from 'react-native-svg';
import { ThemedTouchable } from './ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

export interface ProfessionalOfferData {
  id: string;
  eyebrow?: string;
  proName?: string;
  badge?: string;
  title: string;
  subtitle?: string;
  discount?: string;
  code?: string;
  ctaText?: string;
  discountedPrice?: string;
  originalPrice?: string;
}

export const DEFAULT_PRO_OFFER: ProfessionalOfferData = {
  id: 'offer-1',
  eyebrow: 'CAMPAÑA EXCLUSIVA',
  title: '50% DTO.',
  subtitle: 'Reforma Express 2026',
  discount: '-50%',
  discountedPrice: '79 €',
  originalPrice: '108 €',
  code: 'YEWI50',
  ctaText: 'Descubrir',
};

interface ExclusiveOffersBannerProps {
  offer?: ProfessionalOfferData;
  onPress?: () => void;
  onCtaPress?: () => void;
}

/**
 * Sweet Organic Lime Curve Backdrop inspired by the reference lookbook design
 */
function CardBackdropSvg({ isDark }: { isDark: boolean }) {
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      viewBox="0 0 350 160"
      preserveAspectRatio="none"
      pointerEvents="none"
    >
      {/* Top right organic lime-green fluid curve */}
      <Path
        d="M 175 -25 C 168 35, 185 85, 230 115 C 265 138, 305 140, 360 120 L 360 -25 Z"
        fill="#84CC16"
        opacity={isDark ? 0.85 : 0.95}
      />
      {/* Bottom right subtle lime accent sweep */}
      <Path
        d="M 285 148 C 308 140, 332 148, 360 165 L 295 170 Z"
        fill="#A3E635"
        opacity={0.8}
      />
    </Svg>
  );
}

/**
 * Modern, sweet, free-floating SVG Discount % Icon (NO boxed background container)
 */
function DiscountPercentSvg({ size = 82 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Sparkle 1 Top Left */}
      <Path
        d="M 16 12 C 16 17, 13 20, 8 20 C 13 20, 16 23, 16 28 C 16 23, 19 20, 24 20 C 19 20, 16 17, 16 12 Z"
        fill="#FFFFFF"
        opacity={0.9}
      />
      {/* Sparkle 2 Bottom Right */}
      <Path
        d="M 88 64 C 88 68, 85 71, 81 71 C 85 71, 88 74, 88 78 C 88 74, 91 71, 95 71 C 91 71, 88 68, 88 64 Z"
        fill="#A3E635"
        opacity={0.95}
      />

      {/* Main Dynamic Tilted Ticket / Discount Badge */}
      <G transform="rotate(-12, 50, 50)">
        {/* Ticket Body with authentic rounded corners and cut-out notches */}
        <Path
          d="M 24 22 C 24 16 28 12 34 12 L 66 12 C 72 12 76 16 76 22 L 76 42 C 72 42 69 45 69 49 C 69 53 72 56 76 56 L 76 78 C 76 84 72 88 66 88 L 34 88 C 28 88 24 84 24 78 L 24 56 C 28 56 31 53 31 49 C 31 45 28 42 24 42 Z"
          fill="#18181B"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Dashed perforation line */}
        <Line
          x1="32"
          y1="49"
          x2="68"
          y2="49"
          stroke="#3F3F46"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />

        {/* Crisp % Symbol */}
        {/* Top-Left Lime Circle */}
        <Circle cx="41" cy="33" r="5.5" fill="none" stroke="#A3E635" strokeWidth="2.8" />
        {/* Diagonal Bar */}
        <Line x1="59" y1="26" x2="41" y2="72" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" />
        {/* Bottom-Right Lime Circle */}
        <Circle cx="59" cy="65" r="5.5" fill="none" stroke="#A3E635" strokeWidth="2.8" />
      </G>
    </Svg>
  );
}

export function ExclusiveOffersBanner({
  offer = DEFAULT_PRO_OFFER,
  onPress,
  onCtaPress,
}: ExclusiveOffersBannerProps) {
  const { isDark } = useAppTheme();

  const handleAction = () => {
    if (onCtaPress) onCtaPress();
    else if (onPress) onPress();
  };

  const titleText = offer.title || '50% DTO.';
  const subtitleText = offer.subtitle || 'Reforma Express 2026';
  const discountedPrice = offer.discountedPrice || '79 €';
  const originalPrice = offer.originalPrice || '108 €';

  return (
    <View style={styles.container}>
      <ThemedTouchable
        onPress={handleAction}
        haptic="light"
        activeOpacity={0.92}
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#141416' : '#111113',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
          },
        ]}
      >
        {/* Organic Lime Curve Backdrop */}
        <CardBackdropSvg isDark={isDark} />

        {/* Left Column: Big Discount Headline, Subtitle, Price & CTA */}
        <View style={styles.contentCol}>
          <Text numberOfLines={1} style={styles.title}>
            {titleText}
          </Text>

          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitleText}
          </Text>

          {/* Strikethrough Price Row (Matching Reference) */}
          <View style={styles.priceRow}>
            <Text style={styles.discountedPriceText}>{discountedPrice}</Text>
            <View style={styles.strikethroughWrapper}>
              <Text style={styles.originalPriceText}>{originalPrice}</Text>
              <View style={styles.strikethroughLine} />
            </View>
          </View>

          <ThemedTouchable
            onPress={handleAction}
            haptic="selection"
            style={styles.ctaBtn}
          >
            <Text style={styles.ctaText}>
              {offer.ctaText || 'Descubrir'}
            </Text>
          </ThemedTouchable>
        </View>

        {/* Right Column: Free-floating SVG Discount % Icon (NO background box!) */}
        <View style={styles.rightCol} pointerEvents="none">
          <DiscountPercentSvg size={84} />
        </View>

        {/* 3 Vertical Pagination Dots on the right edge (from reference) */}
        <View style={styles.paginationDots} pointerEvents="none">
          <View style={[styles.dot, { opacity: 0.25 }]} />
          <View style={[styles.dot, { opacity: 0.25 }]} />
          <View style={[styles.dot, { opacity: 1, backgroundColor: '#FFFFFF' }]} />
        </View>
      </ThemedTouchable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 16,
  },
  card: {
    borderRadius: 26,
    overflow: 'hidden',
    position: 'relative',
    paddingVertical: 18,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 154,
  },
  contentCol: {
    flex: 1,
    paddingRight: 10,
    zIndex: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    letterSpacing: -1,
    fontStyle: 'italic',
  },
  subtitle: {
    color: '#A1A1AA',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Medium',
    marginTop: 4,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  discountedPriceText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -0.3,
  },
  strikethroughWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  originalPriceText: {
    color: '#A1A1AA',
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  strikethroughLine: {
    position: 'absolute',
    left: -2,
    right: -2,
    top: '52%',
    height: 1.8,
    backgroundColor: '#84CC16',
    borderRadius: 1,
  },
  ctaBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 999,
  },
  ctaText: {
    color: '#09090B',
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  rightCol: {
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 14,
  },
  paginationDots: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -16 }],
    flexDirection: 'column',
    gap: 5,
    zIndex: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
  },
});

export default ExclusiveOffersBanner;
