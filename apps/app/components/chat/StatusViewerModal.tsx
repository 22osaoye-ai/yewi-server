import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { AuthorStatusFeedGroup, StatusItem, statusesApi } from '@/services/statusesApi';
import { realtimeService } from '@/services/realtimeService';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuthStore } from '@/store/useAuthStore';
import { useSeenStatusesStore } from '@/store/useSeenStatusesStore';
import { toast } from '@/store/useToastStore';
import { Alert } from 'react-native';

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
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();
  const markStatusAsSeen = useSeenStatusesStore((state) => state.markStatusAsSeen);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [showCommentsList, setShowCommentsList] = useState(false);
  const [localStatuses, setLocalStatuses] = useState<StatusItem[]>([]);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  const isAuthor = Boolean(user?.id && storyGroup?.authorId === user.id);
  const shouldPause = isPaused || isTyping || showCommentsList || Boolean(commentText.trim());

  useEffect(() => {
    if (storyGroup?.statuses) {
      setLocalStatuses(storyGroup.statuses);
      setCurrentIndex(0);
    }
  }, [storyGroup]);

  // Realtime listeners for active story comments & likes
  useEffect(() => {
    if (!visible) return;

    const unsubComment = realtimeService.on('status:comment:new', (data) => {
      if (data?.statusId && data?.comment) {
        setLocalStatuses((prev) =>
          prev.map((s) =>
            s.id === data.statusId && !s.comments.some((c) => c.id === data.comment.id)
              ? {
                  ...s,
                  commentsCount: s.commentsCount + 1,
                  comments: [...s.comments, data.comment],
                }
              : s
          )
        );
      }
    });

    const unsubReaction = realtimeService.on('status:reaction:update', (data) => {
      if (data?.statusId) {
        setLocalStatuses((prev) =>
          prev.map((s) =>
            s.id === data.statusId
              ? {
                  ...s,
                  likesCount: data.likesCount,
                  isLikedByMe: data.userId === user?.id ? Boolean(data.reactionType) : s.isLikedByMe,
                }
              : s
          )
        );
      }
    });

    const unsubView = realtimeService.on('status:view:update', (data) => {
      if (data?.statusId) {
        setLocalStatuses((prev) =>
          prev.map((s) =>
            s.id === data.statusId
              ? { ...s, viewCount: data.viewCount }
              : s
          )
        );
      }
    });

    return () => {
      unsubComment();
      unsubReaction();
      unsubView();
    };
  }, [visible, user?.id]);

  const currentStatus: StatusItem | undefined = localStatuses[currentIndex];

  // Mark viewed status in local tracking and record on server
  useEffect(() => {
    if (visible && currentStatus?.id) {
      markStatusAsSeen(currentStatus.id);
      if (currentStatus.authorId !== user?.id) {
        statusesApi.getStatusById(currentStatus.id).catch(() => {});
      }
    }
  }, [visible, currentStatus?.id, markStatusAsSeen, user?.id]);

  const startProgress = useCallback(() => {
    progressAnim.setValue(0);
    animRef.current?.stop();

    animRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION_MS,
      useNativeDriver: false,
    });

    animRef.current.start(({ finished }) => {
      if (finished && !shouldPause) {
        handleNext();
      }
    });
  }, [currentIndex, shouldPause, localStatuses.length]);

  useEffect(() => {
    if (visible && currentStatus && !shouldPause) {
      startProgress();
    } else {
      animRef.current?.stop();
    }

    return () => {
      animRef.current?.stop();
    };
  }, [visible, currentIndex, shouldPause, currentStatus]);

  const handleNext = () => {
    if (currentIndex < localStatuses.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      progressAnim.setValue(0);
      startProgress();
    }
  };

  const calculateTimeRemaining = (expiresAt: string | Date) => {
    if (!expiresAt) return '24h';
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    if (diffMs <= 0) return 'Expirado';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const handleDeleteStatus = () => {
    if (!currentStatus) return;
    setIsPaused(true);
    Alert.alert(
      'Eliminar Estado',
      '¿Deseas eliminar este estado publicado? Los clientes ya no podrán verlo.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => setIsPaused(false),
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await statusesApi.deleteStatus(currentStatus.id);
              toast.success('Estado Eliminado', 'El estado ha sido retirado.');
              const remaining = localStatuses.filter((s) => s.id !== currentStatus.id);
              if (remaining.length === 0) {
                onClose();
              } else {
                setLocalStatuses(remaining);
                setCurrentIndex((prev) => Math.min(prev, remaining.length - 1));
              }
              onStoryUpdated?.();
            } catch (err: any) {
              toast.error('Error al eliminar', err.message || 'No se pudo eliminar el estado.');
              setIsPaused(false);
            }
          },
        },
      ]
    );
  };

  const handleLikeToggle = async () => {
    if (!currentStatus) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    const wasLiked = currentStatus.isLikedByMe;
    const newLikesCount = wasLiked ? currentStatus.likesCount - 1 : currentStatus.likesCount + 1;

    setLocalStatuses((prev) =>
      prev.map((s, idx) =>
        idx === currentIndex
          ? {
              ...s,
              isLikedByMe: !wasLiked,
              likesCount: Math.max(newLikesCount, 0),
            }
          : s,
      ),
    );

    try {
      await statusesApi.reactToStatus(currentStatus.id, 'LIKE');
      onStoryUpdated?.();
    } catch {
      // Revert on error
      setLocalStatuses((prev) =>
        prev.map((s, idx) =>
          idx === currentIndex
            ? { ...s, isLikedByMe: wasLiked, likesCount: currentStatus.likesCount }
            : s,
        ),
      );
    }
  };

  const handleSendComment = async () => {
    const text = commentText.trim();
    if (!text || !currentStatus) return;

    try {
      setIsSendingComment(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

      const newComment = await statusesApi.addComment(currentStatus.id, text);
      setCommentText('');
      setIsTyping(false);

      setLocalStatuses((prev) =>
        prev.map((s, idx) =>
          idx === currentIndex
            ? {
                ...s,
                commentsCount: s.commentsCount + 1,
                comments: [...s.comments, newComment],
              }
            : s,
        ),
      );

      toast.success('Comentario Enviado', 'Tu respuesta ha sido enviada al profesional.');
      onStoryUpdated?.();
    } catch (err: any) {
      toast.error('Error al comentar', err.message || 'No se pudo enviar el comentario.');
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleContactSeller = () => {
    if (!storyGroup) return;
    const name = storyGroup.businessName || storyGroup.authorName;
    const msg = `Hola ${name}, te contacto sobre tu estado en Yewi.`;
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

  const handleReplyCommentInChat = (commentAuthorId: string, commentAuthorName: string, commentBody: string) => {
    const msg = `Hola ${commentAuthorName}, te respondo a tu comentario sobre mi estado: "${commentBody}"`;
    onClose();
    if (onOpenChatWithUser) {
      onOpenChatWithUser(commentAuthorId, commentAuthorName, msg);
    } else {
      router.push({
        pathname: '/chat',
        params: {
          targetUserId: commentAuthorId,
          targetName: commentAuthorName,
          initialMessage: msg,
        },
      });
    }
  };

  if (!visible || !storyGroup || !currentStatus) {
    return null;
  }

  const timeAgo = (() => {
    try {
      const diffMs = Date.now() - new Date(currentStatus.createdAt).getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'hace unos minutos';
      if (diffHours === 1) return 'hace 1 h';
      return `hace ${diffHours} h`;
    } catch {
      return '';
    }
  })();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        {/* Story Background (Image or Text with color) */}
        <View style={styles.mediaContainer}>
          {currentStatus.mediaType === 'TEXT' || !currentStatus.mediaUrl ? (
            <View
              style={[
                styles.textStatusBg,
                { backgroundColor: currentStatus.backgroundColor || '#C87D20' },
              ]}
            >
              <Text style={styles.textStatusContent}>{currentStatus.caption}</Text>
            </View>
          ) : (
            <Image
              source={{ uri: currentStatus.mediaUrl }}
              style={styles.fullMedia}
              contentFit="cover"
            />
          )}

          {/* Caption Banner for images */}
          {currentStatus.mediaType !== 'TEXT' && Boolean(currentStatus.caption) && (
            <View style={styles.captionOverlay}>
              <Text style={styles.captionText}>{currentStatus.caption}</Text>
            </View>
          )}

          {/* Tap Zones for Navigation */}
          <ThemedTouchable
            onPress={handlePrev}
            onLongPress={() => setIsPaused(true)}
            onPressOut={() => setIsPaused(false)}
            haptic="none"
            style={styles.leftTapZone}
          />
          <ThemedTouchable
            onPress={handleNext}
            onLongPress={() => setIsPaused(true)}
            onPressOut={() => setIsPaused(false)}
            haptic="none"
            style={styles.rightTapZone}
          />
        </View>

        {/* Top Header Overlay */}
        <View style={[styles.topHeader, { paddingTop: Math.max(insets.top + 8, 20) }]}>
          {/* Segmented Progress Bars */}
          <View style={styles.progressBarsContainer}>
            {localStatuses.map((_, idx) => {
              let widthPercent = '0%';
              if (idx < currentIndex) {
                widthPercent = '100%';
              } else if (idx === currentIndex) {
                // animated
              }

              return (
                <View key={`prog-${idx}`} style={styles.progressBarTrack}>
                  {idx === currentIndex ? (
                    <Animated.View
                      style={[
                        styles.progressBarFill,
                        {
                          width: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                        },
                      ]}
                    />
                  ) : (
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: widthPercent as any },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>

          {/* Author Info Bar */}
          <View style={styles.authorBar}>
            <View style={styles.authorInfo}>
              <View style={styles.authorAvatarWrap}>
                {storyGroup.authorAvatar ? (
                  <Image
                    source={{ uri: storyGroup.authorAvatar }}
                    style={styles.authorAvatar}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.authorPlaceholder}>
                    <Text style={styles.authorInitials}>
                      {(storyGroup.businessName || storyGroup.authorName || 'Y')
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              <View>
                <View style={styles.nameRow}>
                  <Text numberOfLines={1} style={styles.authorNameText}>
                    {storyGroup.businessName || storyGroup.authorName}
                  </Text>
                  {storyGroup.isPro && (
                    <View style={styles.proChip}>
                      <Text style={styles.proChipText}>PRO</Text>
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.timeAgoText}>
                    {timeAgo} {storyGroup.category ? `· ${storyGroup.category}` : ''}
                  </Text>
                  {/* 24h Expiration Badge */}
                  <View style={styles.expiryChip}>
                    <Ionicons name="time-outline" size={11} color="#F59E0B" />
                    <Text style={styles.expiryChipText}>
                      {calculateTimeRemaining(currentStatus.expiresAt)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* Author Delete Status Button */}
              {isAuthor && (
                <ThemedTouchable
                  onPress={handleDeleteStatus}
                  haptic="medium"
                  style={styles.deleteHeaderBtn}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </ThemedTouchable>
              )}

              {/* Close Button */}
              <ThemedTouchable onPress={onClose} haptic="light" style={styles.closeBtn}>
                <Ionicons name="close" size={26} color="#FFFFFF" />
              </ThemedTouchable>
            </View>
          </View>
        </View>

        {/* Bottom Interaction Bar */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.bottomBarWrapper}
        >
          {isAuthor ? (
            /* Author Analytics Bar */
            <View style={[styles.authorAnalyticsBar, { paddingBottom: Math.max(insets.bottom + 8, 20) }]}>
              <ThemedTouchable
                onPress={() => {
                  setIsPaused(true);
                  setShowCommentsList(true);
                }}
                haptic="light"
                style={styles.analyticsStatItem}
              >
                <Ionicons name="eye-outline" size={18} color="#38BDF8" />
                <Text style={styles.analyticsStatValue}>{currentStatus.viewCount || 0}</Text>
                <Text style={styles.analyticsStatLabel}>vistas</Text>
              </ThemedTouchable>

              <View style={styles.analyticsDivider} />

              <View style={styles.analyticsStatItem}>
                <Ionicons name="heart" size={18} color="#EF4444" />
                <Text style={styles.analyticsStatValue}>{currentStatus.likesCount || 0}</Text>
                <Text style={styles.analyticsStatLabel}>me gusta</Text>
              </View>

              <View style={styles.analyticsDivider} />

              <ThemedTouchable
                onPress={() => {
                  setIsPaused(true);
                  setShowCommentsList(true);
                }}
                haptic="medium"
                style={styles.analyticsStatItem}
              >
                <Ionicons name="chatbubbles-outline" size={18} color="#10B981" />
                <Text style={styles.analyticsStatValue}>
                  {currentStatus.commentsCount || currentStatus.comments?.length || 0}
                </Text>
                <Text style={styles.analyticsStatLabel}>respuestas</Text>
              </ThemedTouchable>
            </View>
          ) : (
            /* Client Viewer Interactive Bar */
            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 8, 20) }]}>
              {/* Quick Contact Seller Pill */}
              <ThemedTouchable
                onPress={handleContactSeller}
                haptic="medium"
                style={styles.contactSellerBtn}
              >
                <Ionicons name="chatbubble-ellipses" size={17} color="#FFFFFF" />
                <Text style={styles.contactSellerBtnText}>Contactar</Text>
              </ThemedTouchable>

              {/* Comment Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder={`Responder a ${storyGroup.businessName || storyGroup.authorName}...`}
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={commentText}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => {
                    if (!commentText.trim()) setIsTyping(false);
                  }}
                  onChangeText={(text) => {
                    setCommentText(text);
                    setIsTyping(Boolean(text.trim()));
                  }}
                  style={styles.commentInput}
                />
                {Boolean(commentText.trim()) && (
                  <ThemedTouchable
                    onPress={handleSendComment}
                    disabled={isSendingComment}
                    haptic="medium"
                    style={styles.sendCommentBtn}
                  >
                    {isSendingComment ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="arrow-up" size={16} color="#FFFFFF" />
                    )}
                  </ThemedTouchable>
                )}
              </View>

              {/* Like Heart Button */}
              <ThemedTouchable
                onPress={handleLikeToggle}
                haptic="medium"
                style={[
                  styles.actionBtn,
                  currentStatus.isLikedByMe && styles.actionBtnLiked,
                ]}
              >
                <Ionicons
                  name={currentStatus.isLikedByMe ? 'heart' : 'heart-outline'}
                  size={24}
                  color={currentStatus.isLikedByMe ? '#EF4444' : '#FFFFFF'}
                />
                {currentStatus.likesCount > 0 && (
                  <Text style={styles.actionBadgeText}>{currentStatus.likesCount}</Text>
                )}
              </ThemedTouchable>

              {/* Comments List Opener */}
              <ThemedTouchable
                onPress={() => {
                  setIsPaused(true);
                  setShowCommentsList(!showCommentsList);
                }}
                haptic="light"
                style={styles.actionBtn}
              >
                <Feather name="message-circle" size={22} color="#FFFFFF" />
                {currentStatus.commentsCount > 0 && (
                  <Text style={styles.actionBadgeText}>{currentStatus.commentsCount}</Text>
                )}
              </ThemedTouchable>
            </View>
          )}
        </KeyboardAvoidingView>

        {/* Comments Drawer Modal */}
        {showCommentsList && (
          <View style={styles.commentsDrawer}>
            <View style={styles.commentsHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="chatbubbles" size={18} color={colors.primary} />
                <Text style={[styles.commentsTitle, { color: colors.textPrimary }]}>
                  Respuestas ({currentStatus.comments?.length || 0})
                </Text>
              </View>
              <ThemedTouchable
                onPress={() => {
                  setShowCommentsList(false);
                  setIsPaused(false);
                }}
                haptic="light"
                style={{ padding: 4 }}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </ThemedTouchable>
            </View>

            <FlatList
              data={currentStatus.comments || []}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 280 }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 12 }}
              ListEmptyComponent={() => (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <Ionicons name="chatbubble-outline" size={32} color={colors.textMuted} style={{ marginBottom: 6 }} />
                  <Text style={[styles.emptyCommentsText, { color: colors.textMuted }]}>
                    No hay comentarios aún en este estado.
                  </Text>
                </View>
              )}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.commentRow,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.commentAvatarWrap}>
                    {item.authorAvatar ? (
                      <Image
                        source={{ uri: item.authorAvatar }}
                        style={styles.commentAvatar}
                      />
                    ) : (
                      <View
                        style={[
                          styles.commentAvatarPlaceholder,
                          { backgroundColor: colors.primaryLight },
                        ]}
                      >
                        <Text style={{ fontSize: 11, fontFamily: 'Satoshi-Bold', color: colors.primary }}>
                          {item.authorName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={[styles.commentAuthorName, { color: colors.textPrimary }]}>
                        {item.authorName}
                      </Text>
                    </View>
                    <Text style={[styles.commentBody, { color: colors.textSecondary }]}>
                      {item.content}
                    </Text>

                    {/* Direct Button for Author to respond via Chat */}
                    {isAuthor && item.authorId !== user?.id && (
                      <ThemedTouchable
                        onPress={() => handleReplyCommentInChat(item.authorId, item.authorName, item.content)}
                        haptic="medium"
                        style={[styles.replyInChatBtn, { backgroundColor: colors.primary }]}
                      >
                        <Ionicons name="chatbubble-ellipses-outline" size={13} color="#FFFFFF" />
                        <Text style={styles.replyInChatBtnText}>Responder en Chat</Text>
                      </ThemedTouchable>
                    )}
                  </View>
                </View>
              )}
            />
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
    ...StyleSheet.absoluteFillObject,
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
    fontSize: 26,
    fontFamily: 'Satoshi-Black',
    textAlign: 'center',
    lineHeight: 36,
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontFamily: 'Satoshi-Medium',
    lineHeight: 20,
  },
  leftTapZone: {
    position: 'absolute',
    left: 0,
    top: 100,
    bottom: 100,
    width: SCREEN_WIDTH * 0.35,
  },
  rightTapZone: {
    position: 'absolute',
    right: 0,
    top: 100,
    bottom: 100,
    width: SCREEN_WIDTH * 0.65,
  },
  topHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  progressBarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  progressBarTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  authorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  authorAvatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#C87D20',
    overflow: 'hidden',
  },
  authorAvatar: {
    width: '100%',
    height: '100%',
  },
  authorPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#C87D20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInitials: {
    color: '#FFFFFF',
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorNameText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontFamily: 'Satoshi-Bold',
    maxWidth: SCREEN_WIDTH * 0.55,
  },
  proChip: {
    backgroundColor: '#10B981',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  proChipText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontFamily: 'Satoshi-Black',
  },
  timeAgoText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11.5,
    fontFamily: 'Satoshi-Regular',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  contactSellerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#C87D20',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 21,
  },
  contactSellerBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Satoshi-Bold',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 21,
    paddingHorizontal: 14,
    height: 42,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  commentInput: {
    flex: 1,
    color: '#FFFFFF',
    fontFamily: 'Satoshi-Regular',
    fontSize: 13.5,
    padding: 0,
  },
  sendCommentBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#C87D20',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  actionBtnLiked: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  actionBadgeText: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#C87D20',
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Satoshi-Bold',
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  commentsDrawer: {
    position: 'absolute',
    bottom: 85,
    left: 16,
    right: 16,
    backgroundColor: '#1E2330',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2D3446',
    paddingTop: 12,
    paddingBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3446',
  },
  commentsTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Satoshi-Bold',
  },
  emptyCommentsText: {
    textAlign: 'center',
    fontSize: 12.5,
    fontFamily: 'Satoshi-Regular',
    paddingVertical: 12,
  },
  expiryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  expiryChipText: {
    color: '#F59E0B',
    fontSize: 10,
    fontFamily: 'Satoshi-Bold',
  },
  deleteHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAnalyticsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  analyticsStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  analyticsStatValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Satoshi-Bold',
  },
  analyticsStatLabel: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
    fontFamily: 'Satoshi-Regular',
  },
  analyticsDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  replyInChatBtn: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  replyInChatBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Satoshi-Bold',
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  commentAvatarWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
  },
  commentAvatar: {
    width: '100%',
    height: '100%',
  },
  commentAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAuthorName: {
    fontSize: 12.5,
    fontFamily: 'Satoshi-Bold',
  },
  commentBody: {
    fontSize: 12.5,
    fontFamily: 'Satoshi-Regular',
    marginTop: 2,
  },
});
