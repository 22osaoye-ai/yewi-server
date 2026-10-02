import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';
import { ChatMessage } from '@/services/chatApi';
import { toast } from '@/store/useToastStore';

interface MessageReactionsBarProps {
  visible: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  currentReactions?: Array<{ emoji: string; userId: string }>;
  currentUserId?: string;
  targetMessage?: ChatMessage | null;
  onReplyMessage?: (message: ChatMessage) => void;
  onDeleteMessage?: (message: ChatMessage) => void;
}

// Curated Top Emojis (Telegram / iMessage gold standard)
const CURATED_EMOJIS = ['❤️', '👍', '🔥', '😂', '😮', '😢'];

export function MessageReactionsBar({
  visible,
  onClose,
  onSelectEmoji,
  currentReactions = [],
  currentUserId,
  targetMessage,
  onReplyMessage,
  onDeleteMessage,
}: MessageReactionsBarProps) {
  const { colors, isDark } = useAppTheme();

  // Entrance spring animations
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 7,
          tension: 90,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
      slideAnim.setValue(12);
    }
  }, [visible, scaleAnim, opacityAnim, slideAnim]);

  if (!visible) return null;

  const isMine = targetMessage ? targetMessage.senderId === currentUserId : false;

  const handleEmojiPress = (emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onSelectEmoji(emoji);
    onClose();
  };

  const handleReplyPress = () => {
    if (targetMessage && onReplyMessage) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onReplyMessage(targetMessage);
    }
    onClose();
  };

  const handleCopyPress = async () => {
    if (!targetMessage?.content) {
      onClose();
      return;
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    try {
      if (Platform.OS === 'web' && navigator.clipboard) {
        await navigator.clipboard.writeText(targetMessage.content);
      } else {
        // Fallback cross-platform sharing
        await Share.share({ message: targetMessage.content });
      }
      toast.success('Copiado', 'Texto copiado al portapapeles');
    } catch {
      // Ignored
    }
    onClose();
  };

  const handleSharePress = async () => {
    if (!targetMessage?.content && !targetMessage?.attachments?.[0]) {
      onClose();
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      await Share.share({
        message: targetMessage.content || targetMessage.attachments?.[0] || '',
      });
    } catch {
      // Ignored
    }
    onClose();
  };

  const handleDeletePress = () => {
    if (targetMessage && onDeleteMessage) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      onDeleteMessage(targetMessage);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={[
            styles.contentWrapper,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
            },
          ]}
        >
          {/* 1. Floating Emojis Capsule (iMessage Style) */}
          <View
            style={[
              styles.capsuleContainer,
              {
                backgroundColor: isDark ? 'rgba(28, 32, 44, 0.94)' : 'rgba(255, 255, 255, 0.96)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            {CURATED_EMOJIS.map((emoji) => {
              const hasUserReacted = currentReactions.some(
                (r) => r.emoji === emoji && r.userId === currentUserId
              );

              return (
                <ThemedTouchable
                  key={emoji}
                  onPress={() => handleEmojiPress(emoji)}
                  haptic="light"
                  style={[
                    styles.emojiItem,
                    hasUserReacted && [
                      styles.activeEmojiItem,
                      {
                        backgroundColor: isDark
                          ? 'rgba(2, 132, 199, 0.28)'
                          : 'rgba(2, 132, 199, 0.12)',
                        borderColor: colors.primary,
                      },
                    ],
                  ]}
                >
                  <Text style={styles.emojiGlyph}>{emoji}</Text>
                </ThemedTouchable>
              );
            })}
          </View>

          {/* 2. Target Message Snippet Preview */}
          {targetMessage?.content && (
            <View
              style={[
                styles.previewCard,
                {
                  backgroundColor: isDark ? 'rgba(24, 27, 36, 0.88)' : 'rgba(241, 245, 249, 0.88)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
            >
              <Text
                numberOfLines={2}
                style={[
                  styles.previewText,
                  { color: isDark ? colors.textSecondary : '#475569' },
                ]}
              >
                "{targetMessage.content}"
              </Text>
            </View>
          )}

          {/* 3. Action Sheet Card (Apple Context Menu Style) */}
          <View
            style={[
              styles.actionsCard,
              {
                backgroundColor: isDark ? 'rgba(28, 32, 44, 0.96)' : 'rgba(255, 255, 255, 0.98)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            {/* Responder */}
            <ThemedTouchable
              onPress={handleReplyPress}
              haptic="selection"
              style={[styles.actionRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}
            >
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>
                Responder
              </Text>
              <Ionicons name="arrow-undo-outline" size={19} color={colors.primary} />
            </ThemedTouchable>

            {/* Copiar texto */}
            {Boolean(targetMessage?.content) && (
              <ThemedTouchable
                onPress={handleCopyPress}
                haptic="selection"
                style={[styles.actionRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}
              >
                <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>
                  Copiar texto
                </Text>
                <Ionicons name="copy-outline" size={19} color={colors.textSecondary} />
              </ThemedTouchable>
            )}

            {/* Compartir */}
            <ThemedTouchable
              onPress={handleSharePress}
              haptic="selection"
              style={[
                styles.actionRow,
                isMine && { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
              ]}
            >
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>
                Compartir
              </Text>
              <Ionicons name="share-outline" size={19} color={colors.textSecondary} />
            </ThemedTouchable>

            {/* Eliminar (Solo si es mi mensaje) */}
            {isMine && onDeleteMessage && (
              <ThemedTouchable
                onPress={handleDeletePress}
                haptic="medium"
                style={styles.actionRow}
              >
                <Text style={[styles.actionLabel, { color: '#EF4444' }]}>
                  Eliminar mensaje
                </Text>
                <Ionicons name="trash-outline" size={19} color="#EF4444" />
              </ThemedTouchable>
            )}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    gap: 12,
  },
  capsuleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 36,
    borderWidth: 1,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 14,
  },
  emojiItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeEmojiItem: {
    borderWidth: 1.5,
  },
  emojiGlyph: {
    fontSize: 25,
  },
  previewCard: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  previewText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Medium',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  actionsCard: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  actionLabel: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-SemiBold',
    letterSpacing: -0.2,
  },
});
