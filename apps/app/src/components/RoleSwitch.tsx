import { useRouter } from 'expo-router';
import { Briefcase, ShoppingBag } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../store/auth.store';
import { Colors, Shadows } from './Theme';

export const RoleSwitch: React.FC = () => {
  const { user, activeRole, switchRole } = useAuthStore();
  const router = useRouter();

  const isPro = user?.roles.includes('PROFESSIONAL') || false;

  const handleToggle = (role: 'CLIENT' | 'PROFESSIONAL') => {
    if (role === 'PROFESSIONAL' && !isPro) {
      router.push('/(client)/profile');
      return;
    }

    switchRole(role);
    if (role === 'CLIENT') {
      router.replace('/(client)/home');
    } else {
      router.replace('/(pro)/opportunities');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          activeRole === 'CLIENT' && styles.activeButton,
        ]}
        onPress={() => handleToggle('CLIENT')}
        activeOpacity={0.85}
      >
        <ShoppingBag
          size={12}
          color={activeRole === 'CLIENT' ? '#FFFFFF' : Colors.textSecondary}
        />
        <Text
          style={[
            styles.text,
            activeRole === 'CLIENT' && styles.activeText,
          ]}
        >
          Cliente
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          activeRole === 'PROFESSIONAL' && styles.activeButton,
        ]}
        onPress={() => handleToggle('PROFESSIONAL')}
        activeOpacity={0.85}
      >
        <Briefcase
          size={12}
          color={activeRole === 'PROFESSIONAL' ? '#FFFFFF' : Colors.textSecondary}
        />
        <Text
          style={[
            styles.text,
            activeRole === 'PROFESSIONAL' && styles.activeText,
          ]}
        >
          Pro
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.pillInactiveBg,
    borderRadius: 24,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 4,
  },
  activeButton: {
    backgroundColor: Colors.primary,
    ...Shadows.subtle,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  activeText: {
    color: '#FFFFFF',
  },
});
