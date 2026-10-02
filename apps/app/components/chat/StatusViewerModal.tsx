import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Dimensions,
  Animated,
  Share,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Stop, Rect, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Reanimated, { FadeIn, FadeOut, SlideInDown, SlideOutDown, Easing } from 'react-native-reanimated';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { AuthorStatusFeedGroup, StatusItem, statusesApi } from '@/services/statusesApi';
import { useAuthStore } from '@/store/useAuthStore';
import { useSeenStatusesStore } from '@/store/useSeenStatusesStore';
import { toast } from '@/store/useToastStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION_MS = 5000;

interface StatusViewerModalProps {
  visible: boolean;
  storyGroup: AuthorStatusFeedGroup | null;
  onClose: () => void;
  onStoryUpdated?: () => void;
  onOpenChatWithUser?: (userId: string, userName: string, initialMsg?: string) => void;
}

export function StatusViewerModal({
  visible,
  storyGroup,
  onClose,
  onStoryUpdated,
  onOpenChatWithUser,
}: StatusViewerModalProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const markStatusAsSeen = useSeenStatusesStore((state) => state.markStatusAsSeen);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [localStatuses, setLocalStatuses] = useState<StatusItem[]>([]);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Engagement states
  const [likesCount, setLikesCount] = useState(0);
  const [isLikedByMe, setIsLikedByMe] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const elapsedFractionRef = useRef(0);

  const isAuthor = Boolean(user?.id && storyGroup?.authorId === user.id);

  // Listener para rastrear la fracción transcurrida sin perder el punto de pausa
  useEffect(() => {
    const id = progressAnim.addListener(({ value }) => {
      elapsedFractionRef.current = value;
    });
    return () => progressAnim.removeListener(id);
  }, [progressAnim]);

  useEffect(() => {
    if (storyGroup?.statuses && storyGroup.statuses.length > 0) {
      setLocalStatuses(storyGroup.statuses);
      setCurrentIndex(0);
    }
  }, [storyGroup]);

  const currentStatus = localStatuses[currentIndex] || null;

  // Sincronizar estado de Me Gusta y reseteo por historia
  useEffect(() => {
    if (currentStatus) {
      setLikesCount(currentStatus.likesCount || 0);
      setIsLikedByMe(Boolean(currentStatus.isLikedByMe));
      elapsedFractionRef.current = 0;
      progressAnim.setValue(0);
      setIsImageLoaded(currentStatus.mediaType === 'TEXT' || !currentStatus.mediaUrl);
      setImageLoadError(false);
    }
  }, [currentIndex, currentStatus, progressAnim]);

  // Parse structured overlay data (text overlay, fonts, colors, and SVG drawing paths)
  const { statusOverlay, displayCaption } = useMemo(() => {
    if (!currentStatus?.caption) return { statusOverlay: null, displayCaption: '' };
    try {
      if (currentStatus.caption.trim().startsWith('{')) {
        const parsed = JSON.parse(currentStatus.caption);
        if (parsed && typeof parsed === 'object') {
          return {
            statusOverlay: parsed,
            displayCaption: parsed.userCaption || '',
          };
        }
      }
    } catch {}
    return { statusOverlay: null, displayCaption: currentStatus.caption };
  }, [currentStatus?.caption]);

  // Mark status as seen when viewed
  useEffect(() => {
    if (visible && currentStatus?.id) {
      markStatusAsSeen(currentStatus.id);
      statusesApi.getStatusById(currentStatus.id).catch(() => {});
    }
  }, [visible, currentStatus?.id, markStatusAsSeen]);

  // Handle Next story
  const handleNext = useCallback(() => {
    if (currentIndex < localStatuses.length - 1) {
      elapsedFractionRef.current = 0;
      progressAnim.setValue(0);
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  }, [currentIndex, localStatuses.length, onClose, progressAnim]);

  // Handle Previous story
  const handlePrev = useCallback(() => {
    elapsedFractionRef.current = 0;
    progressAnim.setValue(0);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex, progressAnim]);

  // Progress Bar Animation Controller con soporte de pausa/reanudación y carga de imagen
  useEffect(() => {
    if (!visible || !currentStatus) return;

    if (isPaused || isHolding || isOptionsOpen || isConfirmDeleteOpen || !isImageLoaded) {
      animRef.current?.stop();
      return;
    }

    const currentVal = elapsedFractionRef.current;
    const remainingDuration = Math.max(200, (1 - currentVal) * STORY_DURATION_MS);

    const anim = Animated.timing(progressAnim, {
      toValue: 1,
      duration: remainingDuration,
      useNativeDriver: false,
    });

    animRef.current = anim;

    anim.start(({ finished }) => {
      if (finished) {
        elapsedFractionRef.current = 0;
        handleNext();
      }
    });

    return () => {
      anim.stop();
    };
  }, [
    visible,
    currentStatus,
    currentIndex,
    isPaused,
    isHolding,
    isOptionsOpen,
    isConfirmDeleteOpen,
    isImageLoaded,
    handleNext,
    progressAnim,
  ]);

  // Options Sheet (...)
  const handleOptionsPress = () => {
    setIsPaused(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsOptionsOpen(true);
  };

  const closeOptions = () => {
    setIsOptionsOpen(false);
    setIsPaused(false);
  };

  const closeConfirmDelete = () => {
    setIsConfirmDeleteOpen(false);
    setIsPaused(false);
  };

  const handleDeleteStatus = async () => {
    if (!currentStatus) return;
    try {
      setIsDeleting(true);
      await statusesApi.deleteStatus(currentStatus.id);
      toast.success('Estado Eliminado', 'El estado ha sido retirado.');
      const remaining = localStatuses.filter((s) => s.id !== currentStatus.id);
      setIsConfirmDeleteOpen(false);
      setIsPaused(false);
      if (remaining.length === 0) {
        onClose();
      } else {
        setLocalStatuses(remaining);
        setCurrentIndex((prev) => Math.min(prev, remaining.length - 1));
      }
      onStoryUpdated?.();
    } catch (err: any) {
      toast.error('Error al eliminar', err.message || 'No se pudo eliminar el estado.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleLike = async () => {
    if (!currentStatus) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const nextLiked = !isLikedByMe;
    setIsLikedByMe(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    try {
      await statusesApi.reactToStatus(currentStatus.id, 'LIKE');
    } catch {
      // Revertir si falla
      setIsLikedByMe(!nextLiked);
      setLikesCount((prev) => (!nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  const handleContactSeller = () => {
    if (!storyGroup) return;
    const name = storyGroup.businessName || storyGroup.authorName;
    const msg = `¡Hola ${name}! He visto tu estado en Yewi y me gustaría pedirte información sobre tus servicios.`;
    onClose();
    if (onOpenChatWithUser) {
      onOpenChatWithUser(storyGroup.authorId, name, msg);
    } else {
      router.push({
        pathname: '/chat',
        params: {
          targetUserId: storyGroup.authorId,
          targetName: name,
          initialMessage: msg,
        },
      });
    }
  };

  const togglePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsPaused((prev) => !prev);
  };

  if (!visible || !storyGroup || !currentStatus) {
    return null;
  }

  // Calculate clean relative time
  const timeAgo = (() => {
    try {
      const diffMs = Date.now() - new Date(currentStatus.createdAt).getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffMinutes < 60) return `${Math.max(diffMinutes, 1)}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  })();

  const authorName = storyGroup.businessName || storyGroup.authorName || 'Profesional';
  const authorAvatar = storyGroup.authorAvatar;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        {/* Full-bleed Media Background (Image, Video, or Text) */}
        <View style={styles.mediaContainer}>
          {currentStatus.mediaType === 'TEXT' || !currentStatus.mediaUrl ? (
            <View
              style={[
                styles.textStatusBg,
                { backgroundColor: currentStatus.backgroundColor || '#1E1B4B' },
              ]}
            >
              <Text style={styles.textStatusContent}>{displayCaption}</Text>
            </View>
          ) : (
            <>
              {/* Spinner mientras descarga la imagen de la red */}
              {!isImageLoaded && !imageLoadError && (
                <View style={styles.imageLoadingBox}>
                  <ActivityIndicator size="large" color="#10B981" />
                </View>
              )}

              {/* Mensaje de error si la imagen no se puede descargar */}
              {imageLoadError ? (
                <View style={styles.imageErrorBox}>
                  <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                  <Text style={styles.imageErrorText}>No se pudo cargar la imagen</Text>
                  <Text style={styles.imageErrorSub}>Toca la pantalla para continuar</Text>
                </View>
              ) : (
                <Image
                  source={{ uri: currentStatus.mediaUrl }}
                  style={styles.fullMedia}
                  contentFit="contain"
                  onLoadEnd={() => setIsImageLoaded(true)}
                  onError={() => {
                    setIsImageLoaded(true);
                    setImageLoadError(true);
                  }}
                />
              )}

              {/* Non-Destructive Active Filter Overlay */}
              {statusOverlay?.filter && (
                <>
                  {statusOverlay.filter === 'vivid' && (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 120, 0, 0.09)' }]} pointerEvents="none" />
                  )}
                  {statusOverlay.filter === 'warm' && (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 180, 50, 0.16)' }]} pointerEvents="none" />
                  )}
                  {statusOverlay.filter === 'cool' && (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 160, 255, 0.14)' }]} pointerEvents="none" />
                  )}
                  {statusOverlay.filter === 'bw' && (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.55)' }]} pointerEvents="none" />
                  )}
                  {statusOverlay.filter === 'vintage' && (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(160, 120, 60, 0.22)' }]} pointerEvents="none" />
                  )}
                  {statusOverlay.filter === 'drama' && (
                    <>
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20, 0, 40, 0.25)' }]} pointerEvents="none" />
                      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                        <Defs>
                          <LinearGradient id="dramaVignetteViewer" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0%" stopColor="#000000" stopOpacity="0.5" />
                            <Stop offset="25%" stopColor="#000000" stopOpacity="0.0" />
                            <Stop offset="75%" stopColor="#000000" stopOpacity="0.0" />
                            <Stop offset="100%" stopColor="#000000" stopOpacity="0.65" />
                          </LinearGradient>
                        </Defs>
                        <Rect width="100%" height="100%" fill="url(#dramaVignetteViewer)" />
                      </Svg>
                    </>
                  )}
                </>
              )}

              {/* Render Drawing/Paint Strokes if present */}
              {statusOverlay?.paths && statusOverlay.paths.length > 0 && (
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                  <Svg
                    viewBox={`0 0 ${statusOverlay.canvasWidth || SCREEN_WIDTH} ${statusOverlay.canvasHeight || Math.round(SCREEN_HEIGHT * 0.75)}`}
                    style={StyleSheet.absoluteFill}
                  >
                    {statusOverlay.paths.map((p: any, i: number) => (
                      <Path
                        key={i}
                        d={p.d}
                        stroke={p.color}
                        strokeWidth={5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    ))}
                  </Svg>
                </View>
              )}


            </>
          )}

          {/* Subtle Top & Bottom Gradient Vignette for crisp readability */}
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
            <Defs>
              <LinearGradient id="vignette" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#000000" stopOpacity="0.55" />
                <Stop offset="18%" stopColor="#000000" stopOpacity="0.0" />
                <Stop offset="65%" stopColor="#000000" stopOpacity="0.0" />
                <Stop offset="100%" stopColor="#000000" stopOpacity="0.85" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#vignette)" />
          </Svg>

          {/* Tap Zones for Next / Previous Navigation (Hold down to pause and hide UI) */}
          <ThemedTouchable
            onPress={handlePrev}
            onLongPress={() => {
              setIsHolding(true);
              setIsPaused(true);
            }}
            onPressOut={() => {
              setIsHolding(false);
              setIsPaused(false);
            }}
            haptic="none"
            style={styles.leftTapZone}
          />
          <ThemedTouchable
            onPress={handleNext}
            onLongPress={() => {
              setIsHolding(true);
              setIsPaused(true);
            }}
            onPressOut={() => {
              setIsHolding(false);
              setIsPaused(false);
            }}
            haptic="none"
            style={styles.rightTapZone}
          />
        </View>

        {/* Top Controls Overlay: Barras de progreso segmentadas + Cabecera de Autor */}
        <Animated.View
          style={[
            styles.topControlsOverlay,
            {
              paddingTop: Math.max(insets.top + 6, 12),
              opacity: isHolding ? 0 : 1,
            },
          ]}
          pointerEvents="box-none"
        >
          {/* 1. Segmented Story Progress Bars (WhatsApp / Instagram Standard) */}
          <View style={styles.progressSegmentsRow}>
            {localStatuses.map((st, idx) => {
              const isCompleted = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              return (
                <View key={st.id || idx} style={styles.segmentTrack}>
                  {isCompleted ? (
                    <View style={[styles.segmentFill, { width: '100%' }]} />
                  ) : isCurrent ? (
                    <Animated.View
                      style={[
                        styles.segmentFill,
                        {
                          width: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                            extrapolate: 'clamp',
                          }),
                        },
                      ]}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>

          {/* 2. Top Author Header Row */}
          <View style={styles.topAuthorHeaderRow}>
            <View style={styles.authorHeaderLeft}>
              <View style={styles.authorAvatarCircle}>
                {authorAvatar ? (
                  <Image
                    source={{ uri: authorAvatar }}
                    style={styles.authorAvatarImg}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.authorFallbackAvatar}>
                    <Text style={styles.authorFallbackText}>
                      {authorName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.authorTextColumn}>
                <Text numberOfLines={1} style={styles.authorNameText}>
                  {authorName}
                </Text>
                {Boolean(timeAgo) && (
                  <Text style={styles.timeAgoText}>{timeAgo}</Text>
                )}
              </View>
            </View>

            {/* Right: Options (...) and Close (X) */}
            <View style={styles.topActionsRight}>
              <ThemedTouchable
                onPress={handleOptionsPress}
                haptic="light"
                style={styles.circularGlassButton}
                accessibilityRole="button"
                accessibilityLabel="Opciones"
              >
                <Ionicons name="ellipsis-horizontal" size={18} color="#FFFFFF" />
              </ThemedTouchable>

              <ThemedTouchable
                onPress={onClose}
                haptic="light"
                style={styles.circularGlassButton}
                accessibilityRole="button"
                accessibilityLabel="Cerrar estado"
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </ThemedTouchable>
            </View>
          </View>
        </Animated.View>

        {/* Bottom Section: Caption + Action Bar */}
        <Animated.View
          style={[
            styles.bottomContainer,
            {
              paddingBottom: Math.max(insets.bottom + 12, 22),
              opacity: isHolding ? 0 : 1,
            },
          ]}
          pointerEvents="box-none"
        >
          {/* Optional Image Caption Badge */}
          {Boolean(displayCaption && currentStatus.mediaUrl && currentStatus.mediaType !== 'TEXT') && (
            <View style={styles.captionWrap}>
              <Text style={styles.captionText} numberOfLines={3}>
                {displayCaption}
              </Text>
            </View>
          )}

          {/* Contextual Action Row */}
          <View style={styles.bottomActionRow}>
            {isAuthor ? (
              /* Vista del Autor: Contador de Vistas + Botón de Eliminar */
              <View style={styles.authorStatsRow}>
                <View style={styles.viewsBadge}>
                  <Ionicons name="eye-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.viewsCountText}>
                    {currentStatus.viewCount || 0} {currentStatus.viewCount === 1 ? 'vista' : 'vistas'}
                  </Text>
                </View>

                <ThemedTouchable
                  onPress={() => {
                    setIsOptionsOpen(false);
                    setIsConfirmDeleteOpen(true);
                  }}
                  haptic="medium"
                  style={styles.deleteQuickBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Eliminar estado"
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </ThemedTouchable>
              </View>
            ) : (
              /* Vista del Cliente: Chatear con Profesional + Botón Me Gusta */
              <View style={styles.clientEngagementRow}>
                <ThemedTouchable
                  onPress={handleContactSeller}
                  haptic="medium"
                  style={styles.replyButton}
                  accessibilityRole="button"
                  accessibilityLabel="Contactar con el profesional"
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.replyButtonText} numberOfLines={1}>
                    Chatear con {storyGroup?.businessName || storyGroup?.authorName}
                  </Text>
                </ThemedTouchable>

                <ThemedTouchable
                  onPress={handleToggleLike}
                  haptic="medium"
                  style={[styles.likeButton, isLikedByMe && styles.likeButtonActive]}
                  accessibilityRole="button"
                  accessibilityLabel={isLikedByMe ? 'Quitar me gusta' : 'Me gusta'}
                >
                  <Ionicons
                    name={isLikedByMe ? 'heart' : 'heart-outline'}
                    size={22}
                    color={isLikedByMe ? '#EF4444' : '#FFFFFF'}
                  />
                  {likesCount > 0 && (
                    <Text style={[styles.likeCountText, isLikedByMe && { color: '#EF4444' }]}>
                      {likesCount}
                    </Text>
                  )}
                </ThemedTouchable>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Options BottomSheet (Mobbin Shop Style) */}
        {isOptionsOpen && (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* Backdrop Dismiss */}
            <Reanimated.View
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(140)}
              style={StyleSheet.absoluteFill}
            >
              <Pressable
                style={styles.sheetBackdrop}
                onPress={closeOptions}
                accessibilityRole="button"
                accessibilityLabel="Cerrar opciones"
              />
            </Reanimated.View>

            {/* Floating Detached Bottom Sheet Card */}
            <View style={styles.bottomSheetWrapper} pointerEvents="box-none">
              <Reanimated.View
                entering={SlideInDown.duration(200).easing(Easing.out(Easing.cubic))}
                exiting={SlideOutDown.duration(150).easing(Easing.in(Easing.cubic))}
                style={[
                  styles.floatingSheetCard,
                  { paddingBottom: Math.max(insets.bottom + 16, 28) },
                ]}
              >
                {/* Drag Indicator Handle (Pill) */}
                <View style={styles.sheetDragHandleWrapper}>
                  <View style={styles.sheetDragHandlePill} />
                </View>

                {/* Header: Title & Circular Close Button */}
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Opciones</Text>
                  <ThemedTouchable
                    onPress={closeOptions}
                    haptic="light"
                    style={styles.sheetCloseButton}
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar opciones"
                  >
                    <Ionicons name="close" size={15} color="#A1A1AA" />
                  </ThemedTouchable>
                </View>

                {/* Options List */}
                <View style={styles.sheetOptionsList}>
                  {isAuthor ? (
                    <>
                      {/* Author Option: Share */}
                      <ThemedTouchable
                        onPress={async () => {
                          closeOptions();
                          try {
                            await Share.share({
                              message: `Mira mi estado en Yewi: ${storyGroup?.businessName || storyGroup?.authorName}`,
                            });
                          } catch {}
                        }}
                        haptic="selection"
                        style={styles.optionRow}
                        accessibilityRole="button"
                        accessibilityLabel="Compartir estado"
                      >
                        <Ionicons
                          name="share-social-outline"
                          size={24}
                          color="#F9FAFB"
                          style={styles.optionIcon}
                        />
                        <Text style={styles.optionLabel}>Compartir estado</Text>
                      </ThemedTouchable>

                      {/* Author Option: Delete */}
                      <ThemedTouchable
                        onPress={() => {
                          setIsOptionsOpen(false);
                          setIsConfirmDeleteOpen(true);
                        }}
                        haptic="medium"
                        style={styles.optionRow}
                        accessibilityRole="button"
                        accessibilityLabel="Eliminar estado"
                      >
                        <Ionicons
                          name="trash-outline"
                          size={24}
                          color="#DC2626"
                          style={styles.optionIcon}
                        />
                        <Text style={[styles.optionLabel, { color: '#DC2626' }]}>
                          Eliminar estado
                        </Text>
                      </ThemedTouchable>
                    </>
                  ) : (
                    <>
                      {/* Non-Author Option: Contact */}
                      <ThemedTouchable
                        onPress={() => {
                          closeOptions();
                          handleContactSeller();
                        }}
                        haptic="selection"
                        style={styles.optionRow}
                        accessibilityRole="button"
                        accessibilityLabel="Contactar por chat"
                      >
                        <Ionicons
                          name="chatbubble-ellipses-outline"
                          size={24}
                          color="#F9FAFB"
                          style={styles.optionIcon}
                        />
                        <Text style={styles.optionLabel}>Contactar por chat</Text>
                      </ThemedTouchable>

                      {/* Non-Author Option: View Profile */}
                      <ThemedTouchable
                        onPress={() => {
                          closeOptions();
                          onClose();
                          router.push({
                            pathname: '/detail',
                            params: { id: storyGroup.authorId, entityType: 'professional' },
                          });
                        }}
                        haptic="selection"
                        style={styles.optionRow}
                        accessibilityRole="button"
                        accessibilityLabel="Ver perfil profesional"
                      >
                        <Ionicons
                          name="person-outline"
                          size={24}
                          color="#F9FAFB"
                          style={styles.optionIcon}
                        />
                        <Text style={styles.optionLabel}>Ver perfil profesional</Text>
                      </ThemedTouchable>

                      {/* Non-Author Option: Share */}
                      <ThemedTouchable
                        onPress={async () => {
                          closeOptions();
                          try {
                            await Share.share({
                              message: `Mira este estado de ${storyGroup?.businessName || storyGroup?.authorName} en Yewi`,
                            });
                          } catch {}
                        }}
                        haptic="selection"
                        style={styles.optionRow}
                        accessibilityRole="button"
                        accessibilityLabel="Compartir estado"
                      >
                        <Ionicons
                          name="share-social-outline"
                          size={24}
                          color="#F9FAFB"
                          style={styles.optionIcon}
                        />
                        <Text style={styles.optionLabel}>Compartir estado</Text>
                      </ThemedTouchable>

                      {/* Non-Author Option: Report */}
                      <ThemedTouchable
                        onPress={() => {
                          closeOptions();
                          toast.success('Estado reportado', 'Gracias por avisarnos. Lo revisaremos.');
                        }}
                        haptic="medium"
                        style={styles.optionRow}
                        accessibilityRole="button"
                        accessibilityLabel="Reportar estado"
                      >
                        <Ionicons
                          name="flag-outline"
                          size={24}
                          color="#DC2626"
                          style={styles.optionIcon}
                        />
                        <Text style={[styles.optionLabel, { color: '#DC2626' }]}>
                          Reportar estado
                        </Text>
                      </ThemedTouchable>
                    </>
                  )}
                </View>
              </Reanimated.View>
            </View>
          </View>
        )}

        {/* Delete Confirmation BottomSheet (Shop Dual Pill Buttons Style) */}
        {isConfirmDeleteOpen && (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <Reanimated.View
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(140)}
              style={StyleSheet.absoluteFill}
            >
              <Pressable
                style={styles.sheetBackdrop}
                onPress={closeConfirmDelete}
                accessibilityRole="button"
                accessibilityLabel="Cerrar confirmación"
              />
            </Reanimated.View>

            <View style={styles.bottomSheetWrapper} pointerEvents="box-none">
              <Reanimated.View
                entering={SlideInDown.duration(200).easing(Easing.out(Easing.cubic))}
                exiting={SlideOutDown.duration(150).easing(Easing.in(Easing.cubic))}
                style={[
                  styles.floatingSheetCard,
                  { paddingBottom: Math.max(insets.bottom + 16, 28) },
                ]}
              >
                {/* Drag Indicator Handle (Pill) */}
                <View style={styles.sheetDragHandleWrapper}>
                  <View style={styles.sheetDragHandlePill} />
                </View>

                {/* Header */}
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>¿Eliminar este estado?</Text>
                  <ThemedTouchable
                    onPress={closeConfirmDelete}
                    haptic="light"
                    style={styles.sheetCloseButton}
                    accessibilityRole="button"
                    accessibilityLabel="Cancelar"
                  >
                    <Ionicons name="close" size={15} color="#A1A1AA" />
                  </ThemedTouchable>
                </View>

                {/* Message */}
                <Text style={styles.confirmMessage}>
                  Esta acción retirará el estado de tu feed de forma permanente y no se puede deshacer.
                </Text>

                {/* Dual Pill Action Buttons */}
                <View style={styles.dualPillRow}>
                  <ThemedTouchable
                    onPress={closeConfirmDelete}
                    haptic="light"
                    disabled={isDeleting}
                    style={styles.cancelPillButton}
                    accessibilityRole="button"
                    accessibilityLabel="Cancelar"
                  >
                    <Text style={styles.cancelPillText}>Cancelar</Text>
                  </ThemedTouchable>

                  <ThemedTouchable
                    onPress={handleDeleteStatus}
                    haptic="heavy"
                    disabled={isDeleting}
                    style={styles.deletePillButton}
                    accessibilityRole="button"
                    accessibilityLabel="Eliminar estado"
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.deletePillText}>Eliminar</Text>
                    )}
                  </ThemedTouchable>
                </View>
              </Reanimated.View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000000',
  },
  mediaContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullMedia: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  textStatusBg: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  textStatusContent: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  leftTapZone: {
    position: 'absolute',
    left: 0,
    top: 100,
    bottom: 160,
    width: SCREEN_WIDTH * 0.32,
  },
  rightTapZone: {
    position: 'absolute',
    right: 0,
    top: 100,
    bottom: 160,
    width: SCREEN_WIDTH * 0.68,
  },
  imageLoadingBox: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageErrorBox: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  imageErrorText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
    marginTop: 14,
  },
  imageErrorSub: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Medium',
    marginTop: 6,
  },
  topControlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 25,
    paddingHorizontal: 12,
  },
  progressSegmentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  segmentTrack: {
    flex: 1,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  segmentFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  topAuthorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  authorHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  topActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circularGlassButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 20,
  },
  authorAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#1E1B4B',
  },
  authorAvatarImg: {
    width: '100%',
    height: '100%',
  },
  authorFallbackAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorFallbackText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },
  authorTextColumn: {
    justifyContent: 'center',
    flex: 1,
  },
  authorNameText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -0.2,
  },
  timeAgoText: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    marginTop: 1,
  },
  captionWrap: {
    marginBottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    alignSelf: 'flex-start',
    maxWidth: '92%',
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans-Medium',
    lineHeight: 18,
  },
  bottomActionRow: {
    width: '100%',
  },
  authorStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  viewsCountText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  deleteQuickBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientEngagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  replyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 14,
  },
  replyButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans-Medium',
    flex: 1,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 44,
    minWidth: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
  },
  likeButtonActive: {
    borderColor: 'rgba(239, 68, 68, 0.6)',
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
  },
  likeCountText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  bottomSheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 0,
    zIndex: 50,
  },
  floatingSheetCard: {
    width: '100%',
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingTop: 8,
    paddingHorizontal: 22,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 20,
  },
  sheetDragHandleWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    marginBottom: 8,
  },
  sheetDragHandlePill: {
    width: 38,
    height: 4.5,
    borderRadius: 999,
    backgroundColor: '#48484A',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#F9FAFB',
    letterSpacing: -0.3,
  },
  sheetCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2A2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOptionsList: {
    gap: 4,
    paddingTop: 2,
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
    color: '#F9FAFB',
    letterSpacing: -0.2,
  },
  confirmMessage: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#9CA3AF',
    lineHeight: 20,
    marginBottom: 22,
  },
  dualPillRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  cancelPillButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#3F3F46',
    backgroundColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelPillText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#F9FAFB',
  },
  deletePillButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletePillText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
  },

});

export default StatusViewerModal;
