import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { CustomAlert } from '@/components/ui/CustomAlert';
import { AuthInput } from '@/components/auth/AuthInput';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { CATEGORIES_LIST } from '@/constants/categories';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuthStore } from '@/store/useAuthStore';
import { leadsApi, ServiceRequestItem } from '@/services/leadsApi';
import { paymentsApi } from '@/services/paymentsApi';
import { getAccessToken } from '@/services/apiClient';
import { HomePromoBanner } from '@/components/ui/HomePromoBanner';

import { useRealtimeStore } from '@/store/useRealtimeStore';
import { SwipeableRow } from '@/components/ui/SwipeableRow';
import { toast } from '@/store/useToastStore';
import { SkeletonCard } from '@/components/ui/Skeleton';


const STORAGE_MY_REQUESTS = '@yewi_cached_my_requests';

const REQUEST_CATEGORY_ICONS: Record<
  string,
  {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    accentColor: string;
  }
> = {
  electricidad: { icon: 'lightning-bolt', accentColor: '#EAB308' },
  fontaneria: { icon: 'water-pump', accentColor: '#0284C7' },
  pintura: { icon: 'format-paint', accentColor: '#9333EA' },
  banos: { icon: 'shower', accentColor: '#059669' },
  cocina: { icon: 'countertop-outline', accentColor: '#EA580C' },
  climatizacion: { icon: 'air-conditioner', accentColor: '#DC2626' },
  carpinteria: { icon: 'hammer', accentColor: '#CA8A04' },
  cerrajeria: { icon: 'key-variant', accentColor: '#4F46E5' },
  reformas: { icon: 'home-city-outline', accentColor: '#C026D3' },
  limpieza: { icon: 'broom', accentColor: '#E11D48' },
  general: { icon: 'toolbox-outline', accentColor: '#F59E0B' },
};


const getCategorySlug = (category: any): string => {
  const catName = (typeof category === 'object' ? category?.name : category) || '';
  const normalized = catName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (normalized.includes('electr')) return 'electricidad';
  if (normalized.includes('fontan')) return 'fontaneria';
  if (normalized.includes('pint')) return 'pintura';
  if (normalized.includes('bañ') || normalized.includes('ban')) return 'banos';
  if (normalized.includes('cocin')) return 'cocina';
  if (normalized.includes('clima') || normalized.includes('aire') || normalized.includes('calefa')) return 'climatizacion';
  if (normalized.includes('carp')) return 'carpinteria';
  if (normalized.includes('cerraj')) return 'cerrajeria';
  if (normalized.includes('reform')) return 'reformas';
  if (normalized.includes('limp')) return 'limpieza';
  return 'general';
};

const getNotchedCardPath = (w: number, h: number) => `
  M 26 0
  L ${w - 26} 0
  A 26 26 0 0 1 ${w} 26
  L ${w} ${h - 58}
  Q ${w} ${h - 44} ${w - 14} ${h - 44}
  L ${w - 36} ${h - 44}
  Q ${w - 50} ${h - 44} ${w - 50} ${h - 30}
  Q ${w - 50} ${h} ${w - 64} ${h}
  L 26 ${h}
  A 26 26 0 0 1 0 ${h - 26}
  L 0 26
  A 26 26 0 0 1 26 0
  Z
`;

export function RequestsTemplate() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const { colors, t, isDark } = useAppTheme();
  const { user, isAuthenticated } = useAuthStore();
  const realtimeLeads = useRealtimeStore((state) => state.availableLeads);
  const unseenLeadsCount = useRealtimeStore((state) => state.unseenLeadsCount);

  const isProfessional = user?.roles?.includes('PROFESSIONAL');
  const [isPro, setIsPro] = useState<boolean>(user?.isPro === true);

  const fetchProStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setIsPro(false);
      return;
    }
    try {
      const status = await paymentsApi.getSubscriptionStatus();
      setIsPro(status.isPro === true);
    } catch {
      setIsPro(user?.isPro === true);
    }
  }, [isAuthenticated, user?.isPro]);

  useEffect(() => {
    fetchProStatus();
  }, [fetchProStatus]);

  // Tab State: 'my-requests' (Mis Solicitudes) vs 'leads' (Oportunidades) vs 'my-proposals' (Mis Presupuestos)
  const [activeTab, setActiveTab] = useState<'my-requests' | 'leads' | 'my-proposals'>('my-requests');
  const [proposalFilter, setProposalFilter] = useState<'ALL' | 'ACCEPTED' | 'PENDING' | 'REJECTED'>('ALL');

  const [myRequests, setMyRequests] = useState<ServiceRequestItem[]>([]);
  const [availableLeads, setAvailableLeads] = useState<ServiceRequestItem[]>([]);
  const [myProposals, setMyProposals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);


  // Publish Modal State
  const [isPublishModalVisible, setIsPublishModalVisible] = useState<boolean>(false);
  const [publishStep, setPublishStep] = useState<number>(1);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Electricidad');
  const [newDescription, setNewDescription] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newCity, setNewCity] = useState(user?.city || 'Zaragoza');
  const [newPostalCode, setNewPostalCode] = useState(user?.postalCode || '50001');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ visible: true, title, message });
  };

  const loadData = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (activeTab === 'my-requests') {
        const data = await leadsApi.getMyRequests();
        if (Array.isArray(data)) {
          const valid = data.filter((item) => item && item.id && item.title);
          setMyRequests(valid);
          await AsyncStorage.setItem(STORAGE_MY_REQUESTS, JSON.stringify(valid));
        }
      } else if (activeTab === 'leads') {
        const data = await leadsApi.getAvailableLeads();
        setAvailableLeads(Array.isArray(data) ? data : []);
      } else if (activeTab === 'my-proposals') {
        const data = await leadsApi.getMyProposals();
        setMyProposals(Array.isArray(data) ? data : []);
      }
    } catch (e: any) {
      console.warn('Error loading requests from API:', e);
      if (activeTab === 'my-requests') {
        const cached = await AsyncStorage.getItem(STORAGE_MY_REQUESTS);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              const valid = parsed.filter(
                (item) => item && item.id && item.title && item.title !== 'Solicitud de trabajo'
              );
              setMyRequests(valid);
            }
          } catch {
            setMyRequests([]);
          }
        }
      } else if (activeTab === 'my-proposals') {
        setMyProposals([]);
      } else {
        setAvailableLeads([]);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab, user?.id, isAuthenticated]);

  useEffect(() => {
    setIsLoading(true);
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === 'leads' && realtimeLeads.length > 0) {
      setAvailableLeads(realtimeLeads);
    }
  }, [activeTab, realtimeLeads]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await loadData();
  };

  const handleDeleteRequest = async (requestId: string) => {
    try {
      setIsDeletingId(requestId);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      await leadsApi.deleteRequest(requestId);

      setMyRequests((prev) => {
        const updated = (Array.isArray(prev) ? prev : []).filter((r) => r.id !== requestId);
        AsyncStorage.setItem(STORAGE_MY_REQUESTS, JSON.stringify(updated)).catch(() => {});
        return updated;
      });

      toast.info('Solicitud Eliminada', 'Tu solicitud ha sido retirada correctamente.');
    } catch (e: any) {
      toast.error('Error al Eliminar', e.message || 'No se pudo eliminar la solicitud.');
    } finally {
      setIsDeletingId(null);
    }
  };


  const handleOpenPublishModal = () => {
    setPublishStep(1);
    setNewTitle('');
    setNewCategory('Electricidad');
    setNewDescription('');
    setNewBudget('');
    setNewCity(user?.city || 'Zaragoza');
    setNewPostalCode(user?.postalCode || '50001');
    setIsPublishModalVisible(true);
  };

  const handleNextPublishStep = () => {
    if (publishStep === 1) {
      setPublishStep(2);
      return;
    }

    if (publishStep === 2) {
      if (!newTitle.trim()) {
        toast.warning('Título Requerido', 'Introduce un título para el trabajo o reforma.');
        return;
      }
      if (!newDescription.trim()) {
        toast.warning('Descripción Requerida', 'Explica detalladamente lo que necesitas realizar.');
        return;
      }
      setPublishStep(3);
      return;
    }

    if (publishStep === 3) {
      if (!newCity.trim()) {
        toast.warning('Localidad Requerida', 'Indica la localidad o municipio del trabajo.');
        return;
      }
      handlePublishRequest();
    }
  };

  const handlePublishRequest = async () => {
    setIsSubmitting(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      const created = await leadsApi.createRequest({
        categoryId: newCategory,
        category: newCategory,
        title: newTitle.trim(),
        description: newDescription.trim(),
        questionnaireAnswers: {},
        budgetEstimated: newBudget ? parseFloat(newBudget) : undefined,
        budgetMax: newBudget ? parseFloat(newBudget) : undefined,
        city: newCity.trim() || user?.city || 'Zaragoza',
        postalCode: newPostalCode.trim() || user?.postalCode || '50001',
      });

      if (created) {
        setIsPublishModalVisible(false);
        setMyRequests((previous) => {
          const updated = [
            created,
            ...(Array.isArray(previous) ? previous : []).filter((request) => request.id !== created.id),
          ];
          AsyncStorage.setItem(STORAGE_MY_REQUESTS, JSON.stringify(updated)).catch(() => {});
          return updated;
        });
        await loadData();
        toast.success(
          '¡Solicitud Publicada!',
          'Los profesionales verificados de tu zona recibirán la solicitud y te enviarán sus presupuestos.'
        );
      }
    } catch (e: any) {
      toast.error('Error al Publicar', e.message || 'No se pudo publicar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const filteredProposals = useMemo(() => {
    if (proposalFilter === 'ALL') return myProposals;
    return myProposals.filter((p) => p.status === proposalFilter);
  }, [myProposals, proposalFilter]);

  const listData =
    activeTab === 'my-requests'
      ? Array.isArray(myRequests)
        ? myRequests
        : []
      : activeTab === 'leads'
      ? Array.isArray(availableLeads)
        ? availableLeads
        : []
      : filteredProposals;

  const paddingTop = Math.max(insets.top + 10, 24);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header Following Exact Design Convention */}
      <View style={{ backgroundColor: colors.background, paddingHorizontal: 20, paddingTop }}>
        {/* Top Row: Title + "+ Publicar" Button */}
        <View className="flex-row justify-between items-center mb-4">
          <Text
            style={{
              fontSize: 28,
              fontFamily: 'Satoshi-Black',
              color: colors.textPrimary,
              letterSpacing: -0.5,
            }}
          >
            Solicitudes
          </Text>

          <ThemedTouchable
            onPress={handleOpenPublishModal}
            haptic="medium"
            style={{
              backgroundColor: colors.primary,
              borderRadius: 999,
              paddingHorizontal: 16,
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={{ color: '#FFFFFF', fontFamily: 'Satoshi-Bold', fontSize: 13.5 }}>
              Publicar
            </Text>
          </ThemedTouchable>
        </View>

        {/* Subtab Bar: Mis Solicitudes vs Oportunidades vs Mis Presupuestos */}
        <View style={{ borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Tab 1: Mis Solicitudes */}
            <ThemedTouchable
              onPress={() => {
                setActiveTab('my-requests');
                Haptics.selectionAsync().catch(() => {});
              }}
              haptic="selection"
              className="pb-3 pt-1 mr-6 relative"
            >
              <Text
                style={{
                  fontSize: 15.5,
                  fontFamily: activeTab === 'my-requests' ? 'Satoshi-Black' : 'Satoshi-Bold',
                  color: activeTab === 'my-requests' ? colors.textPrimary : colors.textMuted,
                }}
              >
                Mis Solicitudes
              </Text>
              {activeTab === 'my-requests' && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2.5,
                    borderRadius: 2,
                    backgroundColor: colors.textPrimary,
                  }}
                />
              )}
            </ThemedTouchable>

            {/* Tab 2: Oportunidades */}
            <ThemedTouchable
              onPress={() => {
                setActiveTab('leads');
                useRealtimeStore.getState().markLeadsAsSeen();
                Haptics.selectionAsync().catch(() => {});
              }}
              haptic="selection"
              className="pb-3 pt-1 mr-6 relative"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Text
                  style={{
                    fontSize: 15.5,
                    fontFamily: activeTab === 'leads' ? 'Satoshi-Black' : 'Satoshi-Bold',
                    color: activeTab === 'leads' ? colors.textPrimary : colors.textMuted,
                  }}
                >
                  Oportunidades {isProfessional ? '★' : ''}
                </Text>
                {unseenLeadsCount > 0 && (
                  <View
                    style={{
                      backgroundColor: '#EF4444',
                      borderRadius: 10,
                      paddingHorizontal: 6,
                      paddingVertical: 1,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontFamily: 'Satoshi-Black', color: '#FFFFFF' }}>
                      {unseenLeadsCount > 99 ? '99+' : unseenLeadsCount}
                    </Text>
                  </View>
                )}
              </View>
              {activeTab === 'leads' && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2.5,
                    borderRadius: 2,
                    backgroundColor: colors.textPrimary,
                  }}
                />
              )}
            </ThemedTouchable>

            {/* Tab 3: Mis Presupuestos (Sellers) */}
            {isProfessional && (
              <ThemedTouchable
                onPress={() => {
                  setActiveTab('my-proposals');
                  Haptics.selectionAsync().catch(() => {});
                }}
                haptic="selection"
                className="pb-3 pt-1 relative"
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text
                    style={{
                      fontSize: 15.5,
                      fontFamily: activeTab === 'my-proposals' ? 'Satoshi-Black' : 'Satoshi-Bold',
                      color: activeTab === 'my-proposals' ? colors.textPrimary : colors.textMuted,
                    }}
                  >
                    Mis Presupuestos
                  </Text>
                  {myProposals.filter((p) => p.status === 'ACCEPTED').length > 0 && (
                    <View
                      style={{
                        backgroundColor: '#10B981',
                        borderRadius: 10,
                        paddingHorizontal: 6,
                        paddingVertical: 1,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontFamily: 'Satoshi-Black', color: '#FFFFFF' }}>
                        {myProposals.filter((p) => p.status === 'ACCEPTED').length}
                      </Text>
                    </View>
                  )}
                </View>
                {activeTab === 'my-proposals' && (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 2.5,
                      borderRadius: 2,
                      backgroundColor: colors.textPrimary,
                    }}
                  />
                )}
              </ThemedTouchable>
            )}
          </ScrollView>
        </View>

        {/* Filter Pills when in 'my-proposals' */}
        {activeTab === 'my-proposals' && (
          <View style={{ flexDirection: 'row', gap: 8, paddingTop: 12, paddingBottom: 4 }}>
            {[
              { id: 'ALL', label: `Todos (${myProposals.length})` },
              { id: 'ACCEPTED', label: `Aceptados ✓ (${myProposals.filter((p) => p.status === 'ACCEPTED').length})` },
              { id: 'PENDING', label: `Pendientes (${myProposals.filter((p) => p.status === 'PENDING').length})` },
              { id: 'REJECTED', label: `Rechazados (${myProposals.filter((p) => p.status === 'REJECTED').length})` },
            ].map((f) => (
              <ThemedTouchable
                key={f.id}
                onPress={() => {
                  setProposalFilter(f.id as any);
                  Haptics.selectionAsync().catch(() => {});
                }}
                haptic="selection"
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 999,
                  backgroundColor:
                    proposalFilter === f.id
                      ? colors.primary
                      : isDark
                      ? '#202532'
                      : '#F1F5F9',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Satoshi-Bold',
                    color: proposalFilter === f.id ? '#FFFFFF' : colors.textSecondary,
                  }}
                >
                  {f.label}
                </Text>
              </ThemedTouchable>
            ))}
          </View>
        )}
      </View>

      {/* Main Content List */}
      {isLoading ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 18,
            paddingTop: 16,
            gap: 12,
          }}
        >
          <SkeletonCard height={120} />
          <SkeletonCard height={120} />
          <SkeletonCard height={120} />
          <SkeletonCard height={120} />
        </ScrollView>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item, index) => (item?.id ? String(item.id) : `request-item-${index}`)}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={{
            paddingHorizontal: 18,
            paddingTop: 16,
            paddingBottom: Math.max(insets.bottom + 120, 140),
            flexGrow: 1,
          }}
          ListHeaderComponent={
            activeTab === 'leads' && !isPro ? (
              <View key="leads-promo-header" style={{ marginBottom: 14 }}>
                <HomePromoBanner
                  ad={{
                    id: isProfessional ? 'pro-active-banner' : 'become-seller',
                    variant: 'seller',
                    badge: isProfessional ? 'PLAN PROFESIONAL' : 'MODO PROFESIONAL',
                    title: isProfessional
                      ? 'Hazte Yewi Pro (9,99 €/mes)'
                      : 'Conviértete en Seller',
                    description: isProfessional
                      ? 'Recibe solicitudes antes, contacto directo sin comisiones y cobertura nacional.'
                      : 'Recibe solicitudes de clientes en tu zona, envía presupuestos y haz crecer tu negocio.',
                    ctaText: isProfessional ? 'Ver ventajas' : 'Activar Seller',
                    discountBadge: isProfessional ? 'PRO' : 'SELLER',
                  }}
                  onPress={() => {
                    if (isProfessional) {
                      router.push('/subscription');
                    } else {
                      router.push('/professional-profile');
                    }
                  }}
                  onCtaPress={() => {
                    if (isProfessional) {
                      router.push('/subscription');
                    } else {
                      router.push('/professional-profile');
                    }
                  }}
                />
              </View>
            ) : undefined
          }

          ListEmptyComponent={() => (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40, paddingHorizontal: 16 }}>
              <View
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 38,
                  backgroundColor: colors.surfaceAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Ionicons
                  name={
                    activeTab === 'my-requests'
                      ? 'document-text-outline'
                      : activeTab === 'my-proposals'
                      ? 'pricetags-outline'
                      : 'sparkles-outline'
                  }
                  size={38}
                  color={colors.primary}
                />
              </View>
              <Text style={{ fontSize: 18, fontFamily: 'Satoshi-Black', color: colors.textPrimary, marginBottom: 8, textAlign: 'center' }}>
                {activeTab === 'my-requests'
                  ? t.noRequestsTitle
                  : activeTab === 'my-proposals'
                  ? 'No hay presupuestos en esta sección'
                  : t.noLeadsTitle}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Satoshi-Regular',
                  color: colors.textSecondary,
                  textAlign: 'center',
                  marginBottom: 20,
                  maxWidth: 300,
                  lineHeight: 20,
                }}
              >
                {activeTab === 'my-requests'
                  ? t.noRequestsDesc
                  : activeTab === 'my-proposals'
                  ? 'Cuando envíes propuestas a solicitudes de clientes, aparecerán aquí para su seguimiento y chat privado.'
                  : t.noLeadsDesc}
              </Text>
              {activeTab === 'my-requests' && (
                <ThemedTouchable
                  onPress={handleOpenPublishModal}
                  haptic="medium"
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 999,
                    paddingHorizontal: 22,
                    paddingVertical: 12,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontFamily: 'Satoshi-Bold', fontSize: 14 }}>
                    Publicar Primera Solicitud
                  </Text>
                </ThemedTouchable>
              )}
            </View>
          )}
          renderItem={({ item }) => {
            if (activeTab === 'my-proposals') {
              const prop = item;
              const isAccepted = prop.status === 'ACCEPTED';
              const isRejected = prop.status === 'REJECTED';
              const reqTitle = prop.serviceRequest?.title || 'Solicitud de servicio';
              const reqCity = prop.serviceRequest?.city || 'Zaragoza';
              const catName = prop.serviceRequest?.category?.name || 'General';
              const catSlug = getCategorySlug(catName);
              const theme = REQUEST_CATEGORY_ICONS[catSlug] || REQUEST_CATEGORY_ICONS.general;

              const statusBadgeBg = isAccepted
                ? isDark
                  ? '#064E3B'
                  : '#D1FAE5'
                : isRejected
                ? isDark
                  ? '#450A0A'
                  : '#FEE2E2'
                : isDark
                ? '#451A03'
                : '#FEF3C7';

              const statusBadgeText = isAccepted
                ? '#10B981'
                : isRejected
                ? '#EF4444'
                : '#F59E0B';

              const statusBadgeLabel = isAccepted
                ? 'Aceptado ✓'
                : isRejected
                ? 'Rechazado'
                : 'Pendiente';

              return (
                <View
                  style={{
                    backgroundColor: isDark ? '#161922' : '#FFFFFF',
                    borderRadius: 20,
                    padding: 18,
                    marginBottom: 14,
                    borderWidth: 1,
                    borderColor: isDark ? '#222734' : '#E2E8F0',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.2 : 0.05,
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                >
                  {/* Top Row: Category + Status Badge */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name={theme.icon} size={18} color={theme.accentColor} />
                      <Text style={{ fontSize: 13, fontFamily: 'Satoshi-Bold', color: colors.textSecondary }}>
                        {catName} · {reqCity}
                      </Text>
                    </View>

                    <View style={{ backgroundColor: statusBadgeBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                      <Text style={{ fontSize: 12, fontFamily: 'Satoshi-Black', color: statusBadgeText }}>
                        {statusBadgeLabel}
                      </Text>
                    </View>
                  </View>

                  {/* Title & Price */}
                  <ThemedTouchable
                    onPress={() => router.push({ pathname: '/request-detail', params: { id: prop.serviceRequestId } })}
                    haptic="light"
                  >
                    <Text numberOfLines={1} style={{ fontSize: 17, fontFamily: 'Satoshi-Black', color: colors.textPrimary, marginBottom: 6 }}>
                      {reqTitle}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                      <Text style={{ fontSize: 20, fontFamily: 'Satoshi-Black', color: colors.primary }}>
                        {prop.price} €
                      </Text>
                      <Text style={{ fontSize: 12.5, fontFamily: 'Satoshi-Medium', color: colors.textMuted }}>
                        Plazo: {prop.estimatedDays || 3} días
                      </Text>
                    </View>

                    {Boolean(prop.message) && (
                      <Text numberOfLines={2} style={{ fontSize: 13, fontFamily: 'Satoshi-Regular', color: colors.textSecondary, marginBottom: 12, lineHeight: 18 }}>
                        {prop.message}
                      </Text>
                    )}
                  </ThemedTouchable>

                  {/* Client & Actions Row (Especially for Accepted Proposals) */}
                  {isAccepted && (
                    <View
                      style={{
                        paddingTop: 12,
                        marginTop: 4,
                        borderTopWidth: 1,
                        borderTopColor: isDark ? '#222734' : '#F1F5F9',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              backgroundColor: colors.primaryLight,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text style={{ fontSize: 13, fontFamily: 'Satoshi-Black', color: colors.primary }}>
                              {prop.client?.name ? prop.client.name.charAt(0).toUpperCase() : 'C'}
                            </Text>
                          </View>
                          <View>
                            <Text style={{ fontSize: 13.5, fontFamily: 'Satoshi-Bold', color: colors.textPrimary }}>
                              {prop.client?.name || 'Cliente'}
                            </Text>
                            <Text style={{ fontSize: 11.5, fontFamily: 'Satoshi-Medium', color: colors.textMuted }}>
                              {prop.client?.city || reqCity}
                            </Text>
                          </View>
                        </View>

                        <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                          <Text style={{ fontSize: 11, fontFamily: 'Satoshi-Bold', color: '#1D4ED8' }}>
                            Presupuesto Aceptado ✓
                          </Text>
                        </View>
                      </View>

                      {/* Open Chat Button */}
                      <ThemedTouchable
                        onPress={() =>
                          router.push({
                            pathname: '/chat',
                            params: {
                              orderId: prop.order?.id,
                              requestId: prop.serviceRequestId,
                              conversationId: prop.conversationId || '',
                              targetName: prop.client?.name,
                            },
                          })
                        }
                        haptic="medium"
                        style={{
                          backgroundColor: colors.primary,
                          borderRadius: 12,
                          paddingVertical: 10,
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'row',
                          gap: 6,
                        }}
                      >
                        <Ionicons name="chatbubbles" size={17} color="#FFFFFF" />
                        <Text style={{ fontSize: 13.5, fontFamily: 'Satoshi-Bold', color: '#FFFFFF' }}>
                          Abrir Chat Privado con el Cliente
                        </Text>
                      </ThemedTouchable>
                    </View>
                  )}
                </View>
              );
            }

            const catSlug = getCategorySlug(item.category || item.categoryId || item.title);
            const theme = REQUEST_CATEGORY_ICONS[catSlug] || REQUEST_CATEGORY_ICONS.general;
            const cardBg = isDark ? '#161922' : '#FFFFFF';
            const boxBg = isDark ? '#202532' : '#F8FAFC';
            const cardBorder = isDark ? '#222734' : '#E2E8F0';
            const cardWidth = Math.min(SCREEN_WIDTH - 40, 500);
            const cardHeight = 142;

            const categoryName =
              typeof item.category === 'object'
                ? item.category?.name || 'General'
                : item.category || item.categoryId || 'General';

            const budgetDisplay = item.budgetMax
              ? `${item.budgetMax}€`
              : item.budgetEstimated
              ? `${item.budgetEstimated}€`
              : activeTab === 'my-requests'
              ? `${item.proposals?.length || 0}`
              : 'A convenir';

            const countLabel = item.budgetMax || item.budgetEstimated
              ? 'presupuesto'
              : activeTab === 'my-requests'
              ? 'presupuestos'
              : 'orientativo';

            const cardContent = (
              <ThemedTouchable
                key={item.id}
                onPress={() => router.push({ pathname: '/request-detail', params: { id: item.id } })}
                haptic="light"
                activeOpacity={0.92}
                style={{
                  width: cardWidth,
                  height: cardHeight,
                  position: 'relative',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: isDark ? 0.3 : 0.06,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <Svg width={cardWidth} height={cardHeight} style={StyleSheet.absoluteFill}>
                  <Path d={getNotchedCardPath(cardWidth, cardHeight)} fill={cardBg} stroke={cardBorder} strokeWidth={1} />
                </Svg>

                <View
                  style={{
                    flexDirection: 'row',
                    padding: 12,
                    height: '100%',
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 82,
                      height: 114,
                      borderRadius: 18,
                      backgroundColor: boxBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 14,
                      borderWidth: 1,
                      borderColor: isDark ? '#282F40' : '#E2E8F0',
                    }}
                  >
                    <MaterialCommunityIcons
                      name={theme.icon}
                      size={36}
                      color={theme.accentColor}
                    />
                  </View>

                  <View
                    style={{
                      flex: 1,
                      height: 114,
                      justifyContent: 'space-between',
                      paddingRight: 44,
                      paddingVertical: 2,
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 16,
                        fontFamily: 'Satoshi-Black',
                        color: colors.textPrimary,
                      }}
                    >
                      {item.title || categoryName}
                    </Text>

                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: 12.5,
                        fontFamily: 'Satoshi-Regular',
                        color: colors.textSecondary,
                        lineHeight: 17,
                        marginVertical: 2,
                      }}
                    >
                      {item.description || 'Sin descripción adicional disponible para esta solicitud.'}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                      <Text
                        style={{
                          fontSize: 22,
                          fontFamily: 'Satoshi-Black',
                          color: colors.textPrimary,
                          lineHeight: 24,
                        }}
                      >
                        {budgetDisplay}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11.5,
                          fontFamily: 'Satoshi-Medium',
                          color: colors.textMuted,
                        }}
                      >
                        {countLabel} · {item.city || 'Zaragoza'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View
                  style={{
                    position: 'absolute',
                    right: 4,
                    bottom: 4,
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    backgroundColor: isDark ? '#FFFFFF' : '#0F172A',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.18,
                    shadowRadius: 3,
                    elevation: 3,
                  }}
                  pointerEvents="none"
                >
                  <Feather
                    name="arrow-up-right"
                    size={19}
                    color={isDark ? '#0F172A' : '#FFFFFF'}
                  />
                </View>
              </ThemedTouchable>
            );

            return (
              <View style={{ alignItems: 'center', marginBottom: 14 }}>
                {activeTab === 'my-requests' ? (
                  <SwipeableRow
                    borderRadius={26}
                    disabled={isDeletingId === item.id}
                    onSwipeLeft={() => handleDeleteRequest(item.id)}
                    onSwipeRight={() => handleDeleteRequest(item.id)}
                    rightLabel="Eliminar"
                    leftLabel="Eliminar"
                    rightIcon="trash-outline"
                    leftIcon="trash-outline"
                    rightActionColor="#DC2626"
                    leftActionColor="#DC2626"
                  >
                    {cardContent}
                  </SwipeableRow>
                ) : (
                  cardContent
                )}
              </View>
            );
          }}
        />
      )}

      <Modal
        visible={isPublishModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsPublishModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: colors.background }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View
            style={{
              flex: 1,
              paddingTop: Math.max(insets.top + 8, 20),
              paddingHorizontal: 22,
              paddingBottom: Math.max(insets.bottom + 16, 24),
              justifyContent: 'space-between',
            }}
          >
            <ScrollView
              style={{ flex: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
            >
              <View className="flex-row items-center justify-between mb-3">
                <Text style={{ fontSize: 18, fontFamily: 'Satoshi-Black', color: colors.textPrimary }}>
                  {t.publishRequestModalTitle}
                </Text>
                <ThemedTouchable onPress={() => setIsPublishModalVisible(false)} haptic="light">
                  <Ionicons name="close-circle" size={26} color={colors.textMuted} />
                </ThemedTouchable>
              </View>

              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-1.5 flex-1 mr-4">
                  {[1, 2, 3].map((s) => (
                    <View
                      key={s}
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: s <= publishStep ? colors.primary : colors.border,
                      }}
                    />
                  ))}
                </View>
                <Text style={{ fontSize: 12.5, fontFamily: 'Satoshi-Bold', color: colors.textSecondary }}>
                  Paso {publishStep} de 3
                </Text>
              </View>

              {publishStep === 1 && (
                <View>
                  <Text style={{ fontSize: 21, fontFamily: 'Satoshi-Black', color: colors.textPrimary, marginBottom: 2 }}>
                    {t.requestCategoryLabel}
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Satoshi-Regular', color: colors.textSecondary, marginBottom: 14 }}>
                    Selecciona el tipo de trabajo que necesitas contratar.
                  </Text>

                  <View className="flex-row flex-wrap gap-2.5">
                    {CATEGORIES_LIST.map((cat) => (
                      <CategoryChip
                        key={cat.id}
                        label={cat.name}
                        isSelected={newCategory === cat.name}
                        onPress={() => setNewCategory(cat.name)}
                      />
                    ))}
                  </View>
                </View>
              )}

              {publishStep === 2 && (
                <View>
                  <Text style={{ fontSize: 21, fontFamily: 'Satoshi-Black', color: colors.textPrimary, marginBottom: 2 }}>
                    Detalles del Trabajo
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Satoshi-Regular', color: colors.textSecondary, marginBottom: 14 }}>
                    Describe qué necesitas reparar, instalar o reformar.
                  </Text>

                  <AuthInput
                    label="Título del trabajo *"
                    leftIcon="create-outline"
                    value={newTitle}
                    onChangeText={setNewTitle}
                    placeholder="Ej. Cambio de cuadro eléctrico y boletín"
                  />

                  <AuthInput
                    label="Descripción detallada *"
                    leftIcon="document-text-outline"
                    value={newDescription}
                    onChangeText={setNewDescription}
                    placeholder="Explica medidas, materiales, estado actual..."
                    multiline
                    numberOfLines={3}
                    style={{ minHeight: 75 }}
                  />
                </View>
              )}

              {publishStep === 3 && (
                <View>
                  <Text style={{ fontSize: 21, fontFamily: 'Satoshi-Black', color: colors.textPrimary, marginBottom: 2 }}>
                    Ubicación y Presupuesto
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Satoshi-Regular', color: colors.textSecondary, marginBottom: 14 }}>
                    Indica dónde se realizará el trabajo. Los profesionales de tu zona te enviarán sus ofertas y presupuestos detallados.
                  </Text>

                  <AuthInput
                    label="Presupuesto orientativo (€) - Opcional"
                    leftIcon="cash-outline"
                    value={newBudget}
                    onChangeText={setNewBudget}
                    placeholder="Opcional (a convenir con el profesional)"
                    keyboardType="numeric"
                  />


                  <View className="flex-row gap-2.5">
                    <View className="flex-[1.1]">
                      <AuthInput
                        label="Localidad / Municipio *"
                        leftIcon="location-outline"
                        value={newCity}
                        onChangeText={setNewCity}
                        placeholder="Zaragoza"
                      />
                    </View>
                    <View className="flex-[0.9]">
                      <AuthInput
                        label="Código Postal"
                        leftIcon="mail-unread-outline"
                        value={newPostalCode}
                        onChangeText={setNewPostalCode}
                        placeholder="50001"
                        keyboardType="numeric"
                        maxLength={5}
                      />
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: colors.borderSubtle,
              }}
            >
              {publishStep > 1 && (
                <View style={{ width: 100 }}>
                  <ThemedTouchable
                    onPress={() => setPublishStep((prev) => prev - 1)}
                    haptic="light"
                    style={{
                      height: 50,
                      borderRadius: 999,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14.5, fontFamily: 'Satoshi-Bold', color: colors.textPrimary }}>
                      {t.back}
                    </Text>
                  </ThemedTouchable>
                </View>
              )}

              <View className="flex-1">
                <ThemedTouchable
                  onPress={handleNextPublishStep}
                  disabled={isSubmitting}
                  haptic="medium"
                  style={{
                    height: 50,
                    borderRadius: 999,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: 'Satoshi-Bold' }}>
                      {publishStep === 3 ? t.publishBtn : t.next}
                    </Text>
                  )}
                </ThemedTouchable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}


export default RequestsTemplate;
