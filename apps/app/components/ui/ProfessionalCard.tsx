import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Stop, Rect, Path, ClipPath, Image as SvgImage } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { ProfessionalDetail } from '@/services/professionalsApi';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { getCategoryTheme } from '@/constants/categoryTheme';
import { CARD_CUTOUT_PATH } from '@/components/ui/CategoryLookbookCarousel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - 40 - 12) / 2);
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.2);
const s = CARD_WIDTH / 200;
const btnSize = Math.round(44 * s);
const btnLeft = Math.round(8 * s);
const btnBottom = Math.round(8 * s);
const pillLeft = Math.round(58 * s);
const pillRight = Math.round(8 * s);
const pillBottom = Math.round(8 * s);
const pillHeight = btnSize;

interface ProfessionalCardProps {
  professional: ProfessionalDetail;
  onPress: () => void;
  layout?: 'grid' | 'full';
  cardHeight?: number;
}

const DEFAULT_TRADE_COVERS: Record<string, string> = {
  Reformas: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
  Electricidad: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
  Fontanería: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
  Climatización: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80',
  Pintura: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
  Suelos: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=800&q=80',
  Pladur: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
  Carpintería: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
  Cerrajería: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
  Baños: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=800&q=80',
  Cocina: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
};

export function ProfessionalCard({
  professional,
  onPress,
  layout = 'grid',
  cardHeight,
}: ProfessionalCardProps) {
  const { colors, isDark } = useAppTheme();
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const isFav = isFavorite(professional.id);

  const name =
    professional.businessName ||
    professional.user?.profile?.displayName ||
    [professional.user?.profile?.firstName, professional.user?.profile?.lastName]
      .filter(Boolean)
      .join(' ') ||
    'Profesional Autónomo';

  const city =
    professional.city ||
    professional.user?.profile?.city ||
    professional.province ||
    'España';

  const rating =
    professional.avgRating && professional.avgRating > 0
      ? Number(professional.avgRating).toFixed(1)
      : '5.0';

  const totalReviews = professional.totalReviews ?? 0;
  const isPro = professional.isPro === true;
  const hourlyRate = professional.hourlyRate ? Number(professional.hourlyRate) : null;
  const mainCategory =
    professional.categories?.[0]?.name || professional.skills?.[0] || 'Reformas';
  const catTheme = getCategoryTheme(mainCategory);

  const photoUri =
    professional.user?.profile?.avatarUrl ||
    (professional.user as any)?.avatarUrl ||
    professional.portfolioItems?.[0]?.imageUrls?.[0] ||
    DEFAULT_TRADE_COVERS[mainCategory] ||
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80';

  const coverImage =
    professional.portfolioItems?.[0]?.imageUrls?.[0] ||
    DEFAULT_TRADE_COVERS[mainCategory] ||
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';

  const handleHeartPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    toggleFavorite(professional.id);
  };

  // -------------------------------------------------------------
  // LAYOUT 1: GRID MODE (CUTOUT HOLE AVATAR, FULL CLIPPED PHOTO, CATEGORY ICON ONLY)
  // -------------------------------------------------------------
  if (layout === 'grid') {
    const cardBg = isDark ? catTheme.bgColorDark : catTheme.bgColorLight;

    return (
      <ThemedTouchable
        onPress={onPress}
        haptic="selection"
        scaleOnPress={true}
        activeOpacity={0.92}
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          position: 'relative',
          marginBottom: 14,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: 8,
          elevation: 3,
        }}
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${mainCategory}, ${city}`}
      >
        {/* Scooped Cutout Shape with Full Photographic Cover Image (NO black overflow) */}
        <Svg
          width={CARD_WIDTH}
          height={CARD_HEIGHT}
          viewBox="0 0 200 240"
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <ClipPath id={`proCardClip-${professional.id}`}>
              <Path d={CARD_CUTOUT_PATH} />
            </ClipPath>
          </Defs>
          {/* Base fill */}
          <Path d={CARD_CUTOUT_PATH} fill={cardBg} />
          {/* Full Card Image occupying the complete card clipped to cutout */}
          <SvgImage
            href={coverImage}
            width="200"
            height="240"
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#proCardClip-${professional.id})`}
          />
        </Svg>

        {/* Top Header Row: Category ICON ONLY on Left, Rating Pill on Right */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 10,
            paddingTop: 10,
            zIndex: 5,
          }}
        >
          {/* Category Icon Badge - NO category text, ONLY icon with its respective color */}
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1.5 },
              shadowOpacity: 0.12,
              shadowRadius: 3,
              elevation: 2,
            }}
          >
            <Ionicons
              name={catTheme.iconName || 'construct'}
              size={18}
              color={catTheme.dotColor}
            />
          </View>

          {/* Rating Pill on Right */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 8,
              paddingVertical: 4.5,
              borderRadius: 999,
              gap: 3,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1.5 },
              shadowOpacity: 0.10,
              shadowRadius: 3,
              elevation: 2,
            }}
          >
            <Ionicons name="star" size={11} color="#F59E0B" />
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'PlusJakartaSans-Bold',
                color: '#0F172A',
              }}
            >
              {rating}
            </Text>
          </View>
        </View>

        {/* Circular Avatar nestled inside the cutout hole ("el avatar en el hueco") */}
        <View
          style={{
            position: 'absolute',
            left: btnLeft,
            bottom: btnBottom,
            width: btnSize,
            height: btnSize,
            borderRadius: btnSize / 2,
            backgroundColor: isDark ? '#27272A' : '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderWidth: 2,
            borderColor: isDark ? '#27272A' : '#FFFFFF',
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.18,
            shadowRadius: 4,
            elevation: 4,
            zIndex: 10,
          }}
        >
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={{ width: btnSize, height: btnSize }}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <Text
              style={{
                fontSize: Math.round(16 * s),
                fontFamily: 'PlusJakartaSans-ExtraBold',
                color: catTheme.dotColor,
              }}
            >
              {name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        {/* Docked Pill beside the avatar in the hole - Professional Name ONLY, Zero price */}
        <View
          style={{
            position: 'absolute',
            left: pillLeft,
            right: pillRight,
            bottom: pillBottom,
            height: pillHeight,
            borderRadius: pillHeight / 2,
            backgroundColor: isDark ? '#27272A' : '#FFFFFF',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            justifyContent: 'center',
            paddingHorizontal: Math.round(12 * s),
            shadowColor: '#000000',
            shadowOpacity: 0.08,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 1.5 },
            elevation: 2,
            zIndex: 10,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              fontSize: Math.max(11, Math.round(12 * s)),
              fontFamily: 'PlusJakartaSans-Bold',
              color: isDark ? '#FFFFFF' : '#0F172A',
              letterSpacing: -0.2,
            }}
          >
            {name}
          </Text>
        </View>
      </ThemedTouchable>
    );
  }

  // -------------------------------------------------------------
  // LAYOUT 2: FULL WIDTH (For single column feeds & search results)
  // -------------------------------------------------------------
  return (
    <ThemedTouchable
      onPress={onPress}
      haptic="selection"
      scaleOnPress={true}
      activeOpacity={0.92}
      style={{
        width: '100%',
        aspectRatio: 0.84,
        borderRadius: 28,
        overflow: 'hidden',
        marginBottom: 20,
        position: 'relative',
        backgroundColor: isDark ? '#18191E' : '#E2E8F0',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDark ? 0.35 : 0.12,
        shadowRadius: 16,
        elevation: 6,
      }}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${mainCategory}, ${city}`}
    >
      {/* Immersive Cover Image */}
      <Image
        source={{ uri: coverImage }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
        accessibilityLabel={name}
      />

      {/* Deep Gradient Vignette on Bottom Area */}
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Defs>
          <LinearGradient id={`proGrad-${professional.id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <Stop offset="40%" stopColor="#000000" stopOpacity="0.15" />
            <Stop offset="68%" stopColor="#000000" stopOpacity="0.65" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0.94" />
          </LinearGradient>
        </Defs>
        <Rect width="100" height="100" fill={`url(#proGrad-${professional.id})`} />
      </Svg>

      {/* Top Floating Bar: Pro Badge on Left, Frosted Glass Heart Button on Right */}
      <View
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          right: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
        }}
        pointerEvents="box-none"
      >
        {isPro ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4.5,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              paddingHorizontal: 11,
              paddingVertical: 5.5,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.25)',
            }}
          >
            <Ionicons name="shield-checkmark" size={13} color="#38BDF8" />
            <Text
              numberOfLines={1}
              style={{
                color: '#FFFFFF',
                fontSize: 11,
                fontFamily: 'PlusJakartaSans-Bold',
                letterSpacing: 0.4,
              }}
            >
              PRO
            </Text>
          </View>
        ) : (
          <View />
        )}

        <TouchableOpacity
          onPress={handleHeartPress}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: isFav ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.22)',
            borderWidth: 1.5,
            borderColor: isFav ? '#EF4444' : 'rgba(255, 255, 255, 0.4)',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 3,
          }}
          accessibilityRole="button"
          accessibilityLabel={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        >
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={21}
            color={isFav ? '#EF4444' : '#FFFFFF'}
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Content Overlay */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 18,
          paddingBottom: 16,
          zIndex: 10,
        }}
        pointerEvents="box-none"
      >
        <Text
          numberOfLines={1}
          style={{
            fontSize: 12.5,
            fontFamily: 'PlusJakartaSans-SemiBold',
            color: 'rgba(255, 255, 255, 0.85)',
            letterSpacing: 0.3,
            textTransform: 'uppercase',
            marginBottom: 2,
          }}
        >
          {city} · {mainCategory}
        </Text>

        <Text
          numberOfLines={1}
          style={{
            fontSize: 22,
            fontFamily: 'PlusJakartaSans-ExtraBold',
            color: '#FFFFFF',
            letterSpacing: -0.4,
            marginBottom: 6,
          }}
        >
          {name}
        </Text>

        {/* Rating and Reviews Row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginBottom: 14,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3.5,
              backgroundColor: 'rgba(255, 255, 255, 0.16)',
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 999,
              borderWidth: 0.5,
              borderColor: 'rgba(255, 255, 255, 0.28)',
            }}
          >
            <Ionicons name="star" size={11.5} color="#F59E0B" />
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 12,
                fontFamily: 'PlusJakartaSans-Bold',
              }}
            >
              {rating}
            </Text>
          </View>

          <Text
            numberOfLines={1}
            style={{
              color: 'rgba(255, 255, 255, 0.78)',
              fontSize: 12.5,
              fontFamily: 'PlusJakartaSans-Medium',
            }}
          >
            {totalReviews > 0 ? `${totalReviews} opiniones` : 'Verificado'}
          </Text>

          {hourlyRate ? (
            <>
              <Text style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 11 }}>•</Text>
              <Text
                numberOfLines={1}
                style={{
                  color: '#FFFFFF',
                  fontSize: 12.5,
                  fontFamily: 'PlusJakartaSans-Bold',
                }}
              >
                Desde {hourlyRate} €/h
              </Text>
            </>
          ) : null}
        </View>

        {/* Action Capsule Bar */}
        <View
          style={{
            height: 52,
            borderRadius: 999,
            backgroundColor: 'rgba(20, 21, 26, 0.9)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.14)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: 22,
            paddingRight: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              color: '#FFFFFF',
              fontSize: 14.5,
              fontFamily: 'PlusJakartaSans-Bold',
              letterSpacing: -0.2,
            }}
          >
            Ver perfil
          </Text>

          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.18,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons name="chevron-forward" size={19} color="#0F172A" />
          </View>
        </View>
      </View>
    </ThemedTouchable>
  );
}
