import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
  StyleSheet,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { CARD_CUTOUT_PATH } from '@/components/ui/CategoryLookbookCarousel';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchFilterHeader } from '@/components/search/SearchFilterHeader';
import { ProfessionalCard } from '@/components/ui/ProfessionalCard';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import {
  professionalsApi,
  ProfessionalDetail,
} from '@/services/professionalsApi';
import { gigsApi, GigDetail } from '@/services/gigsApi';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { CategoryTabs } from '@/components/ui/CategoryTabs';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuthStore } from '@/store/useAuthStore';
import { isUserProfessional } from '@/hooks/useUserRole';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import {
  CATEGORY_THEME_TOKENS,
  CategoryThemeToken,
  getCategoryTheme,
} from '@/constants/categoryTheme';
import { toast } from '@/store/useToastStore';
import {
  SAMPLE_PROJECTS,
  SAMPLE_PROFESSIONALS,
  filterSampleProjects,
  filterSampleProfessionals,
} from '@/constants/sampleData';

type CategoryItem = CategoryThemeToken;

const CATEGORY_LIST: CategoryItem[] = CATEGORY_THEME_TOKENS;

const INTEREST_CHIPS = [
  'Todos',
  'Reformas',
  'Electricidad',
  'Fontanería',
  'Climatización',
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GRID_WIDTH = Math.floor((SCREEN_WIDTH - 40 - 12) / 2);
const CARD_GRID_HEIGHT = Math.round(CARD_GRID_WIDTH * 1.2);
const s = CARD_GRID_WIDTH / 200;
const btnSize = Math.round(44 * s);
const btnLeft = Math.round(8 * s);
const btnBottom = Math.round(8 * s);
const pillLeft = Math.round(58 * s);
const pillRight = Math.round(8 * s);
const pillBottom = Math.round(8 * s);
const pillHeight = btnSize;
const iconAreaHeight = Math.round(160 * s);
const haloSize = Math.round(76 * s);
const iconSize = Math.round(40 * s);
const fontSize = Math.max(12, Math.round(14 * s));

function EmptyStateIllustration({ isDark }: { isDark: boolean }) {
  const strokeColor = isDark ? '#64748B' : '#94A3B8';
  const fillColor = isDark ? '#1E293B' : '#F1F5F9';
  const accentColor = '#0284C7';

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
      <Svg width={140} height={110} viewBox="0 0 140 110" fill="none">
        <Defs>
          <LinearGradient id="emptyGlow" x1="0" y1="0" x2="140" y2="110" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={isDark ? '#38BDF8' : '#0284C7'} stopOpacity={isDark ? 0.14 : 0.09} />
            <Stop offset="100%" stopColor={isDark ? '#818CF8' : '#6366F1'} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* Ambient subtle glow background */}
        <Rect x="20" y="10" width="100" height="85" rx="24" fill="url(#emptyGlow)" />

        {/* Orbit dotted circle */}
        <Circle cx="70" cy="50" r="38" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'} strokeWidth="1.5" strokeDasharray="4 4" />

        {/* Main Magnifying Lens */}
        <Circle cx="64" cy="46" r="24" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
        <Circle cx="64" cy="46" r="12" stroke={accentColor} strokeWidth="1.8" strokeDasharray="2 3" opacity={0.7} />

        {/* Lens Handle */}
        <Path d="M81 63 L97 79" stroke={strokeColor} strokeWidth="3.5" strokeLinecap="round" />

        {/* Sparkle & Accent dots */}
        <Path d="M102 28 V36 M98 32 H106" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
        <Circle cx="36" cy="62" r="2.5" fill={isDark ? '#94A3B8' : '#CBD5E1'} />
        <Circle cx="106" cy="58" r="2" fill={accentColor} opacity={0.6} />
      </Svg>
    </View>
  );
}

export type SearchTab = 'categories' | 'projects' | 'professionals';

export function SearchTemplate() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const HEADER_PADDING = insets.top + 104;

  const params = useLocalSearchParams<{ q?: string; category?: string; tab?: SearchTab }>();
  const [query, setQuery] = useState(params.q || '');
  const [activeTab, setActiveTab] = useState<SearchTab>(params.tab || 'categories');
  const [isSearching, setIsSearching] = useState(Boolean(params.q || params.category));
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(
    params.category || null
  );

  // Zalando-style Quick-Return Dynamic Header (Translate on GPU without layout shift)
  const COLLAPSIBLE_DISTANCE = 50;
  const scrollY = useSharedValue(0);
  const prevScrollY = useSharedValue(0);
  const headerTranslateY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const currentY = event.contentOffset.y;
      const diff = currentY - prevScrollY.value;
      prevScrollY.value = currentY;

      if (currentY <= 0) {
        headerTranslateY.value = 0;
        scrollY.value = 0;
        return;
      }

      // Scrolling down translates header up towards -COLLAPSIBLE_DISTANCE
      // Scrolling up translates header down towards 0
      const nextVal = headerTranslateY.value - diff;
      headerTranslateY.value = Math.min(0, Math.max(-COLLAPSIBLE_DISTANCE, nextVal));
      scrollY.value = currentY;
    },
    onBeginDrag: (event) => {
      prevScrollY.value = event.contentOffset.y;
    },
  });

  const [professionals, setProfessionals] = useState<ProfessionalDetail[]>(SAMPLE_PROFESSIONALS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Projects Tab State
  const [projects, setProjects] = useState<GigDetail[]>(SAMPLE_PROJECTS);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProjectCategoryFilter, setSelectedProjectCategoryFilter] = useState<string>('Todos');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [searchProjects, setSearchProjects] = useState<GigDetail[]>(SAMPLE_PROJECTS);
  const [searchTabFilter, setSearchTabFilter] = useState<'all' | 'projects' | 'professionals'>('all');

  // Professionals Tab State: Multi-selection Category PillTabs (Defaults to 'Todos')
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Todos']);
  const [interestProfessionals, setInterestProfessionals] = useState<ProfessionalDetail[]>(SAMPLE_PROFESSIONALS);
  const [loadingInterests, setLoadingInterests] = useState(false);
  const [deletedProjectIds, setDeletedProjectIds] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([gigsApi.getCachedGigs(), professionalsApi.getCachedProfessionals()])
      .then(([cachedGigs, cachedPros]) => {
        if (cachedGigs && cachedGigs.length > 0) {
          setProjects(cachedGigs);
        }
        if (cachedPros && cachedPros.length > 0) {
          setInterestProfessionals(cachedPros);
          setProfessionals(cachedPros);
        }
      })
      .catch(() => {});
  }, []);

  const { user } = useAuthStore();
  const isProfessional = isUserProfessional(user);

  const toggleCategory = (cat: string) => {
    Haptics.selectionAsync().catch(() => {});
    if (cat === 'Todos') {
      setSelectedCategories(['Todos']);
      return;
    }

    let updated: string[];
    if (selectedCategories.includes('Todos')) {
      updated = [cat];
    } else if (selectedCategories.includes(cat)) {
      updated = selectedCategories.filter((c) => c !== cat);
      if (updated.length === 0) updated = ['Todos'];
    } else {
      if (selectedCategories.length >= 3) {
        updated = [...selectedCategories.slice(1), cat];
      } else {
        updated = [...selectedCategories, cat];
      }
    }
    setSelectedCategories(updated);
  };

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

  const projectsLoadedRef = React.useRef(false);
  const professionalsLoadedRef = React.useRef(false);

  const fetchProjects = useCallback(
    async (showLoader = false) => {
      if (showLoader && !projectsLoadedRef.current) setLoadingProjects(true);
      try {
        const catFilter =
          selectedProjectCategoryFilter !== 'Todos' ? selectedProjectCategoryFilter : undefined;
        const data = await gigsApi.getAll({
          category: catFilter,
          limit: 50,
        });
        if (Array.isArray(data) && data.length > 0) {
          setProjects(data);
        }
        projectsLoadedRef.current = true;
      } catch {
        // Keep previous projects
      } finally {
        setLoadingProjects(false);
        setRefreshing(false);
      }
    },
    [selectedProjectCategoryFilter]
  );

  const fetchInterestProfessionals = useCallback(
    async (showLoader = false) => {
      if (showLoader && !professionalsLoadedRef.current) setLoadingInterests(true);
      try {
        const isAll = selectedCategories.includes('Todos') || selectedCategories.length === 0;
        const catFilter = isAll ? undefined : selectedCategories.join(',');

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
        if (validItems.length > 0) {
          setInterestProfessionals(validItems);
        }
        professionalsLoadedRef.current = true;
      } catch {
        // Keep previous
      } finally {
        setLoadingInterests(false);
        setRefreshing(false);
      }
    },
    [selectedCategories]
  );

  useEffect(() => {
    fetchInterestProfessionals(false);
  }, [selectedCategories, fetchInterestProfessionals]);

  // Pre-load projects and professionals on mount in background
  useEffect(() => {
    fetchProjects(false);
    fetchInterestProfessionals(false);
  }, []);

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
      fetchProjects(!projectsLoadedRef.current);
    }
  }, [isSearching, activeTab, selectedProjectCategoryFilter, fetchProjects]);

  useEffect(() => {
    if (!isSearching && activeTab === 'professionals') {
      fetchInterestProfessionals(!professionalsLoadedRef.current);
    }
  }, [isSearching, activeTab, selectedCategories, fetchInterestProfessionals]);

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'projects' && projects.length === 0) {
        fetchProjects(false);
      } else if (activeTab === 'professionals' && interestProfessionals.length === 0) {
        fetchInterestProfessionals(false);
      } else if (isSearching || selectedCategoryFilter || query.trim()) {
        fetchProfessionals(false);
      }
    }, [activeTab, isSearching, selectedCategoryFilter, query, fetchProjects, fetchInterestProfessionals, fetchProfessionals, projects.length, interestProfessionals.length])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    if (isSearching) {
      fetchProfessionals(false);
    } else if (activeTab === 'projects') {
      fetchProjects(false);
    } else if (activeTab === 'professionals') {
      fetchInterestProfessionals(false);
    } else {
      setRefreshing(false);
    }
  };

  const handleProjectDelete = async (projectId: string) => {
    setDeletedProjectIds((prev) => [...prev, projectId]);
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

  // Active Tab: Projects (Servicios)
  const displayProjects = useMemo((): GigDetail[] => {
    const sampleList = filterSampleProjects(selectedProjectCategoryFilter);
    const realIds = new Set(projects.map((p) => p.id));
    const combined = [...projects, ...sampleList.filter((sp) => !realIds.has(sp.id))];
    return combined.filter((p) => !deletedProjectIds.includes(p.id));
  }, [projects, selectedProjectCategoryFilter, deletedProjectIds]);

  // Active Tab: Professionals (Profesionales y Autónomos)
  const displayProfessionals = useMemo((): ProfessionalDetail[] => {
    const sampleList = filterSampleProfessionals(selectedCategories);
    const realIds = new Set(interestProfessionals.map((p) => p.id));
    return [...interestProfessionals, ...sampleList.filter((sp) => !realIds.has(sp.id))];
  }, [interestProfessionals, selectedCategories]);

  // Live Search Results
  const displaySearchProjects = useMemo((): GigDetail[] => {
    const sampleList = filterSampleProjects(selectedCategoryFilter, query);
    const realIds = new Set(searchProjects.map((p) => p.id));
    const combined = [...searchProjects, ...sampleList.filter((sp) => !realIds.has(sp.id))];
    return combined.filter((p) => !deletedProjectIds.includes(p.id));
  }, [searchProjects, selectedCategoryFilter, query, deletedProjectIds]);

  const displaySearchProfessionals = useMemo((): ProfessionalDetail[] => {
    const sampleList = filterSampleProfessionals(
      selectedCategoryFilter ? [selectedCategoryFilter] : undefined,
      query
    );
    const realIds = new Set(professionals.map((p) => p.id));
    return [...professionals, ...sampleList.filter((sp) => !realIds.has(sp.id))];
  }, [professionals, selectedCategoryFilter, query]);

  const projectsByCategory = useMemo(() => {
    const map = new Map<string, GigDetail[]>();
    for (const cat of INTEREST_CHIPS) {
      if (cat === 'Todos') continue;
      const items = displayProjects.filter(
        (p) => (p.category?.name || '').toLowerCase() === cat.toLowerCase()
      );
      if (items.length > 0) {
        map.set(cat, items);
      }
    }
    const uncategorized = displayProjects.filter(
      (p) =>
        !INTEREST_CHIPS.some(
          (cat) => cat !== 'Todos' && (p.category?.name || '').toLowerCase() === cat.toLowerCase()
        )
    );
    if (uncategorized.length > 0) {
      map.set('Otros Servicios', uncategorized);
    }
    return map;
  }, [displayProjects]);

  const professionalsByCategory = useMemo(() => {
    const map = new Map<string, ProfessionalDetail[]>();
    for (const cat of INTEREST_CHIPS) {
      if (cat === 'Todos') continue;
      const items = displayProfessionals.filter((pro) => {
        const catNorm = cat.toLowerCase();
        const primaryCat = (pro.categories?.[0]?.name || (pro as any).category?.name || '').toLowerCase();
        const skills = (pro.skills || []).map((s) => s.toLowerCase());
        return primaryCat === catNorm || skills.includes(catNorm);
      });
      if (items.length > 0) {
        map.set(cat, items);
      }
    }
    return map;
  }, [displayProfessionals]);

  const renderProjectsChips = () => (
    <View style={{ paddingTop: 6, paddingBottom: 14, marginHorizontal: -20 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
      >
        {isProfessional && (
          <ThemedTouchable
            onPress={() => setShowPublishModal(true)}
            haptic="medium"
            activeOpacity={0.88}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 999,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text
              numberOfLines={1}
              style={{
                color: '#FFFFFF',
                fontFamily: 'PlusJakartaSans-Bold',
                fontSize: 12.5,
                letterSpacing: -0.2,
              }}
            >
              Publicar
            </Text>
          </ThemedTouchable>
        )}

        {INTEREST_CHIPS.map((cat) => {
          const isSelected = selectedProjectCategoryFilter === cat;
          const theme = cat !== 'Todos' ? getCategoryTheme(cat) : null;
          const bg = isSelected ? (isDark ? '#FFFFFF' : '#09090B') : (isDark ? '#1E293B' : '#F4F4F5');
          const border = isSelected ? (isDark ? '#FFFFFF' : '#09090B') : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#E4E4E7');
          const textColor = isSelected ? (isDark ? '#09090B' : '#FFFFFF') : (isDark ? '#94A3B8' : '#52525B');

          return (
            <ThemedTouchable
              key={cat}
              haptic="selection"
              activeOpacity={0.85}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setSelectedProjectCategoryFilter(cat);
              }}
              style={{
                backgroundColor: bg,
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {theme && (
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: isSelected ? (isDark ? '#09090B' : '#FFFFFF') : theme.dotColor,
                  }}
                />
              )}
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: 'PlusJakartaSans-Bold',
                  fontSize: 12.5,
                  color: textColor,
                  letterSpacing: -0.2,
                }}
              >
                {cat}
              </Text>
            </ThemedTouchable>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderProfessionalsChips = () => {
    return (
      <View style={{ paddingTop: 6, paddingBottom: 14, marginHorizontal: -20 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
        >
          {INTEREST_CHIPS.map((chip) => {
            const isSelected = selectedCategories.includes(chip);
            const theme = chip !== 'Todos' ? getCategoryTheme(chip) : null;
            const bg = isSelected ? (isDark ? '#FFFFFF' : '#09090B') : (isDark ? '#1E293B' : '#F4F4F5');
            const border = isSelected ? (isDark ? '#FFFFFF' : '#09090B') : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#E4E4E7');
            const textColor = isSelected ? (isDark ? '#09090B' : '#FFFFFF') : (isDark ? '#94A3B8' : '#52525B');

            return (
              <ThemedTouchable
                key={chip}
                haptic="selection"
                activeOpacity={0.85}
                onPress={() => toggleCategory(chip)}
                style={{
                  backgroundColor: bg,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {theme && (
                  <View
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 3.5,
                      backgroundColor: isSelected ? (isDark ? '#09090B' : '#FFFFFF') : theme.dotColor,
                    }}
                  />
                )}
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: 'PlusJakartaSans-Bold',
                    fontSize: 12.5,
                    color: textColor,
                    letterSpacing: -0.2,
                  }}
                >
                  {chip}
                </Text>
              </ThemedTouchable>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Unified Compact Search Header with Zalando Dynamic Quick-Return */}
      <SearchFilterHeader
        query={query}
        onChangeQuery={setQuery}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSelectedCategoryFilter(null);
          headerTranslateY.value = 0;
          prevScrollY.value = 0;
          scrollY.value = 0;
        }}
        isSearching={isSearching}
        setIsSearching={(searching) => {
          setIsSearching(searching);
          headerTranslateY.value = 0;
          prevScrollY.value = 0;
          scrollY.value = 0;
        }}
        scrollY={scrollY}
        headerTranslateY={headerTranslateY}
      />

      {/* STATE 1: ACTIVE SEARCH OVERLAY WITH EMPTY QUERY */}
      {showEmptySearchOverlay && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 22, paddingTop: insets.top + 64, paddingBottom: 140 }}
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
                fontFamily: 'PlusJakartaSans-Bold',
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
                fontFamily: 'PlusJakartaSans-Regular',
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
                fontFamily: 'PlusJakartaSans-Bold',
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
                      fontFamily: 'PlusJakartaSans-Bold',
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
          {loading ? (
            <View style={{ paddingHorizontal: 18, paddingTop: insets.top + 64, gap: 12 }}>
              <SkeletonCard height={110} />
              <SkeletonCard height={110} />
              <SkeletonCard height={110} />
            </View>
          ) : displaySearchProfessionals.length > 0 || displaySearchProjects.length > 0 ? (
            <Animated.ScrollView
              onScroll={scrollHandler}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 18,
                paddingTop: insets.top + 64,
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
              {/* Segmented Filter Pills (Positioned cleanly right below search header) */}
              <View style={{ marginBottom: 12, marginTop: 4 }}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  <TouchableOpacity
                    onPress={() => setSearchTabFilter('all')}
                    style={{
                      backgroundColor: searchTabFilter === 'all' ? (isDark ? '#FFFFFF' : '#09090B') : (isDark ? '#1E293B' : '#F4F4F5'),
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: searchTabFilter === 'all' ? (isDark ? '#FFFFFF' : '#09090B') : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#E4E4E7'),
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 12,
                        fontFamily: 'PlusJakartaSans-Bold',
                        color: searchTabFilter === 'all' ? (isDark ? '#09090B' : '#FFFFFF') : (isDark ? '#94A3B8' : '#52525B'),
                      }}
                    >
                      Todos ({displaySearchProfessionals.length + displaySearchProjects.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSearchTabFilter('projects')}
                    style={{
                      backgroundColor: searchTabFilter === 'projects' ? (isDark ? '#FFFFFF' : '#09090B') : (isDark ? '#1E293B' : '#F4F4F5'),
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: searchTabFilter === 'projects' ? (isDark ? '#FFFFFF' : '#09090B') : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#E4E4E7'),
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 12,
                        fontFamily: 'PlusJakartaSans-Bold',
                        color: searchTabFilter === 'projects' ? (isDark ? '#09090B' : '#FFFFFF') : (isDark ? '#94A3B8' : '#52525B'),
                      }}
                    >
                      Servicios ({displaySearchProjects.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSearchTabFilter('professionals')}
                    style={{
                      backgroundColor: searchTabFilter === 'professionals' ? (isDark ? '#FFFFFF' : '#09090B') : (isDark ? '#1E293B' : '#F4F4F5'),
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: searchTabFilter === 'professionals' ? (isDark ? '#FFFFFF' : '#09090B') : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#E4E4E7'),
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 12,
                        fontFamily: 'PlusJakartaSans-Bold',
                        color: searchTabFilter === 'professionals' ? (isDark ? '#09090B' : '#FFFFFF') : (isDark ? '#94A3B8' : '#52525B'),
                      }}
                    >
                      Profesionales ({displaySearchProfessionals.length})
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
              {/* Projects Section */}
              {(searchTabFilter === 'all' || searchTabFilter === 'projects') && displaySearchProjects.length > 0 && (
                <View className="mb-4">
                  <View className="flex-row justify-between items-center mb-2.5 px-1">
                    <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.textPrimary }}>
                      Servicios a Precio Cerrado ({displaySearchProjects.length})
                    </Text>
                  </View>
                  {displaySearchProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      layout="full"
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
              {(searchTabFilter === 'all' || searchTabFilter === 'professionals') && displaySearchProfessionals.length > 0 && (
                <View className="mb-4">
                  <View className="flex-row justify-between items-center mb-2.5 px-1">
                    <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.textPrimary }}>
                      Profesionales y Autónomos ({displaySearchProfessionals.length})
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    {displaySearchProfessionals.map((item) => (
                      <ProfessionalCard
                        key={item.id}
                        professional={item}
                        layout="grid"
                        onPress={() => handleProfessionalPress(item.id)}
                      />
                    ))}
                  </View>
                </View>
              )}
            </Animated.ScrollView>
          ) : (
            <View className="flex-1 items-center justify-center px-8 pb-20">
              <EmptyStateIllustration isDark={isDark} />
              <Text
                style={{
                  fontSize: 17,
                  fontFamily: 'PlusJakartaSans-Bold',
                  color: colors.textPrimary,
                  marginBottom: 6,
                  textAlign: 'center',
                }}
              >
                Sin resultados
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'PlusJakartaSans-Regular',
                  color: colors.textMuted,
                  textAlign: 'center',
                  marginBottom: 20,
                  lineHeight: 18,
                  maxWidth: 270,
                }}
              >
                Prueba con otros términos de búsqueda o publica tu solicitud.
              </Text>

              <View style={{ gap: 10, width: '100%', maxWidth: 280 }}>
                {isProfessional ? (
                  <ThemedTouchable
                    onPress={() => setShowPublishModal(true)}
                    haptic="medium"
                    activeOpacity={0.88}
                    style={{
                      backgroundColor: isDark ? '#FFFFFF' : '#09090B',
                      borderRadius: 999,
                      paddingVertical: 13,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Publicar"
                  >
                    <Text numberOfLines={1} style={{ color: isDark ? '#09090B' : '#FFFFFF', fontFamily: 'PlusJakartaSans-Bold', fontSize: 14 }}>
                      Publicar
                    </Text>
                  </ThemedTouchable>
                ) : (
                  <>
                    <ThemedTouchable
                      onPress={() => router.push('/(tabs)/requests')}
                      haptic="medium"
                      activeOpacity={0.88}
                      style={{
                        backgroundColor: isDark ? '#FFFFFF' : '#09090B',
                        borderRadius: 999,
                        paddingVertical: 13,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Publicar Solicitud"
                    >
                      <Text numberOfLines={1} style={{ color: isDark ? '#09090B' : '#FFFFFF', fontFamily: 'PlusJakartaSans-Bold', fontSize: 14 }}>
                        Solicitud
                      </Text>
                    </ThemedTouchable>

                    <ThemedTouchable
                      onPress={() => router.push('/professional-profile')}
                      haptic="light"
                      activeOpacity={0.88}
                      style={{
                        backgroundColor: isDark ? '#1C1E26' : '#F1F5F9',
                        borderRadius: 999,
                        paddingVertical: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Soy Profesional"
                    >
                      <Text
                        numberOfLines={1}
                        style={{
                          color: isDark ? '#F4F4F5' : '#0F172A',
                          fontFamily: 'PlusJakartaSans-Bold',
                          fontSize: 13.5,
                        }}
                      >
                        Soy Profesional
                      </Text>
                    </ThemedTouchable>
                  </>
                )}
              </View>
            </View>
          )}
        </View>
      )}

      {/* STATE 3: LOOKBOOK CATEGORIES 2-COLUMN GRID (Matching Home CategoryLookbook Style) */}
      {!isSearching && activeTab === 'categories' && (
        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: HEADER_PADDING,
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
          {/* Section Editorial Header */}
          <View style={{ marginBottom: 14, marginTop: 4 }}>
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'PlusJakartaSans-ExtraBold',
                color: colors.primary,
                letterSpacing: 1.2,
                marginBottom: 2,
              }}
            >
              EXPLORAR
            </Text>
            <Text
              style={{
                fontSize: 24,
                fontFamily: 'PlusJakartaSans-ExtraBold',
                color: colors.textPrimary,
                letterSpacing: -0.5,
              }}
            >
              Especialidades
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              rowGap: 14,
            }}
          >
            {CATEGORY_LIST.map((item) => {
              const cardBg = isDark ? item.bgColorDark : item.bgColorLight;
              const pillBg = isDark ? '#1E293B' : '#FFFFFF';
              const textColor = isDark ? '#FFFFFF' : '#0F172A';

              return (
                <ThemedTouchable
                  key={item.id}
                  onPress={() => handleCategoryPress(item)}
                  haptic="selection"
                  activeOpacity={0.92}
                  style={{
                    width: CARD_GRID_WIDTH,
                    height: CARD_GRID_HEIGHT,
                    position: 'relative',
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={item.title}
                >
                  {/* Scooped Cutout Background Card Shape - Leaves open hole at bottom-left */}
                  <Svg
                    width={CARD_GRID_WIDTH}
                    height={CARD_GRID_HEIGHT}
                    viewBox="0 0 200 240"
                    style={StyleSheet.absoluteFill}
                  >
                    <Path d={CARD_CUTOUT_PATH} fill={cardBg} />
                  </Svg>

                  {/* Upper Area: Static Vector Icon with Ambient Halo */}
                  <View
                    style={{
                      width: CARD_GRID_WIDTH,
                      height: iconAreaHeight,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingTop: 10,
                    }}
                  >
                    <View
                      style={{
                        width: haloSize,
                        height: haloSize,
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}
                    >
                      <View
                        style={{
                          position: 'absolute',
                          width: haloSize,
                          height: haloSize,
                          borderRadius: haloSize / 2,
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.10)'
                            : 'rgba(255, 255, 255, 0.65)',
                        }}
                      />
                      <Ionicons
                        name={item.iconName}
                        size={iconSize}
                        color={item.accentColor}
                      />
                    </View>
                  </View>

                  {/* Circular Black Button nestled in the cutout hole */}
                  <View
                    style={{
                      position: 'absolute',
                      left: btnLeft,
                      bottom: btnBottom,
                      width: btnSize,
                      height: btnSize,
                      borderRadius: btnSize / 2,
                      backgroundColor: '#111113',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                      shadowColor: '#000000',
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.16,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <Ionicons
                      name="arrow-up"
                      size={Math.round(18 * s)}
                      color="#FFFFFF"
                      style={{ transform: [{ rotate: '45deg' }] }}
                    />
                  </View>

                  {/* Category Pill nestled beside the button */}
                  <View
                    style={{
                      position: 'absolute',
                      left: pillLeft,
                      right: pillRight,
                      bottom: pillBottom,
                      height: pillHeight,
                      borderRadius: pillHeight / 2,
                      backgroundColor: pillBg,
                      borderColor: isDark
                        ? 'rgba(255, 255, 255, 0.12)'
                        : 'rgba(0, 0, 0, 0.04)',
                      borderWidth: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingHorizontal: 6,
                      zIndex: 10,
                      shadowColor: '#000000',
                      shadowOpacity: 0.08,
                      shadowRadius: 5,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 3,
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                      style={{
                        fontSize,
                        fontFamily: 'PlusJakartaSans-Bold',
                        color: textColor,
                        letterSpacing: -0.3,
                        textAlign: 'center',
                      }}
                    >
                      {item.title}
                    </Text>
                  </View>
                </ThemedTouchable>
              );
            })}
          </View>
        </Animated.ScrollView>
      )}

      {/* STATE 3.5: PROYECTOS Y TRABAJOS DE PROFESIONALES (PRECIO CERRADO) */}
      {!isSearching && activeTab === 'projects' && (
        <View className="flex-1">
          {loadingProjects && displayProjects.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20" style={{ paddingTop: HEADER_PADDING }}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text
                style={{
                  fontSize: 13.5,
                  fontFamily: 'PlusJakartaSans-Medium',
                  color: colors.textSecondary,
                  marginTop: 12,
                }}
              >
                Cargando servicios de {selectedProjectCategoryFilter}...
              </Text>
            </View>
          ) : displayProjects.length > 0 ? (
            <Animated.ScrollView
              onScroll={scrollHandler}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: HEADER_PADDING,
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
              {renderProjectsChips()}

              {selectedProjectCategoryFilter === 'Todos' ? (
                Array.from(projectsByCategory.entries()).map(([catName, catItems]) => (
                  <View key={catName} style={{ marginBottom: 28 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Text style={{ fontSize: 18, fontFamily: 'PlusJakartaSans-Bold', color: colors.textPrimary, letterSpacing: -0.3 }}>
                        {catName}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setSelectedProjectCategoryFilter(catName)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-Bold', color: colors.primary }}>
                          Ver todos
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 14, paddingHorizontal: 20 }}
                      style={{ marginHorizontal: -20 }}
                    >
                      {catItems.map((item) => (
                        <ProjectCard
                          key={item.id}
                          project={item}
                          layout="grid"
                          style={{ flex: undefined, maxWidth: undefined, width: 165 }}
                          onPress={() =>
                            router.push({
                              pathname: '/detail',
                              params: { id: item.id, entityType: 'gig' },
                            })
                          }
                        />
                      ))}
                    </ScrollView>
                  </View>
                ))
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 }}>
                  {displayProjects.map((item) => (
                    <View key={item.id} style={{ width: CARD_GRID_WIDTH }}>
                      <ProjectCard
                        project={item}
                        layout="grid"
                        style={{ maxWidth: '100%' }}
                        onPress={() =>
                          router.push({
                            pathname: '/detail',
                            params: { id: item.id, entityType: 'gig' },
                          })
                        }
                      />
                    </View>
                  ))}
                </View>
              )}
            </Animated.ScrollView>
          ) : (
            /* Clean Empty State when no real projects exist */
            <View className="flex-1" style={{ paddingTop: HEADER_PADDING, paddingHorizontal: 20 }}>
              {renderProjectsChips()}
              <View className="flex-1 items-center justify-center px-8 pb-20">
                <EmptyStateIllustration isDark={isDark} />
                <Text
                  style={{
                    fontSize: 17,
                    fontFamily: 'PlusJakartaSans-Bold',
                    color: colors.textPrimary,
                    marginBottom: 6,
                    textAlign: 'center',
                  }}
                >
                  Sin servicios
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'PlusJakartaSans-Regular',
                    color: colors.textMuted,
                    textAlign: 'center',
                    marginBottom: 20,
                    lineHeight: 18,
                    maxWidth: 270,
                  }}
                >
                  {isProfessional
                    ? 'Publica tu primer trabajo para empezar a recibir presupuestos.'
                    : 'Publica una solicitud para recibir presupuestos o explora las demás categorías.'}
                </Text>

                <View style={{ gap: 10, width: '100%', maxWidth: 280 }}>
                  {isProfessional ? (
                    <ThemedTouchable
                      onPress={() => setShowPublishModal(true)}
                      haptic="medium"
                      activeOpacity={0.88}
                      style={{
                        backgroundColor: isDark ? '#FFFFFF' : '#09090B',
                        borderRadius: 999,
                        paddingVertical: 13,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Publicar Proyecto"
                    >
                      <Text numberOfLines={1} style={{ color: isDark ? '#09090B' : '#FFFFFF', fontFamily: 'PlusJakartaSans-Bold', fontSize: 14 }}>
                        Publicar
                      </Text>
                    </ThemedTouchable>
                  ) : (
                    <ThemedTouchable
                      onPress={() => router.push('/(tabs)/requests')}
                      haptic="medium"
                      activeOpacity={0.88}
                      style={{
                        backgroundColor: isDark ? '#FFFFFF' : '#09090B',
                        borderRadius: 999,
                        paddingVertical: 13,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Publicar Solicitud"
                    >
                      <Text numberOfLines={1} style={{ color: isDark ? '#09090B' : '#FFFFFF', fontFamily: 'PlusJakartaSans-Bold', fontSize: 14 }}>
                        Solicitud
                      </Text>
                    </ThemedTouchable>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      )}

      {/* STATE 3: REAL PROFESSIONALS TAB (ZERO MOCK DATA) */}
      {!isSearching && activeTab === 'professionals' && (
        <View className="flex-1">
          {/* List of Real Professionals (Zero Redundant Secondary Header) */}
          {loadingInterests && displayProfessionals.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20" style={{ paddingTop: HEADER_PADDING }}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text
                style={{
                  fontSize: 13.5,
                  fontFamily: 'PlusJakartaSans-Medium',
                  color: colors.textSecondary,
                  marginTop: 12,
                }}
              >
                Cargando profesionales de {selectedCategories.join(', ')}...
              </Text>
            </View>
          ) : displayProfessionals.length > 0 ? (
            <Animated.ScrollView
              onScroll={scrollHandler}
              scrollEventThrottle={16}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: HEADER_PADDING,
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
            >
              {renderProfessionalsChips()}

              {selectedCategories.includes('Todos') || selectedCategories.length === 0 ? (
                Array.from(professionalsByCategory.entries()).map(([catName, catPros]) => (
                  <View key={catName} style={{ marginBottom: 28 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Text style={{ fontSize: 18, fontFamily: 'PlusJakartaSans-Bold', color: colors.textPrimary, letterSpacing: -0.3 }}>
                        {catName}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setSelectedCategories([catName])}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-Bold', color: colors.primary }}>
                          Ver todos
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 14, paddingHorizontal: 20 }}
                      style={{ marginHorizontal: -20 }}
                    >
                      {catPros.map((item) => (
                        <ProfessionalCard
                          key={item.id}
                          professional={item}
                          layout="grid"
                          onPress={() => handleProfessionalPress(item.id)}
                        />
                      ))}
                    </ScrollView>
                  </View>
                ))
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 }}>
                  {displayProfessionals.map((item) => (
                    <ProfessionalCard
                      key={item.id}
                      professional={item}
                      layout="grid"
                      onPress={() => handleProfessionalPress(item.id)}
                    />
                  ))}
                </View>
              )}
            </Animated.ScrollView>
          ) : (
            /* Clean Empty State when no real professionals exist */
            <View className="flex-1" style={{ paddingTop: HEADER_PADDING, paddingHorizontal: 18 }}>
              {renderProfessionalsChips()}
              <View className="flex-1 items-center justify-center px-8 pb-20">
                <EmptyStateIllustration isDark={isDark} />
                <Text
                  style={{
                    fontSize: 17,
                    fontFamily: 'PlusJakartaSans-Bold',
                    color: colors.textPrimary,
                    marginBottom: 6,
                    textAlign: 'center',
                  }}
                >
                  Sin resultados
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'PlusJakartaSans-Regular',
                    color: colors.textMuted,
                    textAlign: 'center',
                    marginBottom: 20,
                    lineHeight: 18,
                    maxWidth: 270,
                  }}
                >
                  {isProfessional
                    ? 'Publica tus servicios para aparecer como autónomo destacado.'
                    : 'Publica tu solicitud para que autónomos de tu zona te envíen ofertas.'}
                </Text>

                <View style={{ gap: 10, width: '100%', maxWidth: 280 }}>
                  {isProfessional ? (
                    <ThemedTouchable
                      onPress={() => setShowPublishModal(true)}
                      haptic="medium"
                      activeOpacity={0.88}
                      style={{
                        backgroundColor: isDark ? '#FFFFFF' : '#09090B',
                        borderRadius: 999,
                        paddingVertical: 13,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Publicar"
                    >
                      <Text numberOfLines={1} style={{ color: isDark ? '#09090B' : '#FFFFFF', fontFamily: 'PlusJakartaSans-Bold', fontSize: 14 }}>
                        Publicar
                      </Text>
                    </ThemedTouchable>
                  ) : (
                    <>
                      <ThemedTouchable
                        onPress={() => router.push('/(tabs)/requests')}
                        haptic="medium"
                        activeOpacity={0.88}
                        style={{
                          backgroundColor: isDark ? '#FFFFFF' : '#09090B',
                          borderRadius: 999,
                          paddingVertical: 13,
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 2,
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Publicar Solicitud"
                      >
                        <Text numberOfLines={1} style={{ color: isDark ? '#09090B' : '#FFFFFF', fontFamily: 'PlusJakartaSans-Bold', fontSize: 14 }}>
                          Solicitud
                        </Text>
                      </ThemedTouchable>

                      <ThemedTouchable
                        onPress={() => router.push('/professional-profile')}
                        haptic="light"
                        activeOpacity={0.88}
                        style={{
                          backgroundColor: isDark ? '#1C1E26' : '#F1F5F9',
                          borderRadius: 999,
                          paddingVertical: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1,
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Soy Profesional"
                      >
                        <Text
                          numberOfLines={1}
                          style={{
                            color: isDark ? '#F4F4F5' : '#0F172A',
                            fontFamily: 'PlusJakartaSans-Bold',
                            fontSize: 13.5,
                          }}
                        >
                          Soy Profesional
                        </Text>
                      </ThemedTouchable>
                    </>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default SearchTemplate;
