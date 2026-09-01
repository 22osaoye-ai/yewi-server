import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  View,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { ThemedPressed } from '@/components/ui/ThemedPressed';
import { CustomAlert } from '@/components/ui/CustomAlert';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useAuthStore } from '@/store/useAuthStore';
import { paymentsApi } from '@/services/paymentsApi';
import { notificationService } from '@/services/notificationService';
import { gigsApi, GigDetail, GigPackage } from '@/services/gigsApi';
import {
  professionalsApi,
  ProfessionalDetail,
  PortfolioItem,
} from '@/services/professionalsApi';
import { reviewsApi, ReviewItem } from '@/services/reviewsApi';
import { ImageViewerModal } from '@/components/ui/ImageViewerModal';
import { toast } from '@/store/useToastStore';


const display = (value: unknown, fallback = 'Dato no disponible') =>
  value === null || value === undefined || value === '' ? fallback : String(value);

export default function DetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { user, isAuthenticated } = useAuthStore();

  const { id, entityType = 'professional' } = useLocalSearchParams<{
    id?: string;
    entityType?: 'gig' | 'professional';
  }>();

  const [entity, setEntity] = useState<GigDetail | ProfessionalDetail | null>(null);
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<GigPackage | null>(null);
  const [processing, setProcessing] = useState(false);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '' });

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Active Portfolio Image Viewer Modal
  const [activePhoto, setActivePhoto] = useState<{
    url: string;
    title?: string;
    description?: string;
    category?: string;
  } | null>(null);


  const loadData = useCallback(async () => {
    if (!id) {
      setError('No se ha indicado el profesional o servicio solicitado.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      if (entityType === 'professional') {
        const proData = await professionalsApi.getPublicProfile(id);
        setEntity(proData);
        // Load reviews
        try {
          const revs = await reviewsApi.getReviewsByProfessional(id);
          setReviewsList(revs || []);
        } catch {
          setReviewsList([]);
        }
      } else {
        const gigData = await gigsApi.getById(id);
        setEntity(gigData);
        setSelectedPackage(gigData?.packages?.[0] ?? null);
      }
      setError(null);
    } catch (requestError: any) {
      setError(requestError.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [id, entityType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const gig = entityType === 'professional' ? null : (entity as GigDetail | null);
  const professional = entityType === 'professional' ? (entity as ProfessionalDetail | null) : null;
  const gigProfile = entityType === 'professional' ? null : (entity as GigDetail | null)?.professionalProfile;
  const profile = gigProfile || professional;

  const sellerName =
    profile?.businessName ||
    profile?.user?.profile?.displayName ||
    (professional?.user?.profile?.firstName
      ? `${professional.user.profile.firstName} ${professional.user.profile.lastName || ''}`.trim()
      : ((gigProfile?.user?.profile as any)?.firstName
          ? `${(gigProfile?.user?.profile as any).firstName} ${(gigProfile?.user?.profile as any).lastName || ''}`.trim()
          : 'Profesional Autónomo'));

  const rawAvatar =
    gigProfile?.user?.profile?.avatarUrl ||
    (gigProfile?.user as any)?.avatarUrl ||
    professional?.user?.profile?.avatarUrl ||
    (professional?.user as any)?.avatarUrl ||
    (professional as any)?.avatarUrl;

  const sellerAvatar =
    (rawAvatar && !rawAvatar.startsWith('file://'))
      ? rawAvatar
      : profile?.portfolioItems?.[0]?.imageUrls?.[0] || null;

  const proUserId =
    (gigProfile?.user as any)?.id ||
    (gigProfile as any)?.userId ||
    (professional?.user as any)?.id ||
    (professional as any)?.userId ||
    (entity as any)?.userId ||
    (entity as any)?.authorId ||
    (gig as any)?.userId ||
    (gig as any)?.authorId;

  const proId =
    gigProfile?.id ||
    professional?.id ||
    (gig as any)?.professionalProfileId;

  const userProId = (user?.professionalProfile as any)?.id;

  const isPro = professional?.isPro === true || gigProfile?.isPro === true;
  const isOwner = Boolean(
    user?.id &&
      (user.id === id ||
        (proUserId && user.id === proUserId) ||
        (user.id === (professional as any)?.userId) ||
        (user.id === (entity as any)?.userId) ||
        (user.id === (gig as any)?.userId) ||
        (user.id === (gig as any)?.authorId) ||
        (userProId && proId && userProId === proId))
  );

  const imageUrl =
    gig?.coverImages?.[0] ||
    sellerAvatar ||
    profile?.portfolioItems?.[0]?.imageUrls?.[0];

  const price = selectedPackage ? Number(selectedPackage.price) : null;
  const isFav = entity ? isFavorite(entity.id) : false;
  const location = [profile?.city, profile?.province].filter(Boolean).join(', ') || 'España';
  const faqs = Array.isArray(gig?.faqs) ? (gig.faqs as { question?: string; answer?: string }[]) : [];
  const title = gig?.title || sellerName;
  const description = gig?.description || professional?.bio;
  const category = gig?.category?.name || professional?.categories?.[0]?.name || professional?.skills?.[0] || 'Servicios';
  const rating = entity?.avgRating && entity.avgRating > 0 ? entity.avgRating.toFixed(1) : null;
  const reviewsCount = entity?.totalReviews ?? reviewsList.length;
  const canBuy = Boolean(gig && selectedPackage && Number.isFinite(price));
  const hourlyRate = professional?.hourlyRate ? Number(professional.hourlyRate) : null;

  const handleBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  const handleContactSeller = () => {
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

    const defaultMsg = gig
      ? `¡Hola ${sellerName}! He visto tu proyecto "${gig.title}" (${price ? `${price} €` : ''}) y me gustaría contratarlo o solicitar más detalles.`
      : `¡Hola ${sellerName}! Me gustaría solicitar información sobre tus servicios profesionales.`;

    router.push({
      pathname: '/chat',
      params: {
        targetUserId: proUserId,
        targetName: sellerName,
        initialMessage: defaultMsg,
      },
    });
  };

  const handleHire = async () => {
    if (!gig || !selectedPackage || !canBuy) return;
    setProcessing(true);
    try {
      await paymentsApi.createPaymentIntent({
        amount: price as number,
        currency: 'EUR',
        paymentType: 'GIG_PURCHASE',
        referenceId: gig.id,
      });
      await notificationService.sendLocalNotification({
        title: 'Pago iniciado',
        body: `Pago iniciado para ${gig.title}.`,
        data: { screen: 'requests', gigId: gig.id },
      });
      setAlert({
        visible: true,
        title: 'Solicitud enviada',
        message: 'El pago y contratación se han iniciado correctamente.',
      });
    } catch (requestError: any) {
      setAlert({
        visible: true,
        title: 'No se pudo contratar',
        message: requestError.message || 'Error al procesar el pago.',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenReviewModal = () => {
    if (!isAuthenticated) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para valorar a un profesional.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Iniciar Sesión', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }
    setReviewRating(5);
    setReviewComment('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) {
      Alert.alert('Comentario requerido', 'Por favor describe brevemente tu experiencia con el trabajo realizado.');
      return;
    }

    setSubmittingReview(true);
    try {
      await reviewsApi.createReview({
        professionalProfileId: professional?.id || undefined,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setShowReviewModal(false);
      Alert.alert('¡Gracias por tu valoración!', 'Tu reseña ha sido publicada con éxito.');
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo enviar la reseña.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !entity) {
    return (
      <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: colors.background }}>
        <Ionicons name="alert-circle-outline" size={46} color={colors.textMuted} />
        <Text className="mt-4 text-center font-satoshi-bold text-base" style={{ color: colors.textPrimary }}>
          {display(error)}
        </Text>
        <ThemedTouchable onPress={handleBack} className="mt-6 rounded-full px-7 py-3" style={{ backgroundColor: colors.primary }}>
          <Text className="font-satoshi-bold text-white">Volver</Text>
        </ThemedTouchable>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Top Hero Banner / Avatar */}
        <View className="h-64 justify-end" style={{ backgroundColor: colors.surfaceAlt }}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.surface }}>
              <Ionicons name="business-outline" size={54} color={colors.textMuted} />
            </View>
          )}
          <View
            className="absolute left-5 right-5 flex-row justify-between"
            style={{ top: insets.top + 8 }}
          >
            <ThemedTouchable
              onPress={handleBack}
              className="h-11 w-11 items-center justify-center rounded-full bg-black/45"
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </ThemedTouchable>
            <ThemedTouchable
              onPress={() => toggleFavorite(entity.id)}
              className="h-11 w-11 items-center justify-center rounded-full bg-black/45"
            >
              <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={22} color={isFav ? '#EF4444' : '#fff'} />
            </ThemedTouchable>
          </View>
        </View>

        {/* Content Body */}
        <View className="px-5 pt-5">
          {/* Category & Pro Badge */}
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-satoshi-bold uppercase" style={{ color: colors.primary }}>
              {display(category)}
            </Text>
            {isPro && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                  backgroundColor: `${colors.primary}18`,
                  paddingHorizontal: 9,
                  paddingVertical: 3,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: `${colors.primary}40`,
                }}
              >
                <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
                <Text style={{ fontSize: 11, fontFamily: 'Satoshi-Black', color: colors.primary }}>
                  YEWI PRO
                </Text>
              </View>
            )}
          </View>

          {/* Title & Location */}
          <Text className="mt-2 text-2xl font-satoshi-black" style={{ color: colors.textPrimary }}>
            {title}
          </Text>
          <View className="flex-row items-center gap-2 mt-1.5">
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text className="font-satoshi-medium text-sm" style={{ color: colors.textSecondary }}>
              {location}
            </Text>
          </View>

          {/* Rating Summary Bar */}
          <View className="mt-3.5 flex-row items-center justify-between p-3.5 rounded-2xl" style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
            <View className="flex-row items-center gap-2">
              <Ionicons name="star" size={18} color="#F59E0B" />
              <Text className="font-satoshi-black text-base" style={{ color: colors.textPrimary }}>
                {rating ? rating : 'Sin valoraciones'}
              </Text>
              <Text className="font-satoshi-medium text-xs" style={{ color: colors.textMuted }}>
                ({reviewsCount} {reviewsCount === 1 ? 'reseña' : 'reseñas'})
              </Text>
            </View>

            {hourlyRate ? (
              <View className="flex-row items-center gap-1">
                <Text className="font-satoshi-black text-base" style={{ color: colors.primary }}>
                  {hourlyRate} €
                </Text>
                <Text className="font-satoshi-medium text-xs" style={{ color: colors.textSecondary }}>
                  /hora
                </Text>
              </View>
            ) : null}
          </View>

          {/* SECTION: SELLER PROFILE & AVATAR CARD (When viewing a service/gig) */}
          {entityType === 'gig' && profile && (
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
              style={{
                marginTop: 16,
                padding: 16,
                borderRadius: 20,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 10 }}>
                {sellerAvatar ? (
                  <Image
                    source={{ uri: sellerAvatar }}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      borderWidth: 2,
                      borderColor: colors.primary,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: colors.primaryLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      borderColor: colors.primary,
                    }}
                  >
                    <Text style={{ fontSize: 19, fontFamily: 'Satoshi-Black', color: colors.primary }}>
                      {sellerName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text numberOfLines={1} style={{ fontSize: 15, fontFamily: 'Satoshi-Black', color: colors.textPrimary }}>
                      {sellerName}
                    </Text>
                    {isPro && (
                      <View
                        style={{
                          backgroundColor: `${colors.primary}18`,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 6,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontFamily: 'Satoshi-Black', color: colors.primary }}>
                          PRO
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={{ fontSize: 12, fontFamily: 'Satoshi-Medium', color: colors.textSecondary, marginTop: 1 }}>
                    {location}
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={{ fontSize: 12, fontFamily: 'Satoshi-Bold', color: colors.textPrimary }}>
                      {rating || '5.0'}
                    </Text>
                    <Text style={{ fontSize: 11.5, fontFamily: 'Satoshi-Regular', color: colors.textMuted }}>
                      ({reviewsCount} {reviewsCount === 1 ? 'reseña' : 'reseñas'})
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: colors.surfaceAlt,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Text style={{ fontSize: 12, fontFamily: 'Satoshi-Bold', color: colors.primary }}>
                  Ver Perfil
                </Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </View>
            </ThemedTouchable>
          )}

          {/* Bio / Description */}
          <Text className="mt-6 text-base font-satoshi-bold" style={{ color: colors.textPrimary }}>
            {entityType === 'gig' ? 'Descripción del servicio' : 'Sobre la empresa / profesional'}
          </Text>
          <Text className="mt-2 text-sm leading-6 font-satoshi-regular" style={{ color: colors.textSecondary }}>
            {display(description, 'Profesional autónomo registrado en la plataforma Yewi.')}
          </Text>

          {/* Portfolio Photos Gallery */}
          {professional?.portfolioItems && professional.portfolioItems.length > 0 ? (
            <View className="mt-8">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-lg font-satoshi-black" style={{ color: colors.textPrimary }}>
                  Trabajos y Portafolio ({professional.portfolioItems.length})
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {professional.portfolioItems.map((item) => (
                  <ThemedTouchable
                    key={item.id}
                    onPress={() => {
                      if (item.imageUrls?.[0]) {
                        setActivePhoto({
                          url: item.imageUrls[0],
                          title: item.title,
                          description: item.description,
                          category: item.tags?.[0] || professional?.categories?.[0]?.name,
                        });
                      }
                    }}
                    haptic="light"
                    style={{
                      width: 220,
                      backgroundColor: colors.surface,
                      borderRadius: 18,
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >

                    {item.imageUrls?.[0] ? (
                      <Image source={{ uri: item.imageUrls[0] }} style={{ width: '100%', height: 130 }} resizeMode="cover" />
                    ) : (
                      <View style={{ width: '100%', height: 130, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="image-outline" size={32} color={colors.textMuted} />
                      </View>
                    )}
                    <View style={{ padding: 12 }}>
                      <Text numberOfLines={1} style={{ fontSize: 13.5, fontFamily: 'Satoshi-Bold', color: colors.textPrimary }}>
                        {item.title}
                      </Text>
                      <Text numberOfLines={2} style={{ fontSize: 12, fontFamily: 'Satoshi-Regular', color: colors.textSecondary, marginTop: 2, lineHeight: 16 }}>
                        {item.description}
                      </Text>
                    </View>
                  </ThemedTouchable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Gig Packages (if Gig entity) */}
          {gig?.packages?.length ? (
            <View className="mt-8">
              <Text className="text-lg font-satoshi-black mb-3" style={{ color: colors.textPrimary }}>
                Paquetes de contratación
              </Text>
              {gig.packages.map((pkg) => {
                const selected = selectedPackage?.id === pkg.id;
                return (
                  <ThemedTouchable
                    key={pkg.id}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setSelectedPackage(pkg);
                    }}
                    className="mb-3 rounded-2xl border p-4"
                    style={{
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: colors.surface,
                    }}
                  >
                    <View className="flex-row justify-between">
                      <Text className="flex-1 font-satoshi-bold" style={{ color: colors.textPrimary }}>
                        {pkg.name}
                      </Text>
                      <Text className="font-satoshi-black" style={{ color: colors.primary }}>
                        {display(pkg.price)} €
                      </Text>
                    </View>
                    <Text className="mt-1 font-satoshi-regular text-xs" style={{ color: colors.textSecondary }}>
                      {display(pkg.description)}
                    </Text>
                  </ThemedTouchable>
                );
              })}
            </View>
          ) : null}

          {/* FAQs (if any) */}
          {faqs.length ? (
            <View className="mt-8">
              <Text className="text-lg font-satoshi-black mb-3" style={{ color: colors.textPrimary }}>
                Preguntas frecuentes
              </Text>
              {faqs.map((faq, index) => (
                <View key={`${faq.question}-${index}`} className="mb-2.5 rounded-xl p-4" style={{ backgroundColor: colors.surface }}>
                  <Text className="font-satoshi-bold text-sm" style={{ color: colors.textPrimary }}>
                    {display(faq.question)}
                  </Text>
                  <Text className="mt-1 font-satoshi-regular text-xs leading-5" style={{ color: colors.textSecondary }}>
                    {display(faq.answer)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* SECTION: CLIENT REVIEWS & VALORACIONES */}
          <View className="mt-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-satoshi-black" style={{ color: colors.textPrimary }}>
                Reseñas de clientes ({reviewsList.length})
              </Text>
              {!isOwner && (
                <ThemedPressed
                  onPress={handleOpenReviewModal}
                  haptic="medium"
                  scaleOnPress
                  style={{
                    backgroundColor: colors.surface,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: colors.primary,
                  }}
                >
                  <Text style={{ fontSize: 12, fontFamily: 'Satoshi-Bold', color: colors.primary }}>
                    + Dejar Reseña
                  </Text>
                </ThemedPressed>
              )}

            </View>

            {reviewsList.length > 0 ? (
              reviewsList.map((rev) => {
                const authorName =
                  rev.author?.profile?.displayName ||
                  [rev.author?.profile?.firstName, rev.author?.profile?.lastName].filter(Boolean).join(' ') ||
                  'Cliente Verificado';

                return (
                  <View
                    key={rev.id}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 18,
                      padding: 14,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: colors.surfaceAlt,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Ionicons name="person" size={16} color={colors.textSecondary} />
                        </View>
                        <Text style={{ fontSize: 13.5, fontFamily: 'Satoshi-Bold', color: colors.textPrimary }}>
                          {authorName}
                        </Text>
                      </View>

                      {/* Stars */}
                      <View style={{ flexDirection: 'row', gap: 2 }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons
                            key={star}
                            name={star <= rev.rating ? 'star' : 'star-outline'}
                            size={13}
                            color="#F59E0B"
                          />
                        ))}
                      </View>
                    </View>

                    <Text style={{ fontSize: 13, fontFamily: 'Satoshi-Regular', color: colors.textSecondary, marginTop: 8, lineHeight: 18 }}>
                      {rev.comment}
                    </Text>

                    {/* Seller Reply */}
                    {rev.sellerReply ? (
                      <View
                        style={{
                          marginTop: 10,
                          padding: 10,
                          borderRadius: 12,
                          backgroundColor: colors.surfaceAlt,
                          borderLeftWidth: 3,
                          borderLeftColor: colors.primary,
                        }}
                      >
                        <Text style={{ fontSize: 11.5, fontFamily: 'Satoshi-Bold', color: colors.textPrimary }}>
                          Respuesta del profesional:
                        </Text>
                        <Text style={{ fontSize: 12, fontFamily: 'Satoshi-Regular', color: colors.textSecondary, marginTop: 2 }}>
                          {rev.sellerReply}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              })
            ) : (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 18,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                }}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={32} color={colors.textMuted} />
                <Text style={{ fontSize: 14, fontFamily: 'Satoshi-Bold', color: colors.textPrimary, marginTop: 8 }}>
                  Aún no hay reseñas registradas
                </Text>
                <Text style={{ fontSize: 12.5, fontFamily: 'Satoshi-Regular', color: colors.textMuted, textAlign: 'center', marginTop: 4 }}>
                  Sé el primero en valorar el trabajo y profesionalidad de este autónomo.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      {/* FIXED BOTTOM ACTION BAR */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom + 12, 24),
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.borderSubtle,
        }}
      >
        {entityType === 'gig' ? (
          isOwner ? (
            <ThemedTouchable
              onPress={() => {
                router.push('/professional-profile');
              }}
              className="items-center rounded-full py-4 flex-row justify-center gap-2"
              style={{ backgroundColor: colors.primary }}
            >
              <Ionicons name="create-outline" size={19} color="#FFFFFF" />
              <Text className="font-satoshi-bold text-white text-base">
                Tu Proyecto · Gestionar
              </Text>
            </ThemedTouchable>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ThemedTouchable
                onPress={handleContactSeller}
                haptic="medium"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1.5,
                  borderColor: colors.primary,
                  borderRadius: 999,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 6,
                }}
              >
                <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary} />
                <Text style={{ fontFamily: 'Satoshi-Bold', color: colors.primary, fontSize: 14 }}>
                  Contactar
                </Text>
              </ThemedTouchable>

              <ThemedTouchable
                disabled={!canBuy || processing}
                onPress={handleHire}
                haptic="medium"
                style={{
                  flex: 1,
                  backgroundColor: canBuy ? colors.primary : colors.surfaceAlt,
                  borderRadius: 999,
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-satoshi-bold text-white text-base">
                    {canBuy ? `Contratar · ${price} €` : 'Paquete no disponible'}
                  </Text>
                )}
              </ThemedTouchable>
            </View>
          )
        ) : isOwner ? (
          <ThemedTouchable
            onPress={() => {
              router.push('/professional-profile');
            }}
            className="items-center rounded-full py-4 flex-row justify-center gap-2"
            style={{ backgroundColor: colors.primary }}
          >
            <Ionicons name="create-outline" size={19} color="#FFFFFF" />
            <Text className="font-satoshi-bold text-white text-base">
              Editar Mi Perfil
            </Text>
          </ThemedTouchable>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ThemedTouchable
              onPress={handleContactSeller}
              haptic="medium"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1.5,
                borderColor: colors.primary,
                borderRadius: 999,
                paddingVertical: 14,
                paddingHorizontal: 18,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
              }}
            >
              <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary} />
              <Text style={{ fontFamily: 'Satoshi-Bold', color: colors.primary, fontSize: 14 }}>
                Contactar
              </Text>
            </ThemedTouchable>

            <ThemedTouchable
              onPress={() => {
                router.push('/(tabs)/requests');
              }}
              className="flex-1 items-center rounded-full py-4"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="font-satoshi-bold text-white text-base">
                Pedir Presupuesto
              </Text>
            </ThemedTouchable>
          </View>
        )}
      </View>

      {/* MODAL: DEJAR RESEÑA */}
      <Modal visible={showReviewModal} animationType="slide" transparent onRequestClose={() => setShowReviewModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/60"
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              borderTopWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontFamily: 'Satoshi-Black', color: colors.textPrimary }}>
                Valorar a {sellerName}
              </Text>
              <Pressable onPress={() => setShowReviewModal(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={{ fontSize: 13, fontFamily: 'Satoshi-Regular', color: colors.textSecondary, marginBottom: 16 }}>
              Tu reseña ayudará a otros clientes a elegir el mejor profesional.
            </Text>

            {/* Star Rating Selector */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setReviewRating(star);
                  }}
                  hitSlop={8}
                >
                  <Ionicons
                    name={star <= reviewRating ? 'star' : 'star-outline'}
                    size={36}
                    color="#F59E0B"
                  />
                </Pressable>
              ))}
            </View>

            {/* Comment Area: Flat without borders or shadows */}
            <TextInput
              style={{
                backgroundColor: colors.surface,
                borderRadius: 0,
                borderWidth: 0,
                borderColor: 'transparent',
                elevation: 0,
                shadowOpacity: 0,
                padding: 16,
                color: colors.textPrimary,
                fontFamily: 'Satoshi-Regular',
                fontSize: 14,
                minHeight: 110,
                textAlignVertical: 'top',
                marginBottom: 20,
              }}
              placeholder="Explica qué te pareció el servicio, la puntualidad, limpieza y acabados..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              value={reviewComment}
              onChangeText={setReviewComment}
            />

            <ThemedPressed
              onPress={handleSubmitReview}
              disabled={submittingReview}
              haptic="medium"
              scaleOnPress
              style={{
                backgroundColor: colors.primary,
                borderRadius: 999,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              {submittingReview ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontFamily: 'Satoshi-Bold', fontSize: 15 }}>
                  Publicar Reseña
                </Text>
              )}
            </ThemedPressed>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* FULLSCREEN IMAGE VIEWER MODAL MATCHING DESIGN */}
      <ImageViewerModal
        visible={Boolean(activePhoto)}
        imageUri={activePhoto?.url || null}
        title={activePhoto?.title}
        description={activePhoto?.description}
        category={activePhoto?.category}
        onClose={() => setActivePhoto(null)}
      />


      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert((current) => ({ ...current, visible: false }))}
      />
    </View>
  );
}
