import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
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
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Adjuntar Archivo
            </Text>
            <ThemedTouchable onPress={onClose} haptic="light">
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </ThemedTouchable>
          </View>

          {/* Options Grid */}
          <View style={styles.optionsGrid}>
            {/* Camera */}
            <ThemedTouchable
              onPress={handlePickCamera}
              haptic="medium"
              style={[
                styles.optionCard,
                {
                  backgroundColor: isDark ? '#1F2432' : '#F8FAFC',
                  borderColor: isDark ? '#2B3245' : '#E2E8F0',
                },
              ]}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#3B82F6' }]}>
                <Ionicons name="camera" size={22} color="#FFFFFF" />
              </View>
              <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>
                Cámara
              </Text>
            </ThemedTouchable>

            {/* Gallery */}
            <ThemedTouchable
              onPress={handlePickGallery}
              haptic="medium"
              style={[
                styles.optionCard,
                {
                  backgroundColor: isDark ? '#1F2432' : '#F8FAFC',
                  borderColor: isDark ? '#2B3245' : '#E2E8F0',
                },
              ]}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#8B5CF6' }]}>
                <Ionicons name="images" size={22} color="#FFFFFF" />
              </View>
              <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>
                Galería
              </Text>
            </ThemedTouchable>

            {/* Documents */}
            <ThemedTouchable
              onPress={handlePickDocument}
              haptic="medium"
              style={[
                styles.optionCard,
                {
                  backgroundColor: isDark ? '#1F2432' : '#F8FAFC',
                  borderColor: isDark ? '#2B3245' : '#E2E8F0',
                },
              ]}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#10B981' }]}>
                <MaterialCommunityIcons name="file-document-multiple" size={22} color="#FFFFFF" />
              </View>
              <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>
                Documento
              </Text>
            </ThemedTouchable>
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
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Satoshi-Bold',
  },
  optionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 13,
    fontFamily: 'Satoshi-Bold',
  },
});
