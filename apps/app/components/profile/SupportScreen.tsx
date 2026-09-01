import React, { useState } from 'react';
import { View, Text, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

interface SupportScreenProps {
  onBack: () => void;
  onShowAlert: (title: string, message: string) => void;
}

interface FaqItem {
  id: string;
  title: string;
  desc: string;
  content: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export function SupportScreen({ onBack, onShowAlert }: SupportScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, t, isDark } = useAppTheme();
  const [expandedId, setExpandedId] = useState<string | null>('1');

  const faqs: FaqItem[] = [
    {
      id: '1',
      title: 'Garantía del Servicio y Depósito en Custodia',
      desc: 'Protección de pagos para clientes y profesionales',
      icon: 'shield-checkmark-outline',
      content:
        'En Yewi, los pagos se retienen en una cuenta de custodia segura (escrow). El importe no se transfiere al profesional hasta que el cliente haya revisado y aprobado formalmente el trabajo realizado.',
    },
    {
      id: '2',
      title: 'Presupuestos y Solicitudes a Medida',
      desc: 'Cómo solicitar trabajos y recibir propuestas',
      icon: 'document-text-outline',
      content:
        'Puedes publicar una solicitud de servicio detallando el trabajo que necesitas. Los profesionales verificados de tu zona te enviarán presupuestos personalizados para que elijas el que mejor se adapte a ti.',
    },
    {
      id: '3',
      title: 'Facturación y Métodos de Pago',
      desc: 'Tarjetas bancarias, Bizum y facturas con IVA',
      icon: 'card-outline',
      content:
        'Aceptamos tarjetas de crédito/débito y pasarelas seguras compatibles con la normativa europea PSD2. Todas las transacciones emiten su correspondiente factura electrónica descargable.',
    },
    {
      id: '4',
      title: 'Resolución de Incidencias y Disputas',
      desc: 'Asistencia y mediación del equipo de Yewi',
      icon: 'help-buoy-outline',
      content:
        'Si surge algún desacuerdo con la entrega de un servicio, puedes abrir una disputa desde el detalle del pedido. Nuestro equipo de soporte mediará para una resolución justa o reembolso.',
    },
  ];

  const handleToggleFaq = async (id: string) => {
    await Haptics.selectionAsync().catch(() => {});
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleContactEmail = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      await Linking.openURL('mailto:soporte@yewi.es?subject=Soporte%20Yewi%20App');
    } catch {
      onShowAlert('Contacto', 'Puedes escribirnos directamente a: soporte@yewi.es');
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: colors.headerBg,
          paddingTop: Math.max(insets.top + 8, 28),
          paddingBottom: 16,
          paddingHorizontal: 18,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <ThemedTouchable
          onPress={onBack}
          haptic="light"
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: isDark ? '#27272A' : 'rgba(255, 255, 255, 0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 14,
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </ThemedTouchable>
        <Text
          style={{
            fontSize: 20,
            fontFamily: 'Satoshi-Black',
            color: '#FFFFFF',
            letterSpacing: -0.4,
          }}
        >
          {t.supportTitle}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 20,
          paddingHorizontal: 18,
          paddingBottom: 140,
        }}
      >
        {/* Contact Banner */}
        <View
          style={{
            backgroundColor: isDark ? colors.surfaceAlt : '#18181B',
            borderRadius: 22,
            padding: 20,
            marginBottom: 24,
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
            borderWidth: isDark ? 1 : 0,
            borderColor: colors.border,
          }}
        >
          <View className="flex-row items-center mb-2">
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="headset-outline" size={20} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 17, fontFamily: 'Satoshi-Black', color: '#FFFFFF' }}>
              {t.needHelp}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Satoshi-Regular',
              color: '#A1A1AA',
              lineHeight: 19,
              marginBottom: 16,
            }}
          >
            Nuestro equipo de atención al cliente está disponible para resolver cualquier duda técnica o de pedidos.
          </Text>

          <ThemedTouchable
            onPress={handleContactEmail}
            haptic="medium"
            style={{
              backgroundColor: colors.primary,
              borderRadius: 999,
              paddingVertical: 12,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
            }}
          >
            <Ionicons name="mail-outline" size={17} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontFamily: 'Satoshi-Bold' }}>
              {t.supportEmailBtn}
            </Text>
          </ThemedTouchable>
        </View>

        {/* FAQs Accordion */}
        <Text
          style={{
            fontSize: 17,
            fontFamily: 'Satoshi-Black',
            color: colors.textPrimary,
            marginBottom: 12,
            marginLeft: 4,
            letterSpacing: -0.3,
          }}
        >
          {t.faqs}
        </Text>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDark ? 0.2 : 0.04,
            shadowRadius: 4,
          }}
        >
          {faqs.map((faq, index) => {
            const isExpanded = expandedId === faq.id;
            const isLast = index === faqs.length - 1;

            return (
              <View
                key={faq.id}
                style={{
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: colors.borderSubtle,
                }}
              >
                <ThemedTouchable
                  onPress={() => handleToggleFaq(faq.id)}
                  haptic="selection"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 16,
                    paddingHorizontal: 18,
                  }}
                >
                  <View className="flex-row items-center flex-1 mr-3">
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: isExpanded
                          ? colors.primaryLight
                          : colors.surfaceAlt,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Ionicons
                        name={faq.icon}
                        size={18}
                        color={isExpanded ? colors.primary : colors.textSecondary}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        style={{
                          fontSize: 15,
                          fontFamily: isExpanded ? 'Satoshi-Black' : 'Satoshi-Bold',
                          color: colors.textPrimary,
                        }}
                      >
                        {faq.title}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: 'Satoshi-Regular',
                          color: colors.textSecondary,
                          marginTop: 1,
                        }}
                      >
                        {faq.desc}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={isExpanded ? colors.primary : colors.textMuted}
                  />
                </ThemedTouchable>

                {isExpanded && (
                  <View
                    style={{
                      paddingHorizontal: 18,
                      paddingBottom: 16,
                      paddingTop: 4,
                      backgroundColor: colors.surfaceAlt,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13.5,
                        fontFamily: 'Satoshi-Regular',
                        color: colors.textSecondary,
                        lineHeight: 20,
                      }}
                    >
                      {faq.content}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export default SupportScreen;
