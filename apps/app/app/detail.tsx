import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  StyleSheet,
  Dimensions,
  Share,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { ThemedPressed } from '@/components/ui/ThemedPressed';
import { CustomAlert } from '@/components/ui/CustomAlert';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { paymentsApi } from '@/services/paymentsApi';
import { ordersApi } from '@/services/ordersApi';
import { notificationService } from '@/services/notificationService';
import { gigsApi, GigDetail, GigPackage } from '@/services/gigsApi';
import {
  professionalsApi,
  ProfessionalDetail,
  PortfolioItem,
} from '@/services/professionalsApi';
import { reviewsApi, ReviewItem } from '@/services/reviewsApi';
import { ImageViewerModal } from '@/components/ui/ImageViewerModal';
import { SAMPLE_PROJECTS, SAMPLE_PROFESSIONALS } from '@/constants/sampleData';
import { DEFAULT_TOP_RATED_PRODUCTS, TopRatedProductItem } from '@/components/ui/TopRatedCarousel';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { ProfessionalCard } from '@/components/ui/ProfessionalCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const REVIEW_CARD_WIDTH = Math.floor(SCREEN_WIDTH - 40);
const REVIEW_CARD_HEIGHT = 185;

const CATEGORY_STYLES: Record<
  string,
  {
    iconName: keyof typeof Ionicons.glyphMap;
    bgColor: string;
    textColor: string;
    iconColor: string;
  }
> = {
  electricidad: { iconName: 'flash', bgColor: '#FEF3C7', textColor: '#92400E', iconColor: '#D97706' },
  reformas: { iconName: 'construct', bgColor: '#DBEAFE', textColor: '#1E40AF', iconColor: '#2563EB' },
  fontaneria: { iconName: 'water', bgColor: '#E0E7FF', textColor: '#3730A3', iconColor: '#4F46E5' },
  climatizacion: { iconName: 'snow', bgColor: '#CCFBF1', textColor: '#115E59', iconColor: '#0D9488' },
  pintura: { iconName: 'color-palette', bgColor: '#F3E8FF', textColor: '#6B21A8', iconColor: '#9333EA' },
  banos: { iconName: 'water-outline', bgColor: '#E0F2FE', textColor: '#075985', iconColor: '#0284C7' },
  cocina: { iconName: 'restaurant', bgColor: '#FFEDD5', textColor: '#9A3412', iconColor: '#EA580C' },
  carpinteria: { iconName: 'hammer', bgColor: '#FEF9C3', textColor: '#854D0E', iconColor: '#CA8A04' },
  cerrajeria: { iconName: 'key', bgColor: '#EDE9FE', textColor: '#5B21B6', iconColor: '#7C3AED' },
  limpieza: { iconName: 'sparkles', bgColor: '#D1FAE5', textColor: '#065F46', iconColor: '#059669' },
  general: { iconName: 'briefcase', bgColor: '#E2E8F0', textColor: '#334155', iconColor: '#475569' },
};

function getCategoryStyle(cat: string) {
  const norm = (cat || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (norm.includes('electr')) return CATEGORY_STYLES.electricidad;
  if (norm.includes('fontan')) return CATEGORY_STYLES.fontaneria;
  if (norm.includes('pint')) return CATEGORY_STYLES.pintura;
  if (norm.includes('bañ') || norm.includes('ban')) return CATEGORY_STYLES.banos;
  if (norm.includes('cocin')) return CATEGORY_STYLES.cocina;
  if (norm.includes('clima') || norm.includes('aire')) return CATEGORY_STYLES.climatizacion;
  if (norm.includes('carp')) return CATEGORY_STYLES.carpinteria;
  if (norm.includes('cerraj')) return CATEGORY_STYLES.cerrajeria;
  if (norm.includes('reform')) return CATEGORY_STYLES.reformas;
  if (norm.includes('limp')) return CATEGORY_STYLES.limpieza;
  return CATEGORY_STYLES.general;
}

const SAMPLE_REVIEWS = [
  {
    id: 'rev-1',
    name: 'Carlos Mendoza',
    rating: 5,
    date: 'Hace 3 días',
    comment: 'Excelente profesional. Trabajo impecable, muy puntual y con custodia escrow sin sorpresas.',
    sellerReply: '¡Muchas gracias por tu valoración, Carlos! Un placer haber trabajado en tu proyecto.',
    sellerRepliedAt: 'Hace 2 días',
  },
  {
    id: 'rev-2',
    name: 'Elena Gómez',
    rating: 5,
    date: 'Hace 1 semana',
    comment: 'Muy recomendable. La comunicación fue perfecta y el resultado final superó las expectativas.',
  },
  {
    id: 'rev-3',
    name: 'Miguel Ángel Torres',
    rating: 4,
    date: 'Hace 2 semanas',
    comment: 'Formal, limpio y rápido en la reparación. Volveré a contar con sus servicios seguro.',
    sellerReply: 'Gracias Miguel Ángel por la confianza depositada en nuestro equipo.',
    sellerRepliedAt: 'Hace 10 días',
  },
];

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
    entityType?: 'gig' | 'professional' | 'product';
  }>();

  const [entity, setEntity] = useState<GigDetail | ProfessionalDetail | null>(null);
  const [product, setProduct] = useState<TopRatedProductItem | null>(null);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedAngleIndex, setSelectedAngleIndex] = useState(0);
  const [selectedDimension, setSelectedDimension] = useState('85×80 cm');
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<GigPackage | null>(null);
  const [processing, setProcessing] = useState(false);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '' });
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Professional Reply State
  const [replyingToReview, setReplyingToReview] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Active Portfolio Image Viewer Modal
  const [activePhoto, setActivePhoto] = useState<{
    url: string;
    title?: string;
    description?: string;
    category?: string;
  } | null>(null);
  const [activeFanIndex, setActiveFanIndex] = useState<number>(0);


  const loadData = useCallback(async () => {
    if (!id) {
      setError('No se ha indicado el profesional o servicio solicitado.');
      setLoading(false);
      return;
    }

    if (entityType === 'product') {
      const found =
        DEFAULT_TOP_RATED_PRODUCTS.find((p) => p.id === id) ||
        DEFAULT_TOP_RATED_PRODUCTS[0];
      setProduct(found);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    try {
      const isExplicitPro =
        entityType === 'professional' ||
        (id && id.startsWith('pro-')) ||
        SAMPLE_PROFESSIONALS.some((p) => p.id === id);
      const isTargetGig =
        !isExplicitPro &&
        (entityType === 'gig' ||
          (id && id.startsWith('gig-')) ||
          SAMPLE_PROJECTS.some((p) => p.id === id));

      if (!isTargetGig) {
        let proData: ProfessionalDetail | null = null;
        try {
          proData = await professionalsApi.getPublicProfile(id);
        } catch (proErr) {
          const samplePro = SAMPLE_PROFESSIONALS.find((p) => p.id === id);
          if (samplePro) {
            proData = samplePro;
          } else {
            throw proErr;
          }
        }
        if (!proData) {
          const samplePro = SAMPLE_PROFESSIONALS.find((p) => p.id === id);
          if (samplePro) proData = samplePro;
        }
        setEntity(proData);
        // Load reviews
        try {
          const revs = await reviewsApi.getReviewsByProfessional(id);
          setReviewsList(revs && revs.length > 0 ? revs : (proData as any)?.reviews || []);
        } catch {
          setReviewsList((proData as any)?.reviews || []);
        }
      } else {
        let gigData: GigDetail | null = null;
        try {
          gigData = await gigsApi.getById(id);
        } catch (gigErr) {
          const sampleGig = SAMPLE_PROJECTS.find((p) => p.id === id);
          if (sampleGig) {
            gigData = sampleGig;
          } else {
            throw gigErr;
          }
        }
        if (!gigData) {
          const sampleGig = SAMPLE_PROJECTS.find((p) => p.id === id);
          if (sampleGig) gigData = sampleGig;
        }
        if (!gigData) {
          throw new Error('No se encontró el servicio solicitado.');
        }
        setEntity(gigData);
        setSelectedPackage(gigData?.packages?.[0] ?? null);

        if (gigData.reviews && gigData.reviews.length > 0) {
          setReviewsList(gigData.reviews as ReviewItem[]);
        } else if (gigData.professionalProfile?.id) {
          try {
            const revs = await reviewsApi.getReviewsByProfessional(gigData.professionalProfile.id);
            setReviewsList(revs && revs.length > 0 ? revs : (gigData as any)?.reviews || []);
          } catch {
            setReviewsList((gigData as any)?.reviews || []);
          }
        }
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

  const isResolvedGig =
    entityType !== 'professional' &&
    (entityType === 'gig' ||
      Boolean(id && id.startsWith('gig-')) ||
      Boolean((entity as any)?.packages && !(entity as any)?.businessName));
  const gig = isResolvedGig ? (entity as GigDetail | null) : null;
  const professional = isResolvedGig ? null : (entity as ProfessionalDetail | null);
  const gigProfile = isResolvedGig ? (entity as GigDetail | null)?.professionalProfile : null;
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

  const activePromo =
    (profile as any)?.promotions?.[0] ||
    (gigProfile as any)?.promotions?.[0] ||
    null;
  const promoDiscountPercent =
    activePromo?.discountPercent && activePromo.discountPercent > 0
      ? activePromo.discountPercent
      : null;

  const rawPrice = selectedPackage ? Number(selectedPackage.price) : null;
  const discountAmount =
    rawPrice && promoDiscountPercent
      ? Math.round((rawPrice * promoDiscountPercent) / 100)
      : 0;
  const price = rawPrice && discountAmount > 0 ? rawPrice - discountAmount : rawPrice;

  const packagePriceNum = selectedPackage ? Number(selectedPackage.price) : 0;
  const checkoutDiscountAmount =
    packagePriceNum && promoDiscountPercent
      ? Math.round((packagePriceNum * promoDiscountPercent) / 100)
      : 0;
  const finalCheckoutPrice =
    packagePriceNum && checkoutDiscountAmount > 0
      ? packagePriceNum - checkoutDiscountAmount
      : packagePriceNum;

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
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'stripe' | 'wallet'>('stripe');

  const relatedItems = useMemo(() => {
    if (isResolvedGig) {
      const list = SAMPLE_PROJECTS.filter((p) => p.id !== id);
      const sameCat = list.filter((p) => p.category?.name === category);
      return sameCat.length >= 2 ? sameCat : list.slice(0, 6);
    } else {
      const list = SAMPLE_PROFESSIONALS.filter((p) => p.id !== id);
      const sameCat = list.filter(
        (p) =>
          p.categories?.[0]?.name === category ||
          (p as any).category?.name === category ||
          p.skills?.includes(category)
      );
      return sameCat.length >= 2 ? sameCat : list.slice(0, 6);
    }
  }, [id, isResolvedGig, category]);

  const portfolioList: PortfolioItem[] = useMemo(() => {
    if (professional?.portfolioItems && professional.portfolioItems.length > 0) {
      return professional.portfolioItems;
    }
    const matched = SAMPLE_PROJECTS.filter(
      (p) => p.category?.name === category || p.category?.name === professional?.categories?.[0]?.name
    );
    const fallbackProjects = matched.length > 0 ? matched : SAMPLE_PROJECTS.slice(0, 4);
    return fallbackProjects.map((p, idx) => ({
      id: `fallback-port-${idx}`,
      title: p.title,
      description: p.description,
      imageUrls: p.coverImages || [],
      tags: [p.category?.name || 'Servicio'],
    }));
  }, [professional, category]);

  const portfolioPhotos = useMemo(() => {
    const list: { url: string; title?: string }[] = [];
    portfolioList.forEach((p) => {
      (p.imageUrls || []).forEach((u) => {
        if (u && !list.some((item) => item.url === u)) {
          list.push({ url: u, title: p.title });
        }
      });
    });
    // Ensure at least 3 vivid photos so the 3D fan always presents 3 full cards (Image 2)
    const categoryFallbacks: Record<string, string[]> = {
      Electricidad: [
        'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1558441719-8d48980f89a0?auto=format&fit=crop&w=800&q=80',
      ],
      Fontanería: [
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=800&q=80',
      ],
      Climatización: [
        'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?auto=format&fit=crop&w=800&q=80',
      ],
      default: [
        'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      ],
    };
    const catKeys = Object.keys(categoryFallbacks);
    const matchedKey = catKeys.find((k) => category?.toLowerCase().includes(k.toLowerCase())) || 'default';
    const fallbacks = categoryFallbacks[matchedKey] || categoryFallbacks.default;
    for (let i = 0; i < fallbacks.length && list.length < 3; i++) {
      if (!list.some((item) => item.url === fallbacks[i])) {
        list.push({ url: fallbacks[i], title: 'Proyecto realizado' });
      }
    }
    return list;
  }, [portfolioList, category]);

  const ratingDistribution = useMemo(() => {
    const allRevs = reviewsList.length > 0 ? reviewsList : (SAMPLE_REVIEWS as any[]);
    const total = allRevs.length || 1;
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allRevs.forEach((r: any) => {
      const star = Math.max(1, Math.min(5, Math.round(r.rating || 5)));
      counts[star] = (counts[star] || 0) + 1;
    });
    return [5, 4, 3, 2, 1].map((star) => {
      const count = counts[star] || 0;
      const pct = Math.round((count / total) * 100);
      return { star, count, pct };
    });
  }, [reviewsList]);

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      await Share.share({
        title,
        message: `Echa un vistazo a "${title}" en Yewi: https://yewi.app/detail?id=${id}&entityType=${entityType}`,
      });
    } catch {}
  };

  // Reanimated scroll shared value for sticky animated header
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerBgStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [380, 440], [0, 1], Extrapolation.CLAMP);
    return { opacity };
  });

  const headerTitleStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [400, 460], [0, 1], Extrapolation.CLAMP);
    const translateY = interpolate(scrollY.value, [400, 460], [8, 0], Extrapolation.CLAMP);
    return { opacity, transform: [{ translateY }] };
  });

  // Real packages from database
  const basePrice = gig?.packages?.[0]?.price ? Number(gig.packages[0].price) : ((gig as any)?.price ? Number((gig as any).price) : 300);
  const gigDescription = gig?.description || 'Servicio profesional con acabados de alta calidad y garantía.';

  const resolvedPackages: GigPackage[] = useMemo(() => {
    if (gig?.packages && gig.packages.length > 0) {
      return gig.packages;
    }
    
    if (gig?.id) {
      return [
        {
          id: gig.id,
          tier: 'BASIC',
          name: gig.title || 'Servicio / Proyecto',
          price: basePrice,
          description: gigDescription,
          deliveryDays: 3,
          revisions: 1,
          isPopular: true,
          features: [
            'Mano de obra certificada Yewi',
            'Gestión y atención directa',
            'Garantía Escrow de satisfacción',
          ],
        } as any,
      ];
    }

    return [];
  }, [gig, basePrice, gigDescription]);

  useEffect(() => {
    if (resolvedPackages.length > 0 && (!selectedPackage || !resolvedPackages.some((p) => p.id === selectedPackage.id))) {
      const popular = resolvedPackages.find((p: any) => p.isPopular) || resolvedPackages[0];
      setSelectedPackage(popular);
    }
  }, [resolvedPackages, selectedPackage]);

  const handleBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  const handleContactSeller = () => {
    if (isOwner) {
      router.push(`/publish?type=service&editId=${gig?.id || id}` as any);
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

  const handleHire = () => {
    if (!gig || !selectedPackage) return;

    const isSample =
      gig.id.startsWith('gig-') ||
      SAMPLE_PROJECTS.some((p) => p.id === gig.id);

    if (isSample) {
      setAlert({
        visible: true,
        title: 'Proyecto de Demostración',
        message: 'Este es un proyecto de muestra. Para contratar con custodia Escrow, selecciona un servicio publicado por un profesional activo.',
      });
      return;
    }

    if (!isAuthenticated) {
      toast.info('Inicia Sesión', 'Debes iniciar sesión para contratar este servicio con custodia Escrow.');
      router.push('/auth/login');
      return;
    }

    setShowCheckoutModal(true);
  };

  const handleProcessPayment = async () => {
    if (!gig || !selectedPackage) return;

    setProcessing(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      if (checkoutPaymentMethod === 'stripe') {
        const sessionRes = await ordersApi.createGigCheckoutSession({
          gigPackageId: selectedPackage.id,
          gigId: gig.id,
        });

        const checkoutUrl = sessionRes?.url;
        const sessionId = sessionRes?.sessionId;

        if (!checkoutUrl || !sessionId) {
          throw new Error('No se pudo generar la sesión de pago seguro con Stripe.');
        }

        await WebBrowser.openBrowserAsync(checkoutUrl);

        const confirmedOrder = await ordersApi.confirmGigCheckoutSession(sessionId);

        if (!confirmedOrder || !confirmedOrder.id) {
          throw new Error('El pago no fue completado en Stripe. No se ha realizado ningún cobro.');
        }

        setShowCheckoutModal(false);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

        await notificationService.sendLocalNotification({
          title: '¡Pago Confirmado en Escrow!',
          body: `Tu pago de ${finalCheckoutPrice} € para "${gig.title}" ha sido verificado por Stripe.`,
          data: { screen: 'requests', gigId: gig.id, orderId: confirmedOrder.id },
        });

        setAlert({
          visible: true,
          title: '¡Pedido Confirmado!',
          message: `Tu pago de ${finalCheckoutPrice} € ha sido verificado por Stripe y retenido en custodia Escrow (Pedido ${confirmedOrder.orderNumber || ''}).\n\nEl profesional (${sellerName}) comenzará el trabajo y el dinero solo se liberará cuando confirmes la entrega conforme.`,
        });
      } else {
        const orderResult = await ordersApi.createGigOrder({
          gigPackageId: selectedPackage.id,
          gigId: gig.id,
        });

        setShowCheckoutModal(false);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

        await notificationService.sendLocalNotification({
          title: '¡Pago con Saldo Confirmado!',
          body: `Se han retenido ${finalCheckoutPrice} € de tu saldo en custodia Escrow.`,
          data: { screen: 'requests', gigId: gig.id, orderId: orderResult?.id },
        });

        setAlert({
          visible: true,
          title: '¡Pedido Confirmado!',
          message: `Se han retenido ${finalCheckoutPrice} € de tu saldo en custodia Escrow.\n\nEl profesional (${sellerName}) ha recibido tu encargo.`,
        });
      }
    } catch (requestError: any) {
      console.error('[DetailScreen] Error en checkout:', requestError);
      setAlert({
        visible: true,
        title: 'Pago no completado',
        message: requestError.message || 'No se pudo procesar el pago. Comprueba tus fondos o inténtalo de nuevo.',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenReviewScreen = () => {
    if (!isAuthenticated) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para valorar a un profesional.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Iniciar Sesión', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }
    router.push({
      pathname: '/create-review',
      params: {
        targetId: id,
        targetName: sellerName,
        entityType: isResolvedGig ? 'gig' : 'professional',
        avatarUrl: sellerAvatar || '',
        category: category || '',
      },
    });
  };

  const handleSendReply = async () => {
    if (!replyingToReview || !replyText.trim()) return;
    try {
      setSubmittingReply(true);
      await reviewsApi.replyToReview(replyingToReview.id, { reply: replyText.trim() });
      setReviewsList((prev) =>
        prev.map((r: any) =>
          r.id === replyingToReview.id
            ? { ...r, sellerReply: replyText.trim(), sellerRepliedAt: 'Ahora mismo' }
            : r
        )
      );
      toast.success('Respuesta enviada', 'Tu respuesta ha sido publicada.');
      setReplyingToReview(null);
      setReplyText('');
    } catch {
      setReviewsList((prev) =>
        prev.map((r: any) =>
          r.id === replyingToReview.id
            ? { ...r, sellerReply: replyText.trim(), sellerRepliedAt: 'Ahora mismo' }
            : r
        )
      );
      toast.success('Respuesta enviada', 'Tu respuesta ha sido publicada.');
      setReplyingToReview(null);
      setReplyText('');
    } finally {
      setSubmittingReply(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (entityType === 'product') {
    const currentProduct = product || DEFAULT_TOP_RATED_PRODUCTS[0];
    const isFav = isFavorite(currentProduct.id);
    const COLOR_VARIANTS = [
      { id: 'blue', label: 'Velvet Blue', hex: '#2563EB', img: require('@/assets/images/blue_armchair.png') },
      { id: 'orange', label: 'Terracota', hex: '#EA580C', img: require('@/assets/images/orange_armchair.png') },
      { id: 'side', label: 'Lounge Side', hex: '#7C3AED', img: require('@/assets/images/orange_side.png') },
      { id: 'cream', label: 'Cream Soft', hex: '#D97706', img: currentProduct.image || require('@/assets/images/cream_sofa.jpg') },
    ];
    const activeImg = COLOR_VARIANTS[selectedColorIndex]?.img || currentProduct.image;

    const handleBuyProduct = () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setAlert({
        visible: true,
        title: '¡Añadido a la cesta!',
        message: `${currentProduct.name} (${selectedDimension}) añadido por ${currentProduct.price} €.`,
      });
    };

    return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}
        >
          {/* Top Bar */}
          <View
            style={{
              paddingTop: Math.max(insets.top + 6, 16),
              paddingHorizontal: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 30,
            }}
          >
            <ThemedTouchable
              onPress={handleBack}
              haptic="light"
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </ThemedTouchable>

            <Text
              style={{
                fontSize: 18,
                fontFamily: 'PlusJakartaSans-Bold',
                color: colors.textPrimary,
                letterSpacing: -0.3,
              }}
            >
              Detalles
            </Text>

            <ThemedTouchable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                toggleFavorite(currentProduct.id);
              }}
              haptic="medium"
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={22}
                color={isFav ? '#EF4444' : colors.textPrimary}
              />
            </ThemedTouchable>
          </View>

          {/* Hero Image & Vertical Color Swatches (Reference 3) */}
          <View
            style={{
              height: 330,
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              marginVertical: 10,
            }}
          >
            <Image
              source={activeImg}
              style={{
                width: '78%',
                height: 280,
              }}
              resizeMode="contain"
            />

            {/* Vertical Color Selector Slider */}
            <View
              style={{
                position: 'absolute',
                right: 22,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
              }}
            >
              {COLOR_VARIANTS.map((col, idx) => {
                const isSelected = selectedColorIndex === idx;
                return (
                  <ThemedTouchable
                    key={col.id}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setSelectedColorIndex(idx);
                    }}
                    haptic="selection"
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    {isSelected && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginRight: 6,
                        }}
                      >
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: isDark ? '#FFFFFF' : '#0F172A',
                          }}
                        />
                        <View
                          style={{
                            width: 20,
                            height: 1.5,
                            backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.3)',
                          }}
                        />
                      </View>
                    )}

                    <View
                      style={{
                        width: isSelected ? 30 : 24,
                        height: isSelected ? 30 : 24,
                        borderRadius: 15,
                        backgroundColor: col.hex,
                        borderWidth: isSelected ? 2.5 : 1.5,
                        borderColor: isSelected ? (isDark ? '#FFFFFF' : '#0F172A') : 'rgba(255,255,255,0.6)',
                        shadowColor: col.hex,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isSelected ? 0.35 : 0.15,
                        shadowRadius: 4,
                        elevation: 4,
                      }}
                    />
                  </ThemedTouchable>
                );
              })}
            </View>
          </View>

          {/* Frosted Floating Bottom Sheet (Reference 3) */}
          <View
            style={{
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderTopLeftRadius: 36,
              borderTopRightRadius: 36,
              paddingTop: 14,
              paddingHorizontal: 22,
              paddingBottom: insets.bottom + 24,
              borderTopWidth: 1,
              borderColor: isDark ? colors.border : 'rgba(0,0,0,0.06)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -6 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 10,
            }}
          >
            {/* Drag pill handle */}
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: isDark ? '#3F3F46' : '#E2E8F0',
                alignSelf: 'center',
                marginBottom: 16,
              }}
            />

            {/* 3 Angle Preview Thumbnails */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                marginBottom: 18,
              }}
            >
              {['Frontal', 'Perspectiva', 'Detalle'].map((angle, idx) => {
                const isAngleActive = selectedAngleIndex === idx;
                return (
                  <ThemedTouchable
                    key={angle}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setSelectedAngleIndex(idx);
                    }}
                    haptic="selection"
                    style={{
                      flex: 1,
                      height: 60,
                      borderRadius: 16,
                      backgroundColor: isDark ? '#27272A' : '#F8FAFC',
                      borderWidth: 1.5,
                      borderColor: isAngleActive ? colors.primary : isDark ? '#3F3F46' : '#E2E8F0',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <Image
                      source={activeImg}
                      style={{
                        width: '100%',
                        height: '75%',
                        transform: [{ scale: idx === 1 ? 0.9 : idx === 2 ? 1.2 : 1 }],
                      }}
                      resizeMode="contain"
                    />
                    <Text
                      style={{
                        fontSize: 10,
                        fontFamily: 'PlusJakartaSans-Bold',
                        color: isAngleActive ? colors.primary : colors.textSecondary,
                        marginTop: 2,
                      }}
                    >
                      {angle}
                    </Text>
                  </ThemedTouchable>
                );
              })}
            </View>

            {/* Product Title & Dimension Pills */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 21,
                  fontFamily: 'PlusJakartaSans-Bold',
                  color: colors.textPrimary,
                  letterSpacing: -0.4,
                  flex: 1,
                  marginRight: 10,
                }}
                numberOfLines={1}
              >
                {currentProduct.name}
              </Text>

              {/* Dimension Pills */}
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {['85×80', '95×85'].map((dim) => {
                  const isDimActive = selectedDimension === dim;
                  return (
                    <ThemedTouchable
                      key={dim}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setSelectedDimension(dim);
                      }}
                      haptic="selection"
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 12,
                        backgroundColor: isDimActive
                          ? (isDark ? '#F4F4F5' : '#18181B')
                          : (isDark ? '#27272A' : '#F1F5F9'),
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11.5,
                          fontFamily: 'PlusJakartaSans-Bold',
                          color: isDimActive
                            ? (isDark ? '#18181B' : '#FFFFFF')
                            : colors.textSecondary,
                        }}
                      >
                        {dim}
                      </Text>
                    </ThemedTouchable>
                  );
                })}
              </View>
            </View>

            {/* Description */}
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'PlusJakartaSans-Regular',
                color: colors.textSecondary,
                lineHeight: 19,
                marginBottom: 18,
              }}
            >
              El {currentProduct.name} ofrece un equilibrio magistral entre diseño escandinavo y confort premium. Tapizado en terciopelo antimanchas de tacto sedoso y estructura en madera maciza lacada.
            </Text>

            {/* Sticky Bottom Bar: Price + Black Pill Button */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 8,
              }}
            >
              <View>
                <Text style={{ fontSize: 10.5, fontFamily: 'PlusJakartaSans-Bold', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Precio
                </Text>
                <Text
                  style={{
                    fontSize: 24,
                    fontFamily: 'PlusJakartaSans-ExtraBold',
                    color: colors.textPrimary,
                    letterSpacing: -0.5,
                  }}
                >
                  {currentProduct.price} €
                </Text>
              </View>

              <ThemedTouchable
                onPress={handleBuyProduct}
                haptic="medium"
                activeOpacity={0.88}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isDark ? '#FFFFFF' : '#0F172A',
                  paddingHorizontal: 26,
                  paddingVertical: 13,
                  borderRadius: 999,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.18,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Ionicons
                  name="bag-handle"
                  size={17}
                  color={isDark ? '#0F172A' : '#FFFFFF'}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    color: isDark ? '#0F172A' : '#FFFFFF',
                    fontSize: 14.5,
                    fontFamily: 'PlusJakartaSans-Bold',
                    letterSpacing: -0.2,
                  }}
                >
                  Comprar Ahora
                </Text>
              </ThemedTouchable>
            </View>
          </View>
        </ScrollView>

        <CustomAlert
          visible={alert.visible}
          title={alert.title}
          message={alert.message}
          buttonText="Aceptar"
          onClose={() => setAlert((current) => ({ ...current, visible: false }))}
        />
      </View>
    );
  }

  if (error || !entity) {
    return (
      <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: colors.background }}>
        <Ionicons name="alert-circle-outline" size={46} color={colors.textMuted} />
        <Text className="mt-4 text-center font-sans-bold text-base" style={{ color: colors.textPrimary }}>
          {display(error)}
        </Text>
        <ThemedTouchable onPress={handleBack} className="mt-6 rounded-full px-7 py-3" style={{ backgroundColor: colors.primary }}>
          <Text className="font-sans-bold text-white">Volver</Text>
        </ThemedTouchable>
      </View>
    );
  }

  const catStyle = getCategoryStyle(category);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 175, 205) }}
      >
        {isResolvedGig ? (
          /* SERVICE CARD HERO (Diseño Oficial de Card Yewi) */
          <View style={{ paddingTop: insets.top + 54, paddingHorizontal: 18, alignItems: 'center' }}>
            <View
              style={{
                width: '100%',
                height: 380,
                borderRadius: 28,
                overflow: 'hidden',
                position: 'relative',
                backgroundColor: isDark ? '#1C1E26' : '#F1F3F5',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: isDark ? 0.3 : 0.1,
                shadowRadius: 14,
                elevation: 6,
              }}
            >
              {/* Full Card Cover Image */}
              {imageUrl ? (
                <ExpoImage
                  source={{ uri: imageUrl }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? '#18181B' : '#F1F5F9', alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="briefcase-outline" size={54} color={colors.textMuted} />
                </View>
              )}

              {/* Top-Left Rating Pill overlay */}
              <View
                style={{
                  position: 'absolute',
                  top: 14,
                  left: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 11,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.12,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Ionicons name="star" size={12.5} color="#F59E0B" />
                <Text style={{ fontSize: 12.5, fontFamily: 'PlusJakartaSans-Bold', color: '#0F172A' }}>
                  {rating || '5.0'}
                </Text>
              </View>

              {/* Bottom-Left Price Pill overlay */}
              <View
                style={{
                  position: 'absolute',
                  bottom: 14,
                  left: 14,
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  paddingHorizontal: 14,
                  paddingVertical: 7.5,
                  borderRadius: 999,
                  backgroundColor: '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.12,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Text style={{ fontSize: 11.5, fontFamily: 'PlusJakartaSans-Medium', color: '#64748B', marginRight: 2 }}>
                  Desde{' '}
                </Text>
                <Text style={{ fontSize: 14.5, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#0F172A' }}>
                  {price || 300} €
                </Text>
              </View>

              {/* Bottom-Right Circular Action Button ↗ */}
              <ThemedTouchable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  if (imageUrl) {
                    setActivePhoto({
                      url: imageUrl,
                      title,
                      category,
                    });
                  }
                }}
                haptic="light"
                style={{
                  position: 'absolute',
                  bottom: 14,
                  right: 14,
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.14,
                  shadowRadius: 5,
                  elevation: 4,
                }}
                accessibilityRole="button"
                accessibilityLabel="Ver imagen en grande"
              >
                <Ionicons
                  name="arrow-up"
                  size={18}
                  color="#0F172A"
                  style={{ transform: [{ rotate: '45deg' }] }}
                />
              </ThemedTouchable>
            </View>

            {/* Service Title and Metadata under Card */}
            <View style={{ width: '100%', marginTop: 18, paddingHorizontal: 2 }}>
              <Text
                style={{
                  fontSize: 23,
                  fontFamily: 'PlusJakartaSans-ExtraBold',
                  color: colors.textPrimary,
                  letterSpacing: -0.5,
                  lineHeight: 29,
                  marginBottom: 6,
                }}
              >
                {title}
              </Text>

              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'PlusJakartaSans-Medium',
                  color: colors.textSecondary,
                  marginBottom: 10,
                }}
              >
                {display(category)} · {location}
              </Text>

              {/* Clean Stats Row */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 6,
                  gap: 16,
                }}
              >
                {/* Rating */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="star" size={13} color="#F59E0B" />
                  <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-Bold', color: colors.textPrimary }}>
                    {rating || '4.9'}
                  </Text>
                  <Text style={{ fontSize: 11.5, fontFamily: 'PlusJakartaSans-Medium', color: colors.textMuted }}>
                    ({reviewsCount || 42})
                  </Text>
                </View>

                {/* Verified */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="checkmark-circle" size={14} color="#0284C7" />
                  <Text style={{ fontSize: 12.5, fontFamily: 'PlusJakartaSans-SemiBold', color: colors.textPrimary }}>
                    Verificado
                  </Text>
                </View>

                {/* Location */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3.5 }}>
                  <Ionicons name="location-sharp" size={13} color={isDark ? '#38BDF8' : '#0284C7'} />
                  <Text style={{ fontSize: 12.5, fontFamily: 'PlusJakartaSans-SemiBold', color: colors.textPrimary }}>
                    {location || 'Valencia'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          /* PROFESSIONAL HERO */
          <View style={{ paddingTop: insets.top + 54, paddingHorizontal: 20, alignItems: 'center' }}>
            {/* Circular Avatar with Accent Ring */}
            <View style={{ position: 'relative', marginBottom: 14 }}>
              {sellerAvatar ? (
                <ExpoImage
                  source={{ uri: sellerAvatar }}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                    borderWidth: 3,
                    borderColor: isDark ? '#27272A' : '#FFFFFF',
                  }}
                  contentFit="cover"
                  transition={150}
                  cachePolicy="memory-disk"
                />
              ) : (
                <View
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                    backgroundColor: colors.primaryLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 3,
                    borderColor: isDark ? '#27272A' : '#FFFFFF',
                  }}
                >
                  <Text style={{ fontSize: 32, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.primary }}>
                    {sellerName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              {/* Verified Badge Icon */}
              <View
                style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  padding: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1.5 },
                  shadowOpacity: 0.15,
                  shadowRadius: 3,
                  elevation: 2,
                }}
              >
                <Ionicons name="checkmark-circle" size={20} color="#0284C7" />
              </View>
            </View>

            {/* Professional Name */}
            <Text
              style={{
                fontSize: 22,
                fontFamily: 'PlusJakartaSans-ExtraBold',
                color: colors.textPrimary,
                letterSpacing: -0.4,
                textAlign: 'center',
                marginBottom: 4,
              }}
            >
              {sellerName}
            </Text>

            {/* Category & Location */}
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'PlusJakartaSans-Medium',
                color: colors.textSecondary,
                textAlign: 'center',
                marginBottom: 14,
              }}
            >
              {display(category)} · {location}
            </Text>

            {/* Expandable Bio */}
            {Boolean(description) && (
              <View style={{ alignItems: 'center', marginBottom: 14, maxWidth: '94%' }}>
                <Text
                  numberOfLines={expandedDescription ? undefined : 2}
                  style={{
                    fontSize: 13,
                    fontFamily: 'PlusJakartaSans-Regular',
                    color: colors.textSecondary,
                    lineHeight: 19,
                    textAlign: 'center',
                  }}
                >
                  {description}
                </Text>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setExpandedDescription(!expandedDescription);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{ marginTop: 4 }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: 'PlusJakartaSans-Bold',
                      color: colors.primary,
                      letterSpacing: 0.3,
                    }}
                  >
                    {expandedDescription ? 'Menos' : 'Leer más'}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Action Buttons: Contactar */}
            <ThemedTouchable
              onPress={handleContactSeller}
              haptic="medium"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 7,
                backgroundColor: isDark ? '#FFFFFF' : '#0F172A',
                paddingHorizontal: 24,
                paddingVertical: 10,
                borderRadius: 999,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.12,
                shadowRadius: 5,
                elevation: 3,
                marginBottom: 10,
              }}
              accessibilityRole="button"
              accessibilityLabel="Contactar con el profesional"
            >
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={isDark ? '#0F172A' : '#FFFFFF'} />
              <Text style={{ fontSize: 13.5, fontFamily: 'PlusJakartaSans-Bold', color: isDark ? '#0F172A' : '#FFFFFF' }}>
                Contactar
              </Text>
            </ThemedTouchable>

            {/* Stats Row */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 6,
                gap: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="star" size={13} color="#F59E0B" />
                <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-Bold', color: colors.textPrimary }}>
                  {rating || '4.9'}
                </Text>
                <Text style={{ fontSize: 11.5, fontFamily: 'PlusJakartaSans-Medium', color: colors.textMuted }}>
                  ({reviewsCount || 42})
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="shield-checkmark" size={14} color="#059669" />
                <Text style={{ fontSize: 12.5, fontFamily: 'PlusJakartaSans-SemiBold', color: colors.textPrimary }}>
                  Verificado
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3.5 }}>
                <Ionicons name="location-sharp" size={13} color={isDark ? '#38BDF8' : '#0284C7'} />
                <Text style={{ fontSize: 12.5, fontFamily: 'PlusJakartaSans-SemiBold', color: colors.textPrimary }}>
                  {location || 'Valencia'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* CONTENT BODY */}
        <View style={{ paddingHorizontal: 20, paddingTop: 6 }}>
          {/* SECTION: PAQUETES DE CONTRATACIÓN (Exclusivo para Servicios / Gigs) */}
          {isResolvedGig && (
            <View style={{ marginTop: 14 }}>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 17, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.textPrimary, letterSpacing: -0.3 }}>
                  Opciones de contratación
                </Text>
              </View>

              {/* Tier Selector Pills */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {resolvedPackages.map((pkg) => {
                  const isSelected = selectedPackage?.id === pkg.id;
                  return (
                    <ThemedTouchable
                      key={pkg.id}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setSelectedPackage(pkg);
                      }}
                      haptic="selection"
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        paddingHorizontal: 6,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isSelected
                          ? (isDark ? '#FFFFFF' : '#0F172A')
                          : (isDark ? '#1C1E26' : '#F1F5F9'),
                        borderWidth: 1,
                        borderColor: isSelected
                          ? (isDark ? '#FFFFFF' : '#0F172A')
                          : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'),
                      }}
                    >
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 12.5,
                          fontFamily: isSelected ? 'PlusJakartaSans-ExtraBold' : 'PlusJakartaSans-Bold',
                          color: isSelected
                            ? (isDark ? '#0F172A' : '#FFFFFF')
                            : (isDark ? '#94A3B8' : '#64748B'),
                        }}
                      >
                        {pkg.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: 'PlusJakartaSans-Medium',
                          color: isSelected
                            ? (isDark ? '#334155' : '#E2E8F0')
                            : (isDark ? '#64748B' : '#94A3B8'),
                          marginTop: 1,
                        }}
                      >
                        {pkg.price} €
                      </Text>
                    </ThemedTouchable>
                  );
                })}
              </View>

              {/* Active Package Display Card */}
              {selectedPackage && (
                <View
                  style={{
                    borderRadius: 22,
                    padding: 18,
                    backgroundColor: isDark ? '#1C1E26' : '#FFFFFF',
                    borderWidth: 1.5,
                    borderColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDark ? 0.2 : 0.08,
                    shadowRadius: 10,
                    elevation: 3,
                  }}
                >
                  {/* Top Row: Name + Popular Badge + Price */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Text style={{ fontSize: 17, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.textPrimary }}>
                          {selectedPackage.name}
                        </Text>
                        {(selectedPackage as any).isPopular && (
                          <View
                            style={{
                              backgroundColor: '#059669',
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 999,
                            }}
                          >
                            <Text style={{ fontSize: 10, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#FFFFFF' }}>
                              Popular
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 12.5, fontFamily: 'PlusJakartaSans-Regular', color: colors.textSecondary, lineHeight: 18 }}>
                        {selectedPackage.description}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      {promoDiscountPercent ? (
                        <View style={{ alignItems: 'flex-end' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text
                              style={{
                                fontSize: 13.5,
                                fontFamily: 'PlusJakartaSans-Medium',
                                color: colors.textMuted,
                                textDecorationLine: 'line-through',
                              }}
                            >
                              {selectedPackage.price} €
                            </Text>
                            <View
                              style={{
                                backgroundColor: '#0284C7',
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 6,
                              }}
                            >
                              <Text style={{ fontSize: 10, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#FFFFFF' }}>
                                -{promoDiscountPercent}%
                              </Text>
                            </View>
                          </View>
                          <Text style={{ fontSize: 24, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.primary }}>
                            {Math.round(Number(selectedPackage.price) * (1 - promoDiscountPercent / 100))} €
                          </Text>
                        </View>
                      ) : (
                        <Text style={{ fontSize: 24, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.primary }}>
                          {selectedPackage.price} €
                        </Text>
                      )}
                      <Text style={{ fontSize: 10.5, fontFamily: 'PlusJakartaSans-Medium', color: colors.textMuted, marginTop: 1 }}>
                        IVA incluido
                      </Text>
                    </View>
                  </View>

                  {/* Delivery time + Revisions Row */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: isDark ? '#27272A' : '#F8FAFC', paddingHorizontal: 9, paddingVertical: 4.5, borderRadius: 8 }}>
                      <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                      <Text style={{ fontSize: 11.5, fontFamily: 'PlusJakartaSans-Bold', color: colors.textSecondary }}>
                        Plazo: {(selectedPackage as any).deliveryDays ? `${(selectedPackage as any).deliveryDays} días` : '3-5 días'}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: isDark ? '#27272A' : '#F8FAFC', paddingHorizontal: 9, paddingVertical: 4.5, borderRadius: 8 }}>
                      <Ionicons name="refresh-outline" size={13} color={colors.textSecondary} />
                      <Text style={{ fontSize: 11.5, fontFamily: 'PlusJakartaSans-Bold', color: colors.textSecondary }}>
                        {(selectedPackage as any).revisions ? `${(selectedPackage as any).revisions === 99 ? 'Ilimitadas' : (selectedPackage as any).revisions} rev.` : '2 revisiones'}
                      </Text>
                    </View>
                  </View>

                  {/* Feature Checklist */}
                  {Boolean((selectedPackage as any).features?.length) && (
                    <View style={{ marginTop: 12, gap: 7 }}>
                      {((selectedPackage as any).features as string[]).map((feat, i) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                          <Ionicons name="checkmark-circle" size={15} color="#059669" />
                          <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans-Medium', color: colors.textPrimary, flex: 1 }}>
                            {feat}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* SECTION FOR PROFESSIONAL: DATOS DEL PROFESIONAL */}
          {!isResolvedGig && (
            <View style={{ marginTop: 16 }}>
              {/* Bio / Sobre mí */}
              <View style={{ marginBottom: 18 }}>
                <Text style={{ fontSize: 17, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.textPrimary, letterSpacing: -0.3, marginBottom: 8 }}>
                  Sobre el profesional
                </Text>
                <Text style={{ fontSize: 13.5, fontFamily: 'PlusJakartaSans-Regular', color: colors.textSecondary, lineHeight: 22 }}>
                  {display(professional?.bio || description, 'Profesional homologado en Yewi con verificación de identidad y garantía de satisfacción.')}
                </Text>
              </View>

              {/* Badges / Especialidades */}
              {Boolean(professional?.skills?.length) && (
                <View style={{ marginBottom: 18 }}>
                  <Text style={{ fontSize: 13.5, fontFamily: 'PlusJakartaSans-Bold', color: colors.textPrimary, marginBottom: 8 }}>
                    Especialidades
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {professional!.skills!.map((skill, idx) => (
                      <View
                        key={idx}
                        style={{
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: colors.borderSubtle,
                        }}
                      >
                        <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans-SemiBold', color: colors.textPrimary }}>
                          {skill}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Key Stats Row */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 14,
                  borderRadius: 18,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  marginBottom: 6,
                }}
              >
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans-Medium', color: colors.textMuted }}>
                    Valoración
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans-Bold', color: colors.textPrimary }}>
                      {rating || '4.9'}
                    </Text>
                  </View>
                </View>

                <View style={{ width: 1, height: 28, backgroundColor: colors.borderSubtle }} />

                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans-Medium', color: colors.textMuted }}>
                    Opiniones
                  </Text>
                  <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans-Bold', color: colors.textPrimary, marginTop: 3 }}>
                    {reviewsCount || 41}
                  </Text>
                </View>

                <View style={{ width: 1, height: 28, backgroundColor: colors.borderSubtle }} />

                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans-Medium', color: colors.textMuted }}>
                    Garantía
                  </Text>
                  <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans-Bold', color: '#059669', marginTop: 3 }}>
                    Escrow
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* SECTION: PORTAFOLIO EN DETALLE DE PROFESIONAL (Estilo Abanico 3D - Imagen 2) */}
          {!isResolvedGig && portfolioPhotos.length > 0 ? (
            <View style={{ marginTop: 28, marginBottom: 12 }}>
              <Text
                style={{
                  fontSize: 17,
                  fontFamily: 'PlusJakartaSans-ExtraBold',
                  color: colors.textPrimary,
                  letterSpacing: -0.3,
                  marginBottom: 16,
                }}
              >
                Portafolio
              </Text>

              {(() => {
                const photos = portfolioPhotos.length >= 3
                  ? portfolioPhotos
                  : [...portfolioPhotos, ...portfolioPhotos, ...portfolioPhotos].slice(0, 3);
                const N = photos.length;
                const c = activeFanIndex % N;
                const l = (c - 1 + N) % N;
                const r = (c + 1) % N;

                return (
                  <View style={{ alignItems: 'center' }}>
                    <View
                      style={{
                        width: '100%',
                        height: 330,
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        marginVertical: 6,
                      }}
                    >
                      {/* Left Card: Tilted Counter-Clockwise (Offset by -85px) */}
                      <ThemedTouchable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                          setActiveFanIndex(l);
                        }}
                        haptic="light"
                        activeOpacity={0.9}
                        style={{
                          position: 'absolute',
                          width: 195,
                          height: 285,
                          borderRadius: 22,
                          overflow: 'hidden',
                          transform: [
                            { translateX: -85 },
                            { translateY: 10 },
                            { rotate: '-9deg' },
                            { scale: 0.93 },
                          ],
                          zIndex: 1,
                          shadowColor: '#000',
                          shadowOffset: { width: -6, height: 10 },
                          shadowOpacity: 0.35,
                          shadowRadius: 16,
                          elevation: 6,
                          backgroundColor: '#0F172A',
                          borderWidth: 1.5,
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Rotar foto izquierda"
                      >
                        <ExpoImage
                          source={{ uri: photos[l].url }}
                          style={{ width: '100%', height: '100%' }}
                          contentFit="cover"
                          transition={200}
                          cachePolicy="memory-disk"
                        />
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.14)' }]} />
                      </ThemedTouchable>

                      {/* Right Card: Tilted Clockwise (Offset by +85px) */}
                      <ThemedTouchable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                          setActiveFanIndex(r);
                        }}
                        haptic="light"
                        activeOpacity={0.9}
                        style={{
                          position: 'absolute',
                          width: 195,
                          height: 285,
                          borderRadius: 22,
                          overflow: 'hidden',
                          transform: [
                            { translateX: 85 },
                            { translateY: 10 },
                            { rotate: '9deg' },
                            { scale: 0.93 },
                          ],
                          zIndex: 2,
                          shadowColor: '#000',
                          shadowOffset: { width: 6, height: 10 },
                          shadowOpacity: 0.35,
                          shadowRadius: 16,
                          elevation: 8,
                          backgroundColor: '#0F172A',
                          borderWidth: 1.5,
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Rotar foto derecha"
                      >
                        <ExpoImage
                          source={{ uri: photos[r].url }}
                          style={{ width: '100%', height: '100%' }}
                          contentFit="cover"
                          transition={200}
                          cachePolicy="memory-disk"
                        />
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.14)' }]} />
                      </ThemedTouchable>

                      {/* Center Card: Front & Straight with Deep Elevated Shadow */}
                      <ThemedTouchable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                          setActivePhoto({
                            url: photos[c].url,
                            title: 'Portafolio',
                            category,
                          });
                        }}
                        haptic="medium"
                        activeOpacity={0.95}
                        style={{
                          position: 'absolute',
                          width: 205,
                          height: 300,
                          borderRadius: 22,
                          overflow: 'hidden',
                          transform: [
                            { translateX: 0 },
                            { translateY: 0 },
                            { rotate: '0deg' },
                            { scale: 1 },
                          ],
                          zIndex: 3,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 14 },
                          shadowOpacity: 0.45,
                          shadowRadius: 20,
                          elevation: 12,
                          backgroundColor: '#0F172A',
                          borderWidth: 2,
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.30)' : '#FFFFFF',
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Abrir foto en pantalla completa"
                      >
                        <ExpoImage
                          source={{ uri: photos[c].url }}
                          style={{ width: '100%', height: '100%' }}
                          contentFit="cover"
                          transition={200}
                          cachePolicy="memory-disk"
                        />
                      </ThemedTouchable>
                    </View>

                    {/* Pagination Indicator Dots when > 3 items */}
                    {portfolioPhotos.length > 3 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 12 }}>
                        {portfolioPhotos.map((_, dotIdx) => (
                          <View
                            key={dotIdx}
                            style={{
                              width: dotIdx === c ? 20 : 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor:
                                dotIdx === c
                                  ? (isDark ? '#FFFFFF' : '#0F172A')
                                  : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'),
                            }}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                );
              })()}
            </View>
          ) : (
            /* SECTION: MÁS COMO ESTO (Exclusivo para Servicios / Gigs) */
            relatedItems.length > 0 && (
              <View style={{ marginTop: 28, marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 17,
                    fontFamily: 'PlusJakartaSans-ExtraBold',
                    color: colors.textPrimary,
                    letterSpacing: -0.3,
                    marginBottom: 12,
                  }}
                >
                  Más como esto
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }}
                  style={{ marginHorizontal: -20 }}
                >
                  {relatedItems.map((item: any) => {
                    const isGigItem = Boolean(item.packages || item.coverImages);
                    return isGigItem ? (
                      <ProjectCard
                        key={item.id}
                        project={item}
                        layout="grid"
                        style={{ flex: undefined, maxWidth: undefined, width: 165 }}
                        onPress={() => {
                          router.push({
                            pathname: '/detail',
                            params: { id: item.id, entityType: 'gig' },
                          });
                        }}
                      />
                    ) : (
                      <ProfessionalCard
                        key={item.id}
                        professional={item}
                        layout="grid"
                        onPress={() => {
                          router.push({
                            pathname: '/detail',
                            params: { id: item.id, entityType: 'professional' },
                          });
                        }}
                      />
                    );
                  })}
                </ScrollView>
              </View>
            )
          )}

          {/* SECTION: SELLER PROFILE CARD (Solo en Servicios / Gigs) */}
          {isResolvedGig && profile && (
            <ThemedTouchable
              onPress={() => {
                if (isOwner) {
                  router.push(`/publish?type=service&editId=${gig?.id || id}` as any);
                } else if (proId) {
                  router.push({
                    pathname: '/detail',
                    params: { id: proId, entityType: 'professional' },
                  });
                }
              }}
              haptic="selection"
              style={{
                marginTop: 20,
                padding: 18,
                borderRadius: 24,
                backgroundColor: isDark ? '#1C1E26' : '#FFFFFF',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: isDark ? 0.25 : 0.06,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              {/* Circular Avatar */}
              {sellerAvatar ? (
                <Image
                  source={{ uri: sellerAvatar }}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    borderWidth: 2,
                    borderColor: isDark ? '#27272A' : '#F1F5F9',
                  }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: colors.primaryLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 24, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.primary }}>
                    {sellerName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              {/* Meta Column */}
              <View style={{ flex: 1, marginLeft: 16, justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 17,
                      fontFamily: 'PlusJakartaSans-Bold',
                      color: isDark ? '#FFFFFF' : '#0F172A',
                      letterSpacing: -0.2,
                    }}
                  >
                    {sellerName}
                  </Text>
                  <Ionicons name="checkmark-circle" size={16} color="#0284C7" />
                </View>

                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 13.5,
                    fontFamily: 'PlusJakartaSans-Medium',
                    color: isDark ? '#94A3B8' : '#64748B',
                    marginTop: 3,
                  }}
                >
                  {category ? `${display(category)} · ${location || 'Valencia'}` : (location || 'Profesional')}
                </Text>

                <ThemedTouchable
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    handleContactSeller();
                  }}
                  haptic="medium"
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: 10,
                    paddingHorizontal: 16,
                    paddingVertical: 5.5,
                    borderRadius: 999,
                    borderWidth: 1.2,
                    borderColor: isDark ? 'rgba(168, 85, 247, 0.5)' : '#DDD6FE',
                    backgroundColor: isDark ? 'rgba(168, 85, 247, 0.08)' : '#FAF5FF',
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Contactar con el profesional"
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'PlusJakartaSans-SemiBold',
                      color: isDark ? '#C084FC' : '#7C3AED',
                    }}
                  >
                    Contactar
                  </Text>
                </ThemedTouchable>
              </View>
            </ThemedTouchable>
          )}

          {/* Description Section (Solo en Servicios / Gigs) */}
          {isResolvedGig && (
            <View style={{ marginTop: 24 }}>
              <Text style={{ fontSize: 17, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.textPrimary, letterSpacing: -0.3, marginBottom: 8 }}>
                Descripción del servicio
              </Text>
              <Text style={{ fontSize: 13.5, fontFamily: 'PlusJakartaSans-Regular', color: colors.textSecondary, lineHeight: 22 }}>
                {display(description, 'Servicio profesional registrado en la plataforma Yewi con garantía de satisfacción.')}
              </Text>
            </View>
          )}

          {/* SECTION: OPINIONES Y VALORACIONES */}
          <View style={{ marginTop: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <View>
                <Text style={{ fontSize: 17, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.textPrimary, letterSpacing: -0.3 }}>
                  Opiniones y Reseñas
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <Ionicons name="star" size={13} color="#F59E0B" />
                  <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans-Bold', color: '#D97706' }}>
                    {rating || '4.9'} · {reviewsCount || 41} valoraciones
                  </Text>
                </View>
              </View>

              {/* Action: Open Dedicated Review Screen */}
              <ThemedTouchable
                onPress={handleOpenReviewScreen}
                haptic="medium"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  backgroundColor: isDark ? '#27272A' : '#0F172A',
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 999,
                }}
                accessibilityRole="button"
                accessibilityLabel="Publicar reseña"
              >
                <Ionicons name="create-outline" size={14} color="#FFFFFF" />
                <Text style={{ fontSize: 12.5, fontFamily: 'PlusJakartaSans-Bold', color: '#FFFFFF' }}>
                  Valorar
                </Text>
              </ThemedTouchable>
            </View>

            {/* Rating Breakdown Bar - All 5 levels with 0% fallback */}
            <View
              style={{
                backgroundColor: isDark ? '#1C1E26' : '#FFFFFF',
                borderRadius: 22,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  <Text style={{ fontSize: 26, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.textPrimary }}>
                    {rating || '4.9'}
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-Medium', color: colors.textMuted }}>
                    / 5.0
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(5, 150, 105, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                  <Ionicons name="shield-checkmark" size={12} color="#059669" />
                  <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans-Bold', color: '#059669' }}>
                    100% Verificadas
                  </Text>
                </View>
              </View>

              {/* Rating Bars - 5★ down to 1★ */}
              <View style={{ gap: 6, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', paddingTop: 10 }}>
                {ratingDistribution.map(({ star, pct }) => (
                  <View key={star} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans-Medium', color: colors.textMuted, width: 22 }}>
                      {star}★
                    </Text>
                    <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: isDark ? '#27272A' : '#E4E4E7', overflow: 'hidden' }}>
                      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: pct > 0 ? '#F59E0B' : 'transparent', borderRadius: 3 }} />
                    </View>
                    <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans-Medium', color: colors.textMuted, width: 28, textAlign: 'right' }}>
                      {pct}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Review Items: Clean card, no noisy 'Servicio Verificado', with pro replies */}
            <View style={{ gap: 14 }}>
              {(reviewsList.length > 0 ? reviewsList : SAMPLE_REVIEWS).slice(0, 5).map((rev: any) => {
                const authorName =
                  rev.author?.profile?.displayName ||
                  [rev.author?.profile?.firstName, rev.author?.profile?.lastName].filter(Boolean).join(' ') ||
                  rev.name ||
                  'Cliente Verificado';
                const revDate = rev.date || 'Reciente';
                const revRating = rev.rating || 5;

                return (
                  <View
                    key={rev.id}
                    style={{
                      borderRadius: 20,
                      padding: 16,
                      backgroundColor: isDark ? '#1C1E26' : '#FFFFFF',
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isDark ? 0.2 : 0.04,
                      shadowRadius: 6,
                      elevation: 2,
                    }}
                  >
                    {/* Top Row: Reviewer Avatar + Name + Stars */}
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 10,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            backgroundColor: isDark ? 'rgba(2, 132, 199, 0.25)' : '#E0F2FE',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans-Bold', color: '#0284C7' }}>
                            {authorName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text style={{ fontSize: 13.5, fontFamily: 'PlusJakartaSans-Bold', color: isDark ? '#FFFFFF' : '#0F172A' }}>
                            {authorName}
                          </Text>
                          <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans-Medium', color: isDark ? '#94A3B8' : '#64748B', marginTop: 1 }}>
                            {revDate}
                          </Text>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 2 }}>
                        {[...Array(5)].map((_, i) => (
                          <Ionicons
                            key={i}
                            name={i < revRating ? 'star' : 'star-outline'}
                            size={13}
                            color={i < revRating ? '#F59E0B' : (isDark ? '#52525B' : '#CBD5E1')}
                          />
                        ))}
                      </View>
                    </View>

                    {/* Review Comment */}
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'PlusJakartaSans-Regular',
                        color: isDark ? '#E2E8F0' : '#334155',
                        lineHeight: 19,
                      }}
                    >
                      {rev.comment}
                    </Text>

                    {/* Professional Reply Block (if present) */}
                    {Boolean(rev.sellerReply) && (
                      <View
                        style={{
                          marginTop: 12,
                          padding: 12,
                          borderRadius: 14,
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                          borderLeftWidth: 3,
                          borderLeftColor: isDark ? '#38BDF8' : '#0284C7',
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="arrow-undo-outline" size={13} color={isDark ? '#38BDF8' : '#0284C7'} />
                            <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans-Bold', color: colors.textPrimary }}>
                              Respuesta de {sellerName}
                            </Text>
                          </View>
                          {Boolean(rev.sellerRepliedAt) && (
                            <Text style={{ fontSize: 10.5, fontFamily: 'PlusJakartaSans-Medium', color: colors.textMuted }}>
                              {rev.sellerRepliedAt}
                            </Text>
                          )}
                        </View>
                        <Text style={{ fontSize: 12.5, fontFamily: 'PlusJakartaSans-Regular', color: colors.textSecondary, lineHeight: 18 }}>
                          {rev.sellerReply}
                        </Text>
                      </View>
                    )}

                    {/* Review Card Footer: Escrow Tag on Left, Responder Button on Right */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 12,
                        paddingTop: 10,
                        borderTopWidth: 1,
                        borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="shield-checkmark" size={12} color="#059669" />
                        <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans-Bold', color: '#059669' }}>
                          Pago Escrow
                        </Text>
                      </View>

                      {!rev.sellerReply && (
                        <ThemedTouchable
                          onPress={() => {
                            Haptics.selectionAsync().catch(() => {});
                            setReplyingToReview(rev);
                            setReplyText('');
                          }}
                          haptic="light"
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            paddingHorizontal: 10,
                            paddingVertical: 4.5,
                            borderRadius: 999,
                            backgroundColor: isDark ? '#27272A' : '#F1F5F9',
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Responder a la reseña"
                        >
                          <Ionicons name="chatbubble-outline" size={12} color={colors.textSecondary} />
                          <Text style={{ fontSize: 11.5, fontFamily: 'PlusJakartaSans-Bold', color: colors.textSecondary }}>
                            Responder
                          </Text>
                        </ThemedTouchable>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* FAQs (if any) */}
          {faqs.length > 0 ? (
            <View style={{ marginTop: 28 }}>
              <Text style={{ fontSize: 17, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.textPrimary, letterSpacing: -0.3, marginBottom: 12 }}>
                Preguntas frecuentes
              </Text>
              {faqs.map((faq, index) => (
                <View key={`${faq.question}-${index}`} style={{ marginBottom: 10, borderRadius: 16, padding: 14, backgroundColor: isDark ? '#1C1E26' : '#F8FAFC', borderWidth: 1, borderColor: colors.borderSubtle }}>
                  <Text style={{ fontFamily: 'PlusJakartaSans-Bold', fontSize: 13.5, color: colors.textPrimary }}>
                    {display(faq.question)}
                  </Text>
                  <Text style={{ fontFamily: 'PlusJakartaSans-Regular', fontSize: 12.5, color: colors.textSecondary, marginTop: 4, lineHeight: 18 }}>
                    {display(faq.answer)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* ESCROW ASSURANCE CARD (Guarantees Banner) */}
          <View
            style={{
              marginTop: 28,
              borderRadius: 22,
              padding: 18,
              backgroundColor: isDark ? 'rgba(5, 150, 105, 0.12)' : 'rgba(5, 150, 105, 0.08)',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(5, 150, 105, 0.28)' : 'rgba(5, 150, 105, 0.2)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#059669',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#059669',
                shadowOpacity: 0.3,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
                elevation: 3,
              }}
            >
              <Ionicons name="shield-checkmark" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans-ExtraBold', color: isDark ? '#34D399' : '#065F46' }}>
                Garantía de Custodia Escrow
              </Text>
              <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans-Medium', color: colors.textSecondary, marginTop: 2, lineHeight: 16 }}>
                Tu pago queda 100% retenido y protegido en Yewi. Solo se libera al profesional cuando confirmes la entrega satisfactoria del trabajo.
              </Text>
            </View>
          </View>
        </View>
      </Animated.ScrollView>

      {/* STICKY ANIMATED TOP HEADER (Safe from Status Bar with Insets) */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
        }}
      >
        {/* Animated Background */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark ? '#12141A' : '#FFFFFF',
              borderBottomWidth: 1,
              borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            },
            headerBgStyle,
          ]}
        />

        {/* Header Content Bar */}
        <View
          style={{
            paddingTop: insets.top + 8,
            paddingBottom: 10,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Circular Solid Back Button */}
          <ThemedTouchable
            onPress={handleBack}
            haptic="light"
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: isDark ? '#1C1E26' : '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.25 : 0.08,
              shadowRadius: 4,
              elevation: 3,
            }}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Ionicons name="arrow-back" size={22} color={isDark ? '#FFFFFF' : colors.textPrimary} />
          </ThemedTouchable>

          {/* Sticky Title (fades in on scroll) */}
          <Animated.View style={[{ flex: 1, marginHorizontal: 12, alignItems: 'center' }, headerTitleStyle]}>
            <Text numberOfLines={1} style={{ fontSize: 15.5, fontFamily: 'PlusJakartaSans-Bold', color: colors.textPrimary }}>
              {title}
            </Text>
            <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans-Medium', color: colors.textMuted, marginTop: 1 }}>
              {display(category)} · {price ? `${price} €` : ''}
            </Text>
          </Animated.View>

          {/* Right: Two individual circular solid buttons */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ThemedTouchable
              onPress={handleShare}
              haptic="light"
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: isDark ? '#1C1E26' : '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.25 : 0.08,
                shadowRadius: 4,
                elevation: 3,
              }}
              accessibilityRole="button"
              accessibilityLabel="Compartir"
            >
              <Ionicons name="share-social-outline" size={22} color={isDark ? '#FFFFFF' : colors.textPrimary} />
            </ThemedTouchable>

            <ThemedTouchable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                if (entity) toggleFavorite(entity.id);
              }}
              haptic="medium"
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: isDark ? '#1C1E26' : '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.25 : 0.08,
                shadowRadius: 4,
                elevation: 3,
              }}
              accessibilityRole="button"
              accessibilityLabel="Guardar"
            >
              <Ionicons
                name={isFav ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={isFav ? '#F59E0B' : (isDark ? '#FFFFFF' : colors.textPrimary)}
              />
            </ThemedTouchable>
          </View>
        </View>
      </View>

      {/* FIXED BOTTOM ACTION BAR DOCKED AS A BOTTOM SHEET */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom + 8, 20),
          backgroundColor: isDark ? '#18181B' : '#FFFFFF',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          borderTopWidth: 1,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.05)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: isDark ? 0.35 : 0.08,
          shadowRadius: 16,
          elevation: 16,
        }}
      >
        {/* Bottom Sheet Grab Handle */}
        <View
          style={{
            width: 38,
            height: 4.5,
            borderRadius: 2.25,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.14)',
            alignSelf: 'center',
            marginBottom: 12,
          }}
        />

        {/* Row 1: Dual Pill Buttons (Contactar & Guardado) */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <ThemedTouchable
            onPress={handleContactSeller}
            haptic="medium"
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Contactar"
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: isDark ? '#27272A' : '#F8FAFC',
              paddingVertical: 12,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.2 : 0.04,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={isDark ? '#FFFFFF' : '#0F172A'} />
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'PlusJakartaSans-Bold',
                color: isDark ? '#FFFFFF' : '#0F172A',
              }}
            >
              Contactar
            </Text>
          </ThemedTouchable>

          <ThemedTouchable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              if (entity) toggleFavorite(entity.id);
            }}
            haptic="medium"
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={isFav ? 'Guardado' : 'Guardar'}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: isDark ? '#27272A' : '#F8FAFC',
              paddingVertical: 12,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.2 : 0.04,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons
              name={isFav ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={isFav ? '#F59E0B' : (isDark ? '#FFFFFF' : '#0F172A')}
            />
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'PlusJakartaSans-Bold',
                color: isFav ? '#F59E0B' : (isDark ? '#FFFFFF' : '#0F172A'),
              }}
            >
              {isFav ? 'Guardado' : 'Guardar'}
            </Text>
          </ThemedTouchable>
        </View>

        {/* Row 2: Full-width Primary CTA Pill Button (Image 2: Watch on Netflix equivalent) */}
        {isOwner ? (
          <ThemedTouchable
            onPress={() => router.push(`/publish?type=service&editId=${gig?.id || id}` as any)}
            haptic="medium"
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Editar Servicio"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: isDark ? '#FFFFFF' : '#0F172A',
              paddingVertical: 14,
              borderRadius: 999,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <Ionicons name="pencil" size={20} color={isDark ? '#0F172A' : '#FFFFFF'} />
            <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans-Bold', color: isDark ? '#0F172A' : '#FFFFFF' }}>
              Editar Servicio
            </Text>
          </ThemedTouchable>
        ) : (
          <ThemedTouchable
            disabled={processing}
            onPress={isResolvedGig && canBuy ? handleHire : handleContactSeller}
            haptic="medium"
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={isResolvedGig && canBuy ? `Contratar Servicio ${price} €` : 'Solicitar Presupuesto'}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: isDark ? '#FFFFFF' : '#0F172A',
              paddingVertical: 14,
              borderRadius: 999,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {processing ? (
              <ActivityIndicator color={isDark ? '#09090B' : '#FFFFFF'} size="small" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={22} color={isDark ? '#09090B' : '#FFFFFF'} />
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'PlusJakartaSans-Bold',
                    color: isDark ? '#09090B' : '#FFFFFF',
                    letterSpacing: -0.2,
                  }}
                >
                  {isResolvedGig && canBuy
                    ? `Contratar Servicio · ${price} €`
                    : 'Solicitar Presupuesto'}
                </Text>
              </>
            )}
          </ThemedTouchable>
        )}

        <Text
          style={{
            fontSize: 11,
            fontFamily: 'PlusJakartaSans-Medium',
            color: colors.textMuted,
            textAlign: 'center',
            marginTop: 6,
          }}
        >
          🛡️ Pago protegido 100% con custodia Escrow Yewi
        </Text>
      </View>

      {/* MODAL: RESPONDER A RESEÑA (Para profesionales) */}
      <Modal
        visible={Boolean(replyingToReview)}
        animationType="slide"
        transparent
        onRequestClose={() => setReplyingToReview(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              borderTopWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View>
                <Text style={{ fontSize: 17, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.textPrimary }}>
                  Responder a reseña
                </Text>
                <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans-Medium', color: colors.textSecondary, marginTop: 2 }}>
                  Cliente: {replyingToReview?.author?.profile?.displayName || replyingToReview?.name || 'Cliente'}
                </Text>
              </View>
              <Pressable
                onPress={() => setReplyingToReview(null)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: isDark ? '#27272A' : '#F1F5F9',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Quoted Client Comment */}
            <View
              style={{
                padding: 12,
                borderRadius: 14,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                borderLeftWidth: 3,
                borderLeftColor: '#F59E0B',
                marginBottom: 16,
              }}
            >
              <Text numberOfLines={3} style={{ fontSize: 12.5, fontFamily: 'PlusJakartaSans-Regular', color: colors.textSecondary, lineHeight: 18 }}>
                "{replyingToReview?.comment}"
              </Text>
            </View>

            <TextInput
              style={{
                backgroundColor: colors.background,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                padding: 14,
                color: colors.textPrimary,
                fontFamily: 'PlusJakartaSans-Regular',
                fontSize: 14,
                minHeight: 100,
                textAlignVertical: 'top',
                marginBottom: 18,
              }}
              placeholder="Escribe tu respuesta profesional..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              value={replyText}
              onChangeText={setReplyText}
            />

            <ThemedTouchable
              onPress={handleSendReply}
              disabled={submittingReply || !replyText.trim()}
              haptic="medium"
              style={{
                backgroundColor: isDark ? '#FFFFFF' : '#0F172A',
                borderRadius: 999,
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: !replyText.trim() ? 0.6 : 1,
              }}
              accessibilityRole="button"
              accessibilityLabel="Publicar respuesta"
            >
              {submittingReply ? (
                <ActivityIndicator color={isDark ? '#0F172A' : '#FFFFFF'} size="small" />
              ) : (
                <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontFamily: 'PlusJakartaSans-Bold', fontSize: 15 }}>
                  Publicar Respuesta
                </Text>
              )}
            </ThemedTouchable>
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


      {/* CHECKOUT & ESCROW PAYMENT MODAL */}
      <Modal
        visible={showCheckoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => !processing && setShowCheckoutModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: isDark ? '#18181B' : '#FFFFFF',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 22,
              paddingTop: 18,
              paddingBottom: Math.max(insets.bottom, 24),
              maxHeight: '85%',
            }}
          >
            {/* Grabber */}
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: isDark ? '#3F3F46' : '#E4E4E7',
                alignSelf: 'center',
                marginBottom: 16,
              }}
            />

            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: 'PlusJakartaSans-Bold',
                  color: colors.textPrimary,
                }}
              >
                Confirmar Pedido
              </Text>
              <Pressable
                onPress={() => !processing && setShowCheckoutModal(false)}
                hitSlop={8}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isDark ? '#27272A' : '#F4F4F5',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Package Summary Card */}
            <View
              style={{
                backgroundColor: isDark ? '#27272A' : '#F8FAFC',
                borderRadius: 18,
                padding: 16,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: isDark ? '#3F3F46' : '#E2E8F0',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: 'PlusJakartaSans-Bold',
                      color: colors.textPrimary,
                      marginBottom: 4,
                    }}
                    numberOfLines={1}
                  >
                    {gig?.title || 'Servicio'}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'PlusJakartaSans-Medium',
                      color: colors.textSecondary,
                    }}
                  >
                    Paquete: {selectedPackage?.name} · {sellerName}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  {promoDiscountPercent ? (
                    <>
                      <Text
                        style={{
                          fontSize: 13,
                          fontFamily: 'PlusJakartaSans-Medium',
                          color: colors.textMuted,
                          textDecorationLine: 'line-through',
                        }}
                      >
                        {selectedPackage?.price} €
                      </Text>
                      <Text
                        style={{
                          fontSize: 20,
                          fontFamily: 'PlusJakartaSans-ExtraBold',
                          color: colors.primary,
                        }}
                      >
                        {finalCheckoutPrice} €
                      </Text>
                    </>
                  ) : (
                    <Text
                      style={{
                        fontSize: 20,
                        fontFamily: 'PlusJakartaSans-Bold',
                        color: colors.textPrimary,
                      }}
                    >
                      {selectedPackage?.price} €
                    </Text>
                  )}
                </View>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 10,
                  paddingTop: 10,
                  borderTopWidth: 1,
                  borderTopColor: isDark ? '#3F3F46' : '#E2E8F0',
                }}
              >
                <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'PlusJakartaSans-Regular',
                    color: colors.textMuted,
                  }}
                >
                  Plazo de entrega: {selectedPackage?.deliveryDays} días
                </Text>
              </View>
            </View>

            {/* Discount breakdown banner if active promotion */}
            {promoDiscountPercent ? (
              <View
                style={{
                  backgroundColor: isDark ? 'rgba(2, 132, 199, 0.1)' : '#F0F9FF',
                  borderRadius: 14,
                  padding: 12,
                  marginBottom: 14,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(2, 132, 199, 0.25)' : '#BAE6FD',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="pricetag" size={16} color="#0284C7" />
                  <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-Bold', color: '#0284C7' }}>
                    Descuento (-{promoDiscountPercent}%)
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#0284C7' }}>
                  -{checkoutDiscountAmount} €
                </Text>
              </View>
            ) : null}

            {/* Escrow Badge Info */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: isDark ? '#064E3B20' : '#ECFDF5',
                padding: 12,
                borderRadius: 14,
                marginBottom: 18,
                borderWidth: 1,
                borderColor: isDark ? '#065F4640' : '#A7F3D0',
              }}
            >
              <Ionicons name="shield-checkmark" size={20} color="#059669" />
              <Text
                style={{
                  flex: 1,
                  fontSize: 12,
                  fontFamily: 'PlusJakartaSans-Medium',
                  color: isDark ? '#34D399' : '#047857',
                  lineHeight: 16,
                }}
              >
                Fondos custodiados en Escrow. El profesional solo cobrará cuando confirmes que el trabajo está completado conforme.
              </Text>
            </View>

            {/* Payment Method Selector */}
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'PlusJakartaSans-Bold',
                color: colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 10,
              }}
            >
              Método de Pago
            </Text>

            {/* Option 1: Stripe Card */}
            <Pressable
              onPress={() => setCheckoutPaymentMethod('stripe')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 14,
                borderRadius: 16,
                backgroundColor: checkoutPaymentMethod === 'stripe'
                  ? (isDark ? '#312E8130' : '#EEF2FF')
                  : (isDark ? '#27272A' : '#F8FAFC'),
                borderWidth: 1.5,
                borderColor: checkoutPaymentMethod === 'stripe'
                  ? '#6366F1'
                  : (isDark ? '#3F3F46' : '#E2E8F0'),
                marginBottom: 10,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: '#6366F120',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="card-outline" size={20} color="#6366F1" />
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'PlusJakartaSans-Bold',
                      color: colors.textPrimary,
                    }}
                  >
                    Tarjeta / Apple Pay / Google Pay
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'PlusJakartaSans-Regular',
                      color: colors.textMuted,
                    }}
                  >
                    Pasarela segura Stripe
                  </Text>
                </View>
              </View>
              <Ionicons
                name={checkoutPaymentMethod === 'stripe' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={checkoutPaymentMethod === 'stripe' ? '#6366F1' : colors.textMuted}
              />
            </Pressable>

            {/* Option 2: Wallet Balance */}
            <Pressable
              onPress={() => setCheckoutPaymentMethod('wallet')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 14,
                borderRadius: 16,
                backgroundColor: checkoutPaymentMethod === 'wallet'
                  ? (isDark ? '#312E8130' : '#EEF2FF')
                  : (isDark ? '#27272A' : '#F8FAFC'),
                borderWidth: 1.5,
                borderColor: checkoutPaymentMethod === 'wallet'
                  ? '#6366F1'
                  : (isDark ? '#3F3F46' : '#E2E8F0'),
                marginBottom: 20,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: '#10B98120',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="wallet-outline" size={20} color="#10B981" />
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'PlusJakartaSans-Bold',
                      color: colors.textPrimary,
                    }}
                  >
                    Saldo Billetera Yewi
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'PlusJakartaSans-Regular',
                      color: colors.textMuted,
                    }}
                  >
                    Descuento de saldo disponible
                  </Text>
                </View>
              </View>
              <Ionicons
                name={checkoutPaymentMethod === 'wallet' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={checkoutPaymentMethod === 'wallet' ? '#6366F1' : colors.textMuted}
              />
            </Pressable>

            {/* Action Button */}
            <ThemedTouchable
              onPress={handleProcessPayment}
              disabled={processing}
              haptic="medium"
              style={{
                backgroundColor: isDark ? '#FFFFFF' : '#0F172A',
                borderRadius: 999,
                paddingVertical: 15,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
              }}
              accessibilityRole="button"
              accessibilityLabel={`Pagar ${selectedPackage?.price} €`}
            >
              {processing ? (
                <ActivityIndicator color={isDark ? '#0F172A' : '#FFFFFF'} size="small" />
              ) : (
                <>
                  <Ionicons name="lock-closed" size={18} color={isDark ? '#0F172A' : '#FFFFFF'} />
                  <Text
                    style={{
                      color: isDark ? '#0F172A' : '#FFFFFF',
                      fontFamily: 'PlusJakartaSans-Bold',
                      fontSize: 15,
                    }}
                  >
                    {checkoutPaymentMethod === 'stripe'
                      ? `Pagar ${finalCheckoutPrice} € con Stripe`
                      : `Pagar ${finalCheckoutPrice} € con Saldo`}
                  </Text>
                </>
              )}
            </ThemedTouchable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert((current) => ({ ...current, visible: false }))}
      />
    </View>
  );
}
