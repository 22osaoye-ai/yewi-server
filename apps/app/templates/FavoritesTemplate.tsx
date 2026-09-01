import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { ProfessionalCard } from '@/components/ui/ProfessionalCard';
import { ThemedPressed } from '@/components/ui/ThemedPressed';
import { useAppTheme } from '@/hooks/useAppTheme';
import { professionalsApi, ProfessionalDetail } from '@/services/professionalsApi';

export function FavoritesTemplate() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, t } = useAppTheme();
  const { favorites } = useFavoritesStore();

  const [favoritedPros, setFavoritedPros] = useState<ProfessionalDetail[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (favorites.length === 0) {
      setFavoritedPros([]);
      return;
    }

    setLoading(true);
    Promise.all(
      favorites.map((id) =>
        professionalsApi.getPublicProfile(id).catch(() => null)
      )
    )
      .then((results) => {
        if (isMounted) {
          setFavoritedPros(results.filter(Boolean) as ProfessionalDetail[]);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [favorites]);

  const handleProductPress = (productId: string) => {
    router.push({
      pathname: '/detail',
      params: { id: productId, entityType: 'professional' },
    });
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: Math.max(insets.top + 8, 24),
          paddingBottom: 16,
          paddingHorizontal: 24,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
        }}
      >
        <Text
          style={{
            fontSize: 26,
            fontFamily: 'Satoshi-Black',
            color: colors.textPrimary,
            letterSpacing: -0.5,
          }}
        >
          {t.itemSaved}
        </Text>
        <Text
          style={{
            fontSize: 12.5,
            fontFamily: 'Satoshi-Medium',
            color: colors.textSecondary,
            marginTop: 2,
          }}
        >
          {favoritedPros.length} {favoritedPros.length === 1 ? 'profesional guardado' : 'profesionales guardados'}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : favoritedPros.length > 0 ? (
        <FlatList
          data={favoritedPros}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 18,
            paddingTop: 16,
            paddingBottom: 140,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProfessionalCard
              professional={item}
              onPress={() => handleProductPress(item.id)}
            />
          )}
        />
      ) : (
        /* Empty Wishlist State */
        <View className="flex-1 items-center justify-center px-8 pb-20">
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="heart-outline" size={36} color={colors.textMuted} />
          </View>
          <Text
            style={{
              fontSize: 18,
              fontFamily: 'Satoshi-Bold',
              color: colors.textPrimary,
              textAlign: 'center',
              marginBottom: 6,
            }}
          >
            {t.savedListsEmpty}
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Satoshi-Regular',
              color: colors.textSecondary,
              textAlign: 'center',
              marginBottom: 24,
              maxWidth: 280,
              lineHeight: 20,
            }}
          >
            Guarda tus profesionales o autónomos preferidos para consultarlos o contratarlos más tarde.
          </Text>
          <ThemedPressed
            onPress={() => router.push('/(tabs)/search')}
            haptic="medium"
            scaleOnPress
            style={{
              backgroundColor: colors.primary,
              borderRadius: 999,
              paddingHorizontal: 24,
              paddingVertical: 12,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontFamily: 'Satoshi-Bold', fontSize: 14 }}>
              Explorar Profesionales
            </Text>
          </ThemedPressed>
        </View>
      )}
    </View>
  );
}

export default FavoritesTemplate;
