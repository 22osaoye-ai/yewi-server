import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

export type UserAuthRole = 'CLIENT' | 'PROFESSIONAL';

interface AuthRoleSelectorProps {
  selectedRole: UserAuthRole;
  onSelectRole: (role: UserAuthRole) => void;
}

export function AuthRoleSelector({
  selectedRole,
  onSelectRole,
}: AuthRoleSelectorProps) {
  const { colors, isDark } = useAppTheme();

  return (
    <View className="mb-6">
      <Text
        style={{
          fontSize: 14,
          fontFamily: 'Satoshi-Bold',
          color: colors.textPrimary,
          marginBottom: 12,
        }}
      >
        ¿Cómo deseas utilizar Yewi?
      </Text>
      <View className="flex-row gap-3">
        {/* Option 1: Client */}
        <ThemedTouchable
          onPress={() => onSelectRole('CLIENT')}
          haptic="selection"
          style={{
            flex: 1,
            backgroundColor: selectedRole === 'CLIENT'
              ? isDark ? '#2B2B32' : '#18181B'
              : colors.surface,
            borderRadius: 22,
            padding: 16,
            borderWidth: 1.5,
            borderColor: selectedRole === 'CLIENT'
              ? colors.primary
              : colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.2 : 0.05,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <View className="flex-row justify-between items-center mb-2">
            <Ionicons
              name="person-outline"
              size={22}
              color={selectedRole === 'CLIENT' ? '#FFFFFF' : colors.textPrimary}
            />
            {selectedRole === 'CLIENT' && (
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
            )}
          </View>
          <Text
            style={{
              fontSize: 15,
              fontFamily: 'Satoshi-Bold',
              color: selectedRole === 'CLIENT' ? '#FFFFFF' : colors.textPrimary,
            }}
          >
            Cliente
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'Satoshi-Regular',
              color: selectedRole === 'CLIENT' ? 'rgba(255,255,255,0.7)' : colors.textSecondary,
              marginTop: 2,
            }}
          >
            Quiero contratar servicios o comprar
          </Text>
        </ThemedTouchable>

        {/* Option 2: Professional */}
        <ThemedTouchable
          onPress={() => onSelectRole('PROFESSIONAL')}
          haptic="selection"
          style={{
            flex: 1,
            backgroundColor: selectedRole === 'PROFESSIONAL'
              ? isDark ? '#2B2B32' : '#18181B'
              : colors.surface,
            borderRadius: 22,
            padding: 16,
            borderWidth: 1.5,
            borderColor: selectedRole === 'PROFESSIONAL'
              ? colors.primary
              : colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.2 : 0.05,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <View className="flex-row justify-between items-center mb-2">
            <Ionicons
              name="briefcase-outline"
              size={22}
              color={selectedRole === 'PROFESSIONAL' ? colors.primary : colors.textPrimary}
            />
            {selectedRole === 'PROFESSIONAL' && (
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
            )}
          </View>
          <Text
            style={{
              fontSize: 15,
              fontFamily: 'Satoshi-Bold',
              color: selectedRole === 'PROFESSIONAL' ? '#FFFFFF' : colors.textPrimary,
            }}
          >
            Profesional
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'Satoshi-Regular',
              color: selectedRole === 'PROFESSIONAL' ? 'rgba(255,255,255,0.7)' : colors.textSecondary,
              marginTop: 2,
            }}
          >
            Ofrezco servicios profesionales
          </Text>
        </ThemedTouchable>
      </View>
    </View>
  );
}

export default AuthRoleSelector;
