import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { CustomAlert } from '@/components/ui/CustomAlert';
import { useAppTheme } from '@/hooks/useAppTheme';
import { paymentsApi, SubscriptionStatusResponse } from '@/services/paymentsApi';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';

const PRO_BENEFITS = [
  {
    icon: 'flash-outline' as const,
    title: 'Acceso Prioritario Inmediato',
    desc: 'Recibe todas las nuevas solicitudes de clientes de tu zona al instante antes que nadie.',
  },
  {
    icon: 'call-outline' as const,
    title: 'Contacto Directo con Clientes',
    desc: 'Accede al número de teléfono, WhatsApp y email del cliente sin gastar créditos ni esperas.',
  },
  {
    icon: 'wallet-outline' as const,
    title: '0% Comisiones por Trabajo',
    desc: 'Todo lo que presupuestas y cobras es 100% tuyo. Sin intermediarios ni deducciones.',
  },
  {
    icon: 'globe-outline' as const,
    title: 'Cobertura Nacional Sin Límites',
    desc: 'Recibe oportunidades de trabajo en cualquier municipio o provincia de España.',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Insignia Yewi Pro Destacada',
    desc: 'Tu perfil mostrará la insignia dorada de verificación para transmitir máxima confianza.',
  },
];

export function SubscriptionTemplate() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const updateUser = useAuthStore((state) => state.updateUser);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [subData, setSubData] = useState<SubscriptionStatusResponse | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ visible: true, title, message });
  };

  const fetchStatus = useCallback(async () => {
    try {
      const data = await paymentsApi.getSubscriptionStatus();
      setSubData(data);
      if (data.isPro) {
        updateUser({ isPro: true });
      }
    } catch (e) {
      console.warn('Error fetching subscription status:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [updateUser]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await fetchStatus();
  };

  const handleSubscribe = async () => {
    try {
      setProcessing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      const res = await paymentsApi.createSubscriptionCheckout();
      const checkoutUrl = res?.url || (res as any)?.data?.url;

      if (!checkoutUrl) {
        throw new Error('No se pudo generar la sesión de pago.');
      }

      await WebBrowser.openBrowserAsync(checkoutUrl);
      await fetchStatus();
    } catch (e: any) {
      toast.error('Error de pago', e.message || 'No se pudo iniciar el proceso de suscripción.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelAutoRenew = () => {
    const periodEnd = subData?.subscription?.currentPeriodEnd
      ? new Date(subData.subscription.currentPeriodEnd).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : 'fin del ciclo';

    showAlert(
      'Cancelar renovación',
      `¿Deseas cancelar la renovación de Yewi Pro? Seguirás disfrutando de todas las ventajas Pro hasta el ${periodEnd} sin nuevos cobros.`
    );

    Alert.alert(
      'Cancelar renovación automática',
      `¿Deseas desactivar la renovación automática de Yewi Pro?\n\nSeguirás con acceso prioritario ilimitado hasta el ${periodEnd} sin cobros adicionales.`,
      [
        { text: 'Mantener plan', style: 'cancel' },
        {
          text: 'Desactivar renovación',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(true);
              await paymentsApi.cancelSubscriptionAutoRenew();
              await fetchStatus();
              toast.info('Renovación cancelada', `Tu plan finalizará el ${periodEnd}.`);
            } catch (e: any) {
              toast.error('Error', e.message || 'No se pudo cancelar la renovación.');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleResumeAutoRenew = async () => {
    try {
      setProcessing(true);
      await paymentsApi.resumeSubscriptionAutoRenew();
      await fetchStatus();
      toast.success('¡Plan reactivado!', 'La renovación automática ha sido activada.');
    } catch (e: any) {
      toast.error('Error', e.message || 'No se pudo reactivar la suscripción.');
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenInvoices = async () => {
    try {
      setProcessing(true);
      const { url } = await paymentsApi.createCustomerPortalSession();
      if (!url) throw new Error('No se pudo abrir el portal de facturación.');
      await WebBrowser.openBrowserAsync(url);
      await fetchStatus();
    } catch (e: any) {
      toast.error('Error', e.message || 'No se pudo abrir el historial de facturas.');
    } finally {
      setProcessing(false);
    }
  };

  const isPro = subData?.isPro === true;
  const isCancelled = Boolean(subData?.subscription?.cancelAtPeriodEnd);
  const renewalDate = subData?.subscription?.currentPeriodEnd
    ? new Date(subData.subscription.currentPeriodEnd).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const paymentCard = subData?.paymentMethod
    ? `${subData.paymentMethod.brand?.toUpperCase() || 'TARJETA'} •••• ${subData.paymentMethod.last4 || '••••'}`
    : 'Stripe Direct';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Top Bar Header */}
      <View
        style={{
          paddingTop: Math.max(insets.top + 8, 20),
          paddingBottom: 14,
          paddingHorizontal: 18,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
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
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </ThemedTouchable>

        <Text
          style={{
            fontSize: 17,
            fontFamily: 'Satoshi-Black',
            color: colors.textPrimary,
          }}
        >
          Suscripción Yewi Pro
        </Text>

        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, fontFamily: 'Satoshi-Medium', color: colors.textSecondary }}>
            Cargando estado de la suscripción...
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: Math.max(insets.bottom + 40, 60),
            gap: 20,
          }}
        >
          {isPro ? (
            /* ACTIVE PRO MANAGEMENT DASHBOARD */
            <View style={{ gap: 20 }}>
              {/* Active Plan Card */}
              <View
                style={{
                  backgroundColor: isDark ? '#1C1D24' : '#FFF9F2',
                  borderRadius: 24,
                  padding: 22,
                  borderWidth: 1.5,
                  borderColor: isDark ? '#F59E0B60' : '#FED7AA',
                  shadowColor: isDark ? '#000' : '#EA580C',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 10,
                  elevation: 4,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="shield-checkmark" size={20} color="#F59E0B" />
                    <Text style={{ fontSize: 18, fontFamily: 'Satoshi-Black', color: colors.textPrimary }}>
                      Yewi Pro Autónomos
                    </Text>
                  </View>

                  <View
                    style={{
                      backgroundColor: isCancelled ? '#FEE2E2' : isDark ? '#78350F50' : '#FEF3C7',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: isCancelled ? '#EF4444' : '#F59E0B',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: 'Satoshi-Black',
                        color: isCancelled ? '#DC2626' : isDark ? '#FDE047' : '#B45309',
                      }}
                    >
                      {isCancelled ? 'CANCELADA' : 'ACTIVA'}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 }}>
                  <Text style={{ fontSize: 32, fontFamily: 'Satoshi-Black', color: isDark ? '#FDE047' : '#C2410C' }}>
                    9,99 €
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Satoshi-Medium', color: colors.textSecondary, marginLeft: 6 }}>
                    / mes (IVA incluido)
                  </Text>
                </View>

                <View style={{ borderTopWidth: 1, borderTopColor: isDark ? '#2E2F3A' : '#FED7AA60', paddingTop: 14, gap: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, fontFamily: 'Satoshi-Medium', color: colors.textSecondary }}>
                      {isCancelled ? 'Válida hasta:' : 'Próxima renovación:'}
                    </Text>
                    <Text style={{ fontSize: 13.5, fontFamily: 'Satoshi-Bold', color: colors.textPrimary }}>
                      {renewalDate || 'Ciclo activo'}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, fontFamily: 'Satoshi-Medium', color: colors.textSecondary }}>
                      Método de pago:
                    </Text>
                    <Text style={{ fontSize: 13.5, fontFamily: 'Satoshi-Bold', color: colors.textPrimary }}>
                      {paymentCard}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ gap: 10 }}>
                {isCancelled ? (
                  <ThemedTouchable
                    onPress={handleResumeAutoRenew}
                    disabled={processing}
                    haptic="medium"
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: 999,
                      paddingVertical: 15,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {processing ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: 'Satoshi-Bold' }}>
                        Reanudar Renovación Automática
                      </Text>
                    )}
                  </ThemedTouchable>
                ) : (
                  <ThemedTouchable
                    onPress={handleCancelAutoRenew}
                    disabled={processing}
                    haptic="medium"
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 999,
                      paddingVertical: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{ color: colors.danger, fontSize: 14.5, fontFamily: 'Satoshi-Bold' }}>
                      Cancelar renovación automática
                    </Text>
                  </ThemedTouchable>
                )}

                <ThemedTouchable
                  onPress={handleOpenInvoices}
                  disabled={processing}
                  haptic="light"
                  style={{
                    backgroundColor: colors.surfaceAlt,
                    borderRadius: 999,
                    paddingVertical: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 6,
                  }}
                >
                  <Ionicons name="document-text-outline" size={17} color={colors.textPrimary} />
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontFamily: 'Satoshi-Bold' }}>
                    Descargar Facturas con IVA (PDF)
                  </Text>
                </ThemedTouchable>
              </View>

              {/* Benefits Section */}
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 17, fontFamily: 'Satoshi-Black', color: colors.textPrimary, marginBottom: 14 }}>
                  Ventajas Activas en tu Cuenta
                </Text>

                <View style={{ gap: 12 }}>
                  {PRO_BENEFITS.map((b, i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        backgroundColor: colors.surface,
                        padding: 16,
                        borderRadius: 18,
                        borderWidth: 1,
                        borderColor: colors.borderSubtle,
                        gap: 14,
                      }}
                    >
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 19,
                          backgroundColor: isDark ? '#78350F40' : '#FEF3C7',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name={b.icon} size={20} color={isDark ? '#FDE047' : '#D97706'} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14.5, fontFamily: 'Satoshi-Bold', color: colors.textPrimary }}>
                          {b.title}
                        </Text>
                        <Text style={{ fontSize: 12.5, fontFamily: 'Satoshi-Regular', color: colors.textSecondary, marginTop: 2, lineHeight: 18 }}>
                          {b.desc}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            /* NON-SUBSCRIBER UPSELL PRESENTATION */
            <View style={{ gap: 24 }}>
              {/* Hero Ticket */}
              <View
                style={{
                  backgroundColor: isDark ? '#1C1D24' : '#FFF9F2',
                  borderRadius: 24,
                  padding: 24,
                  borderWidth: 1.5,
                  borderColor: isDark ? '#F59E0B60' : '#FED7AA',
                  shadowColor: isDark ? '#000' : '#EA580C',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 10,
                  elevation: 4,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 20, fontFamily: 'Satoshi-Black', color: colors.textPrimary }}>
                    Plan Yewi Pro
                  </Text>
                  <View
                    style={{
                      backgroundColor: '#FEF3C7',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: '#F59E0B',
                    }}
                  >
                    <Text style={{ fontSize: 11, fontFamily: 'Satoshi-Black', color: '#B45309' }}>
                      RECOMENDADO
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 }}>
                  <Text style={{ fontSize: 36, fontFamily: 'Satoshi-Black', color: isDark ? '#FDE047' : '#C2410C' }}>
                    9,99 €
                  </Text>
                  <Text style={{ fontSize: 13.5, fontFamily: 'Satoshi-Medium', color: colors.textSecondary, marginLeft: 6 }}>
                    / mes (IVA incluido)
                  </Text>
                </View>

                <Text style={{ fontSize: 13.5, fontFamily: 'Satoshi-Regular', color: colors.textSecondary, lineHeight: 20, marginBottom: 20 }}>
                  Consigue clientes directamente en tu ciudad, envía presupuestos ilimitados y multiplica tus ingresos sin pagar comisiones.
                </Text>

                <ThemedTouchable
                  onPress={handleSubscribe}
                  disabled={processing}
                  haptic="medium"
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 999,
                    paddingVertical: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {processing ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: 'Satoshi-Bold' }}>
                      Activar Yewi Pro Ahora
                    </Text>
                  )}
                </ThemedTouchable>

                <Text style={{ fontSize: 11.5, fontFamily: 'Satoshi-Medium', color: colors.textMuted, textAlign: 'center', marginTop: 10 }}>
                  Sin permanencia · Cancela cuando quieras en 1 toque
                </Text>
              </View>

              {/* Detailed Benefits */}
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 17, fontFamily: 'Satoshi-Black', color: colors.textPrimary, marginBottom: 4 }}>
                  Todo lo que incluye Yewi Pro
                </Text>

                {PRO_BENEFITS.map((b, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      backgroundColor: colors.surface,
                      padding: 16,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                      gap: 14,
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: isDark ? '#78350F40' : '#FEF3C7',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name={b.icon} size={20} color={isDark ? '#FDE047' : '#D97706'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14.5, fontFamily: 'Satoshi-Bold', color: colors.textPrimary }}>
                        {b.title}
                      </Text>
                      <Text style={{ fontSize: 12.5, fontFamily: 'Satoshi-Regular', color: colors.textSecondary, marginTop: 2, lineHeight: 18 }}>
                        {b.desc}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
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

export default SubscriptionTemplate;
