import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { CheckCircle2, Clock, Plus, User } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
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

export default function ClientRequestsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    data: requests = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['my-requests'],
    queryFn: async () => {
      const res: any = await api.get('/leads/my-requests');
      return res.data || res || [];
    },
  });

  const handleAcceptProposal = (proposalId: string, price: number, proName: string) => {
    Alert.alert(
      'Aceptar Presupuesto',
      `¿Deseas aceptar el presupuesto de ${price} € de ${proName}? Los fondos se retendrán de forma segura en Escrow hasta que confirmes la entrega.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceptar y Retener en Escrow',
          onPress: async () => {
            try {
              const res: any = await api.post(`/leads/proposals/${proposalId}/accept`);
              const order = res.data || res;
              Alert.alert(
                '¡Presupuesto Aceptado!',
                `Se ha creado el pedido ${order.orderNumber}. Ya puedes coordinar con el profesional.`,
              );
              refetch();
              router.push('/(client)/orders');
            } catch (err: any) {
              const msg = err.response?.data?.message || 'Error al procesar el presupuesto.';
              Alert.alert('Error', msg);
            }
          },
        },
      ],
    );
  };

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
          <Text style={styles.screenTitle}>Mis Solicitudes</Text>
          <Text style={styles.screenSubtitle}>Proyectos publicados en Zaragoza</Text>
        </View>

        <TouchableOpacity
          style={styles.newRequestBtn}
          onPress={() => router.push('/requests/new')}
          activeOpacity={0.85}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.newRequestText}>Nueva</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No tienes solicitudes activas</Text>
          <Text style={styles.emptyDesc}>
            Publica lo que necesitas (reformas, fontanería, diseño, etc.) y recibe ofertas de autónomos en Zaragoza.
          </Text>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push('/requests/new')}
            activeOpacity={0.88}
          >
            <Text style={styles.createBtnText}>Publicar mi primera solicitud</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={requests}
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
            <View style={styles.requestCard}>
              <View style={styles.cardHeader}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>
                    {item.category?.name || 'Servicio'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === 'FULFILLED'
                      ? styles.statusFulfilled
                      : styles.statusOpen,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      item.status === 'FULFILLED'
                        ? styles.statusTextFulfilled
                        : styles.statusTextOpen,
                    ]}
                  >
                    {item.status === 'FULFILLED' ? 'Asignado' : 'Abierto'}
                  </Text>
                </View>
              </View>

              <Text style={styles.requestTitle}>{item.title}</Text>
              <Text style={styles.requestDescription}>{item.description}</Text>

              <View style={styles.proposalsSection}>
                <Text style={styles.proposalsHeader}>
                  Presupuestos Recibidos ({item.proposals?.length || 0})
                </Text>

                {item.proposals?.length === 0 ? (
                  <Text style={styles.noProposalsText}>
                    Esperando que profesionales de Zaragoza revisen tu solicitud...
                  </Text>
                ) : (
                  item.proposals?.map((prop: any) => (
                    <View key={prop.id} style={styles.proposalItem}>
                      <View style={styles.proposalTop}>
                        <View style={styles.proInfo}>
                          <User size={14} color={Colors.secondary} />
                          <Text style={styles.proName}>
                            {prop.professionalProfile?.businessName ||
                              `${prop.professionalProfile?.user?.profile?.firstName} ${prop.professionalProfile?.user?.profile?.lastName}`}
                          </Text>
                        </View>
                        <Text style={styles.proposalPrice}>{prop.price} €</Text>
                      </View>

                      <Text style={styles.proposalMessage}>{prop.message}</Text>

                      <View style={styles.proposalFooter}>
                        <View style={styles.daysBadge}>
                          <Clock size={12} color={Colors.textSecondary} />
                          <Text style={styles.daysText}>
                            {prop.estimatedDays} días estimados
                          </Text>
                        </View>

                        {prop.status === 'PENDING' ? (
                          <TouchableOpacity
                            style={styles.acceptBtn}
                            onPress={() =>
                              handleAcceptProposal(
                                prop.id,
                                prop.price,
                                prop.professionalProfile?.businessName || 'el profesional',
                              )
                            }
                            activeOpacity={0.85}
                          >
                            <CheckCircle2 size={13} color="#FFFFFF" />
                            <Text style={styles.acceptBtnText}>Aceptar Oferta</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.acceptedBadge}>
                            <Text style={styles.acceptedBadgeText}>
                              {prop.status === 'ACCEPTED' ? '✓ Aceptado' : 'Rechazado'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))
                )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  newRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 4,
    ...Shadows.sm,
  },
  newRequestText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  list: {
    padding: 18,
    paddingBottom: 150,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 16,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: 'rgba(30, 41, 59, 0.08)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusOpen: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  statusFulfilled: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextOpen: {
    color: '#059669',
  },
  statusTextFulfilled: {
    color: '#4F46E5',
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  requestDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  proposalsSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  proposalsHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  noProposalsText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  proposalItem: {
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  proposalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  proInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  proposalPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  proposalMessage: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: 8,
  },
  proposalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  daysBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  daysText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  acceptBtn: {
    backgroundColor: Colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 4,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  acceptedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  acceptedBadgeText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  createBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 24,
    ...Shadows.sm,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
