import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeOut, FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { toast } from '@/store/useToastStore';
import { useAppTheme } from '@/hooks/useAppTheme';

interface ImageViewerModalProps {
  visible: boolean;
  imageUri: string | null;
  title?: string;
  description?: string;
  category?: string;
  onClose: () => void;
}

export function ImageViewerModal({
  visible,
  imageUri,
  title,
  description,
  category,
  onClose,
}: ImageViewerModalProps) {
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const { isDark } = useAppTheme();

  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [showInfo, setShowInfo] = useState<boolean>(false);

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  // Auto-hide controls after 3.5 seconds
  const resetAutoHideTimer = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
      setShowInfo(false);
    }, 3800);
  };

  useEffect(() => {
    if (visible) {
      setControlsVisible(true);
      setShowInfo(false);
      resetAutoHideTimer();
    } else {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [visible, imageUri]);

  const handleToggleControls = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (controlsVisible) {
      setControlsVisible(false);
      setShowInfo(false);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    } else {
      setControlsVisible(true);
      resetAutoHideTimer();
    }
  };

  const handleShare = async () => {
    if (!imageUri) return;
    resetAutoHideTimer();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      await Share.share({
        title: title || 'Trabajo del portafolio',
        message: `${title || 'Foto de trabajo'} - Mira este trabajo en Yewi: ${imageUri}`,
        url: imageUri,
      });
    } catch {
      toast.error('Error al compartir', 'No se pudo abrir el menú de compartir.');
    }
  };

  const handleToggleLike = async () => {
    resetAutoHideTimer();
    const next = !isLiked;
    setIsLiked(next);
    if (next) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      toast.success('Guardado en Favoritos', 'Has añadido esta foto a tus fotos guardadas.');
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      toast.info('Eliminado de Favoritos');
    }
  };

  const handleToggleInfo = () => {
    resetAutoHideTimer();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setShowInfo((prev) => !prev);
  };

  const handleCopyLink = async () => {
    if (!imageUri) return;
    resetAutoHideTimer();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      await Share.share({
        title: title || 'Trabajo del portafolio',
        message: imageUri,
        url: imageUri,
      });
      toast.success('Compartir / Guardar', 'Menú de opciones abierto.');
    } catch {
      toast.info('Imagen', imageUri);
    }
  };

  if (!visible || !imageUri) return null;

  const displayTitle = title || 'Fotografía de Portafolio';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? '#0D0E12' : '#FBF7F4',
          },
        ]}
      >
        {/* Tap area to toggle UI */}
        <Pressable
          onPress={handleToggleControls}
          style={styles.imagePressableArea}
        >
          <Image
            source={{ uri: imageUri }}
            style={{
              width: SCREEN_WIDTH,
              height: SCREEN_HEIGHT * 0.78,
            }}
            resizeMode="contain"
          />
        </Pressable>

        {/* TOP BAR */}
        {controlsVisible && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={[
              styles.topBar,
              {
                paddingTop: Math.max(insets.top + 8, 24),
                backgroundColor: isDark
                  ? 'rgba(13, 14, 18, 0.85)'
                  : 'rgba(251, 247, 244, 0.88)',
              },
            ]}
          >
            <ThemedTouchable
              onPress={onClose}
              haptic="light"
              style={[
                styles.iconBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)',
                },
              ]}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color={isDark ? '#FFFFFF' : '#18181B'}
              />
            </ThemedTouchable>

            <Text
              numberOfLines={1}
              style={[
                styles.titleText,
                {
                  color: isDark ? '#FFFFFF' : '#18181B',
                },
              ]}
            >
              {displayTitle}
            </Text>

            <View style={{ width: 40 }} />
          </Animated.View>
        )}

        {/* OPTIONAL INFO CARD OVERLAY */}
        {showInfo && (
          <Animated.View
            entering={FadeInDown.springify().damping(18)}
            exiting={FadeOutDown.duration(200)}
            style={[
              styles.infoCard,
              {
                bottom: Math.max(insets.bottom + 84, 100),
                backgroundColor: isDark ? '#1C1D24' : '#18181B',
                borderColor: 'rgba(255,255,255,0.12)',
                shadowColor: '#000',
              },
            ]}
          >
            <Text
              style={[
                styles.infoTitle,
                { color: '#FFFFFF' },
              ]}
            >
              {displayTitle}
            </Text>
            {category ? (
              <View
                style={[
                  styles.categoryPill,
                  { backgroundColor: 'rgba(255,255,255,0.15)' },
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: '#FFFFFF' },
                  ]}
                >
                  {category}
                </Text>
              </View>
            ) : null}
            {description ? (
              <Text
                style={[
                  styles.infoDesc,
                  { color: '#D4D4D8' },
                ]}
              >
                {description}
              </Text>
            ) : (
              <Text
                style={[
                  styles.infoDesc,
                  { color: '#71717A', fontStyle: 'italic' },
                ]}
              >
                Sin descripción adicional para este trabajo.
              </Text>
            )}
          </Animated.View>
        )}

        {/* BOTTOM ACTION BAR (SLEEK BLACK MINIMALIST CONTROLS) */}
        {controlsVisible && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={[
              styles.bottomBarContainer,
              {
                bottom: Math.max(insets.bottom + 18, 30),
              },
            ]}
          >
            <View
              style={[
                styles.bottomBarPill,
                {
                  backgroundColor: '#18181B',
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                  shadowColor: '#000',
                  shadowOpacity: 0.3,
                  shadowRadius: 10,
                  elevation: 6,
                },
              ]}
            >
              {/* 1. Share button */}
              <ThemedTouchable
                onPress={handleShare}
                haptic="medium"
                style={[
                  styles.actionRoundBtn,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  },
                ]}
              >
                <Ionicons
                  name="paper-plane-outline"
                  size={19}
                  color="#FFFFFF"
                />
              </ThemedTouchable>

              {/* 2. Heart / Like button */}
              <ThemedTouchable
                onPress={handleToggleLike}
                haptic="medium"
                style={[
                  styles.actionRoundBtn,
                  {
                    backgroundColor: isLiked
                      ? 'rgba(239, 68, 68, 0.25)'
                      : 'rgba(255, 255, 255, 0.12)',
                  },
                ]}
              >
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isLiked ? '#EF4444' : '#FFFFFF'}
                />
              </ThemedTouchable>

              {/* 3. Info / Details toggle */}
              <ThemedTouchable
                onPress={handleToggleInfo}
                haptic="light"
                style={[
                  styles.actionRoundBtn,
                  {
                    backgroundColor: showInfo
                      ? 'rgba(255, 255, 255, 0.28)'
                      : 'rgba(255, 255, 255, 0.12)',
                  },
                ]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={21}
                  color="#FFFFFF"
                />
              </ThemedTouchable>

              {/* 4. Copy Link button */}
              <ThemedTouchable
                onPress={handleCopyLink}
                haptic="light"
                style={[
                  styles.actionRoundBtn,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  },
                ]}
              >
                <Ionicons
                  name="copy-outline"
                  size={19}
                  color="#FFFFFF"
                />
              </ThemedTouchable>
            </View>
          </Animated.View>
        )}

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePressableArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 14,
    zIndex: 20,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 15.5,
    fontFamily: 'Satoshi-Bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  infoCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 25,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Satoshi-Black',
    marginBottom: 4,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: 'Satoshi-Bold',
  },
  infoDesc: {
    fontSize: 13,
    fontFamily: 'Satoshi-Regular',
    lineHeight: 18,
  },
  bottomBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30,
  },
  bottomBarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    gap: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  actionRoundBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ImageViewerModal;
