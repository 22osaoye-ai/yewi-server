import React from 'react';
import { View, Text } from 'react-native';
import { AuthButton } from './AuthButton';
import { useAppTheme } from '@/hooks/useAppTheme';

interface SocialAuthButtonsProps {
  onGooglePress: () => void;
  variant?: 'stacked' | 'side-by-side';
}

export function SocialAuthButtons({
  onGooglePress,
  variant = 'stacked',
}: SocialAuthButtonsProps) {
  const { colors } = useAppTheme();

  if (variant === 'side-by-side') {
    return (
      <View className="w-full">
        {/* Divider */}
        <View className="flex-row items-center my-5">
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'Satoshi-Bold',
              color: colors.textMuted,
              marginHorizontal: 16,
            }}
          >
            O
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        </View>

        <AuthButton
          title="Continuar con Google"
          onPress={onGooglePress}
          variant="outline"
          iconName="logo-google"
          iconColor="#EA4335"
        />
      </View>
    );
  }

  return (
    <View className="w-full gap-3 mb-6">
      <AuthButton
        title="Continuar con Google"
        onPress={onGooglePress}
        variant="outline"
        iconName="logo-google"
        iconColor="#EA4335"
      />
    </View>
  );
}

export default SocialAuthButtons;
