import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ArrowUpRight,
  Droplets,
  Flame,
  Hammer,
  Key,
  Layers,
  Sparkles,
  Square,
  Utensils,
  Wrench,
  Zap,
} from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../services/api';
import { Category } from '../types';
import { Colors, Shadows, Typography } from './Theme';

const PASTEL_PALETTE = [
  { bg: '#D5D4F5', accent: '#4338CA' }, // Lavender (Fontanería)
  { bg: '#F8E8A2', accent: '#B45309' }, // Buttercup (Reformas)
  { bg: '#C6DEC6', accent: '#1B4332' }, // Sage (Electricidad)
  { bg: '#F4D3C6', accent: '#9A3412' }, // Peach (Pintura)
];

const getCategoryIcon = (slugOrName: string) => {
  const s = (slugOrName || '').toLowerCase();
  if (s.includes('electr')) return Zap;
  if (s.includes('fontan')) return Droplets;
  if (s.includes('baño')) return Droplets;
  if (s.includes('cocina')) return Utensils;
  if (s.includes('pladur')) return Square;
  if (s.includes('pintur')) return Sparkles;
  if (s.includes('manita')) return Wrench;
  if (s.includes('suelo')) return Layers;
  if (s.includes('reforma')) return Hammer;
  if (s.includes('limpieza')) return Sparkles;
  if (s.includes('cerraj')) return Key;
  if (s.includes('clima')) return Flame;
  return Wrench;
};

interface CategorySeriesSectionProps {
  title?: string;
  actionText?: string;
  limit?: number;
  layout?: 'grid' | 'scroll';
}

export const CategorySeriesSection: React.FC<CategorySeriesSectionProps> = ({
  title = 'Servicios Populares',
  actionText = 'Ver todos',
  limit = 4,
}) => {
  const router = useRouter();

  // Obtener categorías reales desde backend
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories-home-grid'],
    queryFn: async () => {
      const res: any = await api.get('/categories/tree');
      return res.data || res || [];
    },
  });

  const displayedCategories = categories.slice(0, limit);

  const handleCategoryPress = (category: Category) => {
    router.push({
      pathname: '/search' as any,
      params: { category: category.id, query: category.name },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.kicker}>CATEGORÍAS</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/categories' as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionText}>{actionText} →</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
      ) : (
        <View style={styles.gridContainer}>
          {displayedCategories.map((category, index) => {
            const palette = PASTEL_PALETTE[index % PASTEL_PALETTE.length];
            const IconComp = getCategoryIcon(category.slug || category.name);

            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.card,
                  { backgroundColor: palette.bg },
                ]}
                onPress={() => handleCategoryPress(category)}
                activeOpacity={0.88}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{category.name}</Text>
                  <Text style={styles.cardSubtitle} numberOfLines={2}>
                    {category.description || 'Servicios profesionales'}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.iconCircle}>
                    <IconComp size={22} color={palette.accent} />
                  </View>

                  <View style={styles.arrowCircle}>
                    <ArrowUpRight size={16} color="#111813" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E9892',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111813',
    letterSpacing: -0.5,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111813',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  card: {
    width: '48%',
    minHeight: 145,
    borderRadius: 28,
    padding: 16,
    justifyContent: 'space-between',
    ...Shadows.subtle,
  },
  cardHeader: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111813',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 11,
    color: 'rgba(17, 24, 19, 0.75)',
    lineHeight: 15,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
});
