import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';
import { ChatMessage, AttachmentMeta } from '@/services/chatApi';
import { toast } from '@/store/useToastStore';

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  onLongPress: (message: ChatMessage) => void;
  onPressReaction: (message: ChatMessage, emoji: string) => void;
  onPressImage: (imageUrl: string, caption?: string | null) => void;
  currentUserId?: string;
  onSwipeReply?: (message: ChatMessage) => void;
  onPressReplyQuote?: (messageId: string) => void;
  isHighlighted?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_BUBBLE_WIDTH = SCREEN_WIDTH * 0.78;

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return 'Archivo';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MessageBubble({
  message,
  isMine,
  onLongPress,
  onPressReaction,
  onPressImage,
  currentUserId,
  onSwipeReply,
  onPressReplyQuote,
  isHighlighted = false,
}: MessageBubbleProps) {
  const { colors, isDark } = useAppTheme();
  const swipeableRef = useRef<Swipeable>(null);
  const highlightAnim = useRef(new Animated.Value(0)).current;

  // Flash highlight animation when navigated to via reply quote
  useEffect(() => {
    if (isHighlighted) {
      highlightAnim.setValue(1);
      Animated.timing(highlightAnim, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }).start();
    }
  }, [isHighlighted, highlightAnim]);

  // Aggregate reactions by emoji
  const reactionsMap = useMemo(() => {
    const reactions = message.metadata?.reactions || [];
    const map = new Map<string, { count: number; userReacted: boolean }>();
    for (const r of reactions) {
      const existing = map.get(r.emoji) || { count: 0, userReacted: false };
      existing.count += 1;
      if (r.userId === currentUserId) {
        existing.userReacted = true;
      }
      map.set(r.emoji, existing);
    }
    return Array.from(map.entries()).map(([emoji, data]) => ({
      emoji,
      count: data.count,
      userReacted: data.userReacted,
    }));
  }, [message.metadata?.reactions, currentUserId]);

  const timeFormatted = useMemo(() => {
    try {
      const date = new Date(message.createdAt);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }, [message.createdAt]);

  const attachmentsMeta: AttachmentMeta[] = useMemo(() => {
    if (message.metadata?.attachmentsMeta && Array.isArray(message.metadata.attachmentsMeta)) {
      return message.metadata.attachmentsMeta;
    }
    if (message.attachments && Array.isArray(message.attachments)) {
      return message.attachments.map((url) => {
        const ext = url.split('.').pop()?.toLowerCase() || '';
        let type: 'pdf' | 'excel' | 'word' | 'image' | 'file' = 'file';
        if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) type = 'image';
        else if (ext === 'pdf') type = 'pdf';
        else if (['xlsx', 'xls', 'csv'].includes(ext)) type = 'excel';
        else if (['doc', 'docx'].includes(ext)) type = 'word';

        return {
          url,
          name: url.split('/').pop() || 'Adjunto',
          size: 0,
          type,
        };
      });
    }
    return [];
  }, [message.attachments, message.metadata?.attachmentsMeta]);

  const handleDownloadAttachment = async (att: AttachmentMeta) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        const localUri = `${FileSystem.cacheDirectory || ''}${att.name}`;
        const downloadRes = await FileSystem.downloadAsync(att.url, localUri);
        await Sharing.shareAsync(downloadRes.uri);
      } else {
        toast.info(
          'Documento',
          `Abriendo enlace: ${att.name}`,
        );
      }
    } catch {
      toast.error(
        'Error',
        'No se pudo descargar el archivo.',
      );
    }
  };

  // WhatsApp-style swipe left action render (reply arrow with spring scale/opacity)
  const renderLeftActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [0, 25, 55],
      outputRange: [0.3, 0.7, 1],
      extrapolate: 'clamp',
    });
    const opacity = dragX.interpolate({
      inputRange: [0, 20, 45],
      outputRange: [0, 0.6, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.swipeLeftActionWrap}>
        <Animated.View
          style={[
            styles.swipeReplyCircle,
            {
              backgroundColor: isDark ? '#1C202C' : '#E2E8F0',
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          <Ionicons name="arrow-undo" size={17} color={colors.primary} />
        </Animated.View>
      </View>
    );
  };

  const bubbleBody = (
    <View
      style={[
        styles.rowContainer,
        isMine ? styles.myRowContainer : styles.otherRowContainer,
      ]}
    >
      <ThemedTouchable
        onLongPress={() => onLongPress(message)}
        haptic="medium"
        style={[
          styles.bubbleWrapper,
          {
            maxWidth: MAX_BUBBLE_WIDTH,
            minWidth: Boolean(message.metadata?.replyTo || message.metadata?.isStatusReply || message.metadata?.statusId)
              ? Math.min(260, MAX_BUBBLE_WIDTH * 0.92)
              : undefined,
          },
        ]}
      >
        <View
          style={[
            styles.bubbleContainer,
            Boolean(message.metadata?.replyTo || message.metadata?.isStatusReply || message.metadata?.statusId) && {
              minWidth: Math.min(260, MAX_BUBBLE_WIDTH * 0.92),
            },
            isMine
              ? [
                  styles.myBubble,
                  {
                    backgroundColor: colors.primary,
                    borderColor: 'transparent',
                  },
                ]
              : [
                  styles.otherBubble,
                  {
                    backgroundColor: isDark ? '#1C202C' : '#F1F5F9',
                    borderColor: isDark ? '#2B3245' : '#E2E8F0',
                  },
                ],
          ]}
        >
          {/* Flash Highlight Overlay */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.highlightOverlay,
              {
                opacity: highlightAnim,
                backgroundColor: isDark
                  ? 'rgba(96, 165, 250, 0.35)'
                  : 'rgba(59, 130, 246, 0.28)',
              },
            ]}
          />

          {/* 1. Quoted Reply Message Card (WhatsApp / Telegram style) */}
          {Boolean(message.metadata?.replyTo) && (
            <ThemedTouchable
              onPress={() => {
                if (message.metadata?.replyTo?.id && onPressReplyQuote) {
                  onPressReplyQuote(message.metadata.replyTo.id);
                }
              }}
              haptic="light"
              style={[
                styles.quotedReplyCard,
                {
                  backgroundColor: isMine
                    ? 'rgba(0, 0, 0, 0.18)'
                    : isDark
                      ? '#141720'
                      : '#E2E8F0',
                  borderLeftColor: isMine ? '#93C5FD' : colors.primary,
                },
              ]}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.quotedReplySender,
                    { color: isMine ? '#93C5FD' : colors.primary },
                  ]}
                >
                  {message.metadata?.replyTo?.senderName || 'Usuario'}
                </Text>
                <Text
                  numberOfLines={2}
                  style={[
                    styles.quotedReplyContent,
                    {
                      color: isMine
                        ? 'rgba(255, 255, 255, 0.88)'
                        : colors.textSecondary,
                    },
                  ]}
                >
                  {message.metadata?.replyTo?.content ||
                    (message.metadata?.replyTo?.mediaUrl ? '📷 Foto' : 'Mensaje')}
                </Text>
              </View>
              {Boolean(message.metadata?.replyTo?.mediaUrl) && (
                <Image
                  source={{ uri: message.metadata?.replyTo?.mediaUrl }}
                  style={styles.quotedReplyThumb}
                  contentFit="cover"
                />
              )}
            </ThemedTouchable>
          )}

          {/* 2. Status/Story Reply Quote Header if present */}
          {Boolean(message.metadata?.isStatusReply || message.metadata?.statusId) && (
            <View
              style={[
                styles.storyQuoteBox,
                {
                  backgroundColor: isMine
                    ? 'rgba(0,0,0,0.22)'
                    : isDark
                      ? '#141720'
                      : '#E2E8F0',
                  borderLeftColor: isMine ? '#FDE047' : colors.primary,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.storyQuoteLabel,
                    { color: isMine ? '#FDE047' : colors.primary },
                  ]}
                >
                  Respuesta a un Estado
                </Text>
                {message.metadata?.statusCaption ? (
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.storyQuoteCaption,
                      {
                        color: isMine
                          ? 'rgba(255, 255, 255, 0.88)'
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    {message.metadata.statusCaption}
                  </Text>
                ) : null}
              </View>
              {message.metadata?.statusMediaUrl ? (
                <Image
                  source={{ uri: message.metadata.statusMediaUrl }}
                  style={styles.storyQuoteThumb}
                  contentFit="cover"
                />
              ) : null}
            </View>
          )}

          {/* 3. Document & File Attachments */}
          {attachmentsMeta
            .filter((att) => att.type !== 'image')
            .map((att, idx) => {
              const isPdf = att.type === 'pdf';
              const isExcel = att.type === 'excel';
              const isWord = att.type === 'word';

              const iconBg = isPdf
                ? '#EF4444'
                : isExcel
                  ? '#10B981'
                  : isWord
                    ? '#3B82F6'
                    : '#64748B';

              return (
                <ThemedTouchable
                  key={idx}
                  onPress={() => handleDownloadAttachment(att)}
                  haptic="light"
                  style={[
                    styles.docCard,
                    {
                      backgroundColor: isMine
                        ? 'rgba(0,0,0,0.18)'
                        : isDark
                          ? '#141720'
                          : '#FFFFFF',
                      borderColor: isMine
                        ? 'rgba(255,255,255,0.15)'
                        : isDark
                          ? '#2D3548'
                          : '#E2E8F0',
                    },
                  ]}
                >
                  <View style={[styles.docTypeBadge, { backgroundColor: iconBg }]}>
                    <MaterialCommunityIcons
                      name={
                        isPdf
                          ? 'file-pdf-box'
                          : isExcel
                            ? 'file-excel-box'
                            : isWord
                              ? 'file-word-box'
                              : 'file-document-outline'
                      }
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>

                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.docName,
                        { color: isMine ? '#FFFFFF' : colors.textPrimary },
                      ]}
                    >
                      {att.name}
                    </Text>
                    <Text
                      style={[
                        styles.docSize,
                        {
                          color: isMine
                            ? 'rgba(255,255,255,0.75)'
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      {formatFileSize(att.size)}
                    </Text>
                  </View>

                  <Ionicons
                    name="cloud-download-outline"
                    size={20}
                    color={isMine ? '#FFFFFF' : colors.primary}
                  />
                </ThemedTouchable>
              );
            })}

          {/* 4. Image Attachments */}
          {attachmentsMeta
            .filter((att) => att.type === 'image')
            .map((att, idx) => (
              <ThemedTouchable
                key={idx}
                onPress={() => onPressImage(att.url, message.content)}
                haptic="light"
                style={styles.imageWrap}
              >
                <Image
                  source={{ uri: att.url }}
                  style={styles.imagePreview}
                  contentFit="cover"
                />
              </ThemedTouchable>
            ))}

          {/* 5. Text Message Content */}
          {Boolean(message.content && message.content.trim()) && (
            <Text
              style={[
                styles.messageContent,
                { color: isMine ? '#FFFFFF' : colors.textPrimary },
              ]}
            >
              {message.content}
            </Text>
          )}

          {/* 6. Metadata Footer (Time + Read Receipt Checks) */}
          <View style={styles.metaRow}>
            <Text
              style={[
                styles.timeText,
                {
                  color: isMine
                    ? 'rgba(255, 255, 255, 0.75)'
                    : isDark
                      ? '#94A3B8'
                      : '#64748B',
                },
              ]}
            >
              {timeFormatted}
            </Text>

            {isMine && (
              <Ionicons
                name={message.isRead ? 'checkmark-done' : 'checkmark'}
                size={15}
                color={message.isRead ? '#93C5FD' : 'rgba(255, 255, 255, 0.75)'}
                style={{ marginLeft: 3 }}
              />
            )}
          </View>
        </View>

        {/* 7. Floating Reactions Pill Overlay (WhatsApp style bottom badge) */}
        {reactionsMap.length > 0 && (
          <View
            style={[
              styles.floatingReactionsWrap,
              isMine ? styles.myReactionsWrap : styles.otherReactionsWrap,
            ]}
          >
            {reactionsMap.map(({ emoji, count, userReacted }) => (
              <ThemedTouchable
                key={emoji}
                onPress={() => onPressReaction(message, emoji)}
                haptic="light"
                style={[
                  styles.reactionPill,
                  {
                    backgroundColor: isDark ? '#1F2432' : '#FFFFFF',
                    borderColor: userReacted
                      ? colors.primary
                      : isDark
                        ? '#2D3548'
                        : '#E2E8F0',
                  },
                ]}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                {count > 1 && (
                  <Text
                    style={[
                      styles.reactionCount,
                      { color: userReacted ? colors.primary : colors.textPrimary },
                    ]}
                  >
                    {count}
                  </Text>
                )}
              </ThemedTouchable>
            ))}
          </View>
        )}
      </ThemedTouchable>
    </View>
  );

  if (!onSwipeReply) {
    return bubbleBody;
  }

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      leftThreshold={45}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={renderLeftActions}
      onSwipeableOpen={(direction) => {
        if (direction === 'left') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          onSwipeReply(message);
          swipeableRef.current?.close();
        }
      }}
      containerStyle={{ width: '100%' }}
    >
      {bubbleBody}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  rowContainer: {
    width: '100%',
    marginVertical: 4,
    flexDirection: 'row',
  },
  myRowContainer: {
    justifyContent: 'flex-end',
  },
  otherRowContainer: {
    justifyContent: 'flex-start',
  },
  bubbleWrapper: {
    position: 'relative',
  },
  bubbleContainer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  highlightOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: 20,
    zIndex: 1,
  },
  myBubble: {
    borderBottomRightRadius: 5,
  },
  otherBubble: {
    borderBottomLeftRadius: 5,
  },
  messageContent: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Regular',
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 2,
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  // Quoted Reply Card
  quotedReplyCard: {
    width: '100%',
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    borderLeftWidth: 3.5,
    marginBottom: 8,
    gap: 8,
  },
  quotedReplySender: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  quotedReplyContent: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  quotedReplyThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  // Story Quote
  storyQuoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    borderLeftWidth: 3.5,
    marginBottom: 8,
    gap: 8,
  },
  storyQuoteLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 2,
  },
  storyQuoteCaption: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  storyQuoteThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  // Document Card
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
    gap: 10,
  },
  docTypeBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docName: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  docSize: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Medium',
    marginTop: 1,
  },
  // Image Preview
  imageWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 6,
  },
  imagePreview: {
    width: '100%',
    height: 190,
    borderRadius: 14,
  },
  // Floating Reaction Pills
  floatingReactionsWrap: {
    position: 'absolute',
    bottom: -11,
    flexDirection: 'row',
    gap: 4,
    zIndex: 15,
  },
  myReactionsWrap: {
    right: 8,
  },
  otherReactionsWrap: {
    left: 8,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7.5,
    paddingVertical: 2.5,
    borderRadius: 999,
    borderWidth: 1,
    gap: 3.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 3,
  },
  reactionEmoji: {
    fontSize: 13.5,
  },
  reactionCount: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  // Swipe Reply Action Styles
  swipeLeftActionWrap: {
    width: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeReplyCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
});
