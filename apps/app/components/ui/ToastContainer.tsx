import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useToastStore, ToastMessage } from '@/store/useToastStore';
import { useAppTheme } from '@/hooks/useAppTheme';

export function ToastContainer() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const toasts = useToastStore((state) => state.toasts);
  const hideToast = useToastStore((state) => state.hideToast);

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          top: Math.max(insets.top + 6, 20),
        },
      ]}
    >
      {toasts.map((item) => (
        <ToastItem
          key={item.id}
          toast={item}
          isDark={isDark}
          colors={colors}
          onDismiss={() => hideToast(item.id)}
        />
      ))}
    </View>
  );
}

function ToastItem({
  toast,
  isDark,
  colors,
  onDismiss,
}: {
  toast: ToastMessage;
  isDark: boolean;
  colors: any;
  onDismiss: () => void;
}) {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return { name: 'checkmark-circle' as const, color: '#10B981', bg: isDark ? '#064E3B40' : '#D1FAE5' };
      case 'error':
        return { name: 'alert-circle' as const, color: '#EF4444', bg: isDark ? '#7F1D1D40' : '#FEE2E2' };
      case 'warning':
        return { name: 'warning' as const, color: '#F59E0B', bg: isDark ? '#78350F40' : '#FEF3C7' };
      case 'info':
      default:
        return { name: 'information-circle' as const, color: '#3B82F6', bg: isDark ? '#1E3A8A40' : '#DBEAFE' };
    }
  };

  const iconInfo = getIcon();

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(16).mass(0.8)}
      exiting={FadeOutUp.duration(200)}
      style={[
        styles.toastCard,
        {
          backgroundColor: isDark ? '#1E1E24' : '#FFFFFF',
          borderColor: isDark ? '#2E2E38' : '#E4E4E7',
          shadowColor: '#000',
          shadowOpacity: isDark ? 0.35 : 0.08,
        },
      ]}
    >
      <Pressable onPress={onDismiss} style={styles.pressableContent}>
        <View style={[styles.iconWrapper, { backgroundColor: iconInfo.bg }]}>
          <Ionicons name={iconInfo.name} size={20} color={iconInfo.color} />
        </View>

        <View style={styles.textWrapper}>
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              { color: isDark ? '#FFFFFF' : '#18181B' },
            ]}
          >
            {toast.title}
          </Text>
          {toast.message ? (
            <Text
              numberOfLines={2}
              style={[
                styles.message,
                { color: isDark ? '#A1A1AA' : '#71717A' },
              ]}
            >
              {toast.message}
            </Text>
          ) : null}
        </View>

        <Ionicons name="close" size={16} color={isDark ? '#71717A' : '#A1A1AA'} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99999,
    alignItems: 'center',
    gap: 8,
  },
  toastCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  pressableContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrapper: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Satoshi-Bold',
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 12,
    fontFamily: 'Satoshi-Regular',
    marginTop: 2,
    lineHeight: 16,
  },
});

export default ToastContainer;
