import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SearchFilterHeader } from '@/components/search/SearchFilterHeader';
import { ProfessionalCard } from '@/components/ui/ProfessionalCard';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { ThemedPressed } from '@/components/ui/ThemedPressed';
import {
  professionalsApi,
  ProfessionalDetail,
} from '@/services/professionalsApi';
import { gigsApi, GigDetail } from '@/services/gigsApi';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { PublishProjectModal } from '@/components/ui/PublishProjectModal';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuthStore } from '@/store/useAuthStore';
import { useInterestsStore } from '@/store/useInterestsStore';

interface CategoryItem {
  id: string;
  title: string;
  subtitle: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  categoryFilter: string;
}

const CATEGORY_LIST: CategoryItem[] = [
  {
    id: 'electricidad',
    title: 'Electricidad',
    subtitle: 'Instalaciones, boletines, cuadro de luces y averías',
    iconName: 'lightning-bolt-outline',
    categoryFilter: 'Electricidad',
  },
  {
    id: 'fontaneria',
    title: 'Fontanería',
    subtitle: 'Fugas de agua, calderas, grifería y desatascos',
    iconName: 'water-pump',
    categoryFilter: 'Fontanería',
  },
  {
    id: 'banos',
    title: 'Baños',
    subtitle: 'Cambio de bañera por plato de ducha y mamparas',
    iconName: 'shower',
    categoryFilter: 'Baños',
  },
  {
    id: 'cocina',
    title: 'Cocina',
    subtitle: 'Muebles a medida, encimeras e instalaciones',
    iconName: 'countertop-outline',
    categoryFilter: 'Cocina',
  },
  {
    id: 'pladur',
    title: 'Pladur',
    subtitle: 'Tabiquería seca, techos continuos e insonorización',
    iconName: 'wall',
    categoryFilter: 'Pladur',
  },
  {
    id: 'pintura',
    title: 'Pintura',
    subtitle: 'Alisado de gotelé, interiores, fachadas y decoración',
    iconName: 'format-paint',
    categoryFilter: 'Pintura',
  },
  {
    id: 'manitas',
    title: 'Manitas',
    subtitle: 'Montaje de muebles, lámparas y pequeños arreglos',
    iconName: 'toolbox-outline',
    categoryFilter: 'Manitas',
  },
  {
    id: 'suelos',
    title: 'Suelos y Tarima',
    subtitle: 'Tarima flotante, parquet, acuchillado y vinílicos',
    iconName: 'floor-plan',
    categoryFilter: 'Suelos',
  },
  {
    id: 'climatizacion',
    title: 'Climatización',
    subtitle: 'Aire acondicionado, bombas de calor y aerotermia',
    iconName: 'air-conditioner',
    categoryFilter: 'Climatización',
  },
  {
    id: 'carpinteria',
    title: 'Carpintería',
    subtitle: 'Puertas de paso, armarios empotrados y madera',
    iconName: 'hammer',
    categoryFilter: 'Carpintería',
  },
  {
    id: 'cerrajeria',
    title: 'Cerrajería',
    subtitle: 'Aperturas 24h, cambio de cerraduras y bombines',
    iconName: 'key-variant',
    categoryFilter: 'Cerrajería',
  },
  {
    id: 'limpieza',
    title: 'Limpieza de Obra',
    subtitle: 'Limpiezas a fondo fin de obra, hogar y locales',
    iconName: 'broom',
    categoryFilter: 'Limpieza',
  },
];

const INTEREST_CHIPS = [
  'Todos',
  'Electricidad',
  'Fontanería',
  'Climatización',
  'Reformas',
  'Pintura',
  'Baños',
  'Cocina',
  'Pladur',
  'Manitas',
  'Suelos',
  'Carpintería',
  'Cerrajería',
  'Limpieza',
];

const POPULAR_SEARCHES = [
  'Electricidad',
  'Fontanería',
  'Pintor piso completo',
  'Cambio de bañera',
  'Reparar caldera',
  'Montar muebles',
  'Instalar aire acondicionado',
];

export function SearchTemplate() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();

  const params = useLocalSearchParams<{ q?: string; category?: string; tab?: 'categories' | 'projects' | 'interests' }>();
  const [query, setQuery] = useState(params.q || '');
  const [activeTab, setActiveTab] = useState<'categories' | 'projects' | 'interests'>(params.tab || 'categories');
  const [isSearching, setIsSearching] = useState(Boolean(params.q || params.category));
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(
    params.category || null
  );

  const [professionals, setProfessionals] = useState<ProfessionalDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Projects Tab State
  const [projects, setProjects] = useState<GigDetail[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProjectCategoryFilter, setSelectedProjectCategoryFilter] = useState<string>('Todos');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [searchProjects, setSearchProjects] = useState<GigDetail[]>([]);
  const [searchTabFilter, setSearchTabFilter] = useState<'all' | 'projects' | 'sellers'>('all');

  // Interests Tab State
  const { interests: userInterests, lastUpdatedAt: lastInterestsUpdate, loadInterests } = useInterestsStore();
  const [selectedInterestFilter, setSelectedInterestFilter] = useState<string>(
    userInterests.length > 0 ? `⭐️ Mis Intereses (${userInterests.length})` : 'Todos'
  );
  const [interestSellers, setInterestSellers] = useState<ProfessionalDetail[]>([]);
  const [loadingInterests, setLoadingInterests] = useState(false);

  const { user } = useAuthStore();
  const isProfessional = user?.roles?.includes('PROFESSIONAL');

  useEffect(() => {
    loadInterests();
  }, [loadInterests]);

  // Si los intereses del usuario cambian y no había seleccionado una categoría individual, sincronizar filtro
  useEffect(() => {
    if (userInterests.length > 0 && (selectedInterestFilter === 'Todos' || selectedInterestFilter.startsWith('⭐️ Mis Intereses'))) {
      setSelectedInterestFilter(`⭐️ Mis Intereses (${userInterests.length})`);
    }
  }, [userInterests.length, lastInterestsUpdate]);

  const fetchProfessionals = useCallback(
    async (showLoader = true) => {
      if (showLoader) setLoading(true);
      try {
        const q = query.trim() || undefined;
        const cat = selectedCategoryFilter || undefined;

        const [proRes, gigRes] = await Promise.allSettled([
          professionalsApi.searchProfessionals({
            q,
            category: cat,
            limit: 50,
          }),
          gigsApi.getAll({
            search: q,
            category: cat,
            limit: 50,
          }),
        ]);

        const currentUserId = useAuthStore.getState().user?.id;
        if (proRes.status === 'fulfilled') {
          const validItems = (proRes.value?.items || []).filter(
            (item: ProfessionalDetail) =>
              !currentUserId ||
              (item.user?.id !== currentUserId &&
                (item as any).userId !== currentUserId &&
                item.id !== currentUserId)
          );
          setProfessionals(validItems);
        } else {
          setProfessionals([]);
        }

        if (gigRes.status === 'fulfilled') {
          setSearchProjects(Array.isArray(gigRes.value) ? gigRes.value : []);
        } else {
          setSearchProjects([]);
        }
      } catch {
        setProfessionals([]);
        setSearchProjects([]);
      } finally {
        if (showLoader) setLoading(false);
        setRefreshing(false);
      }
    },
    [query, selectedCategoryFilter]
  );

  const fetchProjects = useCallback(
    async (showLoader = true) => {
      if (showLoader) setLoadingProjects(true);
      try {
        const catFilter =
          selectedProjectCategoryFilter !== 'Todos' ? selectedProjectCategoryFilter : undefined;
        const data = await gigsApi.getAll({
          category: catFilter,
          limit: 50,
        });
        setProjects(Array.isArray(data) ? data : []);
      } catch {
        setProjects([]);
      } finally {
        if (showLoader) setLoadingProjects(false);
        setRefreshing(false);
      }
    },
    [selectedProjectCategoryFilter]
  );

  const fetchInterestSellers = useCallback(
    async (showLoader = true) => {
      if (showLoader) setLoadingInterests(true);
      try {
        let catFilter: string | undefined = undefined;
        const currentInterests = useInterestsStore.getState().interests;

        if (selectedInterestFilter.startsWith('⭐️ Mis Intereses') || selectedInterestFilter === 'Mis Intereses') {
          catFilter = currentInterests.length > 0 ? currentInterests.join(',') : undefined;
        } else if (selectedInterestFilter !== 'Todos') {
          catFilter = selectedInterestFilter;
        }

        const res = await professionalsApi.searchProfessionals({
          category: catFilter,
          limit: 50,
        });
        const currentUserId = useAuthStore.getState().user?.id;
        const validItems = (res?.items || []).filter(
          (item: ProfessionalDetail) =>
            !currentUserId ||
            (item.user?.id !== currentUserId &&
              (item as any).userId !== currentUserId &&
              item.id !== currentUserId)
        );
        setInterestSellers(validItems);
      } catch {
        setInterestSellers([]);
      } finally {
        if (showLoader) setLoadingInterests(false);
        setRefreshing(false);
      }
    },
    [selectedInterestFilter, lastInterestsUpdate]
  );

  useEffect(() => {
    if (params.tab && params.tab !== activeTab) {
      setActiveTab(params.tab);
    }
  }, [params.tab]);

  useEffect(() => {
    if (params.category) {
      setSelectedCategoryFilter(params.category);
      setQuery('');
      setIsSearching(true);
    } else if (params.q) {
      setQuery(params.q);
      setSelectedCategoryFilter(null);
      setIsSearching(true);
    }
  }, [params.category, params.q]);

  useEffect(() => {
    if (isSearching || selectedCategoryFilter || query.trim()) {
      fetchProfessionals(true);
    }
  }, [isSearching, selectedCategoryFilter, query, fetchProfessionals]);

  useEffect(() => {
    if (!isSearching && activeTab === 'projects') {
      fetchProjects(true);
    }
  }, [isSearching, activeTab, selectedProjectCategoryFilter, fetchProjects]);

  useEffect(() => {
    if (!isSearching && activeTab === 'interests') {
      fetchInterestSellers(true);
    }
  }, [isSearching, activeTab, selectedInterestFilter, lastInterestsUpdate, fetchInterestSellers]);

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'projects') {
        fetchProjects(false);
      } else if (activeTab === 'interests') {
        fetchInterestSellers(false);
      } else if (isSearching || selectedCategoryFilter || query.trim()) {
        fetchProfessionals(false);
      }
    }, [activeTab, isSearching, selectedCategoryFilter, query, fetchProjects, fetchInterestSellers, fetchProfessionals])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    if (isSearching) {
      fetchProfessionals(false);
    } else if (activeTab === 'projects') {
      fetchProjects(false);
    } else if (activeTab === 'interests') {
      fetchInterestSellers(false);
    } else {
      setRefreshing(false);
    }
  };

  const handleProjectDelete = async (projectId: string) => {
    try {
      await gigsApi.delete(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch {}
  };

  const handleProfessionalPress = (proId: string) => {
    router.push({
      pathname: '/detail',
      params: { id: proId, entityType: 'professional' },
    });
  };

  const handleCategoryPress = (category: CategoryItem) => {
    setSelectedCategoryFilter(category.categoryFilter);
    setQuery('');
    setIsSearching(true);
  };

  const handleClearAll = () => {
    setQuery('');
    setSelectedCategoryFilter(null);
    setIsSearching(false);
    setProfessionals([]);
    setSearchProjects([]);
  };

  const showSearchResults =
    isSearching && (query.trim().length > 0 || selectedCategoryFilter !== null);
  const showEmptySearchOverlay =
    isSearching && query.trim().length === 0 && selectedCategoryFilter === null;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Search Header */}
      <SearchFilterHeader
        query={query}
        onChangeQuery={setQuery}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSelectedCategoryFilter(null);
        }}
        isSearching={isSearching}
        setIsSearching={setIsSearching}
      />

      {/* STATE 1: ACTIVE SEARCH OVERLAY WITH EMPTY QUERY */}
      {showEmptySearchOverlay && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 30, paddingBottom: 140 }}
        >
          <View className="items-center justify-center mb-8">
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: colors.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              <Ionicons name="search" size={26} color={colors.primary} />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontFamily: 'Satoshi-Bold',
                color: colors.textPrimary,
                marginBottom: 6,
                textAlign: 'center',
              }}
            >
              Busca autónomos y empresas verificadas
            </Text>
            <Text
              style={{
                fontSize: 13.5,
                fontFamily: 'Satoshi-Regular',
                color: colors.textSecondary,
                textAlign: 'center',
                maxWidth: 290,
                lineHeight: 20,
              }}
            >
              Encuentra electricistas, fontaneros, reformas y profesionales cerca de ti con valoraciones reales.
            </Text>
          </View>

          {/* Popular Search Suggestions */}
          <View className="mt-2">
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Satoshi-Bold',
                color: colors.textPrimary,
                marginBottom: 12,
              }}
            >
              Especialidades populares
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {POPULAR_SEARCHES.map((tag) => (
                <ThemedTouchable
                  key={tag}
                  onPress={() => {
                    setQuery(tag);
                    setIsSearching(true);
                  }}
                  haptic="light"
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 999,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons
                    name="trending-up"
                    size={14}
                    color={colors.primary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'Satoshi-Bold',
                      color: colors.textPrimary,
                    }}
                  >
                    {tag}
                  </Text>
                </ThemedTouchable>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {/* STATE 2: LIVE SEARCH RESULTS */}
      {showSearchResults && (
        <View className="flex-1">
          {/* Active Filter Indicator Bar & Tabs */}
          <View className="px-5 py-2.5">
            <View className="flex-row justify-between items-center mb-2">
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Satoshi-Bold',
                  color: colors.textSecondary,
                }}
              >
                Resultados encontrados ({professionals.length + searchProjects.length})
                {selectedCategoryFilter ? ` · ${selectedCategoryFilter}` : ''}
              </Text>

              <ThemedTouchable onPress={handleClearAll} haptic="light">
                <Text
                  style={{
                    fontSize: 12.5,
                    fontFamily: 'Satoshi-Bold',
                    color: colors.primary,
                  }}
                >
                  Limpiar filtros
                </Text>
              </ThemedTouchable>
            </View>

            {/* Segmented Filter Pills */}
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setSearchTabFilter('all')}
                style={{
                  backgroundColor: searchTabFilter === 'all' ? colors.primary : colors.surface,
                  paddingHorizontal: 12,
                  paddingVertical: 5.5,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: searchTabFilter === 'all' ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Satoshi-Bold',
                    color: searchTabFilter === 'all' ? '#FFFFFF' : colors.textPrimary,
                  }}
                >
                  Todos ({professionals.length + searchProjects.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSearchTabFilter('projects')}
                style={{
                  backgroundColor: searchTabFilter === 'projects' ? colors.primary : colors.surface,
                  paddingHorizontal: 12,
                  paddingVertical: 5.5,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: searchTabFilter === 'projects' ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Satoshi-Bold',
                    color: searchTabFilter === 'projects' ? '#FFFFFF' : colors.textPrimary,
                  }}
                >
                  Servicios ({searchProjects.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSearchTabFilter('sellers')}
                style={{
                  backgroundColor: searchTabFilter === 'sellers' ? colors.primary : colors.surface,
                  paddingHorizontal: 12,
                  paddingVertical: 5.5,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: searchTabFilter === 'sellers' ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Satoshi-Bold',
                    color: searchTabFilter === 'sellers' ? '#FFFFFF' : colors.textPrimary,
                  }}
                >
                  Profesionales ({professionals.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator color={colors.primary} size="large" />
              <Text
                style={{
                  fontSize: 13.5,
                  fontFamily: 'Satoshi-Medium',
                  color: colors.textSecondary,
                  marginTop: 12,
                }}
              >
                Buscando servicios y profesionales...
              </Text>
            </View>
          ) : professionals.length > 0 || searchProjects.length > 0 ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 18,
                paddingTop: 8,
                paddingBottom: 140,
              }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.primary}
                />
              }
            >
              {/* Projects Section */}
              {(searchTabFilter === 'all' || searchTabFilter === 'projects') && searchProjects.length > 0 && (
                <View className="mb-4">
                  <View className="flex-row justify-between items-center mb-2.5 px-1">
                    <Text style={{ fontSize: 16, fontFamily: 'Satoshi-Black', color: colors.textPrimary }}>
                      Proyectos y Servicios a Precio Cerrado ({searchProjects.length})
                    </Text>
                  </View>
                  {searchProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onPress={() =>
                        router.push({
                          pathname: '/detail',
                          params: { id: project.id, entityType: 'gig' },
                        })
                      }
                      onDelete={handleProjectDelete}
                    />
                  ))}
                </View>
              )}

              {/* Professionals Section */}
              {(searchTabFilter === 'all' || searchTabFilter === 'sellers') && professionals.length > 0 && (
                <View className="mb-4">
                  <View className="flex-row justify-between items-center mb-2.5 px-1">
                    <Text style={{ fontSize: 16, fontFamily: 'Satoshi-Black', color: colors.textPrimary }}>
                      Profesionales y Autónomos ({professionals.length})
                    </Text>
                  </View>
                  {professionals.map((item) => (
                    <ProfessionalCard
                      key={item.id}
                      professional={item}
                      onPress={() => handleProfessionalPress(item.id)}
                    />
                  ))}
                </View>
              )}
            </ScrollView>
          ) : (
            <View className="flex-1 items-center justify-center px-8 pb-20">
              <View
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 34,
                  backgroundColor: colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="search-outline" size={32} color={colors.textMuted} />
              </View>
              <Text
                style={{
                  fontSize: 17,
                  fontFamily: 'Satoshi-Bold',
                  color: colors.textPrimary,
                  marginBottom: 6,
                  textAlign: 'center',
                }}
              >
                No encontramos resultados para tu búsqueda
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Satoshi-Regular',
                  color: colors.textMuted,
                  textAlign: 'center',
                  marginBottom: 20,
                  lineHeight: 20,
                  maxWidth: 290,
                }}
              >
                {selectedCategoryFilter
                  ? `Sé el primero en solicitar un presupuesto en ${selectedCategoryFilter} o publica tu solicitud para recibir ofertas de autónomos.`
                  : 'Publica tu solicitud para que los profesionales de tu zona te envíen presupuestos personalizados.'}
              </Text>

              <View style={{ gap: 10, width: '100%', maxWidth: 280 }}>
                <ThemedPressed
                  onPress={() => router.push('/(tabs)/requests')}
                  haptic="medium"
                  scaleOnPress
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 999,
                    paddingVertical: 13,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontFamily: 'Satoshi-Bold', fontSize: 14 }}>
                    + Publicar Solicitud
                  </Text>
                </ThemedPressed>

                <ThemedPressed
                  onPress={() => router.push('/professional-profile')}
                  haptic="light"
                  scaleOnPress
                  style={{
                    backgroundColor: isDark ? colors.surface : '#F4F4F6',
                    borderRadius: 999,
                    paddingVertical: 12,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: isDark ? colors.border : '#E4E4E7',
                  }}
                >
                  <Text
                    style={{
                      color: isDark ? '#FFFFFF' : '#18181B',
                      fontFamily: 'Satoshi-Bold',
                      fontSize: 13.5,
                    }}
                  >
                    ¿Eres profesional? Ofrece tus servicios
                  </Text>
                </ThemedPressed>
              </View>
            </View>
          )}
        </View>
      )}

      {/* STATE 3: DEFAULT CATEGORIES LIST */}
      {!isSearching && activeTab === 'categories' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 4, paddingBottom: 140 }}
        >
          {CATEGORY_LIST.map((item) => (
            <ThemedTouchable
              key={item.id}
              onPress={() => handleCategoryPress(item)}
              haptic="selection"
              activeOpacity={0.75}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderSubtle,
              }}
            >
              <View style={{ marginRight: 14, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name={item.iconName} size={24} color={colors.primary} />
              </View>

              <View className="flex-1 justify-center">
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'Satoshi-Bold',
                    color: colors.textPrimary,
                    letterSpacing: -0.3,
                  }}
                >
                  {item.title}
                </Text>
                <Text
                  style={{
                    fontSize: 12.5,
                    fontFamily: 'Satoshi-Medium',
                    color: colors.textSecondary,
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  {item.subtitle}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textMuted}
                style={{ marginLeft: 8 }}
              />
            </ThemedTouchable>
          ))}
        </ScrollView>
      )}

      {/* STATE 3.5: PROYECTOS Y OFERTAS DE SELLERS (PRECIO CERRADO) */}
      {!isSearching && activeTab === 'projects' && (
        <View className="flex-1">
          {/* Header & Filter Chips */}
          <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <Text
                style={{
                  fontSize: 19,
                  fontFamily: 'Satoshi-Black',
                  color: colors.textPrimary,
                  letterSpacing: -0.4,
                }}
              >
                Proyectos y Trabajos
              </Text>
              {isProfessional && (
                <ThemedTouchable
                  onPress={() => setShowPublishModal(true)}
                  haptic="medium"
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 999,
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontFamily: 'Satoshi-Bold' }}>
                    Publicar
                  </Text>
                </ThemedTouchable>
              )}
            </View>

            <Text
              style={{
                fontSize: 12.5,
                fontFamily: 'Satoshi-Medium',
                color: colors.textSecondary,
                marginBottom: 12,
              }}
            >
              Servicios a precio y plazo cerrado ofrecidos por profesionales
            </Text>

            {/* Interest Filter Horizontal Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 6 }}
            >
              {INTEREST_CHIPS.map((chip) => {
                const isSelected = selectedProjectCategoryFilter === chip;
                return (
                  <TouchableOpacity
                    key={chip}
                    onPress={() => setSelectedProjectCategoryFilter(chip)}
                    style={{
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Satoshi-Bold',
                        fontSize: 12.5,
                        color: isSelected ? '#FFFFFF' : colors.textPrimary,
                      }}
                    >
                      {chip}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* List of Real Projects */}
          {loadingProjects ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator color={colors.primary} size="large" />
              <Text
                style={{
                  fontSize: 13.5,
                  fontFamily: 'Satoshi-Medium',
                  color: colors.textSecondary,
                  marginTop: 12,
                }}
              >
                Cargando proyectos de {selectedProjectCategoryFilter}...
              </Text>
            </View>
          ) : projects.length > 0 ? (
            <FlatList
              data={projects}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{
                paddingHorizontal: 18,
                paddingTop: 6,
                paddingBottom: 140,
              }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.primary}
                />
              }
              renderItem={({ item }) => (
                <ProjectCard
                  project={item}
                  onPress={() =>
                    router.push({
                      pathname: '/detail',
                      params: { id: item.id, entityType: 'gig' },
                    })
                  }
                  onDelete={handleProjectDelete}
                />
              )}
            />
          ) : (
            /* Clean Empty State when no real projects exist */
            <View className="flex-1 items-center justify-center px-8 pb-20">
              <View
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 34,
                  backgroundColor: colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="construct-outline" size={32} color={colors.textMuted} />
              </View>
              <Text
                style={{
                  fontSize: 17,
                  fontFamily: 'Satoshi-Bold',
                  color: colors.textPrimary,
                  marginBottom: 6,
                  textAlign: 'center',
                }}
              >
                {selectedProjectCategoryFilter === 'Todos'
                  ? 'No hay proyectos publicados aún'
                  : `No hay proyectos en ${selectedProjectCategoryFilter} aún`}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Satoshi-Regular',
                  color: colors.textMuted,
                  textAlign: 'center',
                  marginBottom: 20,
                  lineHeight: 20,
                  maxWidth: 290,
                }}
              >
                {isProfessional
                  ? 'Publica tu primer trabajo (ej: cambio de baldosas 200€ en 5 días) para que los clientes te contacten.'
                  : 'Publica una solicitud para recibir presupuestos o explora las demás categorías.'}
              </Text>

              <View style={{ gap: 10, width: '100%', maxWidth: 280 }}>
                {isProfessional ? (
                  <ThemedPressed
                    onPress={() => setShowPublishModal(true)}
                    haptic="medium"
                    scaleOnPress
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: 999,
                      paddingVertical: 13,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontFamily: 'Satoshi-Bold', fontSize: 14 }}>
                      + Publicar Proyecto
                    </Text>
                  </ThemedPressed>
                ) : (
                  <ThemedPressed
                    onPress={() => router.push('/(tabs)/requests')}
                    haptic="medium"
                    scaleOnPress
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: 999,
                      paddingVertical: 13,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontFamily: 'Satoshi-Bold', fontSize: 14 }}>
                      + Publicar Solicitud de Presupuesto
                    </Text>
                  </ThemedPressed>
                )}
              </View>
            </View>
          )}
        </View>
      )}

      {/* STATE 4: REAL SELLERS BY INTERESTS TAB (ZERO MOCK DATA) */}
      {!isSearching && activeTab === 'interests' && (
        <View className="flex-1">
          {/* Header & Filter Chips */}
          <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <Text
                style={{
                  fontSize: 19,
                  fontFamily: 'Satoshi-Black',
                  color: colors.textPrimary,
                  letterSpacing: -0.4,
                }}
              >
                Sellers según tus Intereses
              </Text>
              <ThemedTouchable
                onPress={() => router.push('/(tabs)/profile/interests')}
                haptic="selection"
                style={{
                  backgroundColor: colors.surfaceAlt,
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="options-outline" size={14} color={colors.primary} />
                <Text style={{ color: colors.textPrimary, fontSize: 12, fontFamily: 'Satoshi-Bold' }}>
                  {userInterests.length > 0 ? `Mis Intereses (${userInterests.length})` : 'Elegir Intereses'}
                </Text>
              </ThemedTouchable>
            </View>

            <Text
              style={{
                fontSize: 12.5,
                fontFamily: 'Satoshi-Medium',
                color: colors.textSecondary,
                marginTop: 2,
                marginBottom: 12,
              }}
            >
              Profesionales y autónomos verificados listos para realizar tu trabajo
            </Text>

            {/* Interest Filter Horizontal Chips (Dynamic based on user interests) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 6 }}
            >
              {/* Dynamic Chips List */}
              {(() => {
                const chips: string[] = [];
                if (userInterests.length > 0) {
                  chips.push(`⭐️ Mis Intereses (${userInterests.length})`);
                }
                chips.push('Todos');
                userInterests.forEach((interest) => {
                  if (!chips.includes(interest)) chips.push(interest);
                });
                INTEREST_CHIPS.forEach((chip) => {
                  if (chip !== 'Todos' && !chips.includes(chip)) chips.push(chip);
                });

                return chips.map((chip) => {
                  const isSelected = selectedInterestFilter === chip;
                  return (
                    <TouchableOpacity
                      key={chip}
                      onPress={() => setSelectedInterestFilter(chip)}
                      style={{
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        paddingHorizontal: 14,
                        paddingVertical: 7,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: isSelected ? colors.primary : colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'Satoshi-Bold',
                          fontSize: 12.5,
                          color: isSelected ? '#FFFFFF' : colors.textPrimary,
                        }}
                      >
                        {chip}
                      </Text>
                    </TouchableOpacity>
                  );
                });
              })()}
            </ScrollView>
          </View>

          {/* List of Real Sellers */}
          {loadingInterests ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator color={colors.primary} size="large" />
              <Text
                style={{
                  fontSize: 13.5,
                  fontFamily: 'Satoshi-Medium',
                  color: colors.textSecondary,
                  marginTop: 12,
                }}
              >
                Cargando profesionales de {selectedInterestFilter}...
              </Text>
            </View>
          ) : interestSellers.length > 0 ? (
            <FlatList
              data={interestSellers}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{
                paddingHorizontal: 18,
                paddingTop: 6,
                paddingBottom: 140,
              }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.primary}
                />
              }
              renderItem={({ item }) => (
                <ProfessionalCard
                  professional={item}
                  onPress={() => handleProfessionalPress(item.id)}
                />
              )}
            />
          ) : (
            /* Clean Empty State when no real sellers exist */
            <View className="flex-1 items-center justify-center px-8 pb-20">
              <View
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 34,
                  backgroundColor: colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="people-outline" size={32} color={colors.textMuted} />
              </View>
              <Text
                style={{
                  fontSize: 17,
                  fontFamily: 'Satoshi-Bold',
                  color: colors.textPrimary,
                  marginBottom: 6,
                  textAlign: 'center',
                }}
              >
                {selectedInterestFilter === 'Todos'
                  ? 'No hay sellers disponibles aún'
                  : `No hay sellers en ${selectedInterestFilter} aún`}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Satoshi-Regular',
                  color: colors.textMuted,
                  textAlign: 'center',
                  marginBottom: 20,
                  lineHeight: 20,
                  maxWidth: 290,
                }}
              >
                Publica tu solicitud para que autónomos y empresas de tu zona se postulen con presupuestos personalizados.
              </Text>

              <View style={{ gap: 10, width: '100%', maxWidth: 280 }}>
                <ThemedPressed
                  onPress={() => router.push('/(tabs)/requests')}
                  haptic="medium"
                  scaleOnPress
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 999,
                    paddingVertical: 13,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontFamily: 'Satoshi-Bold', fontSize: 14 }}>
                    + Publicar Solicitud de Presupuesto
                  </Text>
                </ThemedPressed>

                <ThemedPressed
                  onPress={() => router.push('/professional-profile')}
                  haptic="light"
                  scaleOnPress
                  style={{
                    backgroundColor: isDark ? colors.surface : '#F4F4F6',
                    borderRadius: 999,
                    paddingVertical: 12,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: isDark ? colors.border : '#E4E4E7',
                  }}
                >
                  <Text
                    style={{
                      color: isDark ? '#FFFFFF' : '#18181B',
                      fontFamily: 'Satoshi-Bold',
                      fontSize: 13.5,
                    }}
                  >
                    ¿Eres profesional? Ofrece tus servicios
                  </Text>
                </ThemedPressed>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Publish Project Modal */}
      <PublishProjectModal
        visible={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onSuccess={(newP) => setProjects((prev) => [newP, ...prev])}
      />
    </View>
  );
}

export default SearchTemplate;
