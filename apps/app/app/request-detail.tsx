import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { CustomAlert } from '@/components/ui/CustomAlert';
import { AuthInput } from '@/components/auth/AuthInput';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuthStore } from '@/store/useAuthStore';
import { leadsApi, ServiceRequestItem } from '@/services/leadsApi';
import { paymentsApi } from '@/services/paymentsApi';
import { toast } from '@/store/useToastStore';


export default function RequestDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const isProfessional = user?.roles?.includes('PROFESSIONAL');

  const [request, setRequest] = useState<ServiceRequestItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Proposal modal & actions
  const [showSendProposalModal, setShowSendProposalModal] = useState<boolean>(false);
  const [proposalPrice, setProposalPrice] = useState<string>('');
  const [proposalDays, setProposalDays] = useState<string>('3');

  const [proposalDesc, setProposalDesc] = useState<string>('');
  const [isSendingProposal, setIsSendingProposal] = useState<boolean>(false);
  const [isCheckingPro, setIsCheckingPro] = useState<boolean>(false);
  const [acceptingProposalId, setAcceptingProposalId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ visible: true, title, message });
  };

  const loadDetail = useCallback(async () => {
    if (!id) {
      setError('ID de solicitud no especificado');
      setIsLoading(false);
      return;
    }
    try {
      const data = await leadsApi.getRequestById(id);
      setRequest(data);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'No se pudo cargar la información de la solicitud');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await loadDetail();
  };

  const isOwner = Boolean(user?.id && request?.clientId === user.id);

  const myExistingProposal =
    request?.myProposal ||
    request?.proposals?.find(
      (p: any) =>
        p.professionalProfile?.userId === user?.id ||
        p.professionalProfileId === (user as any)?.professionalProfile?.id ||
        p.professionalProfile?.user?.id === user?.id
    );

  const isRequestInProgress =
    request?.status === 'IN_PROGRESS' ||
    request?.status === 'FULFILLED' ||
    Boolean(request?.orders && request.orders.length > 0);

  const handleStartProposal = async () => {
    if (myExistingProposal) {
      toast.info('Presupuesto ya enviado', 'Ya has enviado un presupuesto para esta solicitud.');
      return;
    }
    if (isRequestInProgress) {
      toast.warning('Solicitud no disponible', 'Esta solicitud ya tiene un trabajo en curso.');
      return;
    }
    try {
      setIsCheckingPro(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

      const subStatus = await paymentsApi.getSubscriptionStatus();
      if (!subStatus.isPro) {
        router.push('/subscription');
        return;
      }

      setProposalPrice(request?.budgetEstimated ? String(request.budgetEstimated) : '');
      setProposalDays('3');
      setProposalDesc('');
      setShowSendProposalModal(true);
    } catch {
      router.push('/subscription');
    } finally {
      setIsCheckingPro(false);
    }
  };

  const handleSendProposal = async () => {
    if (!request) return;
    const priceNum = parseFloat(proposalPrice);
    if (!proposalPrice || isNaN(priceNum) || priceNum <= 0) {
      toast.warning('Precio Requerido', 'Indica un precio válido en euros para tu presupuesto.');
      return;
    }
    if (!proposalDesc.trim()) {
      toast.warning('Mensaje Requerido', 'Explica brevemente los detalles y materiales incluidos en tu oferta.');
      return;
    }

    try {
      setIsSendingProposal(true);
      await leadsApi.sendQuoteProposal(request.id, {
        price: priceNum,
        estimatedDays: parseInt(proposalDays, 10) || 3,
        message: proposalDesc.trim(),
      });

      setShowSendProposalModal(false);
      toast.success(
        '¡Presupuesto Enviado!',
        'Tu oferta ha sido enviada al cliente. Te avisaremos cuando la revise.'
      );
      loadDetail();
    } catch (e: any) {
      toast.error('Error al Enviar', e.message || 'No se pudo enviar el presupuesto.');
    } finally {
      setIsSendingProposal(false);
    }
  };

  const handleAcceptProposal = async (proposalId: string) => {
    try {
      setAcceptingProposalId(proposalId);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      const result = await leadsApi.acceptProposal(proposalId);

      toast.success(
        '¡Presupuesto Aceptado!',
        'Se ha formalizado el acuerdo con el profesional. Abriendo chat privado...'
      );
      await loadDetail();

      setTimeout(() => {
        router.push({
          pathname: '/chat',
          params: {
            orderId: result.id,
            conversationId: result.conversationId || '',
            requestId: request?.id,
          },
        });
      }, 500);
    } catch (e: any) {
      toast.error('Error al Aceptar', e.message || 'No se pudo aceptar el presupuesto.');
    } finally {
      setAcceptingProposalId(null);
    }
  };

  const handleDeleteRequest = async () => {
    if (!request) return;
    try {
      setIsDeleting(true);
      await leadsApi.deleteRequest(request.id);
      toast.info('Solicitud eliminada');
      router.back();
    } catch (e: any) {
      toast.error('Error al Eliminar', e.message || 'No se pudo eliminar la solicitud.');
    } finally {
      setIsDeleting(false);
    }
  };


  const categoryName =
    typeof request?.category === 'object'
      ? request?.category?.name || 'General'
      : request?.category || request?.categoryId || 'General';

  const budgetDisplay = request?.budgetMax
    ? `${request.budgetMax} €`
    : request?.budgetEstimated
    ? `${request.budgetEstimated} €`
    : 'Presupuesto a convenir';

  const statusLabel =
    request?.status === 'OPEN'
      ? 'Abierta para presupuestos'
      : request?.status === 'IN_PROGRESS' || request?.status === 'FULFILLED'
      ? 'En progreso'
      : request?.status === 'COMPLETED'
      ? 'Completada'
      : request?.status || 'Activa';

  const statusBg =
    request?.status === 'OPEN'
      ? isDark
        ? '#064E3B'
        : '#D1FAE5'
      : isDark
      ? '#1E293B'
      : '#E2E8F0';

  const statusTextColor =
    request?.status === 'OPEN'
      ? '#10B981'
      : isDark
      ? '#94A3B8'
      : '#475569';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#101216' : '#F8FAFC' }}>
      {/* Top Header Bar */}
      <View
        style={{
          paddingTop: Math.max(insets.top + 8, 20),
          paddingBottom: 14,
          paddingHorizontal: 18,
          backgroundColor: isDark ? '#161922' : '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: isDark ? '#222734' : '#F1F5F9',
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
            backgroundColor: isDark ? '#202532' : '#F1F5F9',
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
            letterSpacing: -0.3,
          }}
        >
          Detalle de Solicitud
        </Text>

        <View style={{ width: 40 }} />
      </View>

      {/* Main Content */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, fontFamily: 'Satoshi-Medium', color: colors.textSecondary }}>
            Cargando solicitud...
          </Text>
        </View>
      ) : error || !request ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={{ marginTop: 12, fontSize: 16, fontFamily: 'Satoshi-Bold', color: colors.textPrimary, textAlign: 'center' }}>
            {error || 'No se encontró la solicitud'}
          </Text>
          <ThemedTouchable
            onPress={() => router.back()}
            style={{
              marginTop: 20,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 999,
              backgroundColor: colors.primary,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontFamily: 'Satoshi-Bold' }}>Volver</Text>
          </ThemedTouchable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
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
            paddingTop: 18,
            paddingBottom: Math.max(insets.bottom + 40, 60),
          }}
        >
          {/* Hero Request Overview Card */}
          <View
            style={{
              backgroundColor: isDark ? '#161922' : '#FFFFFF',
              borderRadius: 24,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: isDark ? '#222734' : '#F1F5F9',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.2 : 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {/* Top Row: Category + Status Badges */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View
                style={{
                  backgroundColor: colors.primaryLight,
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                }}
              >
                <Text style={{ fontSize: 12.5, fontFamily: 'Satoshi-Bold', color: colors.primary }}>
                  {categoryName}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: statusBg,
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ fontSize: 12, fontFamily: 'Satoshi-Bold', color: statusTextColor }}>
                  {statusLabel}
                </Text>
              </View>
            </View>

            {/* Title */}
            <Text
              style={{
                fontSize: 22,
                fontFamily: 'Satoshi-Black',
                color: colors.textPrimary,
                marginBottom: 14,
                letterSpacing: -0.4,
                lineHeight: 28,
              }}
            >
              {request.title || 'Solicitud de Servicio'}
            </Text>

            {/* Info Pills Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isDark ? '#202532' : '#F8FAFC',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  gap: 6,
                  borderWidth: 1,
                  borderColor: isDark ? '#282F40' : '#E2E8F0',
                }}
              >
                <Ionicons name="location-outline" size={16} color={colors.primary} />
                <Text style={{ fontSize: 13, fontFamily: 'Satoshi-Bold', color: colors.textPrimary }}>
                  {request.city || 'Zaragoza'} {request.postalCode ? `(${request.postalCode})` : ''}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isDark ? '#202532' : '#F8FAFC',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  gap: 6,
                  borderWidth: 1,
                  borderColor: isDark ? '#282F40' : '#E2E8F0',
                }}
              >
                <Ionicons name="cash-outline" size={16} color={colors.primary} />
                <Text style={{ fontSize: 13, fontFamily: 'Satoshi-Bold', color: colors.primary }}>
                  {budgetDisplay}
                </Text>
              </View>

              {request.createdAt && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isDark ? '#202532' : '#F8FAFC',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    gap: 6,
                    borderWidth: 1,
                    borderColor: isDark ? '#282F40' : '#E2E8F0',
                  }}
                >
                  <Ionicons name="calendar-outline" size={15} color={colors.textSecondary} />
                  <Text style={{ fontSize: 12.5, fontFamily: 'Satoshi-Medium', color: colors.textSecondary }}>
                    {new Date(request.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Description Section Card */}
          <View
            style={{
              backgroundColor: isDark ? '#161922' : '#FFFFFF',
              borderRadius: 20,
              padding: 18,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: isDark ? '#222734' : '#F1F5F9',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Satoshi-Black',
                color: colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                marginBottom: 10,
              }}
            >
              Descripción del Trabajo
            </Text>
            <Text
              style={{
                fontSize: 14.5,
                fontFamily: 'Satoshi-Regular',
                color: colors.textPrimary,
                lineHeight: 23,
              }}
            >
              {request.description || 'Sin descripción adicional proporcionada.'}
            </Text>
          </View>

          {/* SECTION: ORDER IN PROGRESS (STATUS + CHAT + CONTACT) */}
          {request.orders && request.orders.length > 0 && (
            <View
              style={{
                backgroundColor: isDark ? '#132338' : '#EFF6FF',
                borderRadius: 20,
                padding: 18,
                marginBottom: 16,
                borderWidth: 1.5,
                borderColor: '#3B82F6',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Ionicons name="checkmark-circle" size={22} color="#2563EB" />
                <Text style={{ fontSize: 16, fontFamily: 'Satoshi-Black', color: isDark ? '#93C5FD' : '#1E40AF' }}>
                  {isOwner ? 'Profesional Asignado (En Curso)' : '¡Trabajo Asignado! (En Curso)'}
                </Text>
              </View>

              <Text style={{ fontSize: 13, fontFamily: 'Satoshi-Regular', color: isDark ? '#BFDBFE' : '#1E3A8A', marginBottom: 14 }}>
                {isOwner
                  ? 'Has aceptado este presupuesto. Podéis coordinar todos los detalles del trabajo a través del chat privado o por llamada.'
                  : 'Este presupuesto ha sido formalizado. Podéis coordinar todos los detalles y el inicio del servicio en el chat privado.'}
              </Text>

              {request.orders.map((ord: any) => {
                const isMyOrder = ord.professionalProfile?.user?.id === user?.id;
                const contactName = isOwner
                  ? ord.professionalProfile?.businessName ||
                    ord.professionalProfile?.user?.profile?.displayName ||
                    'Profesional Yewi'
                  : (request as any).client?.profile?.displayName ||
                    `${(request as any).client?.profile?.firstName ?? ''} ${(request as any).client?.profile?.lastName ?? ''}`.trim() ||
                    'Cliente Yewi';

                const contactPhone = isOwner
                  ? ord.professionalProfile?.user?.profile?.phoneNumber
                  : (request as any).client?.profile?.phoneNumber;

                return (
                  <View
                    key={ord.id}
                    style={{
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: isDark ? '#334155' : '#BFDBFE',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ fontSize: 15.5, fontFamily: 'Satoshi-Bold', color: colors.textPrimary }}>
                        {contactName}
                      </Text>
                      <Text style={{ fontSize: 18, fontFamily: 'Satoshi-Black', color: '#2563EB' }}>
                        {ord.totalAmount} €
                      </Text>
                    </View>

                    {Boolean(contactPhone) && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <Ionicons name="call-outline" size={15} color={colors.textSecondary} />
                        <Text style={{ fontSize: 13, fontFamily: 'Satoshi-Medium', color: colors.textSecondary }}>
                          Teléfono: {contactPhone}
                        </Text>
                      </View>
                    )}

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: isDark ? '#334155' : '#E5E7EB' }}>
                      <Text style={{ fontSize: 12, fontFamily: 'Satoshi-Medium', color: colors.textMuted }}>
                        Nº Pedido: {ord.orderNumber}
                      </Text>
                      <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                        <Text style={{ fontSize: 11.5, fontFamily: 'Satoshi-Bold', color: '#1D4ED8' }}>
                          Presupuesto Aceptado ✓
                        </Text>
                      </View>
                    </View>

                    {/* Action: Open Private Chat */}
                    {(isOwner || isMyOrder) && (
                      <ThemedTouchable
                        onPress={() =>
                          router.push({
                            pathname: '/chat',
                            params: {
                              orderId: ord.id,
                              requestId: request.id,
                              targetName: contactName,
                            },
                          })
                        }
                        haptic="medium"
                        style={{
                          marginTop: 14,
                          backgroundColor: colors.primary,
                          borderRadius: 12,
                          paddingVertical: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'row',
                          gap: 8,
                          shadowColor: colors.primary,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.25,
                          shadowRadius: 4,
                          elevation: 3,
                        }}
                      >
                        <Ionicons name="chatbubbles" size={18} color="#FFFFFF" />
                        <Text style={{ color: '#FFFFFF', fontSize: 14, fontFamily: 'Satoshi-Bold' }}>
                          {isOwner
                            ? 'Abrir Chat Privado con el Profesional'
                            : 'Abrir Chat Privado con el Cliente'}
                        </Text>
                      </ThemedTouchable>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* SECTION: PRESUPUESTOS RECIBIDOS (Para el cliente propietario) */}
          {isOwner && (
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: 'Satoshi-Black',
                  color: colors.textPrimary,
                  marginBottom: 12,
                }}
              >
                Presupuestos Recibidos ({request.proposals?.length || 0})
              </Text>

              {!request.proposals || request.proposals.length === 0 ? (
                <View
                  style={{
                    backgroundColor: isDark ? '#161922' : '#FFFFFF',
                    borderRadius: 20,
                    padding: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: isDark ? '#222734' : '#F1F5F9',
                  }}
                >
                  <Ionicons name="time-outline" size={36} color={colors.textMuted} style={{ marginBottom: 8 }} />
                  <Text style={{ fontSize: 15, fontFamily: 'Satoshi-Bold', color: colors.textPrimary, marginBottom: 4, textAlign: 'center' }}>
                    Esperando presupuestos
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Satoshi-Regular', color: colors.textSecondary, textAlign: 'center', maxWidth: 280 }}>
                    Los profesionales verificados de tu zona han sido notificados. Recibirás una alerta en cuanto envíen sus ofertas.
                  </Text>
                </View>
              ) : (
                request.proposals.map((prop: any) => {
                  const proName =
                    prop.professionalProfile?.businessName ||
                    prop.professionalProfile?.user?.profile?.displayName ||
                    'Profesional';

                  return (
                    <View
                      key={prop.id}
                      style={{
                        backgroundColor: isDark ? '#161922' : '#FFFFFF',
                        borderRadius: 20,
                        padding: 18,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: isDark ? '#222734' : '#F1F5F9',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
                          <Text style={{ fontSize: 15, fontFamily: 'Satoshi-Bold', color: colors.textPrimary }}>
                            {proName}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 18, fontFamily: 'Satoshi-Black', color: colors.primary }}>
                          {prop.price} €
                        </Text>
                      </View>

                      <Text style={{ fontSize: 13.5, fontFamily: 'Satoshi-Regular', color: colors.textSecondary, lineHeight: 20, marginBottom: 12 }}>
                        {prop.message || prop.description || 'Presupuesto de servicio'}
                      </Text>

                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: isDark ? '#222734' : '#F1F5F9' }}>
                        <Text style={{ fontSize: 12, fontFamily: 'Satoshi-Medium', color: colors.textMuted }}>
                          ⏱️ Plazo: {prop.deliveryDays || prop.estimatedDays || 3} días
                        </Text>

                        {prop.status === 'ACCEPTED' ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 }}>
                              <Text style={{ color: '#065F46', fontSize: 12, fontFamily: 'Satoshi-Bold' }}>
                                Aceptado ✓
                              </Text>
                            </View>
                            <ThemedTouchable
                              onPress={() =>
                                router.push({
                                  pathname: '/chat',
                                  params: {
                                    requestId: request.id,
                                    targetName: proName,
                                  },
                                })
                              }
                              haptic="light"
                              style={{
                                backgroundColor: colors.primaryLight,
                                paddingHorizontal: 12,
                                paddingVertical: 5,
                                borderRadius: 999,
                              }}
                            >
                              <Text style={{ color: colors.primary, fontSize: 12, fontFamily: 'Satoshi-Bold' }}>
                                💬 Chat
                              </Text>
                            </ThemedTouchable>
                          </View>
                        ) : prop.status === 'REJECTED' ? (
                          <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 }}>
                            <Text style={{ color: '#991B1B', fontSize: 12, fontFamily: 'Satoshi-Bold' }}>
                              Rechazado
                            </Text>
                          </View>
                        ) : (
                          <ThemedTouchable
                            onPress={() => handleAcceptProposal(prop.id)}
                            disabled={acceptingProposalId === prop.id || request.status !== 'OPEN'}
                            haptic="medium"
                            style={{
                              backgroundColor: colors.primary,
                              paddingHorizontal: 18,
                              paddingVertical: 9,
                              borderRadius: 999,
                            }}
                          >
                            {acceptingProposalId === prop.id ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: 'Satoshi-Bold' }}>
                                Aceptar Presupuesto
                              </Text>
                            )}
                          </ThemedTouchable>
                        )}
                      </View>
                    </View>
                  );
                })
              )}

              {/* Eliminar Solicitud */}
              <View style={{ marginTop: 14 }}>
                <ThemedTouchable
                  onPress={handleDeleteRequest}
                  disabled={isDeleting}
                  haptic="medium"
                  style={{
                    height: 50,
                    borderRadius: 999,
                    backgroundColor: isDark ? '#3B1818' : '#FEE2E2',
                    borderWidth: 1,
                    borderColor: isDark ? '#5C2424' : '#FCA5A5',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 8,
                  }}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#DC2626" />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={18} color="#DC2626" />
                      <Text style={{ color: '#DC2626', fontSize: 14, fontFamily: 'Satoshi-Bold' }}>
                        Eliminar esta Solicitud
                      </Text>
                    </>
                  )}
                </ThemedTouchable>
              </View>
            </View>
          )}

          {/* SECTION: ACCIÓN / ESTADO PARA PROFESIONALES */}
          {!isOwner && isProfessional && (
            <View style={{ marginTop: 10, marginBottom: 14 }}>
              {myExistingProposal ? (
                <View
                  style={{
                    backgroundColor: isDark ? '#161922' : '#FFFFFF',
                    borderRadius: 22,
                    padding: 18,
                    borderWidth: 1.5,
                    borderColor:
                      myExistingProposal.status === 'ACCEPTED'
                        ? '#10B981'
                        : myExistingProposal.status === 'REJECTED'
                        ? '#EF4444'
                        : colors.primary,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: isDark ? 0.25 : 0.06,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  {/* Header */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                      <Ionicons
                        name={
                          myExistingProposal.status === 'ACCEPTED'
                            ? 'checkmark-circle'
                            : 'document-text'
                        }
                        size={20}
                        color={
                          myExistingProposal.status === 'ACCEPTED'
                            ? '#10B981'
                            : colors.primary
                        }
                      />
                      <Text style={{ fontSize: 16, fontFamily: 'Satoshi-Black', color: colors.textPrimary }}>
                        Tu Presupuesto Enviado
                      </Text>
                    </View>

                    {/* Status Badge */}
                    <View
                      style={{
                        backgroundColor:
                          myExistingProposal.status === 'ACCEPTED'
                            ? isDark ? '#064E3B' : '#D1FAE5'
                            : myExistingProposal.status === 'REJECTED'
                            ? isDark ? '#450A0A' : '#FEE2E2'
                            : isDark ? '#451A03' : '#FEF3C7',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 999,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11.5,
                          fontFamily: 'Satoshi-Bold',
                          color:
                            myExistingProposal.status === 'ACCEPTED'
                              ? isDark ? '#6EE7B7' : '#065F46'
                              : myExistingProposal.status === 'REJECTED'
                              ? isDark ? '#FCA5A5' : '#991B1B'
                              : isDark ? '#FCD34D' : '#92400E',
                        }}
                      >
                        {myExistingProposal.status === 'ACCEPTED'
                          ? 'Presupuesto Aceptado ✓'
                          : myExistingProposal.status === 'REJECTED'
                          ? 'No Seleccionado'
                          : 'En espera de respuesta'}
                      </Text>
                    </View>
                  </View>

                  {/* Price & Days Box */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isDark ? '#202532' : '#F8FAFC',
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: isDark ? '#282F40' : '#E2E8F0',
                    }}
                  >
                    <View>
                      <Text style={{ fontSize: 11, fontFamily: 'Satoshi-Medium', color: colors.textMuted }}>
                        Precio Ofertado
                      </Text>
                      <Text style={{ fontSize: 20, fontFamily: 'Satoshi-Black', color: colors.primary }}>
                        {myExistingProposal.price} €
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 11, fontFamily: 'Satoshi-Medium', color: colors.textMuted }}>
                        Plazo Estimado
                      </Text>
                      <Text style={{ fontSize: 14, fontFamily: 'Satoshi-Bold', color: colors.textPrimary }}>
                        ⏱️ {myExistingProposal.estimatedDays || 3} días
                      </Text>
                    </View>
                  </View>

                  {/* Message */}
                  {Boolean(myExistingProposal.message || myExistingProposal.description) && (
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Satoshi-Regular',
                        color: colors.textSecondary,
                        lineHeight: 19,
                        marginBottom: 14,
                      }}
                    >
                      {myExistingProposal.message || myExistingProposal.description}
                    </Text>
                  )}

                  {/* Action Button for Accepted Proposal */}
                  {myExistingProposal.status === 'ACCEPTED' ? (
                    <ThemedTouchable
                      onPress={() =>
                        router.push({
                          pathname: '/chat',
                          params: {
                            requestId: request.id,
                            orderId: request.orders?.[0]?.id,
                            targetName:
                              (request as any).client?.profile?.displayName ||
                              `${(request as any).client?.profile?.firstName ?? ''} ${(request as any).client?.profile?.lastName ?? ''}`.trim() ||
                              'Cliente',
                          },
                        })
                      }
                      haptic="medium"
                      style={{
                        backgroundColor: '#10B981',
                        borderRadius: 14,
                        paddingVertical: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        gap: 8,
                        shadowColor: '#10B981',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 5,
                        elevation: 3,
                      }}
                    >
                      <Ionicons name="chatbubbles" size={18} color="#FFFFFF" />
                      <Text style={{ fontSize: 14, fontFamily: 'Satoshi-Bold', color: '#FFFFFF' }}>
                        Abrir Chat Privado con el Cliente
                      </Text>
                    </ThemedTouchable>
                  ) : (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingTop: 8,
                        borderTopWidth: 1,
                        borderTopColor: isDark ? '#222734' : '#F1F5F9',
                      }}
                    >
                      <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
                      <Text style={{ fontSize: 12, fontFamily: 'Satoshi-Regular', color: colors.textMuted, flex: 1 }}>
                        Ya has presentado tu presupuesto. Te notificaremos en cuanto el cliente responda.
                      </Text>
                    </View>
                  )}
                </View>
              ) : isRequestInProgress ? (
                <View
                  style={{
                    backgroundColor: isDark ? '#1F1A12' : '#FFFBEB',
                    borderRadius: 18,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: isDark ? '#451A03' : '#FDE68A',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <Ionicons name="lock-closed" size={24} color="#D97706" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14.5, fontFamily: 'Satoshi-Bold', color: isDark ? '#FCD34D' : '#92400E' }}>
                      Solicitud en Curso / Asignada
                    </Text>
                    <Text style={{ fontSize: 12.5, fontFamily: 'Satoshi-Regular', color: isDark ? '#FDE68A' : '#B45309', marginTop: 2 }}>
                      Esta solicitud ya ha seleccionado a un profesional y no admite más presupuestos.
                    </Text>
                  </View>
                </View>
              ) : (
                <ThemedTouchable
                  onPress={handleStartProposal}
                  disabled={isCheckingPro}
                  haptic="medium"
                  style={{
                    height: 54,
                    borderRadius: 999,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 8,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  {isCheckingPro ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="send" size={18} color="#FFFFFF" />
                      <Text style={{ fontSize: 15, fontFamily: 'Satoshi-Bold', color: '#FFFFFF' }}>
                        Enviar Presupuesto al Cliente
                      </Text>
                    </>
                  )}
                </ThemedTouchable>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* MODAL PARA ENVIAR PRESUPUESTO */}
      <Modal
        visible={showSendProposalModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSendProposalModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: colors.background }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              flexGrow: 1,
              paddingTop: Math.max(insets.top + 8, 20),
              paddingHorizontal: 22,
              paddingBottom: Math.max(insets.bottom + 16, 24),
              justifyContent: 'space-between',
            }}
          >
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <Text style={{ fontSize: 20, fontFamily: 'Satoshi-Black', color: colors.textPrimary }}>
                  Enviar Presupuesto
                </Text>
                <ThemedTouchable onPress={() => setShowSendProposalModal(false)} haptic="light">
                  <Ionicons name="close-circle" size={26} color={colors.textMuted} />
                </ThemedTouchable>
              </View>

              <Text style={{ fontSize: 13.5, fontFamily: 'Satoshi-Regular', color: colors.textSecondary, marginBottom: 20 }}>
                Presenta una oferta formal y detallada para el trabajo solicitado por el cliente.
              </Text>

              <AuthInput
                label="Precio Total Oferta (€)"
                placeholder="Ej: 150"
                value={proposalPrice}
                onChangeText={setProposalPrice}
                keyboardType="numeric"
                leftIcon="cash-outline"
                containerStyle={{ marginBottom: 14 }}
              />

              <AuthInput
                label="Días Estimados de Trabajo"
                placeholder="Ej: 2"
                value={proposalDays}
                onChangeText={setProposalDays}
                keyboardType="numeric"
                leftIcon="time-outline"
                containerStyle={{ marginBottom: 14 }}
              />

              <AuthInput
                label="Detalles y Materiales Incluidos"
                placeholder="Explica qué incluye tu oferta, materiales, desplazamiento y garantía..."
                value={proposalDesc}
                onChangeText={setProposalDesc}
                multiline
                numberOfLines={4}
                leftIcon="document-text-outline"
                containerStyle={{ marginBottom: 14 }}
              />
            </View>

            <ThemedTouchable
              onPress={handleSendProposal}
              disabled={isSendingProposal}
              haptic="medium"
              style={{
                height: 52,
                marginTop: 20,
                borderRadius: 999,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isSendingProposal ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ fontSize: 15, fontFamily: 'Satoshi-Bold', color: '#FFFFFF' }}>
                  Confirmar y Enviar Presupuesto
                </Text>
              )}
            </ThemedTouchable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig({ visible: false, title: '', message: '' })}
      />
    </View>
  );
}

