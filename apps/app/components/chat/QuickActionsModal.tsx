import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

interface QuickActionsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAction: (text: string) => void;
  isPro?: boolean;
}

const QUICK_ACTIONS = [
  {
    icon: 'clipboard-text-outline',
    title: 'Solicitar Presupuesto Formal',
    description: 'Pedir cotización desglosada y plazo de entrega estimado.',
    text: 'Hola, ¿podrías enviarme un presupuesto formal y detallado con el plazo estimado para este trabajo?',
  },
  {
    icon: 'calendar-clock',
    title: 'Consultar Disponibilidad',
    description: 'Preguntar por fechas y horarios disponibles para visita.',
    text: 'Hola, ¿cuándo tendrías disponibilidad para coordinar una visita técnica o iniciar?',
  },
  {
    icon: 'map-marker-outline',
    title: 'Enviar Ubicación de Obra',
    description: 'Compartir detalles del lugar donde se realizará el servicio.',
    text: 'Te facilito la dirección donde se requiere el servicio para calcular el desplazamiento.',
  },
  {
    icon: 'camera-outline',
    title: 'Solicitar Fotos Adicionales',
    description: 'Pedir imágenes del área o desperfecto a reparar.',
    text: '¿Podrías enviarme fotos adicionales o medidas del área para valorar mejor el trabajo?',
  },
];

export function QuickActionsModal({
  visible,
  onClose,
  onSelectAction,
}: QuickActionsModalProps) {
  const { colors, isDark } = useAppTheme();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? '#161922' : '#FFFFFF',
              borderColor: isDark ? '#2D3548' : '#E2E8F0',
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.lightningIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="flash" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                Acciones Rápidas Yewi
              </Text>
            </View>

            <ThemedTouchable onPress={onClose} haptic="light">
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </ThemedTouchable>
          </View>

          {/* Action List */}
          <View style={styles.actionsList}>
            {QUICK_ACTIONS.map((action, idx) => (
              <ThemedTouchable
                key={idx}
                onPress={() => {
                  onSelectAction(action.text);
                  onClose();
                }}
                haptic="medium"
                style={[
                  styles.actionItem,
                  {
                    backgroundColor: isDark ? '#1F2432' : '#F8FAFC',
                    borderColor: isDark ? '#2B3245' : '#E2E8F0',
                  },
                ]}
              >
                <View style={[styles.actionIconBadge, { backgroundColor: isDark ? '#272E3F' : '#EFF6FF' }]}>
                  <MaterialCommunityIcons
                    name={action.icon as any}
                    size={20}
                    color={colors.primary}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
                    {action.title}
                  </Text>
                  <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                    {action.description}
                  </Text>
                </View>

                <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
              </ThemedTouchable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  lightningIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Satoshi-Bold',
  },
  actionsList: {
    gap: 10,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  actionIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontFamily: 'Satoshi-Bold',
  },
  actionDesc: {
    fontSize: 12,
    fontFamily: 'Satoshi-Regular',
    marginTop: 2,
  },
});
