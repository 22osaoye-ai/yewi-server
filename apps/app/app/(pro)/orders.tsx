import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { MessageSquare, Package, Send, ShieldCheck } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows } from '../../src/components/Theme';
import { api } from '../../src/services/api';
import { Order } from '../../src/types';

import { useToast } from '../../src/components/Toast';

export default function ProOrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showToast } = useToast();

  const [selectedOrderIdForDelivery, setSelectedOrderIdForDelivery] = useState<string | null>(null);
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [isDelivering, setIsDelivering] = useState(false);

  const {
    data: orders = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<Order[]>({
    queryKey: ['pro-orders'],
    queryFn: async () => {
      const res: any = await api.get('/orders', {
        params: { role: 'PROFESSIONAL' },
      });
      return res.data || res || [];
    },
  });

  const handleDeliverWork = async () => {
    if (!selectedOrderIdForDelivery || !deliveryMessage) {
      showToast({
        type: 'error',
        title: 'Mensaje requerido',
        message: 'Por favor describe la entrega realizada.',
      });
      return;
    }

    try {
      setIsDelivering(true);
      await api.post(`/orders/${selectedOrderIdForDelivery}/deliver`, {
        message: deliveryMessage,
        attachments: [],
      });

      showToast({
        type: 'success',
        title: '¡Entrega Enviada!',
        message: 'El cliente ha sido notificado para liberar los fondos en Escrow.',
      });
      setSelectedOrderIdForDelivery(null);
      setDeliveryMessage('');
      refetch();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al enviar entrega.';
      showToast({
        type: 'error',
        title: 'Error de Entrega',
        message: msg,
      });
    } finally {
      setIsDelivering(false);
    }
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
        <Text style={styles.screenTitle}>Trabajos y Pedidos</Text>
        <Text style={styles.screenSubtitle}>Gestiona entregas y cobros garantizados</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Package size={44} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No tienes trabajos activos</Text>
          <Text style={styles.emptyDesc}>
            Revisa las oportunidades en Zaragoza o publica más Gigs para recibir clientes.
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
                    Ganancia Pro: {item.proEarnings} €
                  </Text>
                </View>
              </View>

              <View style={styles.statusRow}>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>{item.status}</Text>
                </View>
                <Text style={styles.totalPrice}>Total: {item.totalAmount} €</Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.chatBtn}
                  onPress={() =>
                    router.push({
                      pathname: '/chat/[id]',
                      params: { id: item.id },
                    })
                  }
                  activeOpacity={0.85}
                >
                  <MessageSquare size={14} color={Colors.text} />
                  <Text style={styles.chatBtnText}>Chat con Cliente</Text>
                </TouchableOpacity>

                {item.status === 'IN_PROGRESS' && (
                  <TouchableOpacity
                    style={styles.deliverBtn}
                    onPress={() => setSelectedOrderIdForDelivery(item.id)}
                    activeOpacity={0.85}
                  >
                    <Send size={14} color="#FFFFFF" />
                    <Text style={styles.deliverBtnText}>Entregar Trabajo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      )}

      {/* Modal para Entregar Trabajo */}
      <Modal
        visible={Boolean(selectedOrderIdForDelivery)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedOrderIdForDelivery(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Entregar Trabajo Finalizado</Text>
            <Text style={styles.modalSubtitle}>
              Describe el trabajo entregado o añade notas para el cliente.
            </Text>

            <TextInput
              style={[styles.modalInput, { height: 90, textAlignVertical: 'top' }]}
              placeholder="Ej. Trabajo de fontanería completado y probado sin fugas. Adjunto garantía de 6 meses..."
              placeholderTextColor={Colors.textMuted}
              multiline
              value={deliveryMessage}
              onChangeText={setDeliveryMessage}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSelectedOrderIdForDelivery(null)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitDeliverBtn}
                onPress={handleDeliverWork}
                disabled={isDelivering}
                activeOpacity={0.88}
              >
                {isDelivering ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitDeliverText}>Enviar Entrega</Text>
                )}
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
    marginBottom: 8,
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
    marginBottom: 12,
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
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
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
    backgroundColor: Colors.backgroundAlt,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  chatBtnText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  deliverBtn: {
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
  deliverBtnText: {
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
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 14,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.lg,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    color: Colors.text,
    fontSize: 14,
    marginBottom: 16,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: Colors.backgroundAlt,
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  submitDeliverBtn: {
    flex: 2,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: Colors.secondary,
    ...Shadows.sm,
  },
  submitDeliverText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
