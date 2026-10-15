import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { CustomAlert } from '@/components/ui/CustomAlert';
import { Badge, Button, Card } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUserRole } from '@/hooks/useUserRole';
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
    bgColor: string;
  }
> = {
  reformas: { icon: 'home-city-outline', accentColor: '#1D4ED8', bgColor: '#DBEAFE' },
  electricidad: { icon: 'lightning-bolt', accentColor: '#B45309', bgColor: '#FEF3C7' },
  fontaneria: { icon: 'water-pump', accentColor: '#4338CA', bgColor: '#E0E7FF' },
  climatizacion: { icon: 'air-conditioner', accentColor: '#0F766E', bgColor: '#CCFBF1' },
  pintura: { icon: 'format-paint', accentColor: '#7E22CE', bgColor: '#F3E8FF' },
  banos: { icon: 'shower', accentColor: '#0284C7', bgColor: '#E0F2FE' },
  cocina: { icon: 'countertop-outline', accentColor: '#EA580C', bgColor: '#FFEDD5' },
  carpinteria: { icon: 'hammer', accentColor: '#A16207', bgColor: '#FEF9C3' },
  cerrajeria: { icon: 'key-variant', accentColor: '#6D28D9', bgColor: '#EDE9FE' },
  limpieza: { icon: 'broom', accentColor: '#047857', bgColor: '#D1FAE5' },
  suelos: { icon: 'grid', accentColor: '#E11D48', bgColor: '#FFE4E6' },
  pladur: { icon: 'apps', accentColor: '#334155', bgColor: '#F1F5F9' },
  general: { icon: 'toolbox-outline', accentColor: '#0284C7', bgColor: '#E0F2FE' },
};

import { getScoopedCardPath } from '@/components/ui/ScoopedCard';

export const getRequestCardCutoutPath = getScoopedCardPath;

const PROPOSAL_CARD_THEMES: Record<
  string,
  {
    iconName: keyof typeof Ionicons.glyphMap;
    cardBgLight: string;
    cardBgDark: string;
    iconColor: string;
    haloColor: string;
    textColor: string;
  }
> = {
  reformas: {
    iconName: 'construct',
    cardBgLight: '#BAE6FD',
    cardBgDark: '#1E3A5F',
    iconColor: '#1D4ED8',
    haloColor: 'rgba(255, 255, 255, 0.65)',
    textColor: '#0F172A',
  },
  electricidad: {
    iconName: 'flash',
    cardBgLight: '#FDE68A',
    cardBgDark: '#451A03',
    iconColor: '#B45309',
    haloColor: 'rgba(255, 255, 255, 0.65)',
    textColor: '#0F172A',
  },
  fontaneria: {
    iconName: 'water',
    cardBgLight: '#C7D2FE',
    cardBgDark: '#312E81',
    iconColor: '#4338CA',
    haloColor: 'rgba(255, 255, 255, 0.65)',
    textColor: '#0F172A',
  },
  climatizacion: {
    iconName: 'snow',
    cardBgLight: '#CCFBF1',
    cardBgDark: '#134E4A',
    iconColor: '#0F766E',
    haloColor: 'rgba(255, 255, 255, 0.65)',
    textColor: '#0F172A',
  },
  pintura: {
    iconName: 'color-palette',
    cardBgLight: '#F3E8FF',
    cardBgDark: '#581C87',
    iconColor: '#7E22CE',
    haloColor: 'rgba(255, 255, 255, 0.65)',
    textColor: '#0F172A',
  },
  banos: {
    iconName: 'water-outline',
    cardBgLight: '#E0F2FE',
    cardBgDark: '#0C4A6E',
    iconColor: '#0284C7',
    haloColor: 'rgba(255, 255, 255, 0.65)',
    textColor: '#0F172A',
  },
  cocina: {
    iconName: 'restaurant',
    cardBgLight: '#FFEDD5',
    cardBgDark: '#7C2D12',
    iconColor: '#EA580C',
    haloColor: 'rgba(255, 255, 255, 0.65)',
    textColor: '#0F172A',
  },
  carpinteria: {
    iconName: 'hammer',
    cardBgLight: '#FEF9C3',
    cardBgDark: '#713F12',
    iconColor: '#A16207',
    haloColor: 'rgba(255, 255, 255, 0.65)',
    textColor: '#0F172A',
  },
  cerrajeria: {
    iconName: 'key',
    cardBgLight: '#EDE9FE',
    cardBgDark: '#4C1D95',
    iconColor: '#6D28D9',
    haloColor: 'rgba(255, 255, 255, 0.65)',
    textColor: '#0F172A',
  },
  limpieza: {
    iconName: 'sparkles',
    cardBgLight: '#D1FAE5',
    cardBgDark: '#064E3B',
    iconColor: '#047857',
    haloColor: 'rgba(255, 255, 255, 0.65)',
    textColor: '#0F172A',
  },
  general: {
    iconName: 'briefcase',
    cardBgLight: '#E2E8F0',
    cardBgDark: '#1E293B',
    iconColor: '#475569',
    haloColor: 'rgba(255, 255, 255, 0.65)',
    textColor: '#0F172A',
  },
};

const SAMPLE_PROPOSALS = [
  {
    id: 'req-1',
    serviceRequestId: 'req-1',
    title: 'Reforma Integral de Cocina con Isla',
    category: 'Reformas',
    client: {
      name: 'Carlos Mendoza',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
      city: 'Zaragoza',
    },
    price: 2800,
    budget: '2.800 €',
    date: '14 Sept 2026',
    status: 'ACCEPTED',
    statusLabel: 'En progreso',
    statusColor: '#0284C7',
    cardBgLight: '#BAE6FD',
    cardBgDark: '#1E3A5F',
    iconName: 'construct' as const,
    iconColor: '#1D4ED8',
    haloColor: 'rgba(255, 255, 255, 0.65)',
    textColor: '#0F172A',
    escrowProtected: true,
  },
  {
    id: 'req-2',
    serviceRequestId: 'req-2',
    title: 'Instalación y Boletín Cuadro REBT',
    category: 'Electricidad',
    client: {
      name: 'Elena Gómez',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      city: 'Zaragoza',
    },
    price: 420,
    budget: '420 €',
    date: '08 Sept 2026',
    status: 'ACCEPTED',
    statusLabel: 'Completada',
    statusColor: '#059669',
    cardBgLight: '#FDE68A',
    cardBgDark: '#451A03',
    iconName: 'flash' as const,
    iconColor: '#B45309',
    haloColor: 'rgba(255, 255, 255, 0.65)',
    textColor: '#0F172A',
    escrowProtected: true,
  },
  {
    id: 'req-3',
    serviceRequestId: 'req-3',
    title: 'Sustitución Grifería Termostática Ducha',
    category: 'Fontanería',
    client: {
      name: 'Marcos Rivas',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
      city: 'Huesca',
    },
    price: 180,
    budget: '180 €',
    date: 'Ayer',
    status: 'PENDING',
    statusLabel: 'Presupuesto',
    statusColor: '#D97706',
    cardBgLight: '#C7D2FE',
    cardBgDark: '#312E81',
    iconName: 'water' as const,
    iconColor: '#4338CA',
    haloColor: 'rgba(255, 255, 255, 0.65)',
    textColor: '#0F172A',
    escrowProtected: false,
  },
];


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


export function RequestsTemplate() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const { colors, t, isDark } = useAppTheme();
  const { user, isAuthenticated, isProfessional } = useUserRole();
  const params = useLocalSearchParams<{ create?: string }>();

  // Synchronous role state derived from useUserRole (Escrow model)
  const [isPro, setIsPro] = useState<boolean>(isProfessional);

  useEffect(() => {
    setIsPro(isProfessional);
  }, [isProfessional]);

  // Tab State: professionals only have 'my-proposals'; clients have 'my-requests' and 'my-proposals'
  const [activeTab, setActiveTab] = useState<'my-requests' | 'my-proposals'>(
    isProfessional ? 'my-proposals' : 'my-requests'
  );
  const [proposalFilter, setProposalFilter] = useState<'ALL' | 'ACCEPTED' | 'PENDING' | 'REJECTED'>('ALL');

  useEffect(() => {
    if (isProfessional && activeTab !== 'my-proposals') {
      setActiveTab('my-proposals');
    }
  }, [isProfessional, activeTab]);

  const [myRequests, setMyRequests] = useState<ServiceRequestItem[]>([]);
  const [myProposals, setMyProposals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (params.create === 'true') {
      if (!isAuthenticated) {
        toast.warning('Autenticación Requerida', 'Debes iniciar sesión para publicar una solicitud.');
        router.replace('/auth/login');
        return;
      }
      router.push({ pathname: '/publish', params: { type: isProfessional ? 'service' : 'request' } });
    }
  }, [params.create, isAuthenticated, isProfessional, router]);

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
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab, user?.id, isAuthenticated]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_MY_REQUESTS)
      .then((cached) => {
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setMyRequests(parsed);
              setIsLoading(false);
            }
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (
      (activeTab === 'my-requests' && myRequests.length === 0) ||
      (activeTab === 'my-proposals' && myProposals.length === 0)
    ) {
      setIsLoading(true);
    }
    loadData();
  }, [loadData, activeTab]);

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




  const filteredProposals = useMemo(() => {
    const proposalsToUse = myProposals.length > 0 ? myProposals : SAMPLE_PROPOSALS;
    if (proposalFilter === 'ALL') return proposalsToUse;
    return proposalsToUse.filter((p) => p.status === proposalFilter);
  }, [myProposals, proposalFilter]);

  const listData =
    activeTab === 'my-requests'
      ? Array.isArray(myRequests)
        ? myRequests
        : []
      : filteredProposals;

  if (!isAuthenticated) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
          padding: 24,
        }}
      >
        <Ionicons name="lock-closed-outline" size={56} color={colors.primary} />
        <Text
          style={{
            fontSize: 20,
            fontFamily: 'PlusJakartaSans-Bold',
            color: colors.textPrimary,
            marginTop: 16,
          }}
        >
          Acceso Restringido
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'PlusJakartaSans-Regular',
            color: colors.textSecondary,
            textAlign: 'center',
            marginTop: 8,
            marginBottom: 24,
          }}
        >
          Inicia sesión para gestionar y publicar solicitudes de servicios y proyectos.
        </Text>
        <Button onPress={() => router.replace('/auth/login')}>
          Iniciar Sesión
        </Button>
      </View>
    );
  }

  const paddingTop = Math.max(insets.top + 10, 24);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header Following Exact Design Convention */}
      <View style={{ backgroundColor: colors.background, paddingHorizontal: 20, paddingTop }}>
        {/* Top Row: Title + Action Button (Servicio for pros, Solicitud for clients) */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 28,
              fontFamily: 'PlusJakartaSans-ExtraBold',
              color: colors.textPrimary,
              letterSpacing: -0.6,
            }}
          >
            Solicitudes
          </Text>

          {isProfessional ? (
            <ThemedTouchable
              onPress={() => router.push({ pathname: '/publish', params: { type: 'service' } })}
              haptic="medium"
              style={{
                backgroundColor: isDark ? '#FFFFFF' : '#09090B',
                borderRadius: 999,
                paddingHorizontal: 16,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="add" size={18} color={isDark ? '#09090B' : '#FFFFFF'} style={{ marginRight: 4 }} />
              <Text style={{ color: isDark ? '#09090B' : '#FFFFFF', fontFamily: 'PlusJakartaSans-Bold', fontSize: 13 }}>
                Servicio
              </Text>
            </ThemedTouchable>
          ) : (
            <ThemedTouchable
              onPress={() => router.push({ pathname: '/publish', params: { type: 'request' } })}
              haptic="medium"
              style={{
                backgroundColor: isDark ? '#FFFFFF' : '#09090B',
                borderRadius: 999,
                paddingHorizontal: 16,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="add" size={18} color={isDark ? '#09090B' : '#FFFFFF'} style={{ marginRight: 4 }} />
              <Text style={{ color: isDark ? '#09090B' : '#FFFFFF', fontFamily: 'PlusJakartaSans-Bold', fontSize: 13 }}>
                Solicitud
              </Text>
            </ThemedTouchable>
          )}
        </View>

        {/* Subtab Bar: Differentiated by Role */}
        <View style={{ borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -20 }}
            contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }}
          >
            {isProfessional ? (
              <ThemedTouchable
                onPress={() => {
                  setActiveTab('my-proposals');
                  Haptics.selectionAsync().catch(() => {});
                }}
                haptic="selection"
                className="pb-3 pt-1 mr-6 relative"
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text
                    style={{
                      fontSize: 15.5,
                      fontFamily: 'PlusJakartaSans-ExtraBold',
                      color: colors.textPrimary,
                    }}
                  >
                    Presupuestos
                  </Text>
                  {((myProposals.length > 0 ? myProposals : SAMPLE_PROPOSALS).filter((p) => p.status === 'ACCEPTED').length > 0) && (
                    <View
                      style={{
                        backgroundColor: '#10B981',
                        borderRadius: 10,
                        paddingHorizontal: 6,
                        paddingVertical: 1,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#FFFFFF' }}>
                        {(myProposals.length > 0 ? myProposals : SAMPLE_PROPOSALS).filter((p) => p.status === 'ACCEPTED').length}
                      </Text>
                    </View>
                  )}
                </View>
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
              </ThemedTouchable>
            ) : (
              <>
                {/* Client Tab 1: Mis Solicitudes */}
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
                      fontFamily: activeTab === 'my-requests' ? 'PlusJakartaSans-ExtraBold' : 'PlusJakartaSans-Bold',
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

                {/* Client Tab 2: Presupuestos */}
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
                        fontFamily: activeTab === 'my-proposals' ? 'PlusJakartaSans-ExtraBold' : 'PlusJakartaSans-Bold',
                        color: activeTab === 'my-proposals' ? colors.textPrimary : colors.textMuted,
                      }}
                    >
                      Presupuestos
                    </Text>
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
              </>
            )}
          </ScrollView>
        </View>

        {/* Filter Pills when in 'my-proposals' (Bleeds edge-to-edge without padding clipping) */}
        {activeTab === 'my-proposals' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -20 }}
            contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6 }}
          >
            {(() => {
              const currentProposals = myProposals.length > 0 ? myProposals : SAMPLE_PROPOSALS;
              return [
                { id: 'ALL', label: `Todos (${currentProposals.length})` },
                { id: 'ACCEPTED', label: `Aceptados (${currentProposals.filter((p) => p.status === 'ACCEPTED').length})` },
                { id: 'PENDING', label: `Pendientes (${currentProposals.filter((p) => p.status === 'PENDING').length})` },
                { id: 'REJECTED', label: `Rechazados (${currentProposals.filter((p) => p.status === 'REJECTED').length})` },
              ].map((f) => {
                const isSelected = proposalFilter === f.id;
                const bg = isSelected ? (isDark ? '#FFFFFF' : '#09090B') : (isDark ? '#1E293B' : '#F4F4F5');
                const border = isSelected ? (isDark ? '#FFFFFF' : '#09090B') : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#E4E4E7');
                const textColor = isSelected ? (isDark ? '#09090B' : '#FFFFFF') : (isDark ? '#94A3B8' : '#52525B');

              return (
                <ThemedTouchable
                  key={f.id}
                  onPress={() => {
                    setProposalFilter(f.id as any);
                    Haptics.selectionAsync().catch(() => {});
                  }}
                  haptic="selection"
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                  style={{
                    minHeight: 36,
                    paddingHorizontal: 15,
                    paddingVertical: 7,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: bg,
                    borderWidth: 1,
                    borderColor: border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12.5,
                      fontFamily: isSelected ? 'PlusJakartaSans-Bold' : 'PlusJakartaSans-Medium',
                      color: textColor,
                      letterSpacing: -0.2,
                    }}
                  >
                    {f.label}
                  </Text>
                </ThemedTouchable>
              );
            });
          })()}
          </ScrollView>
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
          ListHeaderComponent={null}

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
                      : 'pricetags-outline'
                  }
                  size={38}
                  color={colors.primary}
                />
              </View>
              <Text style={{ fontSize: 18, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.textPrimary, marginBottom: 8, textAlign: 'center' }}>
                {activeTab === 'my-requests'
                  ? t.noRequestsTitle
                  : 'No hay presupuestos'}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'PlusJakartaSans-Regular',
                  color: colors.textSecondary,
                  textAlign: 'center',
                  marginBottom: 20,
                  maxWidth: 300,
                  lineHeight: 20,
                }}
              >
                {activeTab === 'my-requests'
                  ? t.noRequestsDesc
                  : 'Cuando envíes o recibas propuestas para proyectos, aparecerán aquí para su seguimiento y chat privado.'}
              </Text>
              {activeTab === 'my-requests' && !isProfessional && (
                <Button
                  title="Nueva Solicitud"
                  variant="primary"
                  size="md"
                  iconLeft="add"
                  onPress={() => router.push({ pathname: '/publish', params: { type: 'request' } })}
                />
              )}
            </View>
          )}
          renderItem={({ item }) => {
            if (activeTab === 'my-proposals') {
              const prop = item;
              const isAccepted = prop.status === 'ACCEPTED';
              const isRejected = prop.status === 'REJECTED';
              const reqTitle = prop.title || prop.serviceRequest?.title || 'Solicitud de servicio';
              const reqCity = prop.client?.city || prop.serviceRequest?.city || 'Zaragoza';
              const catName = prop.category || prop.serviceRequest?.category?.name || 'General';
              const catSlug = getCategorySlug(catName);
              const fallbackTheme = PROPOSAL_CARD_THEMES[catSlug] || PROPOSAL_CARD_THEMES.general;

              const cardBgLight = prop.cardBgLight || fallbackTheme.cardBgLight;
              const cardBgDark = prop.cardBgDark || fallbackTheme.cardBgDark;
              const iconName = prop.iconName || fallbackTheme.iconName;
              const iconColor = prop.iconColor || fallbackTheme.iconColor;
              const haloColor = prop.haloColor || fallbackTheme.haloColor;
              const textColor = prop.textColor || fallbackTheme.textColor;

              const statusLabel = prop.statusLabel || (isAccepted ? 'Aceptado' : isRejected ? 'Rechazado' : 'Pendiente');
              const statusColor = prop.statusColor || (isAccepted ? '#059669' : isRejected ? '#E11D48' : '#D97706');

              const clientName = prop.client?.name || prop.serviceRequest?.client?.name || 'Cliente';
              const clientAvatar = prop.client?.avatar || prop.clientAvatar || prop.serviceRequest?.client?.avatar;
              const priceDisplay = prop.budget || (prop.price ? `${prop.price} €` : 'A convenir');
              const dateDisplay = prop.date || (prop.createdAt ? new Date(prop.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Hoy');
              const escrowProtected = prop.escrowProtected !== undefined ? prop.escrowProtected : true;

              const REQUEST_CARD_HEIGHT = 185;
              const itemCardWidth = Math.min(SCREEN_WIDTH - 36, 500);

              return (
                <ThemedTouchable
                  key={prop.id}
                  onPress={() => {
                    if (isAccepted && (prop.order?.id || prop.conversationId)) {
                      router.push({
                        pathname: '/chat',
                        params: {
                          orderId: prop.order?.id,
                          requestId: prop.serviceRequestId || prop.id,
                          conversationId: prop.conversationId || '',
                          targetName: clientName,
                        },
                      });
                    } else {
                      router.push({
                        pathname: '/request-detail',
                        params: { id: prop.serviceRequestId || prop.id },
                      });
                    }
                  }}
                  haptic="light"
                  activeOpacity={0.92}
                  style={{
                    width: itemCardWidth,
                    height: REQUEST_CARD_HEIGHT,
                    marginBottom: 16,
                    position: 'relative',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.08,
                    shadowRadius: 10,
                    elevation: 3,
                    alignSelf: 'center',
                  }}
                >
                  {/* Scooped Cutout Background Shape */}
                  <Svg
                    width={itemCardWidth}
                    height={REQUEST_CARD_HEIGHT}
                    viewBox={`0 0 ${itemCardWidth} ${REQUEST_CARD_HEIGHT}`}
                    style={StyleSheet.absoluteFill}
                  >
                    <Path
                      d={getRequestCardCutoutPath(itemCardWidth, REQUEST_CARD_HEIGHT)}
                      fill={isDark ? '#1C1E26' : cardBgLight}
                      stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'}
                      strokeWidth="1"
                    />
                  </Svg>

                  {/* Top Area: Category Icon in Halo + Date + Elevated Status Badge */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingTop: 16,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 21,
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.85)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1,
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.95)',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.04,
                          shadowRadius: 2,
                        }}
                      >
                        <Ionicons name={iconName as any} size={20} color={iconColor} />
                      </View>
                      <View>
                        <Text style={{ fontSize: 13.5, fontFamily: 'PlusJakartaSans-Bold', color: isDark ? '#FFFFFF' : textColor }}>
                          {catName}
                        </Text>
                        <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans-Medium', color: isDark ? '#94A3B8' : '#475569', marginTop: 1 }}>
                          {dateDisplay} · {reqCity}
                        </Text>
                      </View>
                    </View>

                    {/* Elevated Status Pill Badge */}
                    <View
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 5,
                        borderRadius: 999,
                        backgroundColor: isDark ? '#27272A' : '#FFFFFF',
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans-ExtraBold', color: statusColor }}>
                        {statusLabel}
                      </Text>
                    </View>
                  </View>

                  {/* Title */}
                  <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: 15.5,
                        fontFamily: 'PlusJakartaSans-ExtraBold',
                        color: isDark ? '#FFFFFF' : textColor,
                        lineHeight: 21,
                      }}
                    >
                      {reqTitle}
                    </Text>
                  </View>

                  {/* Bottom Row inside the Cutout & Docked: */}
                  {/* 1. Client Avatar nestled inside Cutout Hole */}
                  <View
                    style={{
                      position: 'absolute',
                      left: 8,
                      bottom: 8,
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: isDark ? '#27272A' : '#FFFFFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      borderWidth: 2,
                      borderColor: isDark ? '#27272A' : '#FFFFFF',
                      shadowColor: '#000000',
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.16,
                      shadowRadius: 4,
                      elevation: 4,
                      zIndex: 10,
                    }}
                  >
                    {clientAvatar ? (
                      <Image
                        source={{ uri: clientAvatar }}
                        style={{ width: 44, height: 44 }}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans-ExtraBold', color: iconColor }}>
                        {clientName.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>

                  {/* 2. Client Name docked into adjacent Pill */}
                  <View
                    style={{
                      position: 'absolute',
                      left: 58,
                      bottom: 8,
                      height: 44,
                      maxWidth: itemCardWidth - 58 - 120,
                      borderRadius: 22,
                      backgroundColor: isDark ? '#27272A' : '#FFFFFF',
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                      justifyContent: 'center',
                      paddingHorizontal: 16,
                      zIndex: 10,
                      shadowColor: '#000000',
                      shadowOpacity: 0.08,
                      shadowRadius: 5,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 3,
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 13,
                        fontFamily: 'PlusJakartaSans-Bold',
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        letterSpacing: -0.2,
                      }}
                    >
                      {clientName}
                    </Text>
                  </View>

                  {/* 3. Budget Pill on the Right */}
                  <View
                    style={{
                      position: 'absolute',
                      right: 10,
                      bottom: 8,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: isDark ? '#27272A' : '#FFFFFF',
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 14,
                      gap: 6,
                      zIndex: 10,
                      shadowColor: '#000000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    {escrowProtected && (
                      <Ionicons name="shield-checkmark" size={14} color="#059669" />
                    )}
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 12.5,
                        fontFamily: 'PlusJakartaSans-ExtraBold',
                        color: '#059669',
                      }}
                    >
                      {priceDisplay}
                    </Text>
                  </View>
                </ThemedTouchable>
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
              : `${item.proposals?.length || 0}`;

            const countLabel = item.budgetMax || item.budgetEstimated
              ? 'presupuesto'
              : 'presupuestos';

            const cardContent = (
              <ThemedTouchable
                key={item.id}
                onPress={() => router.push({ pathname: '/request-detail', params: { id: item.id } })}
                haptic="light"
                activeOpacity={0.92}
                style={{
                  width: cardWidth,
                  backgroundColor: colors.surface,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  padding: 18,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.2 : 0.04,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                {/* Top Row: Category icon & name + City & Badge */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : (theme.bgColor || '#F1F5F9'),
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialCommunityIcons
                        name={theme.icon}
                        size={17}
                        color={theme.accentColor}
                      />
                    </View>
                    <Text style={{ fontSize: 12.5, fontFamily: 'PlusJakartaSans-Bold', color: colors.textSecondary }}>
                      {categoryName} · {item.city || 'Zaragoza'}
                    </Text>
                  </View>

                  <View
                    style={{
                      backgroundColor: isDark ? '#1E2330' : '#F1F5F9',
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: 'PlusJakartaSans-Bold',
                        color: colors.textPrimary,
                      }}
                    >
                      {item.proposals?.length ? `${item.proposals.length} ofertas` : 'Nueva'}
                    </Text>
                  </View>
                </View>

                {/* Title */}
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 17,
                    fontFamily: 'PlusJakartaSans-ExtraBold',
                    color: colors.textPrimary,
                    letterSpacing: -0.3,
                    marginBottom: 6,
                  }}
                >
                  {item.title || categoryName}
                </Text>

                {/* Description */}
                <Text
                  numberOfLines={2}
                  style={{
                    fontSize: 13,
                    fontFamily: 'PlusJakartaSans-Regular',
                    color: colors.textSecondary,
                    lineHeight: 19,
                    marginBottom: 14,
                  }}
                >
                  {item.description || 'Sin descripción adicional disponible para esta solicitud.'}
                </Text>

                {/* Bottom Row: Budget / Price + Action */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                    <Text
                      style={{
                        fontSize: 20,
                        fontFamily: 'PlusJakartaSans-ExtraBold',
                        color: colors.textPrimary,
                      }}
                    >
                      {budgetDisplay}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11.5,
                        fontFamily: 'PlusJakartaSans-Medium',
                        color: colors.textMuted,
                      }}
                    >
                      {countLabel}
                    </Text>
                  </View>

                  {isProfessional ? (
                    <ThemedTouchable
                      onPress={() => router.push({ pathname: '/request-detail', params: { id: item.id } })}
                      haptic="medium"
                      style={{
                        backgroundColor: isDark ? '#FFFFFF' : '#09090B',
                        borderRadius: 999,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Ionicons name="flash" size={13} color={isDark ? '#09090B' : '#FFFFFF'} />
                      <Text style={{ color: isDark ? '#09090B' : '#FFFFFF', fontFamily: 'PlusJakartaSans-Bold', fontSize: 12.5 }}>
                        Presupuestar
                      </Text>
                    </ThemedTouchable>
                  ) : (
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        backgroundColor: isDark ? '#1E2330' : '#F1F5F9',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: colors.borderSubtle,
                      }}
                    >
                      <Ionicons name="chevron-forward" size={15} color={colors.textPrimary} />
                    </View>
                  )}
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
