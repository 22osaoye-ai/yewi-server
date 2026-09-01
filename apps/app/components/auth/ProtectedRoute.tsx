import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/useAuthStore';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'CLIENT' | 'PROFESSIONAL' | 'ADMIN';
  fallbackMessage?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  fallbackMessage,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#F8F8FA] items-center justify-center p-6">
        <Text className="text-base font-satoshi-bold text-[#71717A]">
          Cargando sesión...
        </Text>
      </View>
    );
  }

  // 1. Not Authenticated Guard
  if (!isAuthenticated || !user) {
    return (
      <View className="flex-1 bg-[#F8F8FA] items-center justify-center px-8">
        <View className="w-20 h-20 rounded-full bg-white items-center justify-center mb-4 border border-[#E5E5EA] shadow-sm">
          <Ionicons name="lock-closed-outline" size={36} color="#C87D20" />
        </View>
        <Text className="text-[20px] font-satoshi-black text-[#18181B] text-center mb-2">
          Se requiere inicio de sesión
        </Text>
        <Text className="text-[13.5px] font-satoshi text-[#71717A] text-center mb-6 leading-5 max-w-[280px]">
          {fallbackMessage ||
            'Para acceder a esta sección o continuar con tu compra, por favor inicia sesión con tu cuenta de Yewi.'}
        </Text>
        <ThemedTouchable
          onPress={() => router.push('/auth/login')}
          haptic="medium"
          style={{
            backgroundColor: '#C87D20',
            borderRadius: 999,
            paddingVertical: 14,
            paddingHorizontal: 28,
            alignItems: 'center',
          }}
        >
          <Text className="text-white font-satoshi-bold text-sm">
            Iniciar Sesión / Registrarse
          </Text>
        </ThemedTouchable>
      </View>
    );
  }

  // 2. Role-Based Privileges Guard (RBAC)
  if (requiredRole && !user.roles?.includes(requiredRole)) {
    return (
      <View className="flex-1 bg-[#F8F8FA] items-center justify-center px-8">
        <View className="w-20 h-20 rounded-full bg-white items-center justify-center mb-4 border border-[#E5E5EA] shadow-sm">
          <Ionicons name="shield-checkmark-outline" size={36} color="#EF4444" />
        </View>
        <Text className="text-[20px] font-satoshi-black text-[#18181B] text-center mb-2">
          Acceso Restringido
        </Text>
        <Text className="text-[13.5px] font-satoshi text-[#71717A] text-center mb-6 leading-5 max-w-[280px]">
          Esta sección requiere privilegios de rol{' '}
          <Text className="font-satoshi-bold text-[#18181B]">
            {requiredRole === 'PROFESSIONAL' ? 'Profesional / Proveedor' : requiredRole}
          </Text>
          .
        </Text>
        <ThemedTouchable
          onPress={() => router.back()}
          haptic="light"
          style={{
            backgroundColor: '#18181B',
            borderRadius: 999,
            paddingVertical: 12,
            paddingHorizontal: 24,
          }}
        >
          <Text className="text-white font-satoshi-bold text-sm">
            Regresar
          </Text>
        </ThemedTouchable>
      </View>
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;
