import { useRouter } from 'expo-router';
import { ChevronUp, Sparkles, Wrench } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../store/auth.store';
import { Colors, Shadows } from './Theme';

interface ActionRibbonProps {
  title?: string;
  badge?: string;
  onPress?: () => void;
}

export const ActionRibbon: React.FC<ActionRibbonProps> = ({
  title = 'SOLICITUD EXPRESS',
  badge = 'Zaragoza',
  onPress,
}) => {
  const router = useRouter();
  const { activeRole } = useAuthStore();

  const handleAction = () => {
    if (onPress) {
      onPress();
      return;
    }

    if (activeRole === 'PROFESSIONAL') {
      router.push('/(pro)/opportunities');
    } else {
      router.push('/requests/new');
    }
  };

  return (
    <View style={styles.floatingWrapper}>
      <TouchableOpacity
        style={styles.ribbon}
        onPress={handleAction}
        activeOpacity={0.9}
      >
        <View style={styles.left}>
          <View style={styles.iconCircle}>
            <Wrench size={14} color={Colors.primary} />
          </View>
          <Text style={styles.titleText}>
            {activeRole === 'PROFESSIONAL' ? 'LEADS EN ZARAGOZA' : title}
          </Text>
        </View>

        <View style={styles.right}>
          <Text style={styles.badgeText}>
            {activeRole === 'PROFESSIONAL' ? 'Ver Nuevas' : 'Pedir Presupuesto'}
          </Text>
          <ChevronUp size={16} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: 85,
    left: 20,
    right: 20,
    zIndex: 99,
  },
  ribbon: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Shadows.floating,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    color: '#E0E7E3',
    fontSize: 12,
    fontWeight: '700',
  },
});
