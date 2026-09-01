import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

interface MessageReactionsBarProps {
  visible: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  currentReactions?: Array<{ emoji: string; userId: string }>;
  currentUserId?: string;
}

const DEFAULT_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export function MessageReactionsBar({
  visible,
  onClose,
  onSelectEmoji,
  currentReactions = [],
  currentUserId,
}: MessageReactionsBarProps) {
  const { colors, isDark } = useAppTheme();

  if (!visible) return null;

  const handleEmojiPress = (emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onSelectEmoji(emoji);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View
          style={[
            styles.reactionsContainer,
            {
              backgroundColor: isDark ? '#1C202C' : '#FFFFFF',
              borderColor: isDark ? '#2D3548' : '#E2E8F0',
              shadowColor: '#000000',
            },
          ]}
        >
          {DEFAULT_EMOJIS.map((emoji) => {
            const hasUserReacted = currentReactions.some(
              (r) => r.emoji === emoji && r.userId === currentUserId,
            );

            return (
              <ThemedTouchable
                key={emoji}
                onPress={() => handleEmojiPress(emoji)}
                haptic="light"
                style={[
                  styles.emojiButton,
                  hasUserReacted && [
                    styles.activeEmojiButton,
                    { backgroundColor: isDark ? '#2E384D' : '#EFF6FF' },
                  ],
                ]}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </ThemedTouchable>
            );
          })}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  reactionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 32,
    borderWidth: 1,
    gap: 6,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  emojiButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeEmojiButton: {
    borderWidth: 1.5,
    borderColor: '#3B82F6',
  },
  emojiText: {
    fontSize: 24,
  },
});
