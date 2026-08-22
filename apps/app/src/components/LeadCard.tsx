import { CheckCircle, Coins, Flame, Lock, MapPin, Send, Unlock } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../services/api';
import { ServiceRequest } from '../types';
import { Colors, Shadows } from './Theme';

interface LeadCardProps {
  lead: ServiceRequest;
  onUnlockedSuccess?: () => void;
  onSendQuotePress?: (leadId: string) => void;
}

import { useToast } from './Toast';

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onUnlockedSuccess,
  onSendQuotePress,
}) => {
  const { showToast } = useToast();
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockedData, setUnlockedData] = useState<any>(
    lead.isUnlockedByMe ? lead.client : null,
  );

  const handleUnlock = async () => {
    try {
      setIsUnlocking(true);
      const res: any = await api.post(`/leads/requests/${lead.id}/unlock`);
      setUnlockedData(res.data?.clientDetails || res.clientDetails);
      showToast({
        type: 'success',
        title: '¡Contacto Desbloqueado!',
        message: 'Acceso concedido a los datos directos del cliente.',
      });
      if (onUnlockedSuccess) onUnlockedSuccess();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'No se pudo desbloquear el contacto. Verifica tu saldo de créditos.';
      showToast({
        type: 'error',
        title: 'Saldo Insuficiente',
        message: msg,
      });
    } finally {
      setIsUnlocking(false);
    }
  };

  const isUnlocked = Boolean(unlockedData || lead.isUnlockedByMe);

  return (
    <View style={styles.card}>
      {/* Top Meta Badges */}
      <View style={styles.header}>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>
            {lead.category?.name || 'Servicio'}
          </Text>
        </View>

        {lead.isUrgent && (
          <View style={styles.urgentPill}>
            <Flame size={11} color="#FFFFFF" />
            <Text style={styles.urgentText}>Urgente</Text>
          </View>
        )}

        <View style={styles.creditsPill}>
          <Coins size={12} color={Colors.accent} />
          <Text style={styles.creditsText}>{lead.creditCost} créditos</Text>
        </View>
      </View>

      <Text style={styles.title}>{lead.title}</Text>
      <Text style={styles.description} numberOfLines={3}>
        {lead.description}
      </Text>

      {/* Location & Unlocks Info */}
      <View style={styles.metaRow}>
        <View style={styles.locationItem}>
          <MapPin size={13} color={Colors.primary} />
          <Text style={styles.locationText}>
            {lead.city || 'Zaragoza'}
            {lead.distanceKm !== undefined && lead.distanceKm !== null
              ? ` · ${lead.distanceKm.toFixed(1)} km`
              : ''}
          </Text>
        </View>

        <View style={styles.unlocksBadge}>
          <Text style={styles.unlocksText}>
            {lead.unlocksCount}/{lead.maxUnlocks || 5} propuestas
          </Text>
        </View>
      </View>

      {/* Client Protected / Unlocked Island Box */}
      <View
        style={[
          styles.clientBox,
          isUnlocked ? styles.clientBoxUnlocked : styles.clientBoxLocked,
        ]}
      >
        {isUnlocked ? (
          <View>
            <View style={styles.clientStatusRow}>
              <CheckCircle size={14} color={Colors.primary} />
              <Text style={styles.clientStatusUnlocked}>Contacto Desbloqueado</Text>
            </View>
            <Text style={styles.clientDetailText}>
              👤 {unlockedData?.name || `${unlockedData?.firstName} ${unlockedData?.lastName}`}
            </Text>
            <Text style={styles.clientDetailText}>
              📞 Teléfono: {unlockedData?.phone || 'No especificado'}
            </Text>
            <Text style={styles.clientDetailText}>
              ✉️ Email: {unlockedData?.email}
            </Text>
            {unlockedData?.address && (
              <Text style={styles.clientDetailText}>
                📍 Dirección: {unlockedData?.address}
              </Text>
            )}

            <TouchableOpacity
              style={styles.sendQuoteBtn}
              onPress={() => onSendQuotePress && onSendQuotePress(lead.id)}
              activeOpacity={0.88}
            >
              <Send size={13} color="#FFFFFF" />
              <Text style={styles.sendQuoteText}>Enviar Cotización</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.clientStatusRow}>
              <Lock size={12} color={Colors.textSecondary} />
              <Text style={styles.clientStatusLocked}>
                Datos de contacto protegidos
              </Text>
            </View>
            <Text style={styles.lockedDesc}>
              Desbloquea para obtener teléfono directo, email y enviar propuesta.
            </Text>

            <TouchableOpacity
              style={styles.unlockBtn}
              onPress={handleUnlock}
              disabled={isUnlocking || lead.remainingUnlocks === 0}
              activeOpacity={0.88}
            >
              {isUnlocking ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Unlock size={14} color="#FFFFFF" />
                  <Text style={styles.unlockBtnText}>
                    Desbloquear Contacto ({lead.creditCost} cr.)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 16,
    ...Shadows.subtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  categoryPill: {
    backgroundColor: Colors.pillInactiveBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
  },
  urgentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.price,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  creditsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.creditsBadgeBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 'auto',
    gap: 4,
  },
  creditsText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.creditsBadgeText,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 6,
    lineHeight: 22,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  unlocksBadge: {
    backgroundColor: Colors.surfaceWarm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  unlocksText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  clientBox: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
  },
  clientBoxLocked: {
    backgroundColor: Colors.surfaceWarm,
    borderColor: Colors.border,
  },
  clientBoxUnlocked: {
    backgroundColor: 'rgba(27, 67, 50, 0.06)',
    borderColor: Colors.primary,
  },
  clientStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  clientStatusLocked: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  clientStatusUnlocked: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  lockedDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  clientDetailText: {
    fontSize: 13,
    color: Colors.text,
    marginBottom: 4,
    fontWeight: '500',
  },
  unlockBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    ...Shadows.subtle,
  },
  unlockBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  sendQuoteBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 24,
    marginTop: 8,
    gap: 6,
    ...Shadows.subtle,
  },
  sendQuoteText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
