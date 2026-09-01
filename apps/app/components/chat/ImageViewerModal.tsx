import React from 'react';
import { View, Text, StyleSheet, Modal, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { toast } from '@/store/useToastStore';

interface ImageViewerModalProps {
  visible: boolean;
  imageUrl: string | null;
  caption?: string | null;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function ImageViewerModal({
  visible,
  imageUrl,
  caption,
  onClose,
}: ImageViewerModalProps) {
  const insets = useSafeAreaInsets();

  if (!visible || !imageUrl) return null;

  const handleShare = async () => {
    try {
      if (await Sharing.isAvailableAsync()) {
        const localUri = `${FileSystem.cacheDirectory || ''}yewi_image_${Date.now()}.jpg`;
        const downloadRes = await FileSystem.downloadAsync(imageUrl, localUri);
        await Sharing.shareAsync(downloadRes.uri);
      } else {
        toast.info(
          'Compartir no disponible',
          'Tu dispositivo no admite compartir archivos directamente.',
        );
      }
    } catch {
      toast.error(
        'Error',
        'No se pudo compartir la imagen.',
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Top Action Bar */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) }]}>
          <ThemedTouchable onPress={onClose} haptic="light" style={styles.iconBtn}>
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </ThemedTouchable>

          <ThemedTouchable onPress={handleShare} haptic="light" style={styles.iconBtn}>
            <Ionicons name="share-outline" size={24} color="#FFFFFF" />
          </ThemedTouchable>
        </View>

        {/* Full Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.fullImage}
            contentFit="contain"
          />
        </View>

        {/* Bottom Caption if present */}
        {caption ? (
          <View style={[styles.captionBox, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <Text style={styles.captionText}>{caption}</Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
  },
  captionBox: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Satoshi-Medium',
    textAlign: 'center',
  },
});
