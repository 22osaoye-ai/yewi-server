import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  RefreshControl,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { ThemedPressed } from '@/components/ui/ThemedPressed';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuthStore } from '@/store/useAuthStore';
import {
  promotionsApi,
  SellerPromotion,
  CreatePromotionPayload,
} from '@/services/promotionsApi';

const CATEGORY_OPTIONS = [
  'Electricidad',
  'Fontanería',
  'Climatización',
  'Reformas',
  'Pintura',
  'Baños',
  'Cocina',
  'Pladur',
  'Manitas',
  'Suelos',
  'Carpintería',
  'Cerrajería',
  'Limpieza',
];

export function VoucherTemplate() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();

  const isProSeller = Boolean(
    user?.roles?.includes('PROFESSIONAL' as any) ||
      user?.isPro ||
      (user as any)?.professionalProfile
  );

  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [promotions, setPromotions] = useState<SellerPromotion[]>([]);
  const [myPromotions, setMyPromotions] = useState<SellerPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State for Seller Creation
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState('20');
  const [promoCode, setPromoCode] = useState('');
  const [durationDays, setDurationDays] = useState(15);
  const [badgeText, setBadgeText] = useState('OFERTA LIMITADA');

  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true);
      const activeList = await promotionsApi.getActivePromotions();
      setPromotions(activeList || []);

      if (isProSeller) {
        const myList = await promotionsApi.getMyPromotions();
        setMyPromotions(myList || []);
      }
    } catch {
      setPromotions([]);
      setMyPromotions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isProSeller]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPromotions();
  };

  const handleOpenCreateModal = () => {
    setTitle('');
    setDescription('');
    setCategory(CATEGORY_OPTIONS[0]);
    setDiscountType('percent');
    setDiscountValue('20');
    setPromoCode('');
    setDurationDays(15);
    setBadgeText('OFERTA LIMITADA');
    setCreateModalVisible(true);
  };

  const handleCreatePromotion = async () => {
    if (!title.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa un título para la promoción');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa una breve descripción');
      return;
    }
    const numericDiscount = parseFloat(discountValue);
    if (isNaN(numericDiscount) || numericDiscount <= 0) {
      Alert.alert('Descuento no válido', 'Ingresa un valor de descuento mayor a 0');
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const payload: CreatePromotionPayload = {
      title: title.trim(),
      description: description.trim(),
      category,
      badge: badgeText.trim() || 'OFERTA LIMITADA',
      promoCode: promoCode.trim() ? promoCode.trim().toUpperCase() : undefined,
      expiresAt: expiresAt.toISOString(),
      ...(discountType === 'percent'
        ? { discountPercent: Math.min(100, Math.round(numericDiscount)) }
        : { discountAmount: numericDiscount }),
    };

    try {
      setCreating(true);
      await promotionsApi.createPromotion(payload);
      setCreateModalVisible(false);
      Alert.alert('¡Promoción publicada!', 'Tu oferta ya está disponible para todos los clientes.');
      fetchPromotions();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo crear la promoción');
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePromotion = (promoId: string) => {
    Alert.alert(
      'Eliminar Promoción',
      '¿Estás seguro de que deseas retirar esta oferta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await promotionsApi.deletePromotion(promoId);
              fetchPromotions();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  };

  const formatRemainingDays = (expiresAtStr: string) => {
    const exp = new Date(expiresAtStr);
    const now = new Date();
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Expira hoy';
    if (diffDays === 1) return 'Queda 1 día';
    return `Quedan ${diffDays} días`;
  };

  const displayedPromos = activeTab === 'my' ? myPromotions : promotions;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Top Navigation Bar */}
      <View
        style={{
          paddingTop: Math.max(insets.top + 6, 20),
          paddingHorizontal: 18,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
        }}
      >
        <ThemedTouchable
          onPress={() => router.back()}
          haptic="light"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </ThemedTouchable>

        <Text
          style={{
            fontSize: 18,
            fontFamily: 'Satoshi-Black',
            color: colors.textPrimary,
            letterSpacing: -0.3,
          }}
        >
          Cupones & Promociones
        </Text>

        {isProSeller ? (
          <ThemedTouchable
            onPress={handleOpenCreateModal}
            haptic="medium"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.primary,
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 999,
            }}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text
              style={{
                color: '#FFFFFF',
                fontFamily: 'Satoshi-Bold',
                fontSize: 12.5,
                marginLeft: 2,
              }}
            >
              Crear
            </Text>
          </ThemedTouchable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Tabs for Sellers */}
      {isProSeller && (
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderSubtle,
            gap: 10,
          }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab('all')}
            style={{
              flex: 1,
              paddingVertical: 8,
              alignItems: 'center',
              borderRadius: 12,
              backgroundColor: activeTab === 'all' ? colors.primary : colors.surfaceAlt,
            }}
          >
            <Text
              style={{
                fontFamily: 'Satoshi-Bold',
                fontSize: 13,
                color: activeTab === 'all' ? '#FFFFFF' : colors.textSecondary,
              }}
            >
              Todas las Ofertas ({promotions.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('my')}
            style={{
              flex: 1,
              paddingVertical: 8,
              alignItems: 'center',
              borderRadius: 12,
              backgroundColor: activeTab === 'my' ? colors.primary : colors.surfaceAlt,
            }}
          >
            <Text
              style={{
                fontFamily: 'Satoshi-Bold',
                fontSize: 13,
                color: activeTab === 'my' ? '#FFFFFF' : colors.textSecondary,
              }}
            >
              Mis Promociones ({myPromotions.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 60 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator color={colors.primary} size="large" />
            <Text
              style={{
                fontSize: 13.5,
                fontFamily: 'Satoshi-Medium',
                color: colors.textSecondary,
                marginTop: 12,
              }}
            >
              Cargando promociones vigentes...
            </Text>
          </View>
        ) : displayedPromos.length > 0 ? (
          <View>
            <Text
              style={{
                fontSize: 19,
                fontFamily: 'Satoshi-Black',
                color: colors.textPrimary,
                letterSpacing: -0.4,
                marginBottom: 4,
              }}
            >
              {activeTab === 'my'
                ? 'Tus Promociones Activas'
                : 'Descuentos por Tiempo Limitado'}
            </Text>
            <Text
              style={{
                fontSize: 12.5,
                fontFamily: 'Satoshi-Medium',
                color: colors.textSecondary,
                marginBottom: 16,
              }}
            >
              {activeTab === 'my'
                ? 'Gestiona las ofertas que tienes publicadas para los clientes.'
                : 'Ofertas exclusivas directas de profesionales con disponibilidad.'}
            </Text>

            {displayedPromos.map((promo) => (
              <View
                key={promo.id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 16,
                  marginBottom: 14,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.2 : 0.06,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
                {/* Card Top Row: Badge + Expiry Pill */}
                <View className="flex-row items-center justify-between mb-2">
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: isDark ? 'rgba(234, 179, 8, 0.15)' : '#FEF3C7',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 999,
                    }}
                  >
                    <Ionicons
                      name="sparkles"
                      size={12}
                      color="#D97706"
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={{
                        color: '#D97706',
                        fontSize: 11,
                        fontFamily: 'Satoshi-Bold',
                        textTransform: 'uppercase',
                      }}
                    >
                      {promo.badge || 'OFERTA'}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                      paddingHorizontal: 9,
                      paddingVertical: 3.5,
                      borderRadius: 999,
                    }}
                  >
                    <Ionicons
                      name="time-outline"
                      size={12}
                      color="#DC2626"
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={{
                        color: '#DC2626',
                        fontSize: 11,
                        fontFamily: 'Satoshi-Bold',
                      }}
                    >
                      {formatRemainingDays(promo.expiresAt)}
                    </Text>
                  </View>
                </View>

                {/* Title & Description */}
                <Text
                  style={{
                    fontSize: 17,
                    fontFamily: 'Satoshi-Black',
                    color: colors.textPrimary,
                    marginBottom: 4,
                    letterSpacing: -0.3,
                  }}
                >
                  {promo.title}
                </Text>

                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Satoshi-Regular',
                    color: colors.textSecondary,
                    lineHeight: 18,
                    marginBottom: 12,
                  }}
                >
                  {promo.description}
                </Text>

                {/* Promo Details: Code & Discount */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  {promo.category && (
                    <View
                      style={{
                        backgroundColor: colors.surfaceAlt,
                        paddingHorizontal: 9,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11.5,
                          fontFamily: 'Satoshi-Bold',
                          color: colors.textSecondary,
                        }}
                      >
                        📂 {promo.category}
                      </Text>
                    </View>
                  )}

                  {promo.discountPercent ? (
                    <View
                      style={{
                        backgroundColor: isDark ? '#064E3B' : '#DCFCE7',
                        paddingHorizontal: 9,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11.5,
                          fontFamily: 'Satoshi-Bold',
                          color: '#16A34A',
                        }}
                      >
                        -{promo.discountPercent}% Descuento
                      </Text>
                    </View>
                  ) : promo.discountAmount ? (
                    <View
                      style={{
                        backgroundColor: isDark ? '#064E3B' : '#DCFCE7',
                        paddingHorizontal: 9,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11.5,
                          fontFamily: 'Satoshi-Bold',
                          color: '#16A34A',
                        }}
                      >
                        -{promo.discountAmount}€ Descuento
                      </Text>
                    </View>
                  ) : null}

                  {promo.promoCode && (
                    <View
                      style={{
                        backgroundColor: isDark ? '#312E81' : '#E0E7FF',
                        paddingHorizontal: 9,
                        paddingVertical: 4,
                        borderRadius: 8,
                        borderStyle: 'dashed',
                        borderWidth: 1,
                        borderColor: '#6366F1',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11.5,
                          fontFamily: 'Satoshi-Bold',
                          color: '#4F46E5',
                        }}
                      >
                        CÓDIGO: {promo.promoCode}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Bottom Row: Professional Info or Action Button */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: colors.borderSubtle,
                  }}
                >
                  {promo.professional ? (
                    <ThemedTouchable
                      onPress={() => {
                        router.push({
                          pathname: '/detail',
                          params: { id: promo.professional!.id, entityType: 'professional' },
                        });
                      }}
                      haptic="light"
                      style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}
                    >
                      <View
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          backgroundColor: colors.surfaceAlt,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 8,
                        }}
                      >
                        <Ionicons name="person" size={18} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontFamily: 'Satoshi-Bold',
                            color: colors.textPrimary,
                          }}
                          numberOfLines={1}
                        >
                          {promo.professional.name}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            fontFamily: 'Satoshi-Medium',
                            color: colors.textSecondary,
                          }}
                        >
                          ★ {promo.professional.avgRating?.toFixed(1) || 'Nuevo'} · {promo.professional.city}
                        </Text>
                      </View>
                    </ThemedTouchable>
                  ) : (
                    <View />
                  )}

                  {activeTab === 'my' ? (
                    <ThemedTouchable
                      onPress={() => handleDeletePromotion(promo.id)}
                      haptic="light"
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 7,
                        borderRadius: 999,
                        backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2',
                      }}
                    >
                      <Text
                        style={{
                          color: '#DC2626',
                          fontSize: 12,
                          fontFamily: 'Satoshi-Bold',
                        }}
                      >
                        Retirar Oferta
                      </Text>
                    </ThemedTouchable>
                  ) : promo.professional?.userId === user?.id || (promo.professional?.id && (user as any)?.professionalProfile?.id === promo.professional.id) ? (
                    <ThemedTouchable
                      onPress={() => setActiveTab('my')}
                      haptic="selection"
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 7,
                        borderRadius: 999,
                        backgroundColor: isDark ? '#1E293B' : '#EEF2FF',
                        borderWidth: 1,
                        borderColor: '#6366F1',
                      }}
                    >
                      <Text
                        style={{
                          color: '#4F46E5',
                          fontSize: 12,
                          fontFamily: 'Satoshi-Bold',
                        }}
                      >
                        Tu Oferta (Gestionar)
                      </Text>
                    </ThemedTouchable>
                  ) : (
                    <ThemedPressed
                      onPress={() => {
                        const targetId = promo.professional?.userId || promo.professional?.id;
                        if (targetId) {
                          const discountTxt = promo.discountPercent
                            ? ` (${promo.discountPercent}% dto)`
                            : promo.discountAmount
                            ? ` (${promo.discountAmount}€ dto)`
                            : '';
                          router.push({
                            pathname: '/chat',
                            params: {
                              id: targetId,
                              targetName: promo.professional?.name || promo.title,
                              initialMessage: `¡Hola! He visto tu oferta "${promo.title}"${discountTxt} en Cupones & Promociones de Yewi y me gustaría solicitar presupuesto para aplicarla.`,
                            },
                          });
                        } else {
                          router.push('/(tabs)/requests');
                        }
                      }}
                      haptic="medium"
                      scaleOnPress
                      style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: 16,
                        paddingVertical: 8.5,
                        borderRadius: 999,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          color: '#FFFFFF',
                          fontFamily: 'Satoshi-Bold',
                          fontSize: 12.5,
                          marginRight: 4,
                        }}
                      >
                        Pedir Presupuesto
                      </Text>
                      <Feather name="arrow-right" size={13} color="#FFFFFF" />
                    </ThemedPressed>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          /* Zero Mocks Empty State */
          <View className="items-center justify-center py-16 px-6">
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="pricetag-outline" size={32} color={colors.textMuted} />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontFamily: 'Satoshi-Black',
                color: colors.textPrimary,
                marginBottom: 6,
                textAlign: 'center',
              }}
            >
              {activeTab === 'my'
                ? 'Aún no has creado promociones'
                : 'No hay promociones activas en este momento'}
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'Satoshi-Regular',
                color: colors.textSecondary,
                textAlign: 'center',
                marginBottom: 24,
                lineHeight: 19,
                maxWidth: 290,
              }}
            >
              {activeTab === 'my'
                ? 'Publica descuentos por tiempo limitado para captar más clientes en tus categorías de servicio.'
                : 'Los profesionales verificados publican ofertas por tiempo limitado periódicamente. ¡Publica tu solicitud para recibir presupuestos directos!'}
            </Text>

            {isProSeller ? (
              <ThemedPressed
                onPress={handleOpenCreateModal}
                haptic="medium"
                scaleOnPress
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 22,
                  paddingVertical: 12,
                  borderRadius: 999,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontFamily: 'Satoshi-Bold', fontSize: 13.5 }}>
                  + Crear Primera Promoción
                </Text>
              </ThemedPressed>
            ) : (
              <ThemedPressed
                onPress={() => router.push('/(tabs)/requests')}
                haptic="medium"
                scaleOnPress
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 22,
                  paddingVertical: 12,
                  borderRadius: 999,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontFamily: 'Satoshi-Bold', fontSize: 13.5 }}>
                  + Publicar Solicitud de Presupuesto
                </Text>
              </ThemedPressed>
            )}
          </View>
        )}
      </ScrollView>

      {/* MODAL: SELLER CREATE PROMOTION */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              maxHeight: '90%',
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: Math.max(insets.bottom + 12, 24),
            }}
          >
            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: 'Satoshi-Black',
                  color: colors.textPrimary,
                }}
              >
                Crear Promoción por Tiempo Limitado
              </Text>
              <ThemedTouchable
                onPress={() => setCreateModalVisible(false)}
                haptic="light"
                style={{ padding: 4 }}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </ThemedTouchable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" className="pt-4">
              {/* Promotion Title */}
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Satoshi-Bold',
                  color: colors.textPrimary,
                  marginBottom: 6,
                }}
              >
                Título de la Oferta *
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Ej. 20% Dto en Instalación de Aire Acondicionado"
                placeholderTextColor={colors.textMuted}
                style={{
                  backgroundColor: colors.surfaceAlt,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                  color: colors.textPrimary,
                  fontFamily: 'Satoshi-Medium',
                  fontSize: 14,
                  marginBottom: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />

              {/* Category Selector */}
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Satoshi-Bold',
                  color: colors.textPrimary,
                  marginBottom: 6,
                }}
              >
                Categoría del Servicio
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingBottom: 14 }}
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={{
                      backgroundColor: category === cat ? colors.primary : colors.surfaceAlt,
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: category === cat ? colors.primary : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Satoshi-Bold',
                        fontSize: 12.5,
                        color: category === cat ? '#FFFFFF' : colors.textPrimary,
                      }}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Discount Type & Value */}
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Satoshi-Bold',
                  color: colors.textPrimary,
                  marginBottom: 6,
                }}
              >
                Tipo y Valor del Descuento *
              </Text>
              <View className="flex-row items-center gap-3 mb-3">
                <TouchableOpacity
                  onPress={() => setDiscountType('percent')}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 9,
                    borderRadius: 12,
                    backgroundColor: discountType === 'percent' ? colors.primary : colors.surfaceAlt,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Satoshi-Bold',
                      fontSize: 13,
                      color: discountType === 'percent' ? '#FFFFFF' : colors.textSecondary,
                    }}
                  >
                    Porcentaje (%)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setDiscountType('fixed')}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 9,
                    borderRadius: 12,
                    backgroundColor: discountType === 'fixed' ? colors.primary : colors.surfaceAlt,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Satoshi-Bold',
                      fontSize: 13,
                      color: discountType === 'fixed' ? '#FFFFFF' : colors.textSecondary,
                    }}
                  >
                    Importe Fijo (€)
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                value={discountValue}
                onChangeText={setDiscountValue}
                placeholder={discountType === 'percent' ? 'Ej. 20 (%)' : 'Ej. 30 (€)'}
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={{
                  backgroundColor: colors.surfaceAlt,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                  color: colors.textPrimary,
                  fontFamily: 'Satoshi-Medium',
                  fontSize: 14,
                  marginBottom: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />

              {/* Duration in Days */}
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Satoshi-Bold',
                  color: colors.textPrimary,
                  marginBottom: 6,
                }}
              >
                Duración de la Oferta
              </Text>
              <View className="flex-row gap-2 mb-3">
                {[7, 15, 30, 60].map((days) => (
                  <TouchableOpacity
                    key={days}
                    onPress={() => setDurationDays(days)}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      alignItems: 'center',
                      borderRadius: 10,
                      backgroundColor: durationDays === days ? colors.primary : colors.surfaceAlt,
                      borderWidth: 1,
                      borderColor: durationDays === days ? colors.primary : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Satoshi-Bold',
                        fontSize: 12.5,
                        color: durationDays === days ? '#FFFFFF' : colors.textPrimary,
                      }}
                    >
                      {days} días
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Promo Code (Optional) */}
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Satoshi-Bold',
                  color: colors.textPrimary,
                  marginBottom: 6,
                }}
              >
                Código Promocional (Opcional)
              </Text>
              <TextInput
                value={promoCode}
                onChangeText={setPromoCode}
                placeholder="Ej. VERANO20"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                style={{
                  backgroundColor: colors.surfaceAlt,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                  color: colors.textPrimary,
                  fontFamily: 'Satoshi-Medium',
                  fontSize: 14,
                  marginBottom: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />

              {/* Description */}
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Satoshi-Bold',
                  color: colors.textPrimary,
                  marginBottom: 6,
                }}
              >
                Descripción del Servicio *
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe qué incluye este descuento o condiciones..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: colors.surfaceAlt,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                  color: colors.textPrimary,
                  fontFamily: 'Satoshi-Medium',
                  fontSize: 14,
                  marginBottom: 20,
                  minHeight: 70,
                  textAlignVertical: 'top',
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />

              {/* Submit Button */}
              <ThemedPressed
                onPress={handleCreatePromotion}
                disabled={creating}
                haptic="medium"
                scaleOnPress
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                  borderRadius: 999,
                  alignItems: 'center',
                  marginBottom: 20,
                }}
              >
                {creating ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontFamily: 'Satoshi-Bold',
                      fontSize: 15,
                    }}
                  >
                    Publicar Promoción
                  </Text>
                )}
              </ThemedPressed>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

export default VoucherTemplate;
