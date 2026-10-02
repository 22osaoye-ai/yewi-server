import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { useAppTheme } from '@/hooks/useAppTheme';
import { AttachmentMeta } from '@/services/chatApi';
import { toast } from '@/store/useToastStore';

interface AttachmentPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAttachment: (attachment: AttachmentMeta & { localUri?: string; base64?: string }) => void;
}

export function AttachmentPickerModal({
  visible,
  onClose,
  onSelectAttachment,
}: AttachmentPickerModalProps) {
  const { colors, isDark } = useAppTheme();

  if (!visible) return null;

  const handlePickCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        toast.warning(
          'Permiso Requerido',
          'Se necesita permiso de cámara para tomar fotos.',
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `foto_${Date.now()}.jpg`;
        const base64Data = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;

        onSelectAttachment({
          url: asset.uri,
          localUri: asset.uri,
          base64: base64Data,
          name: fileName,
          size: asset.fileSize || 0,
          type: 'image',
          mimeType: asset.mimeType || 'image/jpeg',
        });
        onClose();
      }
    } catch {
      toast.error(
        'Error de Cámara',
        'No se pudo abrir la cámara.',
      );
    }
  };

  const handlePickGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `imagen_${Date.now()}.jpg`;
        const base64Data = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;

        onSelectAttachment({
          url: asset.uri,
          localUri: asset.uri,
          base64: base64Data,
          name: fileName,
          size: asset.fileSize || 0,
          type: 'image',
          mimeType: asset.mimeType || 'image/jpeg',
        });
        onClose();
      }
    } catch {
      toast.error(
        'Error de Galería',
        'No se pudo seleccionar la imagen.',
      );
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const ext = asset.name.split('.').pop()?.toLowerCase() || '';

        let categoryType: 'pdf' | 'excel' | 'word' | 'file' = 'file';
        if (ext === 'pdf') categoryType = 'pdf';
        else if (['xlsx', 'xls', 'csv'].includes(ext)) categoryType = 'excel';
        else if (['doc', 'docx'].includes(ext)) categoryType = 'word';

        // Read base64 for reliable backend transmission
        let base64String: string | undefined;
        try {
          const fileData = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          base64String = `data:${asset.mimeType || 'application/octet-stream'};base64,${fileData}`;
        } catch {
          base64String = asset.uri;
        }

        onSelectAttachment({
          url: asset.uri,
          localUri: asset.uri,
          base64: base64String,
          name: asset.name,
          size: asset.size || 0,
          type: categoryType,
          mimeType: asset.mimeType || 'application/octet-stream',
        });
        onClose();
      }
    } catch {
      toast.error(
        'Error de Documento',
        'No se pudo seleccionar el archivo.',
      );
    }
  };

  const iconColor = isDark ? '#F9FAFB' : '#111827';

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title="Adjuntar archivo"
    >
      <View style={styles.optionsList}>
        {/* Camera */}
        <ThemedTouchable
          onPress={() => {
            onClose();
            setTimeout(() => {
              handlePickCamera();
            }, 180);
          }}
          haptic="selection"
          style={styles.optionRow}
          accessibilityRole="button"
          accessibilityLabel="Tomar foto con la cámara"
        >
          <Ionicons
            name="camera-outline"
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
            Tomar foto con la cámara
          </Text>
        </ThemedTouchable>

        {/* Gallery */}
        <ThemedTouchable
          onPress={() => {
            onClose();
            setTimeout(() => {
              handlePickGallery();
            }, 180);
          }}
          haptic="selection"
          style={styles.optionRow}
          accessibilityRole="button"
          accessibilityLabel="Elegir de la galería"
        >
          <Ionicons
            name="images-outline"
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
            Elegir de la galería
          </Text>
        </ThemedTouchable>

        {/* Documents */}
        <ThemedTouchable
          onPress={() => {
            onClose();
            setTimeout(() => {
              handlePickDocument();
            }, 180);
          }}
          haptic="selection"
          style={styles.optionRow}
          accessibilityRole="button"
          accessibilityLabel="Adjuntar documento"
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
            Adjuntar documento
          </Text>
        </ThemedTouchable>
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
});
