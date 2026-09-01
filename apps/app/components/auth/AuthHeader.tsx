import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showLogo?: boolean;
  align?: 'left' | 'center';
}

export function AuthHeader({
  title,
  subtitle,
  onBack,
  showLogo = true,
  align = 'left',
}: AuthHeaderProps) {
  const { colors, isDark } = useAppTheme();
  const isLeft = align === 'left';

  return (
    <View style={{ marginBottom: 24, width: '100%' }}>
      {/* Top Bar with Back Arrow */}
      {onBack && (
        <View style={{ marginBottom: 20 }}>
          <ThemedTouchable
            onPress={onBack}
            haptic="light"
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.border,
              elevation: 1,
            }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </ThemedTouchable>
        </View>
      )}

      {/* Circular Brand Logo Badge */}
      {showLogo && (
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            alignSelf: isLeft ? 'flex-start' : 'center',
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Ionicons name="sparkles" size={28} color="#FFFFFF" />
        </View>
      )}

      {/* Main Title */}
      <Text
        style={{
          fontSize: 28,
          fontFamily: 'Satoshi-Black',
          color: colors.textPrimary,
          letterSpacing: -0.6,
          marginBottom: 8,
          textAlign: isLeft ? 'left' : 'center',
        }}
      >
        {title}
      </Text>

      {/* Subtitle */}
      {subtitle && (
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'Satoshi-Regular',
            color: colors.textSecondary,
            lineHeight: 20,
            textAlign: isLeft ? 'left' : 'center',
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}

export default AuthHeader;
