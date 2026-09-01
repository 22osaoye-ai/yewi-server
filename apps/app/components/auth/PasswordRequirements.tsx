import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useAppTheme';

interface PasswordRequirementsProps {
  password: string;
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const { colors } = useAppTheme();

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const rules = [
    { label: 'Al menos 8 caracteres', valid: hasMinLength },
    { label: 'Al menos 1 letra mayúscula', valid: hasUppercase },
    { label: 'Al menos 1 letra minúscula', valid: hasLowercase },
    { label: 'Al menos 1 número', valid: hasNumber },
  ];

  return (
    <View className="mb-5 mt-1 ml-1">
      {rules.map((rule, idx) => (
        <View key={idx} className="flex-row items-center my-0.5">
          <Ionicons
            name={rule.valid ? 'checkmark-circle' : 'remove-outline'}
            size={16}
            color={rule.valid ? '#10B981' : colors.textMuted}
            style={{ marginRight: 8 }}
          />
          <Text
            style={{
              fontSize: 12.5,
              fontFamily: rule.valid ? 'Satoshi-Bold' : 'Satoshi-Regular',
              color: rule.valid ? '#10B981' : colors.textSecondary,
            }}
          >
            {rule.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default PasswordRequirements;
