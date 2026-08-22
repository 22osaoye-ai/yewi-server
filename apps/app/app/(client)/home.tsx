import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Droplets,
  Flame,
  Hammer,
  Key,
  Layers,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Square,
  Utensils,
  Wrench,
  Zap,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GigCard } from '../../src/components/GigCard';
import { Header } from '../../src/components/Header';
import { Colors, Shadows, Typography } from '../../src/components/Theme';
import { api } from '../../src/services/api';
import { Category, Gig } from '../../src/types';

export default function ClientHomeScreen() {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  // Obtener categorías desde backend
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories-home'],
    queryFn: async () => {
      const res: any = await api.get('/categories/tree');
      return res.data || res || [];
    },
  });

  // Obtener Gigs de catálogo
  const {
    data: gigsData,
    isLoading: isLoadingGigs,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['gigs-home', selectedCategoryId],
    queryFn: async () => {
      const res: any = await api.get('/gigs', {
        params: selectedCategoryId !== 'all' ? { categoryId: selectedCategoryId } : undefined,
      });
      return res.data || res || [];
    },
  });

  const gigs: Gig[] = Array.isArray(gigsData) ? gigsData : gigsData?.data || [];

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Clean Search Capsule Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/search' as any)}
          activeOpacity={0.88}
        >
          <Search size={18} color="#6C756F" />
          <Text style={styles.searchPlaceholder}>
            Buscar fontanero, electricista, reformas en Zaragoza...
          </Text>
          <View style={styles.filterBtn}>
            <SlidersHorizontal size={14} color="#111813" />
          </View>
        </TouchableOpacity>

        {/* Horizontal Category Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategoryId === 'all' && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategoryId('all')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategoryId === 'all' && styles.categoryChipTextActive,
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  isSelected && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategoryId(cat.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Servicios Verificados</Text>
            <Text style={styles.sectionSubtitle}>
              Profesionales con garantía de pago Escrow en Zaragoza
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/search' as any)}>
            <Text style={styles.seeAllText}>Ver todos →</Text>
          </TouchableOpacity>
        </View>

        {/* Verified Gigs Feed */}
        {isLoadingGigs ? (
          <ActivityIndicator
            size="large"
            color={Colors.primary}
            style={{ marginVertical: 40 }}
          />
        ) : gigs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No hay servicios en esta categoría</Text>
            <Text style={styles.emptySubtitle}>
              Prueba seleccionando otra categoría o busca por palabras clave.
            </Text>
          </View>
        ) : (
          <View style={styles.gigsFeed}>
            {gigs.map((gig) => (
              <GigCard key={gig.id} gig={gig} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 160,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E8E2D5',
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    marginBottom: 14,
    ...Shadows.subtle,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13,
    color: '#6C756F',
    marginLeft: 10,
    fontWeight: '500',
  },
  filterBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F5ECE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 16,
  },
  categoryChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E8E2D5',
  },
  categoryChipActive: {
    backgroundColor: '#111813',
    borderColor: '#111813',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6C756F',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 14,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111813',
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6C756F',
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111813',
  },
  gigsFeed: {
    gap: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111813',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#6C756F',
    marginTop: 4,
    textAlign: 'center',
  },
});
