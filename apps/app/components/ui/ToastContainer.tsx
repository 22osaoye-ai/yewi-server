import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useToastStore, ToastMessage } from '@/store/useToastStore';
import { useAppTheme } from '@/hooks/useAppTheme';

export function ToastContainer() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const toasts = useToastStore((state) => state.toasts);
  const hideToast = useToastStore((state) => state.hideToast);

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          bottom: Math.max(insets.bottom + 85, 96),
        },
      ]}
    >
      {toasts.map((item) => (
        <ToastItem
          key={item.id}
          toast={item}
          isDark={isDark}
          onDismiss={() => hideToast(item.id)}
        />
      ))}
    </View>
  );
}

function ToastItem({
  toast,
  isDark,
  onDismiss,
}: {
  toast: ToastMessage;
  isDark: boolean;
  onDismiss: () => void;
}) {
  const textColor = isDark ? '#18181B' : '#FFFFFF';
  const subtitleColor = isDark ? '#52525B' : '#D4D4D8';

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return { name: 'checkmark-circle-outline' as const, color: textColor };
      case 'error':
        return { name: 'alert-circle-outline' as const, color: isDark ? '#DC2626' : '#F87171' };
      case 'warning':
        return { name: 'warning-outline' as const, color: isDark ? '#D97706' : '#FBBF24' };
      case 'info':
      default:
        return { name: 'information-circle-outline' as const, color: textColor };
    }
  };

  const iconInfo = getIcon();

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(20).stiffness(240)}
      exiting={FadeOutDown.duration(160)}
      style={[
        styles.toastPill,
        {
          backgroundColor: isDark ? '#ECECED' : '#18181B',
          borderColor: isDark ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)',
          shadowColor: '#000',
          shadowOpacity: isDark ? 0.22 : 0.28,
        },
      ]}
    >
      <Pressable onPress={onDismiss} style={styles.pillContent}>
        <Ionicons name={iconInfo.name} size={21} color={iconInfo.color} style={styles.icon} />

        <View style={styles.textWrapper}>
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              { color: textColor },
            ]}
          >
            {toast.title}
          </Text>
          {toast.message ? (
            <Text
              numberOfLines={1}
              style={[
                styles.message,
                { color: subtitleColor },
              ]}
            >
              {toast.message}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 999999,
    alignItems: 'center',
    gap: 8,
  },
  toastPill: {
    alignSelf: 'center',
    maxWidth: '88%',
    borderRadius: 999,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  icon: {
    marginRight: 10,
  },
  textWrapper: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 14.5,
    fontFamily: 'PlusJakartaSans-SemiBold',
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Regular',
    marginTop: 2,
    lineHeight: 15,
  },
});

export default ToastContainer;
