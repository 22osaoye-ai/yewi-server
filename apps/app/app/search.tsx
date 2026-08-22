import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Clock,
  Flame,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
  Zap,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GigCard } from '../src/components/GigCard';
import { Colors, Shadows, Typography } from '../src/components/Theme';
import { AppSwitch } from '../src/components/ui/AppSwitch';
import { api } from '../src/services/api';
import { Category, Gig } from '../src/types';

const SORT_OPTIONS = [
  { id: 'rating', label: 'Mejor Valorado (★ 4.8+)' },
  { id: 'price_asc', label: 'Precio: Menor a Mayor' },
  { id: 'price_desc', label: 'Precio: Mayor a Menor' },
  { id: 'popular', label: 'Más Demandados' },
];

const PRICE_RANGES = [
  { id: 'all', label: 'Todos los precios', min: undefined, max: undefined },
  { id: 'budget', label: 'Económico (< 50€)', min: 0, max: 50 },
  { id: 'mid', label: 'Medio (50€ - 150€)', min: 50, max: 150 },
  { id: 'high', label: 'Proyectos (> 150€)', min: 150, max: 5000 },
];

const ZARAGOZA_ZONES = [
  { id: 'all', label: 'Toda Zaragoza', postal: undefined },
  { id: '50001', label: '50001 - Centro / Casco Antiguo', postal: '50001' },
  { id: '50009', label: '50009 - Romareda / Universidad', postal: '50009' },
  { id: '50010', label: '50010 - Delicias / Bombarda', postal: '50010' },
  { id: '50018', label: '50018 - Actur / Gran Casa', postal: '50018' },
  { id: '50007', label: '50007 - San José / Torrero', postal: '50007' },
  { id: '50014', label: '50014 - La Jota / Arrabal', postal: '50014' },
];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ query?: string; category?: string }>();

  const [query, setQuery] = useState(params.query || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    params.category || null,
  );

  // Advanced Filters
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [sortBy, setSortBy] = useState<string>('rating');
  const [priceRangeId, setPriceRangeId] = useState<string>('all');
  const [zoneId, setZoneId] = useState<string>('all');
  const [isUrgentOnly, setIsUrgentOnly] = useState(false);

  // Categorías reales de base de datos
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories-tree'],
    queryFn: async () => {
      const res: any = await api.get('/categories/tree');
      return res.data || res || [];
    },
  });

  const selectedPriceRange = PRICE_RANGES.find((p) => p.id === priceRangeId);
  const selectedZone = ZARAGOZA_ZONES.find((z) => z.id === zoneId);

  // Gigs reales de base de datos
  const { data: gigsData, isLoading } = useQuery({
    queryKey: [
      'gigs-search',
      query,
      selectedCategory,
      sortBy,
      priceRangeId,
      zoneId,
      isUrgentOnly,
    ],
    queryFn: async () => {
      const p: any = {};
      if (query.trim()) p.search = query.trim();
      if (selectedCategory) p.categoryId = selectedCategory;
      if (selectedPriceRange?.min !== undefined) p.minPrice = selectedPriceRange.min;
      if (selectedPriceRange?.max !== undefined) p.maxPrice = selectedPriceRange.max;
      if (selectedZone?.postal) p.postalCode = selectedZone.postal;
      p.sortBy = sortBy;

      const res: any = await api.get('/gigs', { params: p });
      return res.data || res || [];
    },
  });

  const gigs: Gig[] = Array.isArray(gigsData) ? gigsData : gigsData?.data || [];

  // Sugerencias generadas exclusivamente a partir de las categorías reales
  const dynamicSuggestions = useMemo(() => {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    return categories
      .filter((c) => c.name.toLowerCase().includes(lower))
      .map((c) => ({ text: `${c.name} en Zaragoza`, categoryId: c.id, categoryName: c.name }))
      .slice(0, 4);
  }, [query, categories]);

  const handleSelectSuggestion = (sug: { text: string; categoryId: string }) => {
    setSelectedCategory(sug.categoryId);
    setQuery('');
  };

  const activeFiltersCount =
    (sortBy !== 'rating' ? 1 : 0) +
    (priceRangeId !== 'all' ? 1 : 0) +
    (zoneId !== 'all' ? 1 : 0) +
    (isUrgentOnly ? 1 : 0);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Search Bar */}
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

          <View style={styles.searchInputWrapper}>
            <Search size={18} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar servicio en Zaragoza..."
              placeholderTextColor={Colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus={!params.query && !params.category}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => setQuery('')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Modal Trigger */}
          <TouchableOpacity
            style={[
              styles.filterBtn,
              activeFiltersCount > 0 && styles.filterBtnActive,
            ]}
            onPress={() => setShowFiltersModal(true)}
            activeOpacity={0.8}
          >
            <SlidersHorizontal
              size={18}
              color={activeFiltersCount > 0 ? '#FFFFFF' : Colors.text}
            />
            {activeFiltersCount > 0 && (
              <View style={styles.badgeNumber}>
                <Text style={styles.badgeNumberText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Dynamic Category-Based Suggestions */}
        {query.trim().length > 0 && dynamicSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {dynamicSuggestions.map((sug, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.suggestionItem}
                onPress={() => handleSelectSuggestion(sug)}
                activeOpacity={0.8}
              >
                <Search size={14} color={Colors.accent} />
                <Text style={styles.suggestionText} numberOfLines={1}>
                  {sug.text}
                </Text>
                <View style={styles.suggestionCategoryPill}>
                  <Text style={styles.suggestionCategoryText}>
                    {sug.categoryName}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Horizontal Real Categories Filter */}
        <View style={styles.categoryFilterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryFilterScroll}
          >
            <TouchableOpacity
              style={[
                styles.categoryFilterPill,
                selectedCategory === null && styles.categoryFilterPillActive,
              ]}
              onPress={() => setSelectedCategory(null)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.categoryFilterText,
                  selectedCategory === null && styles.categoryFilterTextActive,
                ]}
              >
                Todos
              </Text>
            </TouchableOpacity>

            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryFilterPill,
                    isSelected && styles.categoryFilterPillActive,
                  ]}
                  onPress={() =>
                    setSelectedCategory(isSelected ? null : cat.id)
                  }
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.categoryFilterText,
                      isSelected && styles.categoryFilterTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Results Grid */}
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={Colors.primary}
            style={{ marginVertical: 40 }}
          />
        ) : (
          <FlatList
            data={gigs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.resultsGrid}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <GigCard gig={item} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Zap size={40} color={Colors.textSecondary} />
                <Text style={styles.emptyTitle}>
                  No se encontraron servicios
                </Text>
                <Text style={styles.emptySubtitle}>
                  Prueba cambiando los filtros o seleccionando otra categoría.
                </Text>
              </View>
            }
          />
        )}
      </KeyboardAvoidingView>

      {/* Advanced Filter Modal */}
      <Modal
        visible={showFiltersModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFiltersModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              {
                paddingBottom: Math.max(insets.bottom + 16, 24),
              },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros Avanzados</Text>
              <TouchableOpacity
                onPress={() => setShowFiltersModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* 1. Ordenación */}
              <Text style={styles.filterHeading}>1. Ordenar Por</Text>
              <View style={styles.optionsWrap}>
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = sortBy === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        styles.filterChip,
                        isSelected && styles.filterChipActive,
                      ]}
                      onPress={() => setSortBy(opt.id)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          isSelected && styles.filterChipTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 2. Rango de Presupuesto */}
              <Text style={styles.filterHeading}>2. Rango de Presupuesto</Text>
              <View style={styles.optionsWrap}>
                {PRICE_RANGES.map((pr) => {
                  const isSelected = priceRangeId === pr.id;
                  return (
                    <TouchableOpacity
                      key={pr.id}
                      style={[
                        styles.filterChip,
                        isSelected && styles.filterChipActive,
                      ]}
                      onPress={() => setPriceRangeId(pr.id)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          isSelected && styles.filterChipTextActive,
                        ]}
                      >
                        {pr.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 3. Código Postal / Zona de Zaragoza */}
              <Text style={styles.filterHeading}>
                3. Zona o Código Postal en Zaragoza
              </Text>
              <View style={styles.optionsWrap}>
                {ZARAGOZA_ZONES.map((zone) => {
                  const isSelected = zoneId === zone.id;
                  return (
                    <TouchableOpacity
                      key={zone.id}
                      style={[
                        styles.filterChip,
                        isSelected && styles.filterChipActive,
                      ]}
                      onPress={() => setZoneId(zone.id)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          isSelected && styles.filterChipTextActive,
                        ]}
                      >
                        {zone.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 4. Disponibilidad Inmediata */}
              <View style={styles.toggleRow}>
                <View style={styles.toggleTextWrap}>
                  <Flame
                    size={20}
                    color={isUrgentOnly ? Colors.danger : Colors.textSecondary}
                  />
                  <View>
                    <Text style={styles.toggleTitle}>Servicio Urgente 24h</Text>
                    <Text style={styles.toggleSubtitle}>
                      Profesionales con respuesta inmediata
                    </Text>
                  </View>
                </View>
                <AppSwitch
                  value={isUrgentOnly}
                  onValueChange={setIsUrgentOnly}
                  activeColor={Colors.danger}
                  inActiveColor={Colors.border}
                />
              </View>
            </ScrollView>

            {/* Apply & Reset Buttons */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setSortBy('rating');
                  setPriceRangeId('all');
                  setZoneId('all');
                  setIsUrgentOnly(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.resetBtnText}>Limpiar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => setShowFiltersModal(false)}
                activeOpacity={0.9}
              >
                <Text style={styles.applyBtnText}>Aplicar Filtros</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
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
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 48,
    gap: 8,
    ...Shadows.subtle,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Shadows.subtle,
  },
  filterBtnActive: {
    backgroundColor: '#111813',
  },
  badgeNumber: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#DC2626',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeNumberText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 6,
    zIndex: 99,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  suggestionCategoryPill: {
    backgroundColor: Colors.surfaceWarm,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  suggestionCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  categoryFilterSection: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  categoryFilterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryFilterPill: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryFilterPillActive: {
    backgroundColor: '#111813',
    borderColor: '#111813',
  },
  categoryFilterText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  categoryFilterTextActive: {
    color: '#FFFFFF',
  },
  resultsGrid: {
    padding: 12,
    paddingBottom: 100,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111813',
    letterSpacing: -0.5,
  },
  modalCloseBtn: {
    padding: 4,
  },
  filterHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111813',
    letterSpacing: -0.2,
    marginTop: 14,
    marginBottom: 8,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#F5F1EA',
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  filterChipActive: {
    backgroundColor: '#111813',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111813',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F1EA',
    borderRadius: 20,
    padding: 14,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111813',
  },
  toggleSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  resetBtn: {
    flex: 1,
    height: 52,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  applyBtn: {
    flex: 2,
    height: 52,
    borderRadius: 9999,
    backgroundColor: '#111813',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.floating,
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
