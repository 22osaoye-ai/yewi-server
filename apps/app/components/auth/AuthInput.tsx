import React from 'react';
import { Input, InputProps } from '@/components/ui/Input';
import { Ionicons } from '@expo/vector-icons';

export interface AuthInputProps extends InputProps {
  iconName?: keyof typeof Ionicons.glyphMap;
}

export function AuthInput({ iconName, leftIcon, ...props }: AuthInputProps) {
  return <Input leftIcon={iconName || leftIcon} {...props} />;
}

export default AuthInput;
