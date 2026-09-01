import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

const CARD_WIDTH = 188;
const CARD_HEIGHT = 205;

export function ServiceActivityCard({ item, onPress }: ServiceActivityCardProps) {
  const { isDark } = useAppTheme();

  const bgColor = isDark
    ? '#241E34'
    : item.cardBg || '#DED4F5';

  const iconColor = item.iconColor || (isDark ? '#F59E0B' : '#C87D20');
  const iconName = item.iconName || CATEGORY_ICONS[item.slug] || 'tools';

  const w = CARD_WIDTH;
  const h = CARD_HEIGHT;

  // Exact vertical card notch curve carving out the bottom-right corner for the circular button
  const d = `
    M 26 0
    L ${w - 26} 0
    A 26 26 0 0 1 ${w} 26
    L ${w} ${h - 64}
    Q ${w} ${h - 48} ${w - 14} ${h - 48}
    L ${w - 36} ${h - 48}
    Q ${w - 50} ${h - 48} ${w - 50} ${h - 34}
    Q ${w - 50} ${h} ${w - 64} ${h}
    L 26 ${h}
    A 26 26 0 0 1 0 ${h - 26}
    L 0 26
    A 26 26 0 0 1 26 0
    Z
  `;

  return (
    <View style={styles.outerWrapper}>
      <ThemedTouchable
        onPress={onPress}
        haptic="light"
        activeOpacity={0.92}
        style={{ width: CARD_WIDTH, height: CARD_HEIGHT, position: 'relative' }}
      >
        {/* Notched Card Background SVG */}
        <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
          <Path
            d={d}
            fill={bgColor}
          />
        </Svg>

        {/* Content Layout inside Vertical Notched Card */}
        <View style={styles.cardContent}>
          {/* Top: Category Icon without background box */}
          <View style={styles.topIconContainer}>
            <MaterialCommunityIcons
              name={iconName}
              size={50}
              color={iconColor}
            />
          </View>

          {/* Middle: Title */}
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              { color: isDark ? '#FFFFFF' : '#18181B' },
            ]}
          >
            {item.name}
          </Text>

          {/* Overlapping Avatar Placeholders + Badge */}
          <View style={styles.avatarRow}>
            <View style={[styles.avatarBubble, { backgroundColor: '#FDE047', zIndex: 3 }]}>
              <Ionicons name="person" size={10} color="#854D0E" />
            </View>
            <View style={[styles.avatarBubble, { backgroundColor: '#93C5FD', marginLeft: -6, zIndex: 2 }]}>
              <Ionicons name="person" size={10} color="#1E40AF" />
            </View>
            <View style={[styles.avatarBubble, { backgroundColor: '#FCA5A5', marginLeft: -6, zIndex: 1 }]}>
              <Ionicons name="person" size={10} color="#991B1B" />
            </View>
            <View style={[styles.proBadge, { backgroundColor: isDark ? '#374151' : '#18181B' }]}>
              <Text style={styles.proBadgeText}>+</Text>
            </View>
          </View>

          {/* Bottom: N/A Metric */}
          <View style={styles.statsRow}>
            <Text
              style={[
                styles.statsCount,
                { color: isDark ? '#FFFFFF' : '#18181B' },
              ]}
            >
              N/A
            </Text>
            <Text
              style={[
                styles.statsLabel,
                { color: isDark ? '#9CA3AF' : '#6B7280' },
              ]}
            >
              disponibles
            </Text>
          </View>
        </View>

        {/* Circular Black Button with Diagonal Arrow (↗) - NO BORDER */}
        <View
          style={[
            styles.actionButton,
            {
              backgroundColor: isDark ? '#FFFFFF' : '#18181B',
            },
          ]}
          pointerEvents="none"
        >
          <Feather
            name="arrow-up-right"
            size={18}
            color={isDark ? '#18181B' : '#FFFFFF'}
          />
        </View>
      </ThemedTouchable>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
    height: '100%',
    justifyContent: 'space-between',
  },
  topIconContainer: {
    width: 60,
    height: 60,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontFamily: 'Satoshi-Black',
    letterSpacing: -0.3,
    marginTop: 2,
    marginBottom: 4,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatarBubble: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  proBadge: {
    marginLeft: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 999,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontFamily: 'Satoshi-Black',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    paddingRight: 40,
  },
  statsCount: {
    fontSize: 19,
    fontFamily: 'Satoshi-Black',
    lineHeight: 21,
  },
  statsLabel: {
    fontSize: 11.5,
    fontFamily: 'Satoshi-Medium',
  },
  actionButton: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default ServiceActivityCard;
