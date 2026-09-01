import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { CustomAlert } from '@/components/ui/CustomAlert';
import { notificationsApi, NotificationItem } from '@/services/notificationsApi';
import { getAccessToken } from '@/services/apiClient';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useRealtimeStore } from '@/store/useRealtimeStore';
import { SwipeableRow } from '@/components/ui/SwipeableRow';

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const notifications = useRealtimeStore((state) => state.notifications);
  const unreadCount = useRealtimeStore((state) => state.unreadCount);
  const setNotifications = useRealtimeStore((state) => state.setNotifications);
  const markAsRead = useRealtimeStore((state) => state.markAsRead);
  const toggleRead = useRealtimeStore((state) => state.toggleRead);
  const deleteNotification = useRealtimeStore((state) => state.deleteNotification);
  const markAllAsRead = useRealtimeStore((state) => state.markAllAsRead);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const isSelectionMode = selectedIds.size > 0;
  const isAllSelected = notifications.length > 0 && selectedIds.size === notifications.length;

  const loadNotifications = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const [items, countData] = await Promise.all([
        notificationsApi.getMyNotifications(),
        notificationsApi.getUnreadCount(),
      ]);
      setNotifications(items || [], countData?.unreadCount || 0);
    } catch {
      // Quiet fail if network error or unauthenticated
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [setNotifications]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await loadNotifications();
  };

  // Selection actions
  const toggleSelect = (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    Haptics.selectionAsync().catch(() => {});
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map((n) => n.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const idsToDelete = Array.from(selectedIds);
    idsToDelete.forEach((id) => {
      deleteNotification(id);
    });
    clearSelection();
    try {
      if (idsToDelete.length > 0) {
        await notificationsApi.deleteBatch(idsToDelete);
      }
    } catch (e) {
      console.warn('Error deleting selected notifications:', e);
    }
  };

  const handleToggleReadSelected = () => {
    Haptics.selectionAsync().catch(() => {});
    const idsToToggle = Array.from(selectedIds);
    idsToToggle.forEach((id) => {
      toggleRead(id);
      const notif = notifications.find((n) => n.id === id);
      if (notif && !notif.isRead) {
        notificationsApi.markAsRead(id).catch(() => {});
      }
    });
    clearSelection();
  };

  // Open detail on tap & mark as read
  const handleOpenNotification = async (item: NotificationItem) => {
    if (isSelectionMode) {
      toggleSelect(item.id);
      return;
    }

    await Haptics.selectionAsync().catch(() => {});
    setSelectedNotification(item);

    // If unread, mark as read on open
    if (!item.isRead) {
      markAsRead(item.id);
      try {
        await notificationsApi.markAsRead(item.id);
      } catch (e) {
        console.warn('Error marking notification as read:', e);
      }
    }
  };

  // Swipe Action: Toggle Read/Unread
  const handleToggleRead = async (item: NotificationItem) => {
    await Haptics.selectionAsync().catch(() => {});
    toggleRead(item.id);
    if (!item.isRead) {
      try {
        await notificationsApi.markAsRead(item.id);
      } catch {}
    }
  };

  const handleDelete = async (id: string) => {
    deleteNotification(id);
    if (selectedNotification?.id === id) {
      setSelectedNotification(null);
    }
    try {
      await notificationsApi.deleteNotification(id);
    } catch (e) {
      console.warn('Error deleting notification:', e);
    }
  };


  const toggleStar = (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMarkAllAsRead = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      await notificationsApi.markAllAsRead();
      markAllAsRead();
      setAlertConfig({
        visible: true,
        title: 'Notificaciones',
        message: 'Todas las notificaciones se han marcado como leídas.',
      });
    } catch {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'No se pudieron marcar todas como leídas.',
      });
    }
  };

  const getAvatarConfig = (item: NotificationItem) => {
    switch (item.type) {
      case 'CHAT_MESSAGE':
        return {
          bg: isDark ? '#1E1B4B' : '#E0E7FF',
          color: '#6366F1',
          initial: 'C',
          sender: 'Mensaje de Chat',
          ctaText: 'Ir a la Conversación',
          ctaRoute: '/(tabs)/requests',
        };
      case 'SERVICE_REQUEST':
        return {
          bg: isDark ? '#3E2A15' : '#FEF3C7',
          color: '#F59E0B',
          initial: '🛠️',
          sender: 'Nueva Oportunidad',
          ctaText: 'Ver Oportunidades',
          ctaRoute: '/(tabs)/requests',
        };
      case 'QUOTE_RECEIVED':
        return {
          bg: isDark ? '#064E3B' : '#D1FAE5',
          color: '#10B981',
          initial: 'P',
          sender: 'Presupuesto Recibido',
          ctaText: 'Ver Mis Solicitudes',
          ctaRoute: '/(tabs)/requests',
        };
      case 'PAYMENT_SUCCESS':
        return {
          bg: isDark ? '#14532D' : '#DCFCE7',
          color: '#16A34A',
          initial: '✓',
          sender: 'Pagos y Pedidos Yewi',
          ctaText: 'Ver Estado de Pedido',
          ctaRoute: '/(tabs)/requests',
        };
      case 'REVIEW_RECEIVED':
        return {
          bg: isDark ? '#422006' : '#FEF9C3',
          color: '#EAB308',
          initial: '★',
          sender: 'Reseña de Cliente',
          ctaText: 'Ver Perfil y Valoraciones',
          ctaRoute: '/(tabs)/profile',
        };
      case 'SYSTEM_ALERT':
        return {
          bg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
          color: '#DC2626',
          initial: '🔥',
          sender: item.title?.includes('Oferta') || item.title?.includes('Promoción') ? 'Oferta de Profesional' : 'Aviso Yewi',
          ctaText: item.link === '/vouchers' ? 'Ver Cupones & Promociones' : 'Ver Detalle',
          ctaRoute: item.link || '/vouchers',
        };
      default:
        return {
          bg: isDark ? '#2E1065' : '#EDE9FE',
          color: colors.primary,
          initial: 'Y',
          sender: 'Yewi Notificaciones',
          ctaText: item.link === '/vouchers' ? 'Ver Promociones' : 'Ver Solicitudes',
          ctaRoute: item.link || '/(tabs)/requests',
        };
    }
  };

  const formatNotificationDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMin < 1) return 'Ahora';
      if (diffMin < 60) return `${diffMin}m`;
      if (diffHours < 24) return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      if (diffDays === 1) return 'Ayer';
      if (diffDays < 7) return `${diffDays}d`;
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    } catch {
      return '';
    }
  };

  const formatDetailFullDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#121316' : '#F9FAFB' }}>
      {/* 1. GMAIL HEADER BAR (Switches on selection mode) */}
      {isSelectionMode ? (
        <View
          style={{
            backgroundColor: isDark ? '#1E2430' : '#E8F0FE',
            paddingTop: Math.max(insets.top + 8, 28),
            paddingBottom: 12,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomWidth: 1,
            borderBottomColor: isDark ? '#2D3748' : '#D2E3FC',
          }}
        >
          {/* Left: Close selection & Selected Count */}
          <View className="flex-row items-center gap-3">
            <ThemedTouchable onPress={clearSelection} haptic="light">
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </ThemedTouchable>
            <Text style={{ fontSize: 18, fontFamily: 'Satoshi-Black', color: colors.textPrimary }}>
              {selectedIds.size}
            </Text>
          </View>

          {/* Right: Actions (Mark Read, Delete, Select All) */}
          <View className="flex-row items-center gap-4">
            <ThemedTouchable onPress={handleToggleReadSelected} haptic="medium" style={{ padding: 4 }}>
              <Ionicons name="mail-unread-outline" size={22} color={colors.textPrimary} />
            </ThemedTouchable>
            <ThemedTouchable onPress={handleDeleteSelected} haptic="heavy" style={{ padding: 4 }}>
              <Ionicons name="trash-outline" size={22} color="#DC2626" />
            </ThemedTouchable>
          </View>
        </View>
      ) : (
        <View
          style={{
            backgroundColor: colors.surface,
            paddingTop: Math.max(insets.top + 8, 28),
            paddingBottom: 14,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View className="flex-row items-center flex-1">
            <ThemedTouchable
              onPress={() => router.back()}
              haptic="light"
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: colors.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </ThemedTouchable>
            <Text
              style={{
                fontSize: 20,
                fontFamily: 'Satoshi-Black',
                color: colors.textPrimary,
                letterSpacing: -0.4,
              }}
            >
              Notificaciones
            </Text>
          </View>

          {unreadCount > 0 && (
            <ThemedTouchable
              onPress={handleMarkAllAsRead}
              haptic="selection"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: colors.primaryLight,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.primary,
              }}
            >
              <Ionicons name="mail-open-outline" size={14} color={colors.primary} />
              <Text style={{ color: colors.primary, fontFamily: 'Satoshi-Bold', fontSize: 12 }}>
                Leídas ({unreadCount})
              </Text>
            </ThemedTouchable>
          )}
        </View>
      )}

      {/* 2. SELECTION BAR (Select all toggle when in selection mode) */}
      {isSelectionMode && (
        <ThemedTouchable
          onPress={handleSelectAll}
          haptic="selection"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 18,
            paddingVertical: 10,
            backgroundColor: isDark ? '#181C24' : '#F1F5F9',
            borderBottomWidth: 1,
            borderBottomColor: colors.borderSubtle,
          }}
        >
          <Ionicons
            name={isAllSelected ? 'checkbox' : 'square-outline'}
            size={20}
            color={isAllSelected ? colors.primary : colors.textMuted}
          />
          <Text style={{ fontSize: 13.5, fontFamily: 'Satoshi-Bold', color: colors.textPrimary }}>
            Seleccionar todo ({notifications.length})
          </Text>
        </ThemedTouchable>
      )}

      {/* 3. GMAIL STYLE NOTIFICATIONS LIST */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, fontFamily: 'Satoshi-Medium', color: colors.textSecondary, fontSize: 14 }}>
            Cargando notificaciones...
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom + 24, 40),
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 90 }}>
              <View
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 38,
                  backgroundColor: colors.surfaceAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="mail-unread-outline" size={36} color={colors.primary} />
              </View>
              <Text style={{ fontSize: 18, fontFamily: 'Satoshi-Black', color: colors.textPrimary, marginBottom: 6 }}>
                Bandeja al día
              </Text>
              <Text
                style={{
                  fontSize: 13.5,
                  fontFamily: 'Satoshi-Regular',
                  color: colors.textSecondary,
                  textAlign: 'center',
                  maxWidth: 270,
                  lineHeight: 20,
                }}
              >
                No tienes notificaciones pendientes. Te avisaremos en cuanto haya actividad en tus servicios.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const avatar = getAvatarConfig(item);
            const isSelected = selectedIds.has(item.id);
            const isStarred = starredIds.has(item.id);
            const isUnread = !item.isRead;

            return (
              <SwipeableRow
                borderRadius={0}
                disabled={isSelectionMode}
                onSwipeLeft={() => handleDelete(item.id)}
                onSwipeRight={() => handleToggleRead(item)}
                leftLabel={item.isRead ? 'No leído' : 'Leído'}
                rightLabel="Eliminar"
                leftIcon={item.isRead ? 'mail-unread-outline' : 'mail-open-outline'}
                rightIcon="trash-outline"
                leftActionColor="#2563EB"
                rightActionColor="#DC2626"
              >
                <Pressable
                  onPress={() => handleOpenNotification(item)}
                  onLongPress={() => toggleSelect(item.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    backgroundColor: isSelected
                      ? isDark
                        ? '#1E293B'
                        : '#E0EDFF'
                      : isUnread
                      ? isDark
                        ? '#161922'
                        : '#FFFFFF'
                      : isDark
                      ? '#121316'
                      : '#F9FAFB',
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? '#1E2028' : '#F1F5F9',
                  }}
                >
                  {/* Left: Avatar / Checkmark Button (Tap to Select) */}
                  <ThemedTouchable
                    onPress={() => toggleSelect(item.id)}
                    haptic="selection"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: isSelected
                        ? '#2563EB'
                        : avatar.bg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 14,
                      marginTop: 2,
                    }}
                  >
                    {isSelected ? (
                      <Ionicons name="checkmark" size={22} color="#FFFFFF" />
                    ) : (
                      <Text
                        style={{
                          color: avatar.color,
                          fontSize: 18,
                          fontFamily: 'Satoshi-Black',
                        }}
                      >
                        {avatar.initial}
                      </Text>
                    )}
                  </ThemedTouchable>

                  {/* Center: Sender, Subject & Snippet (Gmail Layout) */}
                  <View style={{ flex: 1, marginRight: 10 }}>
                    {/* Line 1: Sender / Category + Time + Unread Dot */}
                    <View className="flex-row items-center justify-between mb-0.5">
                      <Text
                        style={{
                          fontSize: 14.5,
                          fontFamily: isUnread ? 'Satoshi-Black' : 'Satoshi-Medium',
                          color: isUnread ? (isDark ? '#FFFFFF' : '#0F172A') : (isDark ? '#94A3B8' : '#64748B'),
                          flex: 1,
                          marginRight: 6,
                        }}
                        numberOfLines={1}
                      >
                        {item.title || avatar.sender}
                      </Text>

                      <View className="flex-row items-center gap-1.5">
                        <Text
                          style={{
                            fontSize: 12,
                            fontFamily: isUnread ? 'Satoshi-Bold' : 'Satoshi-Regular',
                            color: isUnread ? colors.primary : (isDark ? '#64748B' : '#94A3B8'),
                          }}
                        >
                          {formatNotificationDate(item.createdAt)}
                        </Text>
                        {isUnread && (
                          <View
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: 3.5,
                              backgroundColor: colors.primary,
                            }}
                          />
                        )}
                      </View>
                    </View>

                    {/* Line 2: Message Content */}
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: isUnread ? 'Satoshi-Bold' : 'Satoshi-Regular',
                        color: isUnread ? (isDark ? '#E2E8F0' : '#1E293B') : (isDark ? '#94A3B8' : '#64748B'),
                        lineHeight: 18,
                        marginTop: 1,
                      }}
                      numberOfLines={2}
                    >
                      {item.message}
                    </Text>
                  </View>

                  {/* Right: Star Icon Button */}
                  <ThemedTouchable
                    onPress={(e) => {
                      e.stopPropagation?.();
                      toggleStar(item.id);
                    }}
                    haptic="light"
                    style={{ padding: 4, marginTop: 4 }}
                  >
                    <Ionicons
                      name={isStarred ? 'star' : 'star-outline'}
                      size={19}
                      color={isStarred ? '#F59E0B' : (isDark ? '#475569' : '#CBD5E1')}
                    />
                  </ThemedTouchable>
                </Pressable>
              </SwipeableRow>
            );
          }}
        />
      )}

      {/* 4. MODAL DETALLE DE NOTIFICACIÓN COMPLETO (Lectura y Acciones) */}
      <Modal
        visible={Boolean(selectedNotification)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedNotification(null)}
      >
        {selectedNotification && (() => {
          const avatar = getAvatarConfig(selectedNotification);
          const isStarred = starredIds.has(selectedNotification.id);

          return (
            <View
              style={{
                flex: 1,
                backgroundColor: colors.background,
                paddingTop: Math.max(insets.top + 8, 20),
                paddingHorizontal: 20,
                paddingBottom: Math.max(insets.bottom + 16, 24),
              }}
            >
              {/* Header: Back/Close + Action Icons */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.borderSubtle,
                  marginBottom: 20,
                }}
              >
                <ThemedTouchable
                  onPress={() => setSelectedNotification(null)}
                  haptic="light"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.surfaceAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
                </ThemedTouchable>

                <View className="flex-row items-center gap-3">
                  <ThemedTouchable
                    onPress={() => toggleStar(selectedNotification.id)}
                    haptic="light"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.surfaceAlt,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons
                      name={isStarred ? 'star' : 'star-outline'}
                      size={20}
                      color={isStarred ? '#F59E0B' : colors.textSecondary}
                    />
                  </ThemedTouchable>

                  <ThemedTouchable
                    onPress={() => {
                      handleToggleRead(selectedNotification);
                      setSelectedNotification(null);
                    }}
                    haptic="selection"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.surfaceAlt,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="mail-unread-outline" size={20} color={colors.textSecondary} />
                  </ThemedTouchable>

                  <ThemedTouchable
                    onPress={() => handleDelete(selectedNotification.id)}
                    haptic="heavy"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: '#FEE2E2',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#DC2626" />
                  </ThemedTouchable>
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                {/* Sender Card */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 20,
                  }}
                >
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: avatar.bg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 14,
                    }}
                  >
                    <Text style={{ color: avatar.color, fontSize: 22, fontFamily: 'Satoshi-Black' }}>
                      {avatar.initial}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: 'Satoshi-Black',
                        color: colors.textPrimary,
                      }}
                    >
                      {avatar.sender}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Satoshi-Regular',
                        color: colors.textMuted,
                        marginTop: 2,
                      }}
                    >
                      {formatDetailFullDate(selectedNotification.createdAt)}
                    </Text>
                  </View>
                </View>

                {/* Subject Title */}
                <Text
                  style={{
                    fontSize: 20,
                    fontFamily: 'Satoshi-Black',
                    color: colors.textPrimary,
                    marginBottom: 16,
                    lineHeight: 26,
                  }}
                >
                  {selectedNotification.title}
                </Text>

                {/* Message Body Box */}
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 18,
                    padding: 18,
                    borderWidth: 1,
                    borderColor: colors.border,
                    marginBottom: 24,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: 'Satoshi-Regular',
                      color: colors.textPrimary,
                      lineHeight: 23,
                    }}
                    selectable
                  >
                    {selectedNotification.message}
                  </Text>
                </View>

                {/* Contextual Action Button */}
                {avatar.ctaText && (
                  <ThemedTouchable
                    onPress={() => {
                      setSelectedNotification(null);
                      router.push(avatar.ctaRoute as any);
                    }}
                    haptic="medium"
                    style={{
                      backgroundColor: colors.primary,
                      height: 52,
                      borderRadius: 999,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                      gap: 8,
                      marginBottom: 14,
                      elevation: 3,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                    }}
                  >
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: 'Satoshi-Bold' }}>
                      {avatar.ctaText}
                    </Text>
                  </ThemedTouchable>
                )}

                {/* Secondary Action: Marcar como no leído */}
                <ThemedTouchable
                  onPress={() => {
                    handleToggleRead(selectedNotification);
                    setSelectedNotification(null);
                  }}
                  haptic="selection"
                  style={{
                    height: 48,
                    borderRadius: 999,
                    backgroundColor: colors.surfaceAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Ionicons name="mail-unread-outline" size={18} color={colors.textPrimary} />
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontFamily: 'Satoshi-Bold' }}>
                    Marcar como no leído
                  </Text>
                </ThemedTouchable>
              </ScrollView>
            </View>
          );
        })()}
      </Modal>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}
