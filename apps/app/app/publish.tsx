import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { AuthInput } from '@/components/auth/AuthInput';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { CATEGORIES_LIST } from '@/constants/categories';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUserRole } from '@/hooks/useUserRole';
import { leadsApi } from '@/services/leadsApi';
import { gigsApi } from '@/services/gigsApi';
import { getAccessToken, setAccessToken } from '@/services/apiClient';
import { authService } from '@/services/authService';
import { toast } from '@/store/useToastStore';

interface ServiceTier {
  tier: 'BASIC' | 'STANDARD' | 'PREMIUM';
  name: string;
  price: string;
  deliveryDays: string;
  revisions: number;
  description: string;
  features: string[];
  isPopular?: boolean;
}

const DEFAULT_TIERS: Record<'BASIC' | 'STANDARD' | 'PREMIUM', ServiceTier> = {
  BASIC: {
    tier: 'BASIC',
    name: 'Básico',
    price: '195',
    deliveryDays: '2',
    revisions: 1,
    description: 'Diagnóstico inicial y mano de obra esencial para reparaciones o trabajos puntuales.',
    features: [
      'Mano de obra especializada y desplazamiento local',
      'Diagnóstico técnico y evaluación in situ',
      'Presupuesto cerrado sin costes ocultos',
      'Garantía Escrow estándar Yewi',
    ],
    isPopular: false,
  },
  STANDARD: {
    tier: 'STANDARD',
    name: 'Completo',
    price: '300',
    deliveryDays: '4',
    revisions: 2,
    description: 'Servicio integral con mano de obra cualificada, materiales estándar y acabados profesionales.',
    features: [
      'Todo lo incluido en el plan Básico',
      'Materiales de primera calidad incluidos',
      'Desescombro y limpieza básica de la zona',
      'Soporte prioritario Yewi',
      'Garantía Escrow ampliada a 6 meses',
    ],
    isPopular: true,
  },
  PREMIUM: {
    tier: 'PREMIUM',
    name: 'Premium VIP',
    price: '480',
    deliveryDays: '7',
    revisions: 99,
    description: 'Solución llave en mano con máxima prioridad de calendario, acabados de lujo y garantía extendida.',
    features: [
      'Todo lo incluido en el plan Completo',
      'Prioridad absoluta en agenda inmediata',
      'Materiales de gama alta con catálogo exclusivo',
      'Revisiones ilimitadas durante la obra',
      'Garantía Escrow ampliada a 12 meses',
    ],
    isPopular: false,
  },
};

export default function PublishScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();
  const { user, isAuthenticated, isProfessional } = useUserRole();
  const params = useLocalSearchParams<{ type?: string; editId?: string }>();

  // Determinación estricta del modo según el rol:
  // - Profesionales: ÚNICAMENTE pueden publicar servicios / ofertas con precio cerrado ('service')
  // - Clientes: ÚNICAMENTE pueden publicar solicitudes de trabajo / presupuestos ('request')
  const mode: 'request' | 'service' = isProfessional ? 'service' : 'request';

  // Si un profesional intenta acceder con parámetro request, avisar y bloquear
  useEffect(() => {
    if (isProfessional && params.type === 'request') {
      toast.warning(
        'Exclusivo Clientes',
        'Las solicitudes de trabajo son exclusivas para clientes. Como profesional publica tus servicios.'
      );
    }
  }, [isProfessional, params.type]);

  // Stepper state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingGig, setIsLoadingGig] = useState(false);

  // Common Form Fields
  const [selectedCategory, setSelectedCategory] = useState<string>('Electricidad');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [city, setNewCity] = useState<string>(user?.city || 'Zaragoza');
  const [postalCode, setNewPostalCode] = useState<string>(user?.postalCode || '50001');

  // Request-specific fields (Client)
  const [budget, setBudget] = useState<string>('');

  // Service-specific Multi-Tier Packages (Professional Gig matching Image 2)
  const [packages, setPackages] = useState<Record<'BASIC' | 'STANDARD' | 'PREMIUM', ServiceTier>>(DEFAULT_TIERS);
  const [selectedTierKey, setSelectedTierKey] = useState<'BASIC' | 'STANDARD' | 'PREMIUM'>('STANDARD');

  // Load existing gig for editing if editId is provided
  useEffect(() => {
    if (params.editId) {
      setIsLoadingGig(true);
      gigsApi
        .getById(params.editId)
        .then((gig) => {
          if (gig) {
            setTitle(gig.title || '');
            setDescription(gig.description || '');
            if (gig.category?.name) {
              setSelectedCategory(gig.category.name);
            }
            if (gig.packages && gig.packages.length > 0) {
              const updatedTiers = { ...DEFAULT_TIERS };
              gig.packages.forEach((pkg) => {
                const tierKey = pkg.tier as 'BASIC' | 'STANDARD' | 'PREMIUM';
                if (updatedTiers[tierKey]) {
                  updatedTiers[tierKey] = {
                    ...updatedTiers[tierKey],
                    name: pkg.name || updatedTiers[tierKey].name,
                    price: String(pkg.price || updatedTiers[tierKey].price),
                    deliveryDays: String(pkg.deliveryDays || updatedTiers[tierKey].deliveryDays),
                    revisions: pkg.revisions || updatedTiers[tierKey].revisions,
                    description: pkg.description || updatedTiers[tierKey].description,
                    features: Array.isArray(pkg.features)
                      ? (pkg.features as string[])
                      : updatedTiers[tierKey].features,
                    isPopular: pkg.isPopular,
                  };
                }
              });
              setPackages(updatedTiers);
            }
          }
        })
        .catch(() => {
          toast.error('Error al Cargar', 'No se pudo cargar la información del servicio.');
        })
        .finally(() => {
          setIsLoadingGig(false);
        });
    }
  }, [params.editId]);

  const activeTier = packages[selectedTierKey];
  const activePriceNum = parseFloat(activeTier.price) || 0;
  const activePlatformFee = activePriceNum * 0.15;
  const activeNetEarnings = activePriceNum * 0.85;

  const handleNextStep = () => {
    if (!isAuthenticated) {
      toast.warning('Autenticación Requerida', 'Debes iniciar sesión para publicar.');
      router.replace('/auth/login');
      return;
    }

    if (step === 1) {
      if (mode === 'service' && !title.trim()) {
        toast.warning('Título Obligatorio', 'Introduce un título para tu servicio.');
        return;
      }
      setStep(2);
      Haptics.selectionAsync().catch(() => {});
      return;
    }

    if (step === 2) {
      if (mode === 'request') {
        if (!title.trim()) {
          toast.warning('Título Obligatorio', 'Introduce qué necesitas reparar o realizar.');
          return;
        }
        if (!description.trim() || description.trim().length < 10) {
          toast.warning('Descripción Detallada', 'Explica lo que necesitas (mínimo 10 caracteres).');
          return;
        }
      } else {
        // Validar que los 3 paquetes tengan precio y plazo válidos
        for (const key of ['BASIC', 'STANDARD', 'PREMIUM'] as const) {
          const p = packages[key];
          const pr = parseFloat(p.price);
          const dy = parseInt(p.deliveryDays, 10);
          if (!p.price.trim() || isNaN(pr) || pr <= 0) {
            toast.warning('Precio Inválido', `Introduce un precio válido para el plan ${p.name}.`);
            setSelectedTierKey(key);
            return;
          }
          if (!p.deliveryDays.trim() || isNaN(dy) || dy <= 0) {
            toast.warning('Plazo Inválido', `Introduce un plazo de entrega en días para el plan ${p.name}.`);
            setSelectedTierKey(key);
            return;
          }
        }
      }
      setStep(3);
      Haptics.selectionAsync().catch(() => {});
      return;
    }

    if (step === 3) {
      if (mode === 'request') {
        if (!city.trim()) {
          toast.warning('Localidad Obligatoria', 'Indica el municipio de la solicitud.');
          return;
        }
        handleSubmitRequest();
      } else {
        if (!description.trim() || description.trim().length < 15) {
          toast.warning('Descripción Detallada', 'Describe qué incluye el servicio (mínimo 15 caracteres).');
          return;
        }
        handleSubmitService();
      }
    }
  };

  const handleSubmitRequest = async () => {
    if (isProfessional) {
      toast.error('Acceso Denegado', 'Los profesionales no pueden crear solicitudes de trabajo.');
      return;
    }
    try {
      setIsSubmitting(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      await leadsApi.createRequest({
        categoryId: selectedCategory,
        category: selectedCategory,
        title: title.trim(),
        description: description.trim(),
        budgetEstimated: budget ? parseFloat(budget) : undefined,
        budgetMax: budget ? parseFloat(budget) : undefined,
        city: city.trim() || user?.city || 'Zaragoza',
        postalCode: postalCode.trim() || user?.postalCode || '50001',
      });

      toast.success(
        '¡Solicitud Publicada!',
        'Los profesionales verificados de tu zona te enviarán sus presupuestos con custodia Escrow.'
      );

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/requests');
      }
    } catch (e: any) {
      toast.error('Error al Publicar', e.message || 'No se pudo publicar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitService = async () => {
    if (!isProfessional) {
      toast.error('Acceso Denegado', 'Solo los profesionales pueden ofrecer servicios con precio cerrado.');
      return;
    }
    try {
      setIsSubmitting(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      let currentToken = await getAccessToken();
      if (!currentToken && user?.email) {
        try {
          const authRes = await authService.loginWithGoogle({
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || (user as any).displayName || 'Profesional',
            avatarUrl: user.avatarUrl || undefined,
          });
          if (authRes?.accessToken) {
            await setAccessToken(authRes.accessToken);
            currentToken = authRes.accessToken;
          }
        } catch {}
      }

      const standardPrice = parseFloat(packages.STANDARD.price) || 300;
      const standardDays = parseInt(packages.STANDARD.deliveryDays, 10) || 4;

      const packagesPayload = [
        {
          tier: 'BASIC',
          name: packages.BASIC.name,
          description: packages.BASIC.description,
          price: parseFloat(packages.BASIC.price) || 195,
          deliveryDays: parseInt(packages.BASIC.deliveryDays, 10) || 2,
          revisions: packages.BASIC.revisions,
          features: packages.BASIC.features,
          isPopular: false,
        },
        {
          tier: 'STANDARD',
          name: packages.STANDARD.name,
          description: packages.STANDARD.description,
          price: standardPrice,
          deliveryDays: standardDays,
          revisions: packages.STANDARD.revisions,
          features: packages.STANDARD.features,
          isPopular: true,
        },
        {
          tier: 'PREMIUM',
          name: packages.PREMIUM.name,
          description: packages.PREMIUM.description,
          price: parseFloat(packages.PREMIUM.price) || 480,
          deliveryDays: parseInt(packages.PREMIUM.deliveryDays, 10) || 7,
          revisions: packages.PREMIUM.revisions,
          features: packages.PREMIUM.features,
          isPopular: false,
        },
      ];

      if (params.editId) {
        await gigsApi.update(params.editId, {
          title: title.trim(),
          category: selectedCategory,
          price: standardPrice,
          deliveryDays: standardDays,
          description: description.trim(),
          city: city.trim() || user?.city || 'Zaragoza',
          packages: packagesPayload,
        });

        toast.success(
          '¡Servicio Actualizado!',
          'Los cambios en tu servicio se han guardado con éxito.'
        );
      } else {
        await gigsApi.create({
          title: title.trim(),
          category: selectedCategory,
          // Omitir categoryId como string para evitar error de clave foránea UUID en Postgres
          price: standardPrice,
          deliveryDays: standardDays,
          description: description.trim(),
          city: city.trim() || user?.city || 'Zaragoza',
          packages: packagesPayload,
        });

        toast.success(
          '¡Servicio Publicado!',
          'Tu servicio ya está disponible con precio cerrado y custodia Escrow 100% garantizada.'
        );
      }

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/requests');
      }
    } catch (e: any) {
      toast.error('Error al Publicar', e.message || 'No se pudo publicar el servicio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/requests');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* 1. TOP APP BAR */}
      <View
        style={{
          paddingTop: Math.max(insets.top + 8, 20),
          paddingBottom: 12,
          paddingHorizontal: 18,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <ThemedTouchable
          onPress={step > 1 ? () => setStep((prev) => (prev - 1) as any) : handleClose}
          haptic="light"
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.borderSubtle,
          }}
        >
          <Ionicons
            name={step > 1 ? 'chevron-back' : 'close'}
            size={24}
            color={colors.textPrimary}
          />
        </ThemedTouchable>

        <Text
          style={{
            fontSize: 16.5,
            fontFamily: 'PlusJakartaSans-ExtraBold',
            color: colors.textPrimary,
            letterSpacing: -0.3,
          }}
        >
          {mode === 'request' ? 'Nueva Solicitud' : (params.editId ? 'Editar Servicio' : 'Nuevo Servicio')}
        </Text>

        <ThemedTouchable
          onPress={handleClose}
          haptic="light"
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}
        >
          <Text style={{ fontSize: 13.5, fontFamily: 'PlusJakartaSans-Bold', color: colors.textMuted }}>
            Cancelar
          </Text>
        </ThemedTouchable>
      </View>

      {/* 2. PROGRESS BAR */}
      <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                backgroundColor: s <= step ? colors.primary : colors.borderSubtle,
              }}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans-Bold', color: colors.textSecondary }}>
            Paso {step} de 3
          </Text>
          <Text style={{ fontSize: 11.5, fontFamily: 'PlusJakartaSans-Medium', color: colors.textMuted }}>
            {mode === 'request' ? 'Cliente' : 'Profesional'}
          </Text>
        </View>
      </View>

      {/* 3. SCROLLABLE FORM BODY OR LOADER */}
      {isLoadingGig ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={{
              marginTop: 16,
              fontSize: 14,
              fontFamily: 'PlusJakartaSans-Medium',
              color: colors.textSecondary,
            }}
          >
            Cargando servicio...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom + 90, 110),
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* STEP 1: CATEGORY (BOTH) + TITLE (FOR SERVICE) */}
        {step === 1 && (
          <View>
            <Text style={{ fontSize: 22, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.textPrimary, marginBottom: 4 }}>
              {mode === 'request' ? '¿Qué trabajo necesitas?' : 'Título y Categoría del Servicio'}
            </Text>
            <Text style={{ fontSize: 13.5, fontFamily: 'PlusJakartaSans-Regular', color: colors.textSecondary, marginBottom: 16 }}>
              {mode === 'request'
                ? 'Selecciona el oficio o especialidad para que los profesionales reciban tu encargo.'
                : 'Define el oficio y el nombre del servicio que ofrecerás con precio cerrado.'}
            </Text>

            {mode === 'service' && (
              <AuthInput
                label="Nombre del Servicio *"
                placeholder="Ej: Cambio de plato de ducha en 24h"
                value={title}
                onChangeText={setTitle}
                leftIcon="construct-outline"
                containerStyle={{ marginBottom: 16 }}
              />
            )}

            <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-Bold', color: colors.textSecondary, marginBottom: 10 }}>
              Oficio o Categoría *
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES_LIST.map((cat) => (
                <CategoryChip
                  key={cat.id}
                  label={cat.name}
                  isSelected={selectedCategory === cat.name}
                  onPress={() => {
                    setSelectedCategory(cat.name);
                    Haptics.selectionAsync().catch(() => {});
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {/* STEP 2: WORK DETAILS (REQUEST) OR PRICING & DELIVERY (SERVICE) */}
        {step === 2 && (
          <View>
            {mode === 'request' ? (
              <>
                <Text style={{ fontSize: 22, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.textPrimary, marginBottom: 4 }}>
                  Detalles del Trabajo
                </Text>
                <Text style={{ fontSize: 13.5, fontFamily: 'PlusJakartaSans-Regular', color: colors.textSecondary, marginBottom: 16 }}>
                  Cuanto más específico seas, más exactos y ajustados serán los presupuestos.
                </Text>

                <AuthInput
                  label="Título de la Solicitud *"
                  placeholder="Ej: Reparar fuga bajo fregadero cocina"
                  value={title}
                  onChangeText={setTitle}
                  leftIcon="create-outline"
                  containerStyle={{ marginBottom: 14 }}
                />

                <AuthInput
                  label="Descripción detallada *"
                  placeholder="Explica medidas, modelo, materiales si los tienes, accesos, etc."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={5}
                  leftIcon="document-text-outline"
                  containerStyle={{ marginBottom: 16 }}
                />
              </>
            ) : (
              <>
                <Text style={{ fontSize: 22, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.textPrimary, marginBottom: 4 }}>
                  Opciones de contratación
                </Text>
                <Text style={{ fontSize: 13.5, fontFamily: 'PlusJakartaSans-Regular', color: colors.textSecondary, marginBottom: 16 }}>
                  Configura tus 3 paquetes de servicio cerrado (Básico, Completo y Premium VIP) con plazos y garantía Escrow.
                </Text>

                {/* 1. TIER SELECTOR PILL TABS (BÁSICO / COMPLETO / PREMIUM VIP) */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                  {(['BASIC', 'STANDARD', 'PREMIUM'] as const).map((key) => {
                    const pkg = packages[key];
                    const isSelected = selectedTierKey === key;
                    return (
                      <ThemedTouchable
                        key={key}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          setSelectedTierKey(key);
                        }}
                        haptic="selection"
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          paddingHorizontal: 4,
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

                {/* 2. ACTIVE PACKAGE CARD (MATCHING IMAGE 2 EXACTLY) */}
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
                    marginBottom: 16,
                  }}
                >
                  {/* Top Row: Name + Popular Badge + Price */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Text style={{ fontSize: 17, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.textPrimary }}>
                          {activeTier.name}
                        </Text>
                        {activeTier.isPopular && (
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
                        {activeTier.description}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 24, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.primary }}>
                        {activeTier.price} €
                      </Text>
                      <Text style={{ fontSize: 10.5, fontFamily: 'PlusJakartaSans-Medium', color: colors.textMuted, marginTop: 1 }}>
                        IVA incluido
                      </Text>
                    </View>
                  </View>

                  {/* Delivery time + Revisions Row */}
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginTop: 14,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: isDark ? '#27272A' : '#F8FAFC', paddingHorizontal: 9, paddingVertical: 4.5, borderRadius: 8 }}>
                      <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                      <Text style={{ fontSize: 11.5, fontFamily: 'PlusJakartaSans-Bold', color: colors.textSecondary }}>
                        Plazo: {activeTier.deliveryDays} días
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: isDark ? '#27272A' : '#F8FAFC', paddingHorizontal: 9, paddingVertical: 4.5, borderRadius: 8 }}>
                      <Ionicons name="refresh-outline" size={13} color={colors.textSecondary} />
                      <Text style={{ fontSize: 11.5, fontFamily: 'PlusJakartaSans-Bold', color: colors.textSecondary }}>
                        {activeTier.revisions === 99 ? 'Ilimitadas rev.' : `${activeTier.revisions} rev.`}
                      </Text>
                    </View>
                  </View>

                  {/* Feature Checklist */}
                  <View style={{ marginTop: 12, gap: 7 }}>
                    {activeTier.features.map((feat, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                        <Ionicons name="checkmark-circle" size={15} color="#059669" />
                        <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans-Medium', color: colors.textPrimary, flex: 1 }}>
                          {feat}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* 3. QUICK PRICE & DELIVERY ADJUSTMENT FOR SELECTED TIER */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                  <View style={{ flex: 1.2 }}>
                    <AuthInput
                      label={`Precio ${activeTier.name} (€) *`}
                      placeholder="Ej: 300"
                      value={activeTier.price}
                      onChangeText={(val) => {
                        setPackages((prev) => ({
                          ...prev,
                          [selectedTierKey]: { ...prev[selectedTierKey], price: val },
                        }));
                      }}
                      keyboardType="numeric"
                      leftIcon="cash-outline"
                    />
                  </View>
                  <View style={{ flex: 0.8 }}>
                    <AuthInput
                      label="Plazo (Días) *"
                      placeholder="Ej: 4"
                      value={activeTier.deliveryDays}
                      onChangeText={(val) => {
                        setPackages((prev) => ({
                          ...prev,
                          [selectedTierKey]: { ...prev[selectedTierKey], deliveryDays: val },
                        }));
                      }}
                      keyboardType="numeric"
                      leftIcon="time-outline"
                    />
                  </View>
                </View>

                {/* 4. ESCROW BREAKDOWN CARD FOR ACTIVE TIER */}
                {activePriceNum > 0 && (
                  <View
                    style={{
                      backgroundColor: isDark ? '#161922' : '#FFFFFF',
                      borderRadius: 16,
                      padding: 14,
                      marginBottom: 16,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-Regular', color: colors.textSecondary }}>
                        Precio cobrado ({activeTier.name}):
                      </Text>
                      <Text style={{ fontSize: 13.5, fontFamily: 'PlusJakartaSans-Bold', color: colors.textPrimary }}>
                        {activePriceNum.toFixed(2)} €
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-Regular', color: colors.textSecondary }}>
                        Comisión Yewi (15%):
                      </Text>
                      <Text style={{ fontSize: 13.5, fontFamily: 'PlusJakartaSans-Bold', color: colors.textMuted }}>
                        -{activePlatformFee.toFixed(2)} €
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                        <Text style={{ fontSize: 13.5, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.textPrimary }}>
                          Tu Cobro Neto Custodiado:
                        </Text>
                      </View>
                      <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#10B981' }}>
                        {activeNetEarnings.toFixed(2)} €
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* STEP 3: LOCATION & BUDGET (REQUEST) OR COVERAGE & INCLUSIONS (SERVICE) */}
        {step === 3 && (
          <View>
            {mode === 'request' ? (
              <>
                <Text style={{ fontSize: 22, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.textPrimary, marginBottom: 4 }}>
                  Ubicación y Presupuesto
                </Text>
                <Text style={{ fontSize: 13.5, fontFamily: 'PlusJakartaSans-Regular', color: colors.textSecondary, marginBottom: 16 }}>
                  Indica dónde se realizará el trabajo para que acudan profesionales de tu municipio.
                </Text>

                <AuthInput
                  label="Presupuesto Orientativo (€) - Opcional"
                  placeholder="Ej: 150 (o dejar en blanco para convenir)"
                  value={budget}
                  onChangeText={setBudget}
                  keyboardType="numeric"
                  leftIcon="cash-outline"
                  containerStyle={{ marginBottom: 14 }}
                />

                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                  <View style={{ flex: 1.2 }}>
                    <AuthInput
                      label="Municipio / Localidad *"
                      placeholder="Zaragoza"
                      value={city}
                      onChangeText={setNewCity}
                      leftIcon="location-outline"
                    />
                  </View>
                  <View style={{ flex: 0.8 }}>
                    <AuthInput
                      label="Código Postal"
                      placeholder="50001"
                      value={postalCode}
                      onChangeText={setNewPostalCode}
                      keyboardType="numeric"
                      maxLength={5}
                      leftIcon="mail-unread-outline"
                    />
                  </View>
                </View>

                {/* ESCROW GUARANTEE BANNER */}
                <View
                  style={{
                    backgroundColor: isDark ? 'rgba(5, 150, 105, 0.12)' : 'rgba(5, 150, 105, 0.08)',
                    borderRadius: 16,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(5, 150, 105, 0.28)' : 'rgba(5, 150, 105, 0.22)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <Ionicons name="shield-checkmark" size={24} color="#059669" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-Bold', color: isDark ? '#34D399' : '#065F46' }}>
                      Custodia Escrow al 100%
                    </Text>
                    <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans-Medium', color: colors.textSecondary, marginTop: 2 }}>
                      Tu dinero permanece custodiado por Yewi. Solo se libera al profesional cuando confirmes tu satisfacción.
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 22, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.textPrimary, marginBottom: 4 }}>
                  Alcance y Zona de Cobertura
                </Text>
                <Text style={{ fontSize: 13.5, fontFamily: 'PlusJakartaSans-Regular', color: colors.textSecondary, marginBottom: 16 }}>
                  Detalla qué incluye tu servicio, materiales de mano de obra y tu ciudad principal.
                </Text>

                <AuthInput
                  label="Descripción y Qué Incluye *"
                  placeholder="Incluye desplazamiento, diagnóstico, mano de obra hasta 2 horas y factura oficial..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  leftIcon="document-text-outline"
                  containerStyle={{ marginBottom: 14 }}
                />

                <AuthInput
                  label="Ciudad o Municipio de Base *"
                  placeholder="Zaragoza"
                  value={city}
                  onChangeText={setNewCity}
                  leftIcon="location-outline"
                  containerStyle={{ marginBottom: 16 }}
                />
              </>
            )}
          </View>
        )}
      </ScrollView>
      )}

      {/* 4. STICKY BOTTOM ACTION BAR */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.borderSubtle,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom + 12, 20),
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {step > 1 && (
          <ThemedTouchable
            onPress={() => setStep((prev) => (prev - 1) as any)}
            haptic="light"
            style={{
              width: 100,
              height: 50,
              borderRadius: 999,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 14.5, fontFamily: 'PlusJakartaSans-Bold', color: colors.textPrimary }}>
              Atrás
            </Text>
          </ThemedTouchable>
        )}

        <View style={{ flex: 1 }}>
          <ThemedTouchable
            onPress={handleNextStep}
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
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: 'PlusJakartaSans-Bold' }}>
                {step === 3 ? (params.editId ? 'Guardar' : 'Publicar') : 'Continuar'}
              </Text>
            )}
          </ThemedTouchable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
