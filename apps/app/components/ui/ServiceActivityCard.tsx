import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

export const CATEGORY_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  electricidad: 'lightning-bolt-outline',
  fontaneria: 'water-pump',
  banos: 'shower',
  cocina: 'countertop-outline',
  pladur: 'wall',
  pintura: 'format-paint',
  manitas: 'toolbox-outline',
  suelos: 'floor-plan',
  reformas: 'home-city-outline',
  climatizacion: 'air-conditioner',
  carpinteria: 'hammer',
  cerrajeria: 'key-variant',
  limpieza: 'broom',
};

export interface ServiceActivityItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  cardBg?: string;
  iconColor?: string;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
}

interface ServiceActivityCardProps {
  item: ServiceActivityItem;
  onPress: () => void;
}

const CARD_WIDTH = 174;
const CARD_HEIGHT = 168;

export function ServiceActivityCard({ item, onPress }: ServiceActivityCardProps) {
  const { colors, isDark } = useAppTheme();

  const iconName = item.iconName || CATEGORY_ICONS[item.slug] || 'tools';
  const iconColor = isDark ? '#38BDF8' : '#0284C7';
  const iconBg = isDark ? 'rgba(56, 189, 248, 0.12)' : '#F0F9FF';

  return (
    <View style={styles.outerWrapper}>
      <ThemedTouchable
        onPress={onPress}
        haptic="light"
        activeOpacity={0.88}
        style={[
          styles.cardContainer,
          {
            backgroundColor: isDark ? '#1C1C21' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={item.name}
      >
        {/* Top Row: Icon container + diagonal arrow indicator */}
        <View style={styles.topRow}>
          <View style={[styles.iconPill, { backgroundColor: iconBg }]}>
            <MaterialCommunityIcons
              name={iconName}
              size={24}
              color={iconColor}
            />
          </View>

          <View
            style={[
              styles.arrowIndicator,
              {
                backgroundColor: isDark ? '#27272A' : '#F8FAFC',
                borderColor: isDark ? '#333338' : '#E2E8F0',
              },
            ]}
          >
            <Feather
              name="arrow-up-right"
              size={14}
              color={isDark ? '#94A3B8' : '#64748B'}
            />
          </View>
        </View>

        {/* Bottom Section: Category Title & Subtle Description */}
        <View style={styles.bottomSection}>
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              { color: isDark ? '#F8FAFC' : '#0F172A' },
            ]}
          >
            {item.name}
          </Text>

          <Text
            numberOfLines={2}
            style={[
              styles.description,
              { color: isDark ? '#94A3B8' : '#64748B' },
            ]}
          >
            {item.description || 'Servicios verificados con garantía'}
          </Text>
        </View>
      </ThemedTouchable>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconPill: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSection: {
    marginTop: 'auto',
  },
  title: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Regular',
    lineHeight: 16,
  },
});

export default ServiceActivityCard;
