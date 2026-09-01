import React from 'react';
import { View, Text, Image } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ProfessionalDetail } from '@/services/professionalsApi';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

interface ProfessionalCardProps {
  professional: ProfessionalDetail;
  onPress: () => void;
}

export function ProfessionalCard({ professional, onPress }: ProfessionalCardProps) {
  const { colors, isDark } = useAppTheme();
  const [avatarError, setAvatarError] = React.useState(false);

  const name =
    professional.businessName ||
    professional.user?.profile?.displayName ||
    [professional.user?.profile?.firstName, professional.user?.profile?.lastName]
      .filter(Boolean)
      .join(' ') ||
    'Profesional Autónomo';

  const rawAvatar =
    professional.user?.profile?.avatarUrl ||
    (professional.user as any)?.avatarUrl ||
    (professional as any)?.avatarUrl;

  const avatarUrl =
    (rawAvatar && !rawAvatar.startsWith('file://'))
      ? rawAvatar
      : professional.portfolioItems?.[0]?.imageUrls?.[0] || null;

  const city =
    professional.city ||
    professional.user?.profile?.city ||
    professional.province ||
    'Ubicación no indicada';

  const rating = professional.avgRating && professional.avgRating > 0
    ? professional.avgRating.toFixed(1)
    : null;

  const totalReviews = professional.totalReviews ?? 0;
  const isPro = professional.isPro === true;
  const hourlyRate = professional.hourlyRate ? Number(professional.hourlyRate) : null;
  const mainCategory = professional.categories?.[0]?.name || professional.skills?.[0] || 'Servicios del Hogar';

  const cardBg = isDark
    ? '#1E1D22'
    : isPro
    ? '#FFF9F2'
    : '#FFFDF9';

  const cardBorder = isDark
    ? isPro
      ? '#F59E0B60'
      : '#2E2D36'
    : isPro
    ? '#FDBA74'
    : '#FED7AA';

  return (
    <ThemedTouchable
      onPress={onPress}
      haptic="light"
      activeOpacity={0.9}
      style={{
        backgroundColor: cardBg,
        borderRadius: 22,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1.5,
        borderColor: cardBorder,
        shadowColor: isDark ? '#000' : '#EA580C',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: isDark ? 0.35 : 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Top Header: Avatar + Name + Pro Badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {avatarUrl && !avatarError ? (
          <Image
            source={{ uri: avatarUrl }}
            onError={() => setAvatarError(true)}
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: isDark ? '#2A2930' : '#FED7AA',
              borderWidth: 1.5,
              borderColor: isPro ? '#F59E0B' : cardBorder,
            }}
          />
        ) : (
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: isDark ? '#2A2930' : '#FFEDD5',
              borderWidth: 1.5,
              borderColor: isPro ? '#F59E0B' : cardBorder,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 19,
                fontFamily: 'Satoshi-Black',
                color: isDark ? '#FDE047' : '#C2410C',
              }}
            >
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 15.5,
                fontFamily: 'Satoshi-Black',
                color: colors.textPrimary,
                flex: 1,
              }}
            >
              {name}
            </Text>
            {isPro && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3.5,
                  backgroundColor: isDark ? '#78350F50' : '#FEF3C7',
                  paddingHorizontal: 8,
                  paddingVertical: 2.5,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: isDark ? '#F59E0B' : '#F59E0B',
                }}
              >
                <Ionicons name="shield-checkmark" size={11} color={isDark ? '#FDE047' : '#B45309'} />
                <Text
                  style={{
                    fontSize: 10.5,
                    fontFamily: 'Satoshi-Black',
                    color: isDark ? '#FDE047' : '#B45309',
                    letterSpacing: 0.3,
                  }}
                >
                  PRO
                </Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 12.5,
                fontFamily: 'Satoshi-Medium',
                color: colors.textSecondary,
              }}
            >
              {city}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>•</Text>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 12.5,
                fontFamily: 'Satoshi-Medium',
                color: colors.textSecondary,
              }}
            >
              {mainCategory}
            </Text>
          </View>
        </View>
      </View>

      {/* Bio / Description */}
      {professional.bio ? (
        <Text
          numberOfLines={2}
          style={{
            fontSize: 13,
            fontFamily: 'Satoshi-Regular',
            color: colors.textSecondary,
            lineHeight: 18,
            marginTop: 10,
          }}
        >
          {professional.bio}
        </Text>
      ) : null}

      {/* Portfolio Photos Carousel (if any) */}
      {professional.portfolioItems && professional.portfolioItems.length > 0 ? (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          {professional.portfolioItems.slice(0, 3).map((item, idx) => {
            const firstImg = item.imageUrls?.[0];
            if (!firstImg) return null;
            return (
              <Image
                key={item.id || idx}
                source={{ uri: firstImg }}
                style={{
                  flex: 1,
                  height: 68,
                  borderRadius: 12,
                  backgroundColor: isDark ? '#2A2930' : '#FED7AA',
                  borderWidth: 1,
                  borderColor: isDark ? '#3A3842' : '#FED7AA',
                }}
                resizeMode="cover"
              />
            );
          })}
        </View>
      ) : null}

      {/* Bottom Row: Rating & Hourly Rate */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 12,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: isDark ? '#2E2D36' : '#FED7AA40',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {rating ? (
            <>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Satoshi-Bold',
                  color: colors.textPrimary,
                }}
              >
                {rating}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Satoshi-Regular',
                  color: colors.textMuted,
                }}
              >
                ({totalReviews} {totalReviews === 1 ? 'reseña' : 'reseñas'})
              </Text>
            </>
          ) : (
            <View
              style={{
                backgroundColor: isDark ? '#2A2930' : '#FFEDD5',
                paddingHorizontal: 9,
                paddingVertical: 3,
                borderRadius: 999,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'Satoshi-Bold',
                  color: isDark ? '#FDE047' : '#C2410C',
                }}
              >
                Nuevo en Yewi
              </Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {hourlyRate ? (
            <Text
              style={{
                fontSize: 15,
                fontFamily: 'Satoshi-Black',
                color: isDark ? '#FDE047' : '#C2410C',
              }}
            >
              {hourlyRate} €<Text style={{ fontSize: 11.5, fontFamily: 'Satoshi-Medium', color: colors.textSecondary }}>/h</Text>
            </Text>
          ) : (
            <Text
              style={{
                fontSize: 12.5,
                fontFamily: 'Satoshi-Medium',
                color: colors.textSecondary,
              }}
            >
              Tarifa a consultar
            </Text>
          )}
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: isDark ? '#2A2930' : '#FFEDD5',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="arrow-up-right" size={15} color={isDark ? '#FDE047' : '#C2410C'} />
          </View>
        </View>
      </View>
    </ThemedTouchable>
  );
}

