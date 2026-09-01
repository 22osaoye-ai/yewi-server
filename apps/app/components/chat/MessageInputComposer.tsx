import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';
import { AttachmentMeta } from '@/services/chatApi';
import { AttachmentPickerModal } from './AttachmentPickerModal';
import { QuickActionsModal } from './QuickActionsModal';

interface MessageInputComposerProps {
  inputText: string;
  onChangeText: (text: string) => void;
  onSendMessage: () => void;
  isSending: boolean;
  pendingAttachment: (AttachmentMeta & { localUri?: string; base64?: string }) | null;
  onRemovePendingAttachment: () => void;
  onSelectAttachment: (attachment: AttachmentMeta & { localUri?: string; base64?: string }) => void;
  onSelectQuickAction: (text: string) => void;
}

export function MessageInputComposer({
  inputText,
  onChangeText,
  onSendMessage,
  isSending,
  pendingAttachment,
  onRemovePendingAttachment,
  onSelectAttachment,
  onSelectQuickAction,
}: MessageInputComposerProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const [isAttachmentPickerOpen, setIsAttachmentPickerOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  const canSend = Boolean(inputText.trim() || pendingAttachment) && !isSending;

  const handleSendPress = () => {
    if (!canSend) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSendMessage();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#141720' : '#FFFFFF',
          borderTopColor: isDark ? '#1F2432' : '#F1F5F9',
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {/* 1. Pending Attachment Strip */}
      {pendingAttachment && (
        <View
          style={[
            styles.pendingStrip,
            {
              backgroundColor: isDark ? '#1C202C' : '#F8FAFC',
              borderColor: isDark ? '#2D3548' : '#E2E8F0',
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
            {pendingAttachment.type === 'image' && pendingAttachment.url ? (
              <Image
                source={{ uri: pendingAttachment.url }}
                style={styles.pendingImageThumb}
                contentFit="cover"
              />
            ) : (
              <View
                style={[
                  styles.pendingDocIcon,
                  {
                    backgroundColor:
                      pendingAttachment.type === 'pdf'
                        ? '#EF4444'
                        : pendingAttachment.type === 'excel'
                          ? '#10B981'
                          : '#3B82F6',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={
                    pendingAttachment.type === 'pdf'
                      ? 'file-pdf-box'
                      : pendingAttachment.type === 'excel'
                        ? 'file-excel-box'
                        : 'file-document-outline'
                  }
                  size={20}
                  color="#FFFFFF"
                />
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={[styles.pendingName, { color: colors.textPrimary }]}
              >
                {pendingAttachment.name}
              </Text>
              <Text
                style={[styles.pendingType, { color: colors.textSecondary }]}
              >
                {pendingAttachment.type.toUpperCase()} listo para enviar
              </Text>
            </View>
          </View>

          <ThemedTouchable
            onPress={onRemovePendingAttachment}
            haptic="light"
            style={styles.removePendingBtn}
          >
            <Ionicons name="close-circle" size={22} color="#EF4444" />
          </ThemedTouchable>
        </View>
      )}

      {/* 2. Input Row */}
      <View style={styles.inputRow}>
        {/* Attachment Button (📎) */}
        <ThemedTouchable
          onPress={() => setIsAttachmentPickerOpen(true)}
          haptic="light"
          style={[
            styles.iconButton,
            { backgroundColor: isDark ? '#1F2432' : '#F1F5F9' },
          ]}
        >
          <Ionicons
            name="attach"
            size={22}
            color={pendingAttachment ? colors.primary : colors.textSecondary}
          />
        </ThemedTouchable>

        {/* Quick Action Button (⚡) */}
        <ThemedTouchable
          onPress={() => setIsQuickActionsOpen(true)}
          haptic="light"
          style={[
            styles.iconButton,
            { backgroundColor: isDark ? '#1F2432' : '#F1F5F9' },
          ]}
        >
          <Ionicons name="flash" size={18} color="#EAB308" />
        </ThemedTouchable>

        {/* Capsule Input Field */}
        <View
          style={[
            styles.inputFieldContainer,
            {
              backgroundColor: isDark ? '#1C202C' : '#F1F5F9',
              borderColor: isDark ? '#2D3548' : '#E2E8F0',
            },
          ]}
        >
          <TextInput
            value={inputText}
            onChangeText={onChangeText}
            placeholder="Enviar un mensaje..."
            placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
            multiline
            maxLength={2000}
            style={[styles.textInput, { color: colors.textPrimary }]}
          />
        </View>

        {/* Send Button (➤) */}
        <ThemedTouchable
          onPress={handleSendPress}
          disabled={!canSend}
          haptic="medium"
          style={[
            styles.sendButton,
            {
              backgroundColor: canSend ? colors.primary : isDark ? '#1F2432' : '#E2E8F0',
            },
          ]}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons
              name="send"
              size={17}
              color={canSend ? '#FFFFFF' : colors.textMuted}
              style={{ marginLeft: 2 }}
            />
          )}
        </ThemedTouchable>
      </View>

      {/* Modals */}
      <AttachmentPickerModal
        visible={isAttachmentPickerOpen}
        onClose={() => setIsAttachmentPickerOpen(false)}
        onSelectAttachment={onSelectAttachment}
      />

      <QuickActionsModal
        visible={isQuickActionsOpen}
        onClose={() => setIsQuickActionsOpen(false)}
        onSelectAction={onSelectQuickAction}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  pendingStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 8,
  },
  pendingImageThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  pendingDocIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingName: {
    fontSize: 13,
    fontFamily: 'Satoshi-Bold',
  },
  pendingType: {
    fontSize: 11,
    fontFamily: 'Satoshi-Medium',
    marginTop: 1,
  },
  removePendingBtn: {
    padding: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputFieldContainer: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: PlatformSelect(6, 8),
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 15,
    fontFamily: 'Satoshi-Regular',
    padding: 0,
    margin: 0,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

function PlatformSelect(iosVal: number, androidVal: number): number {
  return typeof navigator !== 'undefined' ? iosVal : androidVal;
}
