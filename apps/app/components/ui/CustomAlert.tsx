import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedTouchable } from './ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttonText?: string;
  cancelButtonText?: string;
  onClose: () => void;
  onConfirm?: () => void;
  isDestructive?: boolean;
}

export function CustomAlert({
  visible,
  title,
  message,
  buttonText = 'De acuerdo',
  cancelButtonText = 'Cancelar',
  onClose,
  onConfirm,
  isDestructive = false,
}: CustomAlertProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const handleConfirmPress = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              paddingBottom: Math.max(insets.bottom + 16, 26),
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Top Drag Indicator Pill */}
          <View style={styles.dragHandleWrapper}>
            <View
              style={[
                styles.dragHandlePill,
                { backgroundColor: isDark ? '#48484A' : '#D1D5DB' },
              ]}
            />
          </View>

          {/* Header Row: Title & Close Circle X */}
          <View style={styles.headerRow}>
            <Text
              style={[
                styles.title,
                { color: isDark ? '#F9FAFB' : '#111827' },
              ]}
              numberOfLines={2}
            >
              {title}
            </Text>
            <ThemedTouchable
              onPress={onClose}
              haptic="light"
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? '#2A2A2E' : '#F0F0F2' },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Cerrar modal"
            >
              <Ionicons
                name="close"
                size={15}
                color={isDark ? '#A1A1AA' : '#6B7280'}
              />
            </ThemedTouchable>
          </View>

          {/* Message Text */}
          <Text
            style={[
              styles.message,
              { color: isDark ? '#9CA3AF' : '#6B7280' },
            ]}
          >
            {message}
          </Text>

          {/* Action Buttons Row (Mobbin Shop style) */}
          {onConfirm ? (
            <View style={styles.buttonRow}>
              <ThemedTouchable
                onPress={onClose}
                haptic="light"
                style={[
                  styles.cancelBtn,
                  {
                    backgroundColor: isDark ? '#27272A' : '#FFFFFF',
                    borderColor: isDark ? '#3F3F46' : '#E5E7EB',
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.cancelBtnText,
                    { color: isDark ? '#F9FAFB' : '#111827' },
                  ]}
                >
                  {cancelButtonText}
                </Text>
              </ThemedTouchable>

              <ThemedTouchable
                onPress={handleConfirmPress}
                haptic="medium"
                style={[
                  styles.confirmBtn,
                  {
                    backgroundColor: isDestructive ? '#DC2626' : (isDark ? colors.primary : '#0284C7'),
                  },
                ]}
              >
                <Text numberOfLines={1} style={styles.confirmBtnText}>{buttonText}</Text>
              </ThemedTouchable>
            </View>
          ) : (
            <ThemedTouchable
              onPress={handleConfirmPress}
              haptic="medium"
              style={[
                styles.singleBtn,
                { backgroundColor: isDestructive ? '#DC2626' : (isDark ? colors.primary : '#0284C7') },
              ]}
            >
              <Text numberOfLines={1} style={styles.confirmBtnText}>{buttonText}</Text>
            </ThemedTouchable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  card: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingTop: 8,
    paddingHorizontal: 22,
    width: '100%',
    borderTopWidth: 1,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
  },
  dragHandleWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    marginBottom: 8,
  },
  dragHandlePill: {
    width: 38,
    height: 4.5,
    borderRadius: 999,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -0.3,
    flex: 1,
    marginRight: 12,
    lineHeight: 26,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singleBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
  },
});

export default CustomAlert;
