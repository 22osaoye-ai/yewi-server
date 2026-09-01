import React from 'react';
import { View, Text, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from './ThemedTouchable';
import { ThemedPressed } from './ThemedPressed';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuthStore } from '@/store/useAuthStore';
import { GigDetail } from '@/services/gigsApi';
import { toast } from '@/store/useToastStore';

const CATEGORY_STYLES: Record<string, { icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }> = {
  electricidad: { icon: 'lightning-bolt', color: '#EAB308' },
  fontaneria: { icon: 'water-pump', color: '#0284C7' },
  banos: { icon: 'shower', color: '#059669' },
  cocina: { icon: 'countertop-outline', color: '#EA580C' },
  pintura: { icon: 'format-paint', color: '#9333EA' },
  pladur: { icon: 'wall', color: '#475569' },
  manitas: { icon: 'toolbox-outline', color: '#D97706' },
  suelos: { icon: 'floor-plan', color: '#CA8A04' },
  climatizacion: { icon: 'air-conditioner', color: '#DC2626' },
  carpinteria: { icon: 'hammer', color: '#B45309' },
  cerrajeria: { icon: 'key-variant', color: '#4F46E5' },
  limpieza: { icon: 'broom', color: '#E11D48' },
  reformas: { icon: 'home-city-outline', color: '#C026D3' },
  general: { icon: 'toolbox-outline', color: '#C87D20' },
};

function getCategoryStyle(name?: string) {
  const norm = (name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (norm.includes('electr')) return CATEGORY_STYLES.electricidad;
  if (norm.includes('fontan')) return CATEGORY_STYLES.fontaneria;
  if (norm.includes('ban') || norm.includes('bañ')) return CATEGORY_STYLES.banos;
  if (norm.includes('cocin')) return CATEGORY_STYLES.cocina;
  if (norm.includes('pint')) return CATEGORY_STYLES.pintura;
  if (norm.includes('pladur')) return CATEGORY_STYLES.pladur;
  if (norm.includes('manit')) return CATEGORY_STYLES.manitas;
  if (norm.includes('suelo') || norm.includes('tarima') || norm.includes('parq')) return CATEGORY_STYLES.suelos;
  if (norm.includes('clima') || norm.includes('aire')) return CATEGORY_STYLES.climatizacion;
  if (norm.includes('carp')) return CATEGORY_STYLES.carpinteria;
  if (norm.includes('cerraj')) return CATEGORY_STYLES.cerrajeria;
  if (norm.includes('limp')) return CATEGORY_STYLES.limpieza;
  if (norm.includes('reform') || norm.includes('albanil') || norm.includes('albañil')) return CATEGORY_STYLES.reformas;
  return CATEGORY_STYLES.general;
}

interface ProjectCardProps {
  project: GigDetail;
  onPress?: () => void;
  onDelete?: (id: string) => void;
  isOwner?: boolean;
}

export function ProjectCard({ project, onPress, onDelete, isOwner: propIsOwner }: ProjectCardProps) {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();

  const pro = project.professionalProfile;
  const proUserId =
    (pro?.user as any)?.id ||
    (pro as any)?.userId ||
    (project as any)?.authorId ||
    (project as any)?.userId;

  const proId = pro?.id || (project as any)?.professionalProfileId;
  const userProId = (user?.professionalProfile as any)?.id;

  const isOwner =
    propIsOwner ||
    Boolean(
      user?.id &&
        (
          (proUserId && user.id === proUserId) ||
          (user.id === (project as any)?.userId) ||
          (user.id === (project as any)?.authorId) ||
          ((project as any)?.professionalProfileId && userProId && userProId === (project as any).professionalProfileId) ||
          (proId && userProId && userProId === proId)
        )
    );

  const basicPackage = project.packages?.[0];
  const price = basicPackage?.price ? Number(basicPackage.price) : 50;
  const deliveryDays = basicPackage?.deliveryDays || 3;

  const [avatarError, setAvatarError] = React.useState(false);

  const proName =
    pro?.businessName ||
    pro?.user?.profile?.displayName ||
    ((pro?.user?.profile as any)?.firstName
      ? `${(pro?.user?.profile as any).firstName} ${(pro?.user?.profile as any).lastName || ''}`.trim()
      : 'Profesional Verificado');

  const rawAvatar =
    pro?.user?.profile?.avatarUrl ||
    (pro?.user as any)?.avatarUrl ||
    (pro as any)?.avatarUrl;

  const proAvatar =
    !avatarError &&
    ((rawAvatar && !rawAvatar.startsWith('file://'))
      ? rawAvatar
      : pro?.portfolioItems?.[0]?.imageUrls?.[0] || null);

  const proCity = pro?.city || pro?.province || 'España';
  const rating = pro?.avgRating ? Number(pro.avgRating).toFixed(1) : '5.0';
  const totalReviews = pro?.totalReviews || 0;

  const catName = project.category?.name || 'Servicio';
  const catStyle = getCategoryStyle(catName);

  const handleContactPress = () => {
    if (isOwner) {
      router.push('/professional-profile');
      return;
    }

    if (!user) {
      toast.info('Inicia Sesión', 'Accede a tu cuenta para contactar directamente con el profesional.');
      router.push('/(auth)/login' as any);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    const defaultMsg = `¡Hola ${proName}! He visto tu proyecto "${project.title}" (${price} € en ${deliveryDays} días) y me gustaría contratarlo o solicitar más detalles.`;

    router.push({
      pathname: '/chat',
      params: {
        targetUserId: proUserId,
        targetName: proName,
        initialMessage: defaultMsg,
      },
    });
  };

  return (
    <ThemedPressed
      onPress={onPress}
      disabled={!onPress}
      scaleOnPress={Boolean(onPress)}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 22,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: isDark ? '#262C3A' : '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: isDark ? 0.3 : 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Top Row: Category Pill + Location + Price Badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{
              backgroundColor: isDark ? '#1F2430' : '#F1F5F9',
              paddingHorizontal: 10,
              paddingVertical: 4.5,
              borderRadius: 999,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              borderWidth: 1,
              borderColor: isDark ? '#2D3546' : '#E2E8F0',
            }}
          >
            <MaterialCommunityIcons name={catStyle.icon} size={14} color={catStyle.color} />
            <Text style={{ fontSize: 12, fontFamily: 'Satoshi-Bold', color: colors.textPrimary }}>
              {catName}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="location-sharp" size={13} color={colors.textMuted} />
            <Text style={{ fontSize: 12, fontFamily: 'Satoshi-Medium', color: colors.textSecondary }}>
              {proCity}
            </Text>
          </View>
        </View>

        {/* Price & Delivery badge */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 19, fontFamily: 'Satoshi-Black', color: colors.primary }}>
            {price} €
          </Text>
          <Text style={{ fontSize: 11.5, fontFamily: 'Satoshi-Bold', color: colors.textMuted }}>
            ⏱️ {deliveryDays} {deliveryDays === 1 ? 'día' : 'días'}
          </Text>
        </View>
      </View>

      {/* Project Title */}
      <Text
        numberOfLines={2}
        style={{
          fontSize: 16.5,
          fontFamily: 'Satoshi-Black',
          color: colors.textPrimary,
          letterSpacing: -0.3,
          lineHeight: 22,
          marginBottom: 6,
        }}
      >
        {project.title}
      </Text>

      {/* Description */}
      {Boolean(project.description) && (
        <Text
          numberOfLines={2}
          style={{
            fontSize: 13,
            fontFamily: 'Satoshi-Regular',
            color: colors.textSecondary,
            lineHeight: 18,
            marginBottom: 14,
          }}
        >
          {project.description}
        </Text>
      )}

      {/* Optional Cover Image Preview */}
      {Boolean(project.coverImages?.[0]) && (
        <View
          style={{
            height: 120,
            borderRadius: 14,
            overflow: 'hidden',
            marginBottom: 14,
            backgroundColor: colors.surfaceAlt,
          }}
        >
          <Image
            source={{ uri: project.coverImages![0] }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Professional Footer Row & CTA Button */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: isDark ? '#262C3A' : '#F1F5F9',
        }}
      >
        {/* Pro Avatar & Name (Tappable to view seller profile) */}
        <ThemedTouchable
          onPress={() => {
            if (proId) {
              router.push({
                pathname: '/detail',
                params: { id: proId, entityType: 'professional' },
              });
            }
          }}
          haptic="selection"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1, marginRight: 10 }}
        >
          {proAvatar ? (
            <Image
              source={{ uri: proAvatar }}
              onError={() => setAvatarError(true)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                borderWidth: 1.5,
                borderColor: colors.primary,
              }}
            />
          ) : (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: colors.primary,
              }}
            >
              <Text style={{ fontSize: 14, fontFamily: 'Satoshi-Black', color: colors.primary }}>
                {proName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ fontSize: 13.5, fontFamily: 'Satoshi-Bold', color: colors.textPrimary }}>
              {proName}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={{ fontSize: 11.5, fontFamily: 'Satoshi-Bold', color: colors.textPrimary }}>
                {rating}
              </Text>
              <Text style={{ fontSize: 11, fontFamily: 'Satoshi-Regular', color: colors.textMuted }}>
                ({totalReviews})
              </Text>
            </View>
          </View>
        </ThemedTouchable>

        {/* Action Button */}
        {isOwner ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {Boolean(onDelete) && (
              <ThemedTouchable
                onPress={() => onDelete && onDelete(project.id)}
                haptic="medium"
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 999,
                  backgroundColor: isDark ? '#3B1818' : '#FEE2E2',
                }}
              >
                <Ionicons name="trash-outline" size={16} color="#DC2626" />
              </ThemedTouchable>
            )}
            <ThemedTouchable
              onPress={() => router.push('/professional-profile')}
              haptic="light"
              style={{
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 999,
                backgroundColor: colors.surfaceAlt,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Ionicons name="create-outline" size={13} color={colors.primary} />
              <Text style={{ fontSize: 12, fontFamily: 'Satoshi-Bold', color: colors.primary }}>
                Tu Proyecto
              </Text>
            </ThemedTouchable>
          </View>
        ) : (
          <ThemedTouchable
            onPress={handleContactPress}
            haptic="medium"
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 15,
              paddingVertical: 8.5,
              borderRadius: 999,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons name="chatbubble-ellipses" size={15} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 12.5, fontFamily: 'Satoshi-Bold' }}>
              Contactar
            </Text>
          </ThemedTouchable>
        )}
      </View>
    </ThemedPressed>
  );
}
