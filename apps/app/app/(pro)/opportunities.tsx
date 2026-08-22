import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Coins, Send, Sparkles, X } from 'lucide-react-native';
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
import { Header } from '../../src/components/Header';
import { LeadCard } from '../../src/components/LeadCard';
import { Colors, Shadows } from '../../src/components/Theme';
import { api } from '../../src/services/api';
import { ServiceRequest } from '../../src/types';

import { useToast } from '../../src/components/Toast';

export default function OpportunitiesScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  const [selectedLeadIdForQuote, setSelectedLeadIdForQuote] = useState<string | null>(null);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteDays, setQuoteDays] = useState('2');
  const [quoteMessage, setQuoteMessage] = useState('');
  const [isSendingQuote, setIsSendingQuote] = useState(false);

  // 1. Obtener billetera para saber créditos actuales
  const { data: walletData, refetch: refetchWallet } = useQuery({
    queryKey: ['my-wallet'],
    queryFn: async () => {
      const res: any = await api.get('/wallet/me');
      return res.data || res;
    },
  });

  // 2. Obtener oportunidades de leads
  const {
    data: leads = [],
    isLoading,
    refetch: refetchLeads,
    isRefetching,
  } = useQuery<ServiceRequest[]>({
    queryKey: ['pro-opportunities'],
    queryFn: async () => {
      const res: any = await api.get('/leads/opportunities');
      return res.data || res || [];
    },
  });

  const handleSendQuote = async () => {
    if (!selectedLeadIdForQuote || !quotePrice || !quoteMessage) {
      showToast({
        type: 'error',
        title: 'Campos Obligatorios',
        message: 'Por favor ingresa el precio y tu mensaje de propuesta.',
      });
      return;
    }

    try {
      setIsSendingQuote(true);
      await api.post(`/leads/requests/${selectedLeadIdForQuote}/quote`, {
        price: parseFloat(quotePrice),
        estimatedDays: parseInt(quoteDays, 10) || 1,
        message: quoteMessage,
      });

      showToast({
        type: 'success',
        title: '¡Presupuesto Enviado!',
        message: 'El cliente ha recibido tu oferta. Te notificaremos al ser aceptada.',
      });
      setSelectedLeadIdForQuote(null);
      setQuotePrice('');
      setQuoteMessage('');
      refetchLeads();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al enviar presupuesto.';
      showToast({
        type: 'error',
        title: 'Error de Envío',
        message: msg,
      });
    } finally {
      setIsSendingQuote(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.topBar}>
        <View>
          <Text style={styles.screenTitle}>Oportunidades en Zaragoza</Text>
          <Text style={styles.screenSubtitle}>Solicitudes abiertas de clientes</Text>
        </View>

        <TouchableOpacity
          style={styles.creditsPill}
          onPress={() => router.push('/(pro)/wallet')}
          activeOpacity={0.8}
        >
          <Coins size={14} color="#D97706" />
          <Text style={styles.creditsPillText}>
            {walletData?.creditBalance ?? 0} cr.
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : leads.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Sparkles size={40} color={Colors.secondary} />
          <Text style={styles.emptyTitle}>No hay nuevas solicitudes en este momento</Text>
          <Text style={styles.emptyDesc}>
            Te notificaremos en cuanto clientes de Zaragoza y alrededores publiquen proyectos en tu sector.
          </Text>
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                refetchLeads();
                refetchWallet();
              }}
              tintColor={Colors.primary}
            />
          }
          renderItem={({ item }) => (
            <LeadCard
              lead={item}
              onUnlockedSuccess={() => {
                refetchLeads();
                refetchWallet();
              }}
              onSendQuotePress={(leadId) => setSelectedLeadIdForQuote(leadId)}
            />
          )}
        />
      )}

      {/* Modal para Enviar Presupuesto */}
      <Modal
        visible={Boolean(selectedLeadIdForQuote)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedLeadIdForQuote(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enviar Presupuesto al Cliente</Text>
              <TouchableOpacity onPress={() => setSelectedLeadIdForQuote(null)}>
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Precio Total (€) *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej. 120"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={quotePrice}
              onChangeText={setQuotePrice}
            />

            <Text style={styles.modalLabel}>Plazo Estimado (Días) *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej. 2"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              value={quoteDays}
              onChangeText={setQuoteDays}
            />

            <Text style={styles.modalLabel}>Mensaje / Condiciones del Trabajo *</Text>
            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Explica qué incluye tu servicio, materiales, disponibilidad..."
              placeholderTextColor={Colors.textMuted}
              multiline
              value={quoteMessage}
              onChangeText={setQuoteMessage}
            />

            <TouchableOpacity
              style={styles.submitQuoteBtn}
              onPress={handleSendQuote}
              disabled={isSendingQuote}
              activeOpacity={0.88}
            >
              {isSendingQuote ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Send size={16} color="#FFFFFF" />
                  <Text style={styles.submitQuoteText}>Enviar Cotización</Text>
                </>
              )}
            </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  screenSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  creditsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
    ...Shadows.sm,
  },
  creditsPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D97706',
  },
  list: {
    padding: 18,
    paddingBottom: 120,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 22,
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    color: Colors.text,
    fontSize: 14,
    height: 46,
    marginBottom: 12,
  },
  submitQuoteBtn: {
    backgroundColor: Colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
    marginTop: 6,
    gap: 8,
    ...Shadows.sm,
  },
  submitQuoteText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
