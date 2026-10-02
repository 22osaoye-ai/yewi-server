import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AppBottomSheet } from './AppBottomSheet';
import { ThemedTouchable } from './ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUserRole } from '@/hooks/useUserRole';

interface PublishBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectRequest: () => void;
  onSelectProject: () => void;
  onSelectPromo?: () => void;
}

export function PublishBottomSheet({
  visible,
  onClose,
  onSelectRequest,
  onSelectProject,
}: PublishBottomSheetProps) {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { user, isAuthenticated, isProfessional } = useUserRole();

  const handlePressOption = (action: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onClose();
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    // Smooth transition: let sheet dismiss before presenting target screen/modal
    setTimeout(() => {
      action();
    }, 180);
  };

  const iconColor = isDark ? '#F9FAFB' : '#111827';

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title="Publicar"
    >
      <View style={styles.optionsList}>
        {/* OPTION 1: SOLICITUD (Solo Clientes - Los profesionales no pueden crear solicitudes) */}
        {!isProfessional && (
          <ThemedTouchable
            onPress={() => handlePressOption(onSelectRequest)}
            haptic="selection"
            style={styles.optionRow}
            accessibilityRole="button"
            accessibilityLabel="Solicitud"
          >
            <Ionicons
              name="document-text-outline"
              size={24}
              color={iconColor}
              style={styles.optionIcon}
            />
            <Text
              style={[
                styles.optionLabel,
                { color: isDark ? '#F9FAFB' : '#111827' },
              ]}
            >
              Solicitud
            </Text>
          </ThemedTouchable>
        )}

        {/* OPTION 2: SERVICIO (Solo Profesionales con custodia Escrow) */}
        {isProfessional && (
          <ThemedTouchable
            onPress={() => handlePressOption(onSelectProject)}
            haptic="selection"
            style={styles.optionRow}
            accessibilityRole="button"
            accessibilityLabel="Servicio"
          >
            <Ionicons
              name="add-circle-outline"
              size={24}
              color={iconColor}
              style={styles.optionIcon}
            />
            <View style={styles.labelWithBadge}>
              <Text
                style={[
                  styles.optionLabel,
                  { color: isDark ? '#F9FAFB' : '#111827' },
                ]}
              >
                Servicio
              </Text>
              <View
                style={[
                  styles.proBadge,
                  { backgroundColor: isDark ? '#27272A' : '#111827' },
                ]}
              >
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            </View>
          </ThemedTouchable>
        )}
      </View>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  optionsList: {
    gap: 4,
    paddingTop: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  optionIcon: {
    marginRight: 16,
    width: 26,
    textAlign: 'center',
  },
  optionLabel: {
    fontSize: 16.5,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -0.2,
  },
  labelWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    letterSpacing: 0.5,
  },
});

export default PublishBottomSheet;
