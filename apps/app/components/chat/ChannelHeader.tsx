import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';
import { ChatParticipant } from '@/services/chatApi';

interface ChannelHeaderProps {
  otherParticipant?: ChatParticipant | null;
  fallbackName?: string;
  unreadCount?: number;
  isTyping?: boolean;
  onBack: () => void;
  onPressProfile: () => void;
}

export function ChannelHeader({
  otherParticipant,
  fallbackName,
  unreadCount = 0,
  isTyping = false,
  onBack,
  onPressProfile,
}: ChannelHeaderProps) {
  const { colors, isDark } = useAppTheme();

  const isPro = Boolean(
    otherParticipant?.isPro ||
      otherParticipant?.professionalProfile ||
      otherParticipant?.badges?.includes('VERIFIED_PRO'),
  );

  const displayName =
    otherParticipant?.displayName ||
    otherParticipant?.businessName ||
    fallbackName ||
    'Chat Yewi';

  const avatarUrl =
    otherParticipant?.avatarUrl || otherParticipant?.profile?.avatarUrl;

  return (
    <View
      style={[
        styles.headerContainer,
        {
          backgroundColor: isDark ? '#141720' : '#FFFFFF',
          borderBottomColor: isDark ? '#1F2432' : '#F1F5F9',
        },
      ]}
    >
      {/* Back Button with Unread Badge Pill */}
      <ThemedTouchable
        onPress={onBack}
        haptic="light"
        style={styles.backButton}
      >
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        {unreadCount > 0 && (
          <View style={[styles.unreadBadgePill, { backgroundColor: colors.primary }]}>
            <Text style={styles.unreadBadgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </ThemedTouchable>

      {/* Center & Left Info */}
      <ThemedTouchable
        onPress={onPressProfile}
        haptic="light"
        style={styles.centerInfoTouchable}
      >
        <View style={styles.textColumn}>
          <View style={styles.nameRow}>
            <Text
              numberOfLines={1}
              style={[styles.displayNameText, { color: colors.textPrimary }]}
            >
              {displayName}
            </Text>
            {isPro && (
              <View style={styles.proBadgePill}>
                <Ionicons name="shield-checkmark" size={11} color="#FFFFFF" />
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </View>

          <Text
            numberOfLines={1}
            style={[
              styles.subtitleText,
              {
                color: isTyping
                  ? colors.primary
                  : isDark
                    ? '#94A3B8'
                    : '#64748B',
              },
            ]}
          >
            {isTyping
              ? 'escribiendo...'
              : isPro
                ? 'Profesional Verificado · En línea'
                : 'En línea'}
          </Text>
        </View>
      </ThemedTouchable>

      {/* Right Avatar with Presence Indicator */}
      <ThemedTouchable
        onPress={onPressProfile}
        haptic="light"
        style={styles.avatarTouchable}
      >
        <View style={styles.avatarWrap}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Text style={[styles.avatarInitial, { color: colors.primary }]}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {/* Green Online Presence Dot */}
          <View style={styles.onlineDot} />
        </View>
      </ThemedTouchable>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingRight: 8,
  },
  unreadBadgePill: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -4,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Satoshi-Bold',
  },
  centerInfoTouchable: {
    flex: 1,
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  textColumn: {
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  displayNameText: {
    fontSize: 16,
    fontFamily: 'Satoshi-Bold',
    letterSpacing: -0.2,
  },
  proBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#10B981',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Satoshi-Black',
    letterSpacing: 0.4,
  },
  subtitleText: {
    fontSize: 12,
    fontFamily: 'Satoshi-Medium',
    marginTop: 1,
  },
  avatarTouchable: {
    paddingLeft: 6,
  },
  avatarWrap: {
    width: 38,
    height: 38,
    position: 'relative',
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontFamily: 'Satoshi-Black',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#141720',
  },
});
