import { create } from 'zustand';
import * as Haptics from 'expo-haptics';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastState {
  toasts: ToastMessage[];
  showToast: (params: {
    type?: ToastType;
    title: string;
    message?: string;
    duration?: number;
  }) => void;
  hideToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: ({ type = 'success', title, message, duration = 3400 }) => {
    const id = `${Date.now()}-${Math.random()}`;

    // Haptic feedback según el tipo de Toast
    if (type === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else if (type === 'error') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } else if (type === 'warning') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    set((state) => ({
      // Mantener máximo 2 toasts simultáneos para no saturar la vista
      toasts: [...state.toasts.slice(-1), { id, type, title, message, duration }],
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },
  hideToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

export const toast = {
  success: (title: string, message?: string, duration?: number) =>
    useToastStore.getState().showToast({ type: 'success', title, message, duration }),
  error: (title: string, message?: string, duration?: number) =>
    useToastStore.getState().showToast({ type: 'error', title, message, duration }),
  info: (title: string, message?: string, duration?: number) =>
    useToastStore.getState().showToast({ type: 'info', title, message, duration }),
  warning: (title: string, message?: string, duration?: number) =>
    useToastStore.getState().showToast({ type: 'warning', title, message, duration }),
};
