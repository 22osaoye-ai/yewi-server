import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from './ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';
import { AuthorStatusFeedGroup, StatusItem } from '@/services/statusesApi';
import { GigDetail } from '@/services/gigsApi';

export interface StoryDigestCardProps {
  project?: GigDetail;
  group?: AuthorStatusFeedGroup;
  onPress?: () => void;
  onOpenViewer?: (group: AuthorStatusFeedGroup, initialIndex?: number) => void;
  onOptionsPress?: (group: AuthorStatusFeedGroup) => void;
}

export function StoryDigestCard({
  project,
  group,
  onPress,
  onOpenViewer,
}: StoryDigestCardProps) {
  const { colors, isDark } = useAppTheme();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Extraer datos reales del proyecto o del grupo
  const proProfile = project?.professionalProfile;
  const authorName =
    proProfile?.businessName ||
    proProfile?.user?.profile?.displayName ||
    (proProfile?.user as any)?.firstName ||
    group?.businessName ||
    group?.authorName ||
    'Profesional Verificado';

  const avatarUrl =
    proProfile?.user?.profile?.avatarUrl ||
    (proProfile?.user as any)?.avatarUrl ||
    (project as any)?.user?.avatarUrl ||
    group?.authorAvatar ||
    null;

  const city = proProfile?.city || 'Madrid';
  const rating = proProfile?.avgRating || 4.9;
  const reviewsCount = proProfile?.totalReviews || 38;
  const isPro = proProfile?.isPro ?? group?.isPro ?? true;

  const basicPackage = project?.packages?.[0];
  const price = basicPackage?.price ? Number(basicPackage.price) : undefined;
  const formattedPrice = price ? `Desde ${price.toLocaleString('es-ES')} €` : undefined;
  const category = project?.category?.name || group?.category || 'Reformas';

  // Imágenes del trabajo o estados
  const images: string[] = [];
  if (project?.coverImages && project.coverImages.length > 0) {
    images.push(...project.coverImages);
  } else if (group?.statuses && group.statuses.length > 0) {
    images.push(
      ...group.statuses
        .map((s) => s.mediaUrl)
        .filter((url): url is string => Boolean(url))
    );
  }

  if (images.length === 0) {
    images.push(
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'
    );
  }

  const currentImageUrl = images[activeImageIndex] || images[0];

  const title =
    project?.title ||
    group?.statuses?.[activeImageIndex]?.caption ||
    'Proyecto completado con certificación y garantía.';

  const description =
    project?.description ||
    'Instalación realizada con materiales de alta calidad y entrega en plazo acordado.';

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (onPress) {
      onPress();
    } else if (group && onOpenViewer) {
      onOpenViewer(group, activeImageIndex);
    }
  };

  const handleNextImage = () => {
    if (activeImageIndex < images.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setActiveImageIndex((prev) => prev + 1);
    }
  };

  const handlePrevImage = () => {
    if (activeImageIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setActiveImageIndex((prev) => prev - 1);
    }
  };

  return (
    <ThemedTouchable
      onPress={handleCardPress}
      haptic="light"
      scaleOnPress
      activeOpacity={0.94}
      style={[
        styles.cardContainer,
        {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderColor: isDark ? colors.border : '#E2E8F0',
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${title}, de ${authorName}`}
    >
      {/* 1. Cabecera con Foto Real del Profesional */}
      <View style={styles.headerRow}>
        <View style={styles.authorContainer}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
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
              <Text style={[styles.avatarInitial, { color: colors.primary }]}>
                {authorName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.authorMeta}>
            <View style={styles.nameRow}>
              <Text
                style={[styles.authorNameText, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {authorName}
              </Text>
              {isPro && (
                <Ionicons
                  name="checkmark-circle"
                  size={15}
                  color={colors.primary}
                  style={styles.verifiedIcon}
                />
              )}
            </View>
            <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
              {`${city} · ★ ${rating.toFixed(1)} (${reviewsCount})`}
            </Text>
          </View>
        </View>

        {/* Badge de Precio / Categoría */}
        <View
          style={[
            styles.priceBadge,
            {
              backgroundColor: isDark
                ? 'rgba(56, 189, 248, 0.12)'
                : 'rgba(2, 132, 199, 0.08)',
            },
          ]}
        >
          <Text style={[styles.priceText, { color: colors.primary }]}>
            {formattedPrice || category}
          </Text>
        </View>
      </View>

      {/* 2. Imagen del Trabajo / Proyecto */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: currentImageUrl }}
          style={styles.workImage}
          contentFit="cover"
          transition={200}
        />

        {/* Zonas de toque para navegar entre fotos */}
        {images.length > 1 && (
          <View style={styles.tapZones}>
            <Pressable
              style={styles.tapZone}
              onPress={(e) => {
                e.stopPropagation();
                handlePrevImage();
              }}
            />
            <Pressable
              style={styles.tapZone}
              onPress={(e) => {
                e.stopPropagation();
                handleNextImage();
              }}
            />
          </View>
        )}

        {/* Guiones de progreso de fotos */}
        {images.length > 1 && (
          <View style={styles.dashesContainer} pointerEvents="none">
            {images.slice(0, 8).map((_, idx) => (
              <View
                key={`dash-${idx}`}
                style={[
                  styles.dashItem,
                  {
                    backgroundColor:
                      idx === activeImageIndex
                        ? '#FFFFFF'
                        : 'rgba(255, 255, 255, 0.45)',
                  },
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* 3. Título y Descripción de la Obra (Limpio, sin botón feo abajo) */}
      <View style={styles.contentBottom}>
        <Text
          style={[styles.headlineText, { color: colors.textPrimary }]}
          numberOfLines={2}
        >
          {title}
        </Text>
        {description ? (
          <Text
            style={[styles.descriptionText, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </ThemedTouchable>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  authorMeta: {
    marginLeft: 10,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorNameText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -0.2,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  subtitleText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Regular',
    marginTop: 1,
  },
  priceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  imageWrapper: {
    width: '100%',
    height: 230,
    backgroundColor: '#1E293B',
    position: 'relative',
    overflow: 'hidden',
  },
  workImage: {
    ...StyleSheet.absoluteFill,
  },
  tapZones: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
  },
  tapZone: {
    flex: 1,
    height: '100%',
  },
  dashesContainer: {
    position: 'absolute',
    bottom: 10,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 5,
  },
  dashItem: {
    flex: 1,
    height: 2.5,
    borderRadius: 2,
  },
  contentBottom: {
    padding: 16,
    paddingTop: 12,
  },
  headlineText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Bold',
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  descriptionText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Regular',
    lineHeight: 18,
    marginTop: 4,
  },
});
