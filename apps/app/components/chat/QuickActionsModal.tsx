import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
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
  const { isDark } = useAppTheme();

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title="Acciones rápidas"
    >
      <View style={styles.actionsList}>
        {QUICK_ACTIONS.map((action, idx) => (
          <ThemedTouchable
            key={idx}
            onPress={() => {
              onClose();
              setTimeout(() => {
                onSelectAction(action.text);
              }, 180);
            }}
            haptic="selection"
            style={styles.actionItem}
            accessibilityRole="button"
            accessibilityLabel={action.title}
          >
            <MaterialCommunityIcons
              name={action.icon as any}
              size={24}
              color={isDark ? '#F9FAFB' : '#111827'}
              style={styles.actionIcon}
            />

            <View style={{ flex: 1 }}>
              <Text style={[styles.actionTitle, { color: isDark ? '#F9FAFB' : '#111827' }]}>
                {action.title}
              </Text>
              <Text style={[styles.actionDesc, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                {action.description}
              </Text>
            </View>
          </ThemedTouchable>
        ))}
      </View>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  actionsList: {
    gap: 6,
    paddingTop: 4,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  actionIcon: {
    marginRight: 16,
    width: 26,
    textAlign: 'center',
  },
  actionTitle: {
    fontSize: 15.5,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-Medium',
    lineHeight: 16,
  },
});

export default QuickActionsModal;
