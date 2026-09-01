import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Rect,
  Line,
  Defs,
  Pattern,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { CustomAlert } from '@/components/ui/CustomAlert';
import { useAppTheme } from '@/hooks/useAppTheme';
import { paymentsApi, SubscriptionStatusResponse } from '@/services/paymentsApi';
import { useAuthStore } from '@/store/useAuthStore';


interface YewiProModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscriptionUpdated?: () => void;
}

const PRO_FEATURES = [
  'Prioridad máxima en nuevas solicitudes',
  'Contacto directo del cliente (teléfono y email)',
  'Sin comisiones por trabajos ni presupuestos',
  'Cobertura nacional sin límites en tu país',
  'Insignia Verificada Pro destacada en búsquedas',
  'Alertas instantáneas de nuevos leads',
];

export function YewiProModal({
  visible,
  onClose,
  onSubscriptionUpdated,
}: YewiProModalProps) {
  const insets = useSafeAreaInsets();
  const { t } = useAppTheme();
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const updateUser = useAuthStore((state) => state.updateUser);

  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [subData, setSubData] = useState<SubscriptionStatusResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ visible: true, title, message });
  };

  const fetchStatus = async () => {
    try {
      setLoadingStatus(true);
      const data = await paymentsApi.getSubscriptionStatus();
      setSubData(data);
      if (data.isPro) {
        updateUser({ isPro: true });
      }
    } catch (e) {
      console.warn('Error fetching subscription status:', e);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchStatus();
    }
  }, [visible]);

  const handleSubscribe = async () => {
    try {
      setIsProcessing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      const res = await paymentsApi.createSubscriptionCheckout();
      const checkoutUrl = res?.url || (res as any)?.data?.url;

      if (!checkoutUrl) {
        throw new Error('No se pudo generar la sesión de pago.');
      }

      await WebBrowser.openBrowserAsync(checkoutUrl);

      await fetchStatus();
      onSubscriptionUpdated?.();
    } catch (e: any) {
      showAlert(t.paymentErrorTitle, e.message || 'No se pudo iniciar el proceso de suscripción.');
    } finally {
      setIsProcessing(false);
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

    Alert.alert(
      'Cancelar renovación automática',
      `¿Deseas cancelar la renovación de Yewi Pro?\n\nSeguirás disfrutando de todas las ventajas y acceso prioritario hasta el ${periodEnd} sin cobros adicionales.`,
      [
        { text: 'Mantener plan', style: 'cancel' },
        {
          text: 'Desactivar renovación',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsProcessing(true);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
              await paymentsApi.cancelSubscriptionAutoRenew();
              await fetchStatus();
              onSubscriptionUpdated?.();
              showAlert('Renovación cancelada', `Tu plan no se renovará automáticamente y finalizará el ${periodEnd}.`);
            } catch (e: any) {
              showAlert('Error', e.message || 'No se pudo cancelar la renovación.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleResumeAutoRenew = async () => {
    try {
      setIsProcessing(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      await paymentsApi.resumeSubscriptionAutoRenew();
      await fetchStatus();
      onSubscriptionUpdated?.();
      showAlert('¡Plan reactivado!', 'La renovación automática de Yewi Pro ha sido reactivada.');
    } catch (e: any) {
      showAlert('Error', e.message || 'No se pudo reactivar la suscripción.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenInvoices = async () => {
    try {
      setIsProcessing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

      const { url } = await paymentsApi.createCustomerPortalSession();
      if (!url) {
        throw new Error('No se pudo abrir el portal de facturación.');
      }

      await WebBrowser.openBrowserAsync(url);
      await fetchStatus();
      onSubscriptionUpdated?.();
    } catch (e: any) {
      showAlert('Error', e.message || 'No se pudo abrir el historial de facturas.');
    } finally {
      setIsProcessing(false);
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

  const isCompact = SCREEN_HEIGHT < 750;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.modalRoot,
          {
            paddingTop: Math.max(insets.top + 8, 20),
            paddingBottom: Math.max(insets.bottom + 8, 20),
          },
        ]}
      >
        {/* TOP BAR: Back Button & Header Title */}
        <View style={styles.topBar}>
          <ThemedTouchable
            onPress={onClose}
            haptic="light"
            style={styles.closeButton}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </ThemedTouchable>
          <Text style={{ fontSize: 17, fontFamily: 'Satoshi-Bold', color: '#FFFFFF', marginLeft: 12 }}>
            {isPro ? 'Gestión de Plan Yewi Pro' : 'Planes y Suscripción'}
          </Text>
        </View>

        {loadingStatus ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#FDE047" />
            <Text style={{ marginTop: 12, color: '#E2E8F0', fontFamily: 'Satoshi-Medium' }}>
              {t.loading}
            </Text>
          </View>
        ) : isPro ? (
          /* =========================================================================
             VISTA 1: PANEL IN-APP DE GESTIÓN DE PLAN PRO (NATIVO, SIN SALIR A STRIPE)
             ========================================================================= */
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20, gap: 14 }}
          >
            {/* Card 1: Resumen de Suscripción Activa */}
            <View style={[styles.pricingCard, { padding: 20 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <View>
                  <Text style={{ fontSize: 20, fontFamily: 'Satoshi-Black', color: '#FFFFFF' }}>
                    Yewi Pro
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Satoshi-Medium', color: '#FDE047', marginTop: 2 }}>
                    Facturación mensual · 9,99 € / mes
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: isCancelled ? '#EF444425' : '#10B98125',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: isCancelled ? '#EF4444' : '#10B981',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: 'Satoshi-Black',
                      color: isCancelled ? '#F87171' : '#34D399',
                    }}
                  >
                    {isCancelled ? 'CANCELADA' : 'ACTIVA'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Info de fechas y renovación */}
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons
                    name={isCancelled ? 'time-outline' : 'calendar-outline'}
                    size={17}
                    color="#FDE047"
                    style={{ marginRight: 10 }}
                  />
                  <Text style={{ fontSize: 13, fontFamily: 'Satoshi-Medium', color: 'rgba(255,255,255,0.9)', flex: 1 }}>
                    {isCancelled
                      ? `Finaliza el periodo: ${renewalDate || 'Fin de mes'}`
                      : `Próxima renovación automática: ${renewalDate || 'Mensual'}`}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="card-outline" size={17} color="#FDE047" style={{ marginRight: 10 }} />
                  <Text style={{ fontSize: 13, fontFamily: 'Satoshi-Medium', color: 'rgba(255,255,255,0.9)', flex: 1 }}>
                    Método de pago: {paymentCard}
                  </Text>
                </View>
              </View>
            </View>

            {/* Card 2: Ventajas Activas */}
            <View style={{ backgroundColor: '#232226', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
              <Text style={{ fontSize: 15, fontFamily: 'Satoshi-Bold', color: '#FFFFFF', marginBottom: 12 }}>
                Tus ventajas Pro activas
              </Text>
              <View style={{ gap: 10 }}>
                {PRO_FEATURES.map((feat, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.checkIconWrapper}>
                      <Ionicons name="checkmark" size={11} color="#000000" />
                    </View>
                    <Text style={{ fontSize: 13, fontFamily: 'Satoshi-Regular', color: '#E4E4E7', flex: 1 }}>
                      {feat}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Card 3: Acciones In-App */}
            <View style={{ gap: 10, marginTop: 4 }}>
              {isCancelled ? (
                <ThemedTouchable
                  onPress={handleResumeAutoRenew}
                  disabled={isProcessing}
                  haptic="medium"
                  style={styles.whiteCtaButton}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#18181B" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="refresh-outline" size={18} color="#18181B" />
                      <Text style={styles.whiteCtaText}>Reanudar Renovación Automática</Text>
                    </View>
                  )}
                </ThemedTouchable>
              ) : (
                <ThemedTouchable
                  onPress={handleCancelAutoRenew}
                  disabled={isProcessing}
                  haptic="light"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    borderWidth: 1,
                    borderColor: 'rgba(239, 68, 68, 0.35)',
                    borderRadius: 999,
                    paddingVertical: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#F87171" />
                  ) : (
                    <Text style={{ fontSize: 14, fontFamily: 'Satoshi-Bold', color: '#F87171' }}>
                      Cancelar Renovación Automática
                    </Text>
                  )}
                </ThemedTouchable>
              )}

              {/* Botón secundario para facturas PDF */}
              <ThemedTouchable
                onPress={handleOpenInvoices}
                disabled={isProcessing}
                haptic="light"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  borderRadius: 999,
                  paddingVertical: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 6,
                }}
              >
                <Ionicons name="receipt-outline" size={16} color="rgba(255,255,255,0.7)" />
                <Text style={{ fontSize: 13, fontFamily: 'Satoshi-Medium', color: 'rgba(255,255,255,0.8)' }}>
                  Descargar Facturas con IVA (PDF)
                </Text>
              </ThemedTouchable>
            </View>
          </ScrollView>
        ) : (
          /* =========================================================================
             VISTA 2: PROSPECTO DE SUSCRIPCIÓN PARA USUARIOS NO PRO
             ========================================================================= */
          <View style={{ flex: 1, justifyContent: 'space-between' }}>
            <View>
              {/* TITLE HEADER */}
              <View style={{ marginBottom: isCompact ? 10 : 16 }}>
                <Text style={styles.mainTitle}>{t.pricingTitle}</Text>
              </View>

              {/* THE TALENT PRO STYLE CARD */}
              <View style={[styles.pricingCard, { padding: isCompact ? 18 : 22 }]}>
                {/* Top-Right Yellow Tab with Diagonal Hatch Pattern */}
                <View style={styles.topRightYellowTab}>
                  <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                    <Defs>
                      <Pattern id="stripesPattern" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                        <Line x1="0" y1="0" x2="0" y2="6" stroke="#CA8A04" strokeWidth="1.2" />
                      </Pattern>
                    </Defs>
                    <Rect width="100%" height="100%" fill="url(#stripesPattern)" opacity={0.35} />
                  </Svg>

                  <Text style={styles.tabText}>{t.planProBadge}</Text>
                </View>

                {/* Top Row: Plan Name */}
                <View style={{ height: 32, justifyContent: 'center', marginBottom: 6, paddingRight: 96 }}>
                  <Text numberOfLines={1} style={styles.planName}>
                    {t.yewiProTitle}
                  </Text>
                </View>

                {/* Price Row: Real 9,99 € Monthly Price */}
                <View className="flex-row items-baseline mb-1">
                  <Text style={styles.mainPrice}>{t.proPriceMonthly}</Text>
                  <View style={{ marginLeft: 6 }}>
                    <Text style={styles.priceSubtext}>{t.proPerMonth}</Text>
                    <Text style={styles.priceBilledText}>{t.proBilledMonthly}</Text>
                  </View>
                </View>

                {/* Pitch Text */}
                <Text style={[styles.pitchText, { marginBottom: isCompact ? 12 : 16 }]}>
                  {t.proPitch}
                </Text>

                {/* Subtle Divider */}
                <View style={styles.divider} />

                {/* Feature Checklist */}
                <View style={{ gap: isCompact ? 8 : 10, marginBottom: isCompact ? 18 : 22 }}>
                  {PRO_FEATURES.map((feat, index) => (
                    <View key={index} className="flex-row items-center">
                      <View style={styles.checkIconWrapper}>
                        <Ionicons name="checkmark" size={12} color="#000000" />
                      </View>
                      <Text numberOfLines={1} style={styles.featureText}>
                        {feat}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* CTA Button */}
                <ThemedTouchable
                  onPress={handleSubscribe}
                  disabled={isProcessing}
                  haptic="medium"
                  activeOpacity={0.88}
                  style={styles.whiteCtaButton}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#18181B" />
                  ) : (
                    <Text style={styles.whiteCtaText}>{t.subscribeBtn}</Text>
                  )}
                </ThemedTouchable>
              </View>
            </View>

            {/* Footer Note */}
            <Text style={styles.footerNote}>
              {t.cancelAnytimeNote}
            </Text>
          </View>
        )}
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttonText={t.accept}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: '#353230',
    paddingHorizontal: 18,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTitle: {
    fontSize: 27,
    fontFamily: 'Satoshi-Black',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  pricingCard: {
    width: '100%',
    backgroundColor: '#18181B',
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: '#FDE047',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#FDE047',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  topRightYellowTab: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FDE047',
    borderTopRightRadius: 21,
    borderBottomLeftRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 5,
  },
  tabText: {
    color: '#18181B',
    fontSize: 11.5,
    fontFamily: 'Satoshi-Black',
    letterSpacing: 0.2,
    zIndex: 6,
  },
  planName: {
    fontSize: 20,
    fontFamily: 'Satoshi-Black',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  mainPrice: {
    fontSize: 36,
    fontFamily: 'Satoshi-Black',
    color: '#FDE047',
    letterSpacing: -1,
  },
  priceSubtext: {
    fontSize: 12,
    fontFamily: 'Satoshi-Bold',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  priceBilledText: {
    fontSize: 10.5,
    fontFamily: 'Satoshi-Medium',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  pitchText: {
    fontSize: 12.5,
    fontFamily: 'Satoshi-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 17,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 14,
  },
  checkIconWrapper: {
    width: 19,
    height: 19,
    borderRadius: 9.5,
    backgroundColor: '#FDE047',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  featureText: {
    fontSize: 13,
    fontFamily: 'Satoshi-Medium',
    color: '#FFFFFF',
    flex: 1,
  },
  whiteCtaButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  whiteCtaText: {
    fontSize: 15,
    fontFamily: 'Satoshi-Black',
    color: '#18181B',
    letterSpacing: -0.2,
  },
  footerNote: {
    fontSize: 11.5,
    fontFamily: 'Satoshi-Medium',
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    marginTop: 6,
  },
});

export default YewiProModal;

