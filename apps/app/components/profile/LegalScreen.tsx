import React, { useState } from 'react';
import { View, Text, ScrollView, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

interface LegalScreenProps {
  onBack: () => void;
  onShowAlert: (title: string, message: string) => void;
}

interface LegalDoc {
  id: string;
  title: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  content: string;
}

export function LegalScreen({ onBack }: LegalScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, t, isDark } = useAppTheme();
  const [selectedDoc, setSelectedDoc] = useState<LegalDoc | null>(null);

  const legalDocs: LegalDoc[] = [
    {
      id: 'terms',
      title: 'Términos y Condiciones de Uso',
      desc: 'Condiciones de contratación y uso de la plataforma',
      icon: 'document-text-outline',
      content: `1. INTRODUCCIÓN Y OBJETO
Yewi es una plataforma tecnológica que conecta a usuarios clientes con profesionales independientes y empresas prestadoras de servicios para el hogar, reformas e instalaciones en España.

2. CONDICIONES DE LOS SERVICIOS Y CONTRATACIÓN
El cliente contrata los servicios ofertados por profesionales verificados a través del sistema de pedidos o presupuestos a medida. La plataforma retiene los importes abonados en un sistema de custodia (escrow) hasta la confirmación de la correcta finalización del trabajo.

3. DERECHO DE DESISTIMIENTO Y GARANTÍA
De conformidad con el Real Decreto Legislativo 1/2007, el cliente dispondrá de los derechos y plazos legales en materia de defensa de consumidores y usuarios en España.`,
    },
    {
      id: 'privacy',
      title: 'Política de Privacidad y RGPD',
      desc: 'Tratamiento y protección de datos personales',
      icon: 'shield-checkmark-outline',
      content: `1. RESPONSABLE DEL TRATAMIENTO
El responsable del tratamiento de los datos recabados en la aplicación es Yewi Technologies S.L., con domicilio fiscal en España.

2. FINALIDAD DEL TRATAMIENTO
Los datos personales (nombre, teléfono, correo electrónico, dirección y ubicación) se tratan exclusivamente con la finalidad de gestionar la cuenta de usuario, permitir la contratación y emisión de presupuestos y asegurar la correcta prestación del servicio.

3. DERECHOS DEL USUARIO (ARCO)
El usuario puede ejercer en cualquier momento sus derechos de acceso, rectificación, supresión, limitación y portabilidad mediante comunicación directa a privacidad@yewi.es.`,
    },
    {
      id: 'community',
      title: 'Normas de la Comunidad de Creadores y Profesionales',
      desc: 'Estándares de calidad y conducta profesional',
      icon: 'people-outline',
      content: `1. VERIFICACIÓN DE IDENTIDAD Y CUALIFICACIÓN
Todos los profesionales deben aportar documentación válida (DNI/NIE, CIF de empresa y seguro de responsabilidad civil cuando aplique) para ser verificados en la plataforma.

2. TRANSPARENCIA EN PRECIOS Y PRESUPUESTOS
Queda terminantemente prohibido exigir suplementos no pactados previamente en el presupuesto aceptado a través de Yewi.

3. RESPETO Y PUNTUALIDAD
La puntualidad, el trato respetuoso y la limpieza en los trabajos en el domicilio del cliente son pilares obligatorios de nuestra comunidad.`,
    },
    {
      id: 'licenses',
      title: 'Licencias de Software y Atribuciones',
      desc: 'Librerías de código abierto utilizadas',
      icon: 'code-slash-outline',
      content: `Yewi App utiliza software de código abierto bajo licencias permisivas (MIT, Apache 2.0 y BSD):
- React Native & Expo Platform (MIT License)
- NestJS Framework (MIT License)
- Prisma Database Toolkit (Apache 2.0)
- TailwindCSS / NativeWind (MIT License)
- Zustand State Management (MIT License)
- Ionicons & Expo Vector Icons (MIT / SIL OFL)`,
    },
  ];

  const handleOpenDoc = async (doc: LegalDoc) => {
    await Haptics.selectionAsync().catch(() => {});
    setSelectedDoc(doc);
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
          {t.legalTitle}
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
        <Text
          style={{
            fontSize: 17,
            fontFamily: 'Satoshi-Black',
            color: colors.textPrimary,
            marginBottom: 10,
            marginLeft: 4,
            letterSpacing: -0.3,
          }}
        >
          Documentos y Políticas Oficiales
        </Text>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
            marginBottom: 24,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDark ? 0.2 : 0.04,
            shadowRadius: 4,
          }}
        >
          {legalDocs.map((item, idx) => (
            <ThemedTouchable
              key={item.id}
              onPress={() => handleOpenDoc(item)}
              haptic="selection"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 16,
                paddingHorizontal: 18,
                borderBottomWidth: idx < legalDocs.length - 1 ? 1 : 0,
                borderBottomColor: colors.borderSubtle,
              }}
            >
              <View className="flex-row items-center flex-1 mr-3">
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={colors.textSecondary}
                  style={{ marginRight: 14 }}
                />
                <View className="flex-1">
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: 'Satoshi-Bold',
                      color: colors.textPrimary,
                    }}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'Satoshi-Regular',
                      color: colors.textSecondary,
                      marginTop: 1,
                    }}
                  >
                    {item.desc}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </ThemedTouchable>
          ))}
        </View>
      </ScrollView>

      {/* Modal Document Viewer */}
      <Modal
        visible={!!selectedDoc}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedDoc(null)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View
            style={{
              paddingTop: Math.max(insets.top + 10, 20),
              paddingHorizontal: 20,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderSubtle,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: colors.surface,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Satoshi-Black',
                color: colors.textPrimary,
                flex: 1,
                marginRight: 10,
              }}
              numberOfLines={1}
            >
              {selectedDoc?.title}
            </Text>
            <ThemedTouchable onPress={() => setSelectedDoc(null)} haptic="light">
              <Ionicons name="close-circle" size={26} color={colors.textMuted} />
            </ThemedTouchable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{
              padding: 22,
              paddingBottom: Math.max(insets.bottom + 30, 50),
            }}
          >
            <Text
              style={{
                fontSize: 14.5,
                fontFamily: 'Satoshi-Regular',
                color: colors.textPrimary,
                lineHeight: 23,
              }}
            >
              {selectedDoc?.content}
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

export default LegalScreen;
