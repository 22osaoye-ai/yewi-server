import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react-native';
import React, { createContext, useContext, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows } from './Theme';

export type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  hideToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<any>(null);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  };

  const showToast = ({
    type = 'info',
    title,
    message,
    duration = 4000,
  }: ToastOptions) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setToast({ type, title, message, duration });
    translateY.setValue(-120);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    timeoutRef.current = setTimeout(() => {
      hideToast();
    }, duration);
  };

  const getIcon = () => {
    if (toast?.type === 'success') {
      return <CheckCircle2 size={20} color="#10B981" />;
    }
    if (toast?.type === 'error') {
      return <AlertCircle size={20} color="#EF4444" />;
    }
    return <Info size={20} color="#3B82F6" />;
  };

  const getBorderColor = () => {
    if (toast?.type === 'success') return 'rgba(16, 185, 129, 0.4)';
    if (toast?.type === 'error') return 'rgba(239, 68, 68, 0.4)';
    return 'rgba(59, 130, 246, 0.4)';
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              top: Math.max(insets.top + 10, 20),
              transform: [{ translateY }],
              opacity,
              borderColor: getBorderColor(),
            },
          ]}
        >
          <View style={styles.iconContainer}>{getIcon()}</View>
          <View style={styles.textContainer}>
            <Text style={styles.titleText}>{toast.title}</Text>
            {toast.message ? (
              <Text style={styles.messageText} numberOfLines={2}>
                {toast.message}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={hideToast}
            activeOpacity={0.7}
          >
            <X size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 99999,
    ...Shadows.floating,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  messageText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  },
});
