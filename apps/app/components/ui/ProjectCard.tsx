import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from './ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { toast } from '@/store/useToastStore';
import { GigDetail } from '@/services/gigsApi';
import { getCategoryTheme } from '@/constants/categoryTheme';

interface ProjectCardProps {
  project: GigDetail;
  onPress?: () => void;
  onDelete?: (id: string) => void;
  isOwner?: boolean;
  layout?: 'grid' | 'full';
  style?: any;
}

export function ProjectCard({
  project,
  onPress,
  onDelete,
  isOwner: propIsOwner,
  layout = 'full',
  style,
}: ProjectCardProps) {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const isFav = isFavorite(project.id);

  const handleReviewsPress = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push({
      pathname: '/detail',
      params: { id: project.id, entityType: 'gig', tab: 'reviews' },
    });
  };

  const handleCommentsPress = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push({
      pathname: '/detail',
      params: { id: project.id, entityType: 'gig', tab: 'reviews' },
    });
  };

  const handleBookmarkPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    toggleFavorite(project.id);
    if (!isFav) {
      toast.success('Guardado', 'Servicio añadido a tus favoritos');
    } else {
      toast.info('Eliminado', 'Servicio retirado de favoritos');
    }
  };

  const handleContactPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (pro?.id) {
      router.push({
        pathname: '/detail',
        params: { id: pro.id, entityType: 'professional', action: 'contact' },
      });
    } else {
      onPress?.();
    }
  };

  const handleMenuPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (pro?.id) {
      router.push({
        pathname: '/detail',
        params: { id: pro.id, entityType: 'professional' },
      });
    } else {
      onPress?.();
    }
  };

  const pro = project.professionalProfile;
  const proName =
    pro?.businessName ||
    pro?.user?.profile?.displayName ||
    ((pro?.user?.profile as any)?.firstName
      ? `${(pro?.user?.profile as any).firstName} ${(pro?.user?.profile as any).lastName || ''}`.trim()
      : 'Profesional Verificado');

  const proAvatar =
    pro?.user?.profile?.avatarUrl ||
    (pro?.user as any)?.avatarUrl ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=140&q=80';

  const categoryName = project.category?.name || 'Servicio';
  const basicPackage = project.packages?.[0];
  const price = basicPackage?.price ? Number(basicPackage.price) : 890;
  const rating = pro?.avgRating ? Number(pro.avgRating).toFixed(1) : '5.0';
  const totalReviews = pro?.totalReviews ?? 42;
  const coverImage =
    project.coverImages?.[0] ||
    pro?.portfolioItems?.[0]?.imageUrls?.[0] ||
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80';

  const isGrid = layout === 'grid';

  // --- GRID VIEW (Diseño oficial con badge de estrellas, píldora Desde y botón ↗) ---
  if (isGrid) {
    return (
      <ThemedTouchable
        onPress={onPress}
        haptic="light"
        activeOpacity={0.92}
        style={[styles.gridCardWrapper, style]}
        accessibilityRole="button"
        accessibilityLabel={`${project.title}, ${price} euros`}
      >
        <View
          style={[
            styles.gridImageContainer,
            {
              backgroundColor: isDark ? '#1E2028' : '#F1F3F5',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
        >
          <Image
            source={{ uri: coverImage }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />

          {/* Bottom-Left Price Pill overlay */}
          <View style={styles.gridPricePill}>
            <Text style={styles.gridPricePrefix}>Desde </Text>
            <Text style={styles.gridPriceText}>{price} €</Text>
          </View>

          {/* Bottom-Right Circular Action Button ↗ */}
          <View style={styles.gridActionBtn}>
            <Ionicons
              name="arrow-up"
              size={15}
              color="#0F172A"
              style={{ transform: [{ rotate: '45deg' }] }}
            />
          </View>
        </View>

        <Text
          numberOfLines={1}
          style={[
            styles.gridTitle,
            { color: colors.textPrimary },
          ]}
        >
          {project.title}
        </Text>
      </ThemedTouchable>
    );
  }

  // --- FULL VIEW (Diseñado exactamente según la Imagen 2 de Referencia) ---
  return (
    <View style={[styles.fullCardContainer, style]}>
      {/* 1. Header Row: Author Avatar + Name + Action Pill + Menu Button */}
      <View style={styles.headerRow}>
        <ThemedTouchable
          onPress={() => {
            if (pro?.id) {
              router.push({
                pathname: '/detail',
                params: { id: pro.id, entityType: 'professional' },
              });
            } else {
              onPress?.();
            }
          }}
          haptic="light"
          style={styles.authorCol}
        >
          <Image
            source={{ uri: proAvatar }}
            style={styles.authorAvatar}
            contentFit="cover"
            transition={150}
          />
          <View style={styles.authorMeta}>
            <Text
              numberOfLines={1}
              style={[
                styles.authorName,
                { color: isDark ? '#F8FAFC' : '#0F172A' },
              ]}
            >
              {proName}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                styles.authorSubtitle,
                { color: isDark ? '#94A3B8' : '#64748B' },
              ]}
            >
              {categoryName}
            </Text>
          </View>
        </ThemedTouchable>

        <View style={styles.headerActionsRow}>
          {/* Action Button: "Contactar" in crisp white rounded pill */}
          <ThemedTouchable
            onPress={handleContactPress}
            haptic="medium"
            style={[
              styles.followPill,
              {
                backgroundColor: isDark ? '#27272A' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Contactar profesional"
          >
            <Text
              style={[
                styles.followPillText,
                { color: isDark ? '#F8FAFC' : '#0F172A' },
              ]}
            >
              Contactar
            </Text>
          </ThemedTouchable>

          {/* Circular Menu Button: ☰ icon */}
          <ThemedTouchable
            onPress={handleMenuPress}
            haptic="light"
            style={[
              styles.circularMenuBtn,
              {
                backgroundColor: isDark ? '#27272A' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Ver opciones del profesional"
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={18}
              color={isDark ? '#F8FAFC' : '#0F172A'}
            />
          </ThemedTouchable>
        </View>
      </View>

      {/* 2. Main Large Media Card with 24px Rounded Corners */}
      <ThemedTouchable
        onPress={onPress}
        haptic="selection"
        activeOpacity={0.94}
        style={[
          styles.imageCard,
          {
            backgroundColor: isDark ? '#181A22' : '#F1F3F5',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Ver detalle de ${project.title}`}
      >
        <Image
          source={{ uri: coverImage }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
      </ThemedTouchable>

      {/* 3. Bottom Floating Pills Row: Reseñas / Comentarios a la izquierda, Guardado / Precio a la derecha */}
      <View style={styles.footerPillsRow}>
        {/* Left Interaction Pill: Consultas y Comentarios */}
        <View
          style={[
            styles.floatingPill,
            {
              backgroundColor: isDark ? '#27272A' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          {/* Comment / Total Consultas */}
          <ThemedTouchable
            onPress={handleCommentsPress}
            haptic="light"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.pillStatItem}
            accessibilityRole="button"
            accessibilityLabel={`${totalReviews} comentarios, ver consultas`}
          >
            <Ionicons
              name="chatbubble-outline"
              size={13.5}
              color={isDark ? '#F8FAFC' : '#0F172A'}
            />
            <Text
              style={[
                styles.pillStatText,
                { color: isDark ? '#F8FAFC' : '#0F172A' },
              ]}
            >
              {totalReviews}
            </Text>
          </ThemedTouchable>
        </View>

        {/* Right Bookmark / Price Pill */}
        <View
          style={[
            styles.floatingPill,
            styles.priceBookmarkPill,
            {
              backgroundColor: isDark ? '#27272A' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          {/* Bookmark Button (Guardar en favoritos) */}
          <ThemedTouchable
            onPress={handleBookmarkPress}
            haptic="medium"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 6 }}
            style={{ paddingRight: 6 }}
            accessibilityRole="button"
            accessibilityLabel={isFav ? 'Quitar de guardados' : 'Guardar servicio en favoritos'}
          >
            <Ionicons
              name={isFav ? 'bookmark' : 'bookmark-outline'}
              size={16}
              color={isFav ? '#0284C7' : (isDark ? '#38BDF8' : '#0284C7')}
            />
          </ThemedTouchable>

          {/* Price Action Button */}
          <ThemedTouchable
            onPress={onPress}
            haptic="light"
            style={{ flexDirection: 'row', alignItems: 'center' }}
            accessibilityRole="button"
            accessibilityLabel={`Desde ${price} euros`}
          >
            <Text
              style={[
                styles.pricePrefix,
                { color: isDark ? '#94A3B8' : '#64748B' },
              ]}
            >
              Desde{' '}
            </Text>
            <Text
              style={[
                styles.priceNumber,
                { color: isDark ? '#F8FAFC' : '#0F172A' },
              ]}
            >
              {price} €
            </Text>
          </ThemedTouchable>
        </View>
      </View>

      {/* 4. Project Headline below Card for maximum editorial context */}
      <ThemedTouchable
        onPress={onPress}
        haptic="light"
        activeOpacity={0.88}
        style={styles.titleRow}
      >
        <Text
          numberOfLines={2}
          style={[
            styles.fullProjectTitle,
            { color: isDark ? '#F8FAFC' : '#0F172A' },
          ]}
        >
          {project.title}
        </Text>
      </ThemedTouchable>
    </View>
  );
}

const styles = StyleSheet.create({
  // FULL FEED VIEW (IMAGEN 2)
  fullCardContainer: {
    width: '100%',
    marginBottom: 30, // Generosa separación entre servicios (cero apiñamiento)
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  authorCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  authorAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E2E8F0',
  },
  authorMeta: {
    marginLeft: 11,
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -0.3,
  },
  authorSubtitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    marginTop: 1,
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  followPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  followPillText: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -0.2,
  },
  circularMenuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  imageCard: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 4,
  },
  footerPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 2,
  },
  floatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  pillStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pillStatText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -0.2,
  },
  pillDivider: {
    width: 1,
    height: 12,
    marginHorizontal: 10,
  },
  priceBookmarkPill: {
    paddingHorizontal: 15,
  },
  pricePrefix: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  priceNumber: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    letterSpacing: -0.3,
  },
  titleRow: {
    marginTop: 8,
    paddingHorizontal: 6,
  },
  fullProjectTitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-SemiBold',
    lineHeight: 20,
    letterSpacing: -0.2,
  },

  // GRID VIEW (PERFIL - PANTALLA 3)
  gridCardWrapper: {
    flex: 1,
    maxWidth: '48%',
    marginBottom: 16,
  },
  gridImageContainer: {
    width: '100%',
    aspectRatio: 0.88,
    borderRadius: 26,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  gridRatingPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  gridRatingText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#0F172A',
  },
  gridPricePill: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  gridPricePrefix: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#64748B',
  },
  gridPriceText: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    color: '#0F172A',
  },
  gridActionBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  gridTitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-SemiBold',
    marginTop: 6,
    paddingHorizontal: 2,
    letterSpacing: -0.2,
  },
});

export default ProjectCard;
