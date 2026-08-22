import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { CheckCircle, MessageSquare, Package, ShieldCheck } from 'lucide-react-native';
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
import { Order } from '../../src/types';

export default function ClientOrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    data: orders = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<Order[]>({
    queryKey: ['client-orders'],
    queryFn: async () => {
      const res: any = await api.get('/orders', {
        params: { role: 'CLIENT' },
      });
      return res.data || res || [];
    },
  });

  const handleApproveOrder = (orderId: string, orderNumber: string) => {
    Alert.alert(
      'Aprobar Entrega y Liberar Fondos',
      `¿Confirmas que el trabajo del pedido ${orderNumber} se ha completado satisfactoriamente? Los fondos en Escrow serán liberados al profesional.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprobar y Liberar Escrow',
          onPress: async () => {
            try {
              await api.post(`/orders/${orderId}/approve`);
              Alert.alert('¡Pedido Completado!', 'Los fondos han sido transferidos al profesional.');
              refetch();
            } catch (err: any) {
              const msg = err.response?.data?.message || 'Error al aprobar el pedido.';
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
        <Text style={styles.screenTitle}>Mis Pedidos</Text>
        <Text style={styles.screenSubtitle}>Protegidos con el sistema Escrow de Yewi</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Package size={44} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No tienes pedidos activos</Text>
          <Text style={styles.emptyDesc}>
            Cuando contrates un Gig o aceptes una cotización de un profesional, aparecerá aquí.
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
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
            <View style={styles.orderCard}>
              <View style={styles.orderTopRow}>
                <Text style={styles.orderNumber}>{item.orderNumber}</Text>
                <View style={styles.escrowBadge}>
                  <ShieldCheck size={12} color="#059669" />
                  <Text style={styles.escrowBadgeText}>
                    Escrow: {item.escrowStatus}
                  </Text>
                </View>
              </View>

              <View style={styles.statusRow}>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>{item.status}</Text>
                </View>
                <Text style={styles.totalPrice}>{item.totalAmount} €</Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.chatBtn}
                  onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })}
                  activeOpacity={0.85}
                >
                  <MessageSquare size={14} color="#FFFFFF" />
                  <Text style={styles.chatBtnText}>Chat & Entregas</Text>
                </TouchableOpacity>

                {item.status === 'DELIVERED' && (
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleApproveOrder(item.id, item.orderNumber)}
                    activeOpacity={0.85}
                  >
                    <CheckCircle size={14} color="#FFFFFF" />
                    <Text style={styles.approveBtnText}>Aprobar Trabajo</Text>
                  </TouchableOpacity>
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
    paddingBottom: 150,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 14,
    ...Shadows.sm,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  escrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  escrowBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusPill: {
    backgroundColor: Colors.backgroundAlt,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 14,
  },
  chatBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    ...Shadows.sm,
  },
  chatBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  approveBtn: {
    flex: 1,
    backgroundColor: Colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    ...Shadows.sm,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
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
    marginTop: 16,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
