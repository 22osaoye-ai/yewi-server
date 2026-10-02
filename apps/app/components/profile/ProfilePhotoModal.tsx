import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { CustomSwitch } from '@/components/ui/CustomSwitch';
import { useAppTheme } from '@/hooks/useAppTheme';

interface ProfilePhotoModalProps {
  visible: boolean;
  isOnline: boolean;
  hasPhoto?: boolean;
  onClose: () => void;
  onToggleOnline: (value: boolean) => void;
  onSelectFromGallery: () => void;
  onTakePhoto: () => void;
  onRemovePhoto?: () => void;
}

export function ProfilePhotoModal({
  visible,
  isOnline,
  hasPhoto = false,
  onClose,
  onToggleOnline,
  onSelectFromGallery,
  onTakePhoto,
  onRemovePhoto,
}: ProfilePhotoModalProps) {
  const { colors, isDark } = useAppTheme();

  const handleAction = (callback: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onClose();
    setTimeout(() => {
      callback();
    }, 180);
  };

  const iconColor = isDark ? '#F9FAFB' : '#111827';

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title="Foto"
    >
      <View style={styles.optionsList}>
        {/* Option 1: Gallery */}
        <ThemedTouchable
          onPress={() => handleAction(onSelectFromGallery)}
          haptic="selection"
          style={styles.optionRow}
          accessibilityRole="button"
          accessibilityLabel="Galería"
        >
          <Ionicons
            name="images-outline"
            size={24}
            color={iconColor}
            style={styles.optionIcon}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.optionLabel,
              { color: isDark ? '#F9FAFB' : '#111827' },
            ]}
          >
            Galería
          </Text>
        </ThemedTouchable>

        {/* Option 2: Camera */}
        <ThemedTouchable
          onPress={() => handleAction(onTakePhoto)}
          haptic="selection"
          style={styles.optionRow}
          accessibilityRole="button"
          accessibilityLabel="Cámara"
        >
          <Ionicons
            name="camera-outline"
            size={24}
            color={iconColor}
            style={styles.optionIcon}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.optionLabel,
              { color: isDark ? '#F9FAFB' : '#111827' },
            ]}
          >
            Cámara
          </Text>
        </ThemedTouchable>

        {/* Option 3: Remove Photo (if has photo) */}
        {hasPhoto && onRemovePhoto && (
          <ThemedTouchable
            onPress={() => handleAction(onRemovePhoto)}
            haptic="medium"
            style={styles.optionRow}
            accessibilityRole="button"
            accessibilityLabel="Eliminar"
          >
            <Ionicons
              name="trash-outline"
              size={24}
              color="#DC2626"
              style={styles.optionIcon}
            />
            <Text numberOfLines={1} style={[styles.optionLabel, { color: '#DC2626' }]}>
              Eliminar
            </Text>
          </ThemedTouchable>
        )}

        {/* Option 4: Online Status Switch Toggle */}
        <View style={styles.switchRow}>
          <View style={styles.switchLabelWrap}>
            <Ionicons
              name="radio-button-on"
              size={22}
              color={isOnline ? '#10B981' : isDark ? '#6B7280' : '#9CA3AF'}
              style={styles.optionIcon}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.optionLabel,
                { color: isDark ? '#F9FAFB' : '#111827' },
              ]}
            >
              En línea
            </Text>
          </View>
          <CustomSwitch
            value={isOnline}
            onValueChange={(val) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              onToggleOnline(val);
            }}
            activeColor="#10B981"
          />
        </View>
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  switchLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
});

export default ProfilePhotoModal;
