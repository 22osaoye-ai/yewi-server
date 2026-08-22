import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  Heart,
  RefreshCw,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Star,
  Zap,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows, Typography } from '../../src/components/Theme';
import { useToast } from '../../src/components/Toast';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/store/auth.store';
import { Gig, GigPackage, GigTier } from '../../src/types';

export default function GigDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { showToast } = useToast();

  const [selectedTier, setSelectedTier] = useState<GigTier>('PREMIUM');
  const [isOrdering, setIsOrdering] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const { data: gig, isLoading } = useQuery<Gig>({
    queryKey: ['gig-detail', id],
    queryFn: async () => {
      const res: any = await api.get(`/gigs/${id}`);
      return res.data || res;
    },
  });

  const currentPackage: GigPackage | undefined =
    gig?.packages?.find((p) => p.tier === selectedTier) || gig?.packages?.[0];

  const handleOrder = async () => {
    if (!isAuthenticated) {
      showToast({
        type: 'info',
        title: 'Inicia Sesión',
        message: 'Debes iniciar sesión para contratar este servicio con Escrow.',
      });
      router.push('/(auth)/login');
      return;
    }

    if (!currentPackage) return;

    try {
      setIsOrdering(true);
      const res: any = await api.post('/orders/gig', {
        gigPackageId: currentPackage.id,
      });
      const order = res.data || res;
      showToast({
        type: 'success',
        title: '¡Pedido Formalizado!',
        message: `Pedido ${order.orderNumber || ''} creado con fondos en Escrow.`,
      });
      router.push('/(client)/orders');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al procesar el pedido.';
      showToast({
        type: 'error',
        title: 'Error de Pedido',
        message: msg,
      });
    } finally {
      setIsOrdering(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!gig) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Servicio no encontrado.</Text>
        <TouchableOpacity
          style={styles.backButtonPill}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonPillText}>Volver Atrás</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Compatibilidad con professionalProfile y professional
  const proProfile = (gig as any).professionalProfile || gig.professional;
  const sellerFirstName = proProfile?.user?.profile?.firstName || '';
  const sellerLastName = proProfile?.user?.profile?.lastName || '';
  const sellerFullName = sellerFirstName
    ? `${sellerFirstName} ${sellerLastName}`.trim()
    : 'Profesional Verificado';
  const sellerName = proProfile?.businessName || sellerFullName;
  const initial = (sellerFirstName || sellerName || 'u').charAt(0).toLowerCase();

  const rating = gig.ratingAvg ? gig.ratingAvg.toFixed(1) : '5.0';
  const reviewCount = gig.ratingCount || gig.totalReviews || 1;
  const categoryName = gig.category?.name || 'FONTANERÍA';

  return (
    <View style={styles.container}>
      {/* Top Action Bar transparente integrado sobre el fondo original */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top + 6, 14),
          },
        ]}
      >
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color="#111813" />
        </TouchableOpacity>

        {/* Emblema central de rayo flotante */}
        <View style={styles.centerEmblem}>
          <Zap size={28} color="#6C756F" />
        </View>

        {/* Acciones Derecha */}
        <View style={styles.rightActions}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => setIsSaved(!isSaved)}
            activeOpacity={0.8}
          >
            <Heart
              size={18}
              color={isSaved ? Colors.danger : '#111813'}
              fill={isSaved ? Colors.danger : 'transparent'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => {
              showToast({
                type: 'info',
                title: 'Enlace Copiado',
                message: 'Enlace copiado al portapapeles.',
              });
            }}
            activeOpacity={0.8}
          >
            <Share2 size={18} color="#111813" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Kicker */}
        <Text style={styles.categoryKicker}>
          {categoryName.toUpperCase()}
        </Text>

        {/* Title */}
        <Text style={styles.title}>{gig.title}</Text>

        {/* Seller Info Row */}
        <View style={styles.sellerRow}>
          <View style={styles.avatarCircle}>
            {proProfile?.user?.profile?.avatarUrl ? (
              <Image
                source={{ uri: proProfile.user.profile.avatarUrl }}
                style={styles.avatarImg}
              />
            ) : (
              <Text style={styles.avatarInitial}>{initial}</Text>
            )}
          </View>

          <View style={styles.sellerDetails}>
            <Text style={styles.sellerNameText}>{sellerName}</Text>
            <View style={styles.ratingRow}>
              <Star size={13} color="#D97706" fill="#D97706" />
              <Text style={styles.ratingText}>{rating}</Text>
              <Text style={styles.reviewCountText}>
                ({reviewCount} reseñas)
              </Text>
            </View>
          </View>
        </View>

        {/* Package Tabs Container (Básico, Estándar, Premium) */}
        {gig.packages && gig.packages.length > 0 && (
          <View style={styles.packageContainer}>
            <View style={styles.packageTabsRow}>
              {(['BASIC', 'STANDARD', 'PREMIUM'] as GigTier[]).map((tier) => {
                const pkg = gig.packages?.find((p) => p.tier === tier);
                if (!pkg) return null;
                const isSelected = selectedTier === tier;
                const label =
                  tier === 'BASIC'
                    ? 'Básico'
                    : tier === 'STANDARD'
                    ? 'Estándar'
                    : 'Premium';

                return (
                  <TouchableOpacity
                    key={tier}
                    style={[
                      styles.packageTab,
                      isSelected && styles.packageTabActive,
                    ]}
                    onPress={() => setSelectedTier(tier)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.packageTabText,
                        isSelected && styles.packageTabTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selected Package Card Body */}
            {currentPackage && (
              <View style={styles.packageCardBody}>
                <View style={styles.packageHeaderRow}>
                  <Text style={styles.packagePrice}>
                    {currentPackage.price} €
                  </Text>
                </View>

                <Text style={styles.packageDescription}>
                  {currentPackage.description}
                </Text>

                <View style={styles.packagePillsRow}>
                  <View style={styles.pillBadge}>
                    <Clock size={13} color="#6C756F" />
                    <Text style={styles.pillBadgeText}>
                      Entrega en {currentPackage.deliveryDays} días
                    </Text>
                  </View>

                  <View style={styles.pillBadge}>
                    <RefreshCw size={13} color="#6C756F" />
                    <Text style={styles.pillBadgeText}>
                      {currentPackage.revisions === -1
                        ? 'Revisiones ilimitadas'
                        : `${currentPackage.revisions} revisiones`}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Description Section Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Descripción del Servicio</Text>
          <Text style={styles.descriptionText}>{gig.description}</Text>
        </View>

        {/* Escrow Guarantee Card */}
        <View style={styles.escrowCard}>
          <ShieldCheck size={22} color="#059669" />
          <View style={{ flex: 1 }}>
            <Text style={styles.escrowTitle}>Protección Escrow Yewi</Text>
            <Text style={styles.escrowDesc}>
              Tu dinero permanece retenido y seguro. Solo se transfiere al profesional cuando confirmes la entrega satisfactoria.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Checkout Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom + 12, 18),
          },
        ]}
      >
        <View style={styles.bottomPriceWrap}>
          <Text style={styles.bottomPriceLabel}>PRECIO DEL PAQUETE</Text>
          <Text style={styles.bottomPriceValue}>
            {currentPackage?.price || gig.startingPrice || 35} €
          </Text>
        </View>

        <TouchableOpacity
          style={styles.escrowButton}
          onPress={handleOrder}
          disabled={isOrdering}
          activeOpacity={0.88}
        >
          {isOrdering ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <ShoppingCart size={18} color="#FFFFFF" />
              <Text style={styles.escrowButtonText}>Contratar con Escrow</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5', // Fondo cálido idéntico al original de la imagen
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111813',
    textAlign: 'center',
  },
  backButtonPill: {
    marginTop: 14,
    backgroundColor: '#111813',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 9999,
  },
  backButtonPillText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 4,
    backgroundColor: '#FAF8F5',
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E2D5',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  centerEmblem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 120,
  },
  categoryKicker: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6C756F',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111813',
    letterSpacing: -0.5,
    lineHeight: 28,
    marginBottom: 16,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#111813',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111813',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111813',
  },
  reviewCountText: {
    fontSize: 12,
    color: '#6C756F',
  },
  packageContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E8E2D5',
    overflow: 'hidden',
    marginBottom: 16,
    ...Shadows.subtle,
  },
  packageTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F5ECE3', // Beige pastel cálido para pestañas inactivas
    borderBottomWidth: 1,
    borderBottomColor: '#E8E2D5',
  },
  packageTab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageTabActive: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#111813',
  },
  packageTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6C756F',
  },
  packageTabTextActive: {
    color: '#111813',
    fontWeight: '900',
  },
  packageCardBody: {
    padding: 20,
  },
  packageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  packagePrice: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111813',
  },
  packageDescription: {
    fontSize: 13,
    color: '#6C756F',
    lineHeight: 19,
    marginBottom: 16,
  },
  packagePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5ECE3',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    gap: 6,
  },
  pillBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111813',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E8E2D5',
    padding: 20,
    marginBottom: 16,
    ...Shadows.subtle,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111813',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 13,
    color: '#6C756F',
    lineHeight: 20,
  },
  escrowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA', // Fondo verde claro esmeralda suave idéntico a la captura
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#A8D5BA',
    padding: 16,
    gap: 14,
    marginBottom: 16,
  },
  escrowTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#059669',
    marginBottom: 2,
  },
  escrowDesc: {
    fontSize: 11,
    color: '#047857',
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E2D5',
    paddingHorizontal: 20,
    paddingTop: 12,
    ...Shadows.floating,
  },
  bottomPriceWrap: {
    flexDirection: 'column',
  },
  bottomPriceLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8E9892',
    textTransform: 'uppercase',
  },
  bottomPriceValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111813',
  },
  escrowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111813',
    height: 52,
    borderRadius: 9999,
    paddingHorizontal: 22,
    gap: 8,
    ...Shadows.floating,
  },
  escrowButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
