import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
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
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows, Typography } from '../src/components/Theme';
import { api } from '../src/services/api';
import { Category } from '../src/types';

const PASTEL_PALETTE = [
  { bg: '#D5D4F5', accent: '#4338CA' }, // Lavender
  { bg: '#F8E8A2', accent: '#B45309' }, // Buttercup
  { bg: '#C6DEC6', accent: '#1B4332' }, // Sage
  { bg: '#F4D3C6', accent: '#9A3412' }, // Peach
  { bg: '#E0F2FE', accent: '#0284C7' }, // Sky
  { bg: '#D1FAE5', accent: '#065F46' }, // Mint
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

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Obtener categorías reales de la base de datos
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories-all'],
    queryFn: async () => {
      const res: any = await api.get('/categories/tree');
      return res.data || res || [];
    },
  });

  const handleCategoryPress = (category: Category) => {
    router.push({
      pathname: '/search' as any,
      params: { category: category.id, query: category.name },
    });
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top + 8, 16),
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.titleWrapper}>
          <Text style={styles.screenTitle}>Categorías de Servicios</Text>
          <Text style={styles.screenSubtitle}>
            Profesionales verificados en Zaragoza por especialidad
          </Text>
        </View>
      </View>

      {/* Grid of Real Categories from DB */}
      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={{ marginVertical: 40 }}
        />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const palette = PASTEL_PALETTE[index % PASTEL_PALETTE.length];
            const IconComp = getCategoryIcon(item.slug || item.name);

            return (
              <TouchableOpacity
                style={[
                  styles.card,
                  { backgroundColor: palette.bg },
                ]}
                onPress={() => handleCategoryPress(item)}
                activeOpacity={0.88}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardSubtitle} numberOfLines={2}>
                    {item.description || 'Servicios profesionales en Zaragoza'}
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
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay categorías disponibles.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  titleWrapper: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111813',
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  gridContent: {
    padding: 14,
    paddingBottom: 100,
  },
  card: {
    flex: 1,
    margin: 6,
    minHeight: 155,
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
    marginTop: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
