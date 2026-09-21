import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';
import { professionalsApi } from '@/services/professionalsApi';
import { promotionsApi, SellerPromotion } from '@/services/promotionsApi';
import { toast } from '@/store/useToastStore';

interface ManageRatesModalProps {
  visible: boolean;
  onClose: () => void;
  initialHourlyRate?: number | null;
  onRateUpdated?: (newRate: number) => void;
}

const PRESET_DISCOUNTS = [10, 15, 20, 25, 30, 50];
const DURATION_OPTIONS = [
  { label: '7 días', days: 7 },
  { label: '15 días', days: 15 },
  { label: '30 días', days: 30 },
];

export function ManageRatesModal({
  visible,
  onClose,
  initialHourlyRate,
  onRateUpdated,
}: ManageRatesModalProps) {
  const { colors, isDark } = useAppTheme();

  // Rate state
  const [hourlyRateText, setHourlyRateText] = useState<string>(
    initialHourlyRate ? String(initialHourlyRate) : ''
  );
  const [savingRate, setSavingRate] = useState(false);

  // Promotions state
  const [loadingPromos, setLoadingPromos] = useState(false);
  const [activePromo, setActivePromo] = useState<SellerPromotion | null>(null);
  const [creatingPromo, setCreatingPromo] = useState(false);
  const [deletingPromo, setDeletingPromo] = useState(false);

  // Promo creation form
  const [isPermanent, setIsPermanent] = useState(false);
  const [selectedDurationDays, setSelectedDurationDays] = useState(15);
  const [selectedDiscountPercent, setSelectedDiscountPercent] = useState<number>(15);
  const [promoTitle, setPromoTitle] = useState('Oferta Especial');

  useEffect(() => {
    if (initialHourlyRate !== undefined && initialHourlyRate !== null) {
      setHourlyRateText(String(initialHourlyRate));
    }
  }, [initialHourlyRate]);

  useEffect(() => {
    if (visible) {
      loadActivePromotion();
    }
  }, [visible]);

  const loadActivePromotion = async () => {
    try {
      setLoadingPromos(true);
      const myPromos = await promotionsApi.getMyPromotions();
      if (Array.isArray(myPromos) && myPromos.length > 0) {
        // Look for the newest active promotion
        const now = new Date();
        const valid = myPromos.find((p) => {
          if (!p.expiresAt) return true;
          return new Date(p.expiresAt) > now;
        });
        setActivePromo(valid || null);
      } else {
        setActivePromo(null);
      }
    } catch {
      setActivePromo(null);
    } finally {
      setLoadingPromos(false);
    }
  };

  const handleSaveHourlyRate = async () => {
    const rateNum = parseFloat(hourlyRateText);
    if (isNaN(rateNum) || rateNum < 0) {
      toast.warning('Tarifa Inválida', 'Introduce un importe válido por hora.');
      return;
    }

    try {
      setSavingRate(true);
      await professionalsApi.updateMyProfile({ hourlyRate: rateNum });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      toast.success('Tarifa Guardada', `${rateNum} €/h actualizado correctamente.`);
      if (onRateUpdated) {
        onRateUpdated(rateNum);
      }
    } catch (err: any) {
      toast.error('Error al Guardar', err?.message || 'No se pudo actualizar la tarifa.');
    } finally {
      setSavingRate(false);
    }
  };

  const handleCreatePromotion = async () => {
    if (!promoTitle.trim()) {
      toast.warning('Título Requerido', 'Introduce un título para el descuento.');
      return;
    }

    try {
      setCreatingPromo(true);
      let expiresAt: string | undefined;

      if (!isPermanent) {
        const exp = new Date();
        exp.setDate(exp.getDate() + selectedDurationDays);
        expiresAt = exp.toISOString();
      }

      const created = await promotionsApi.createPromotion({
        title: promoTitle.trim(),
        description: `Descuento exclusivo del ${selectedDiscountPercent}% en todos los servicios.`,
        discountPercent: selectedDiscountPercent,
        isPermanent,
        expiresAt,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      toast.success(
        'Descuento Activo',
        `Descuento del ${selectedDiscountPercent}% publicado y aplicado automáticamente.`
      );
      setActivePromo(created);
    } catch (err: any) {
      toast.error('Error al Crear', err?.message || 'No se pudo publicar la promoción.');
    } finally {
      setCreatingPromo(false);
    }
  };

  const handleDeletePromotion = async () => {
    if (!activePromo) return;
    try {
      setDeletingPromo(true);
      await promotionsApi.deletePromotion(activePromo.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      toast.info('Descuento Retirado', 'La promoción ha sido desactivada.');
      setActivePromo(null);
    } catch (err: any) {
      toast.error('Error al Eliminar', err?.message || 'No se pudo retirar la promoción.');
    } finally {
      setDeletingPromo(false);
    }
  };

  const textColor = isDark ? '#F9FAFB' : '#111827';
  const subtextColor = isDark ? '#9CA3AF' : '#6B7280';
  const inputBg = isDark ? '#27272A' : '#F4F4F5';
  const borderColor = isDark ? '#3F3F46' : '#E4E4E7';

  return (
    <AppBottomSheet visible={visible} onClose={onClose} title="Tarifas y Descuentos">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* SECTION 1: Hourly Rate */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="time-outline" size={20} color="#0284C7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Tarifa por Hora</Text>
              <Text style={[styles.sectionDesc, { color: subtextColor }]}>
                Importe orientativo por hora para presupuestos
              </Text>
            </View>
          </View>

          <View style={styles.rateInputRow}>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: inputBg, borderColor },
              ]}
            >
              <TextInput
                value={hourlyRateText}
                onChangeText={setHourlyRateText}
                placeholder="Ej. 35"
                placeholderTextColor={subtextColor}
                keyboardType="numeric"
                style={[styles.rateInput, { color: textColor }]}
              />
              <Text style={[styles.currencySuffix, { color: subtextColor }]}>€/h</Text>
            </View>

            <ThemedTouchable
              onPress={handleSaveHourlyRate}
              disabled={savingRate}
              haptic="medium"
              style={[
                styles.saveButton,
                { opacity: savingRate ? 0.7 : 1 },
              ]}
            >
              {savingRate ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar</Text>
              )}
            </ThemedTouchable>
          </View>
        </View>

        {/* SECTION 2: Active or New Promotion */}
        <View style={[styles.sectionCard, { marginTop: 16 }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="pricetag" size={20} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Descuentos y Ofertas</Text>
              <Text style={[styles.sectionDesc, { color: subtextColor }]}>
                Aparece en la tarjeta de ofertas del Home y se aplica al pagar
              </Text>
            </View>
          </View>

          {loadingPromos ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color="#0284C7" />
            </View>
          ) : activePromo ? (
            /* Active Promotion Display */
            <View
              style={[
                styles.activePromoCard,
                {
                  backgroundColor: isDark ? 'rgba(2, 132, 199, 0.12)' : '#F0F9FF',
                  borderColor: isDark ? 'rgba(2, 132, 199, 0.3)' : '#BAE6FD',
                },
              ]}
            >
              <View style={styles.promoHeader}>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>
                    -{activePromo.discountPercent || 15}%
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.activePromoTitle, { color: textColor }]}>
                    {activePromo.title}
                  </Text>
                  <Text style={[styles.activePromoSubtitle, { color: subtextColor }]}>
                    {activePromo.isPermanent
                      ? 'Permanente'
                      : activePromo.expiresAt
                      ? `Expira el ${new Date(activePromo.expiresAt).toLocaleDateString()}`
                      : 'Temporal'}
                  </Text>
                </View>
              </View>

              <ThemedTouchable
                onPress={handleDeletePromotion}
                disabled={deletingPromo}
                haptic="medium"
                style={styles.deletePromoButton}
              >
                {deletingPromo ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={17} color="#DC2626" />
                    <Text style={styles.deletePromoText}>Eliminar Descuento</Text>
                  </>
                )}
              </ThemedTouchable>
            </View>
          ) : (
            /* Create Promotion Form */
            <View style={styles.createPromoForm}>
              {/* Promo Type: Permanente vs Temporal */}
              <Text style={[styles.fieldLabel, { color: textColor }]}>Tipo de Descuento</Text>
              <View style={styles.toggleRow}>
                <ThemedTouchable
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setIsPermanent(false);
                  }}
                  haptic="light"
                  style={[
                    styles.togglePill,
                    !isPermanent && styles.togglePillActive,
                    { borderColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.togglePillText,
                      !isPermanent && styles.togglePillTextActive,
                      { color: !isPermanent ? '#0284C7' : subtextColor },
                    ]}
                  >
                    Temporal
                  </Text>
                </ThemedTouchable>

                <ThemedTouchable
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setIsPermanent(true);
                  }}
                  haptic="light"
                  style={[
                    styles.togglePill,
                    isPermanent && styles.togglePillActive,
                    { borderColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.togglePillText,
                      isPermanent && styles.togglePillTextActive,
                      { color: isPermanent ? '#0284C7' : subtextColor },
                    ]}
                  >
                    Permanente
                  </Text>
                </ThemedTouchable>
              </View>

              {/* Duration options (if temporal) */}
              {!isPermanent && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.fieldLabel, { color: textColor }]}>Duración</Text>
                  <View style={styles.pillsRow}>
                    {DURATION_OPTIONS.map((opt) => (
                      <ThemedTouchable
                        key={opt.days}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          setSelectedDurationDays(opt.days);
                        }}
                        haptic="light"
                        style={[
                          styles.smallPill,
                          selectedDurationDays === opt.days && styles.smallPillActive,
                          { borderColor },
                        ]}
                      >
                        <Text
                          style={[
                            styles.smallPillText,
                            selectedDurationDays === opt.days && styles.smallPillTextActive,
                            { color: selectedDurationDays === opt.days ? '#0284C7' : subtextColor },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </ThemedTouchable>
                    ))}
                  </View>
                </View>
              )}

              {/* Discount Percentage Pills */}
              <Text style={[styles.fieldLabel, { color: textColor, marginTop: 14 }]}>
                Porcentaje de Descuento
              </Text>
              <View style={styles.pillsRow}>
                {PRESET_DISCOUNTS.map((pct) => (
                  <ThemedTouchable
                    key={pct}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setSelectedDiscountPercent(pct);
                    }}
                    haptic="light"
                    style={[
                      styles.percentPill,
                      selectedDiscountPercent === pct && styles.percentPillActive,
                      { borderColor },
                    ]}
                  >
                    <Text
                      style={[
                        styles.percentPillText,
                        selectedDiscountPercent === pct && styles.percentPillTextActive,
                        { color: selectedDiscountPercent === pct ? '#0284C7' : subtextColor },
                      ]}
                    >
                      {pct}%
                    </Text>
                  </ThemedTouchable>
                ))}
              </View>

              {/* Promo Title */}
              <Text style={[styles.fieldLabel, { color: textColor, marginTop: 14 }]}>
                Título de la Oferta
              </Text>
              <TextInput
                value={promoTitle}
                onChangeText={setPromoTitle}
                placeholder="Ej. Oferta Primavera"
                placeholderTextColor={subtextColor}
                style={[
                  styles.titleInput,
                  { backgroundColor: inputBg, borderColor, color: textColor },
                ]}
              />

              {/* Submit Promo Button */}
              <ThemedTouchable
                onPress={handleCreatePromotion}
                disabled={creatingPromo}
                haptic="medium"
                style={[
                  styles.createPromoButton,
                  { opacity: creatingPromo ? 0.7 : 1 },
                ]}
              >
                {creatingPromo ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.createPromoButtonText}>Activar Descuento</Text>
                )}
              </ThemedTouchable>
            </View>
          )}
        </View>
      </ScrollView>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
  },
  sectionCard: {
    paddingTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -0.2,
  },
  sectionDesc: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-Regular',
    marginTop: 1,
  },
  rateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  rateInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  currencySuffix: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  saveButton: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  loaderContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  activePromoCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 6,
  },
  promoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },
  activePromoTitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  activePromoSubtitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Regular',
    marginTop: 2,
  },
  deletePromoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
  },
  deletePromoText: {
    color: '#DC2626',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  createPromoForm: {
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-SemiBold',
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  togglePill: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  togglePillActive: {
    borderColor: '#0284C7',
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
  },
  togglePillText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  togglePillTextActive: {
    fontFamily: 'PlusJakartaSans-Bold',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  smallPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  smallPillActive: {
    borderColor: '#0284C7',
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
  },
  smallPillText: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  smallPillTextActive: {
    fontFamily: 'PlusJakartaSans-Bold',
  },
  percentPill: {
    flex: 1,
    minWidth: 46,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentPillActive: {
    borderColor: '#0284C7',
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
  },
  percentPillText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  percentPillTextActive: {
    fontFamily: 'PlusJakartaSans-Bold',
  },
  titleInput: {
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  createPromoButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  createPromoButtonText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontFamily: 'PlusJakartaSans-Bold',
  },
});

export default ManageRatesModal;
