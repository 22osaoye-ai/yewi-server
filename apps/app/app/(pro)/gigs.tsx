import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Briefcase, Eye, Star } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows } from '../../src/components/Theme';
import { api } from '../../src/services/api';
import { Gig } from '../../src/types';

export default function ProGigsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    data: myProfile,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['pro-profile-me'],
    queryFn: async () => {
      const res: any = await api.get('/professionals/me');
      return res.data || res;
    },
  });

  const gigs: Gig[] = myProfile?.gigs || [];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top + 8, 16),
          },
        ]}
      >
        <View>
          <Text style={styles.screenTitle}>Mis Servicios (Gigs)</Text>
          <Text style={styles.screenSubtitle}>Catálogo de servicios activos</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : gigs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Briefcase size={44} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>Aún no has publicado ningún Gig</Text>
          <Text style={styles.emptyDesc}>
            Crea servicios empaquetados con precios fijos y tiempos de entrega para que los clientes te contraten directamente.
          </Text>
        </View>
      ) : (
        <FlatList
          data={gigs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.gigCard}>
              <Text style={styles.gigTitle}>{item.title}</Text>
              <Text style={styles.gigDesc} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.packagesGrid}>
                {item.packages?.map((pkg) => (
                  <View key={pkg.id} style={styles.packagePill}>
                    <Text style={styles.packageTier}>{pkg.tier}</Text>
                    <Text style={styles.packagePrice}>{pkg.price} €</Text>
                    <Text style={styles.packageDays}>{pkg.deliveryDays}d</Text>
                  </View>
                ))}
              </View>

              <View style={styles.footerRow}>
                <View style={styles.ratingRow}>
                  <Star size={13} color={Colors.accent} fill={Colors.accent} />
                  <Text style={styles.ratingText}>
                    {item.ratingAvg ? item.ratingAvg.toFixed(1) : '5.0'}
                  </Text>
                  <Text style={styles.ratingCount}>({item.ratingCount || 0})</Text>
                </View>

                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() =>
                    router.push({
                      pathname: '/gigs/[id]',
                      params: { id: item.slug || item.id },
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Eye size={13} color={Colors.secondary} />
                  <Text style={styles.viewBtnText}>Ver Ficha</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  screenSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  list: {
    padding: 18,
    paddingBottom: 120,
  },
  gigCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 14,
    ...Shadows.sm,
  },
  gigTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  gigDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  packagesGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  packagePill: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  packageTier: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  packagePrice: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.text,
    marginVertical: 2,
  },
  packageDays: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  ratingCount: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 14,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
