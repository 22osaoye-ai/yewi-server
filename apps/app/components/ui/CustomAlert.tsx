import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedTouchable } from './ThemedTouchable';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
  onConfirm?: () => void;
}

export function CustomAlert({
  visible,
  title,
  message,
  buttonText = 'De acuerdo',
  onClose,
  onConfirm,
}: CustomAlertProps) {
  const handleButtonPress = () => {
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
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Header Row: Title & Close Circle X */}
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <ThemedTouchable
              onPress={onClose}
              haptic="light"
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={18} color="#18181B" />
            </ThemedTouchable>
          </View>

          {/* Message Text */}
          <Text style={styles.message}>{message}</Text>

          {/* Action Button */}
          <ThemedTouchable
            onPress={handleButtonPress}
            haptic="medium"
            style={styles.actionBtn}
          >
            <Text style={styles.actionBtnText}>{buttonText}</Text>
          </ThemedTouchable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 350,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Satoshi-Black',
    color: '#18181B',
    flex: 1,
    marginRight: 8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F8FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 14,
    fontFamily: 'Satoshi-Regular',
    color: '#71717A',
    lineHeight: 20,
    marginBottom: 24,
  },
  actionBtn: {
    backgroundColor: '#18181B',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 15,
    fontFamily: 'Satoshi-Bold',
    color: '#FFFFFF',
  },
});

export default CustomAlert;
