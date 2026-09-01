import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { Input } from '@/components/ui/Input';
import { useAppTheme } from '@/hooks/useAppTheme';

interface SearchFilterHeaderProps {
  query: string;
  onChangeQuery: (query: string) => void;
  activeTab: 'categories' | 'projects' | 'interests';
  onSelectTab: (tab: 'categories' | 'projects' | 'interests') => void;
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;
}

export function SearchFilterHeader({
  query,
  onChangeQuery,
  activeTab,
  onSelectTab,
  isSearching,
  setIsSearching,
}: SearchFilterHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const paddingTop = Math.max(insets.top + 10, 24);

  return (
    <View style={{ backgroundColor: colors.background, paddingHorizontal: 20, paddingTop }}>
      {/* MODE 1: ACTIVE SEARCH HEADER (Back arrow + Input field) */}
      {isSearching ? (
        <View className="flex-row items-center mb-3">
          {/* Back Arrow */}
          <ThemedTouchable
            onPress={() => {
              setIsSearching(false);
              onChangeQuery('');
            }}
            haptic="light"
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </ThemedTouchable>

          {/* Global Pill Search Input */}
          <Input
            leftIcon="search-outline"
            value={query}
            onChangeText={onChangeQuery}
            placeholder="Buscar proyectos, electricistas..."
            autoFocus
            returnKeyType="search"
            clearable
            containerStyle={{ flex: 1, marginBottom: 0 }}
            inputContainerStyle={{
              paddingVertical: 10,
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          />
        </View>
      ) : (
        /* MODE 2: DEFAULT CATEGORIES HEADER (Title + Search Icon Q + Tabs) */
        <>
          {/* Top Row: Explore Title & Search Icon Q */}
          <View className="flex-row justify-between items-center mb-4">
            <Text
              style={{
                fontSize: 28,
                fontFamily: 'Satoshi-Black',
                color: colors.textPrimary,
                letterSpacing: -0.5,
              }}
            >
              Explorar
            </Text>
            <ThemedTouchable
              onPress={() => setIsSearching(true)}
              haptic="light"
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="search-outline" size={20} color={colors.textPrimary} />
            </ThemedTouchable>
          </View>

          {/* Tab Bar: Categorías vs Proyectos vs Sellers */}
          <View style={{ borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }}>
            <View className="flex-row items-center">
              {/* Tab 1: Categorías */}
              <ThemedTouchable
                onPress={() => onSelectTab('categories')}
                haptic="selection"
                className="pb-3 pt-1 mr-6 relative"
              >
                <Text
                  style={{
                    fontSize: 15.5,
                    fontFamily: activeTab === 'categories' ? 'Satoshi-Black' : 'Satoshi-Bold',
                    color: activeTab === 'categories' ? colors.textPrimary : colors.textMuted,
                  }}
                >
                  Categorías
                </Text>
                {activeTab === 'categories' && (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 2.5,
                      borderRadius: 2,
                      backgroundColor: colors.textPrimary,
                    }}
                  />
                )}
              </ThemedTouchable>

              {/* Tab 2: Proyectos */}
              <ThemedTouchable
                onPress={() => onSelectTab('projects')}
                haptic="selection"
                className="pb-3 pt-1 mr-6 relative"
              >
                <Text
                  style={{
                    fontSize: 15.5,
                    fontFamily: activeTab === 'projects' ? 'Satoshi-Black' : 'Satoshi-Bold',
                    color: activeTab === 'projects' ? colors.textPrimary : colors.textMuted,
                  }}
                >
                  Proyectos
                </Text>
                {activeTab === 'projects' && (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 2.5,
                      borderRadius: 2,
                      backgroundColor: colors.textPrimary,
                    }}
                  />
                )}
              </ThemedTouchable>

              {/* Tab 3: Sellers */}
              <ThemedTouchable
                onPress={() => onSelectTab('interests')}
                haptic="selection"
                className="pb-3 pt-1 relative"
              >
                <Text
                  style={{
                    fontSize: 15.5,
                    fontFamily: activeTab === 'interests' ? 'Satoshi-Black' : 'Satoshi-Bold',
                    color: activeTab === 'interests' ? colors.textPrimary : colors.textMuted,
                  }}
                >
                  Sellers
                </Text>
                {activeTab === 'interests' && (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 2.5,
                      borderRadius: 2,
                      backgroundColor: colors.textPrimary,
                    }}
                  />
                )}
              </ThemedTouchable>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

export default SearchFilterHeader;
