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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuthStore } from '@/store/useAuthStore';
import { professionalsApi } from '@/services/professionalsApi';
import { promotionsApi, SellerPromotion } from '@/services/promotionsApi';
import { toast } from '@/store/useToastStore';

interface ManageRatesModalProps {
  visible: boolean;
  onClose: () => void;
  initialHourlyRate?: number | null;
  initialSpecs?: string[];
  onRateUpdated?: (newRate: number, specs?: string[]) => void;
}

const PRESET_DISCOUNTS = [10, 15, 20, 25, 30, 50];
const DURATION_OPTIONS = [
  { label: '7 días', days: 7 },
  { label: '15 días', days: 15 },
  { label: '30 días', days: 30 },
];

const SUGGESTED_SPECS = [
  'Presupuesto previo gratuito',
  'Desplazamiento incluido hasta 20 km',
  'Garantía de 6 meses por escrito',
  'Herramientas y maquinaria propia',
  'Factura oficial con IVA',
  'Atención de urgencias disponible',
];

export function ManageRatesModal({
  visible,
  onClose,
  initialHourlyRate,
  initialSpecs,
  onRateUpdated,
}: ManageRatesModalProps) {
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();

  const specsStorageKey = `@yewi_pro_rate_specs_${user?.id || 'me'}`;
  const calloutStorageKey = `@yewi_pro_callout_fee_${user?.id || 'me'}`;

  // 1. Rate & Callout State
  const [hourlyRateText, setHourlyRateText] = useState<string>(
    initialHourlyRate ? String(initialHourlyRate) : ''
  );
  const [calloutFeeText, setCalloutFeeText] = useState<string>('');
  const [savingRate, setSavingRate] = useState(false);

  // 2. Dynamic Specifications State (added by professional, NOT static)
  const [specifications, setSpecifications] = useState<string[]>(initialSpecs || []);
  const [newSpecText, setNewSpecText] = useState('');
  const [savingSpecs, setSavingSpecs] = useState(false);

  // 3. Promotions State
  const [loadingPromos, setLoadingPromos] = useState(false);
  const [activePromo, setActivePromo] = useState<SellerPromotion | null>(null);
  const [creatingPromo, setCreatingPromo] = useState(false);
  const [deletingPromo, setDeletingPromo] = useState(false);

  // 4. Promo creation form (Dynamic, no static texts)
  const [isPermanent, setIsPermanent] = useState(false);
  const [selectedDurationDays, setSelectedDurationDays] = useState(15);
  const [selectedDiscountPercent, setSelectedDiscountPercent] = useState<number>(15);
  const [customDiscountText, setCustomDiscountText] = useState('');
  const [promoTitle, setPromoTitle] = useState('');
  const [promoDescription, setPromoDescription] = useState('');

  // Sync initial hourly rate
  useEffect(() => {
    if (initialHourlyRate !== undefined && initialHourlyRate !== null) {
      setHourlyRateText(String(initialHourlyRate));
    }
  }, [initialHourlyRate]);

  // Load specs, callout fee and promotions on open
  useEffect(() => {
    if (visible) {
      loadStoredSpecsAndRates();
      loadActivePromotion();
    }
  }, [visible]);

  const loadStoredSpecsAndRates = async () => {
    try {
      const [storedSpecs, storedCallout] = await Promise.all([
        AsyncStorage.getItem(specsStorageKey),
        AsyncStorage.getItem(calloutStorageKey),
      ]);

      if (storedSpecs) {
        try {
          const parsed = JSON.parse(storedSpecs);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSpecifications(parsed);
          }
        } catch {}
      } else if (initialSpecs && initialSpecs.length > 0) {
        setSpecifications(initialSpecs);
      } else if (user?.professionalProfile?.skills && user.professionalProfile.skills.length > 0) {
        setSpecifications(user.professionalProfile.skills);
      }

      if (storedCallout) {
        setCalloutFeeText(storedCallout);
      }
    } catch {}
  };

  const loadActivePromotion = async () => {
    try {
      setLoadingPromos(true);
      const myPromos = await promotionsApi.getMyPromotions();
      if (Array.isArray(myPromos) && myPromos.length > 0) {
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

  // Save Hourly Rate & Callout
  const handleSaveHourlyRate = async () => {
    const rateNum = parseFloat(hourlyRateText);
    if (isNaN(rateNum) || rateNum < 0) {
      toast.warning('Tarifa Inválida', 'Introduce un importe válido por hora.');
      return;
    }

    try {
      setSavingRate(true);
      await professionalsApi.updateMyProfile({
        hourlyRate: rateNum,
      });

      if (calloutFeeText.trim()) {
        await AsyncStorage.setItem(calloutStorageKey, calloutFeeText.trim());
      } else {
        await AsyncStorage.removeItem(calloutStorageKey);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      toast.success('Tarifa Guardada', `${rateNum} €/h actualizado correctamente.`);
      if (onRateUpdated) {
        onRateUpdated(rateNum, specifications);
      }
    } catch (err: any) {
      toast.error('Error al Guardar', err?.message || 'No se pudo actualizar la tarifa.');
    } finally {
      setSavingRate(false);
    }
  };

  // Add a new specification dynamically
  const handleAddSpecification = () => {
    const trimmed = newSpecText.trim();
    if (!trimmed) return;

    if (specifications.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.info('Especificación Existente', 'Ya has añadido esta especificación.');
      return;
    }

    const updated = [...specifications, trimmed];
    setSpecifications(updated);
    setNewSpecText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  // Add suggested specification
  const handleAddSuggestedSpec = (spec: string) => {
    if (specifications.some((s) => s.toLowerCase() === spec.toLowerCase())) {
      toast.info('Especificación Existente', 'Ya has añadido esta especificación.');
      return;
    }
    const updated = [...specifications, spec];
    setSpecifications(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  // Remove a specification
  const handleRemoveSpecification = (index: number) => {
    const updated = specifications.filter((_, idx) => idx !== index);
    setSpecifications(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  // Save Specifications persistently
  const handleSaveSpecifications = async () => {
    try {
      setSavingSpecs(true);
      await AsyncStorage.setItem(specsStorageKey, JSON.stringify(specifications));

      // Also persist to backend professional profile skills
      await professionalsApi.updateMyProfile({
        skills: specifications,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      toast.success('Especificaciones Guardadas', 'Tus condiciones y especificaciones han sido guardadas.');

      const rateNum = parseFloat(hourlyRateText);
      if (onRateUpdated && !isNaN(rateNum)) {
        onRateUpdated(rateNum, specifications);
      }
    } catch (err: any) {
      toast.error('Error', err?.message || 'No se pudieron guardar las especificaciones.');
    } finally {
      setSavingSpecs(false);
    }
  };

  // Create Promotion (Fully dynamic, no static texts)
  const handleCreatePromotion = async () => {
    const title = promoTitle.trim();
    if (!title) {
      toast.warning('Título Requerido', 'Introduce un título para tu oferta.');
      return;
    }

    const description = promoDescription.trim();
    if (!description) {
      toast.warning('Especificaciones Requeridas', 'Añade las especificaciones y condiciones del descuento.');
      return;
    }

    const effectivePercent = customDiscountText.trim()
      ? parseFloat(customDiscountText)
      : selectedDiscountPercent;

    if (isNaN(effectivePercent) || effectivePercent <= 0 || effectivePercent > 99) {
      toast.warning('Porcentaje Inválido', 'El porcentaje debe estar entre 1% y 99%.');
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
        title,
        description,
        discountPercent: effectivePercent,
        isPermanent,
        expiresAt,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      toast.success(
        'Oferta Publicada',
        `Descuento del ${effectivePercent}% activo con tus especificaciones.`
      );
      setActivePromo(created);
      setPromoTitle('');
      setPromoDescription('');
      setCustomDiscountText('');
    } catch (err: any) {
      toast.error('Error al Crear', err?.message || 'No se pudo publicar la promoción.');
    } finally {
      setCreatingPromo(false);
    }
  };

  // Delete active promotion
  const handleDeletePromotion = async () => {
    if (!activePromo) return;
    try {
      setDeletingPromo(true);
      await promotionsApi.deletePromotion(activePromo.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      toast.info('Oferta Retirada', 'La promoción ha sido desactivada.');
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
    <AppBottomSheet visible={visible} onClose={onClose} title="Tarifas y Especificaciones">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* SECTION 1: Hourly Rate & Minimum Callout */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="time-outline" size={20} color="#0284C7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Tarifa Base de Mano de Obra</Text>
              <Text style={[styles.sectionDesc, { color: subtextColor }]}>
                Precios orientativos visibles para clientes en presupuestos
              </Text>
            </View>
          </View>

          {/* Tarifa por hora */}
          <Text style={[styles.inputLabel, { color: textColor }]}>Tarifa por Hora (€/h)</Text>
          <View style={styles.rateInputRow}>
            <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor }]}>
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
              style={[styles.saveButton, { opacity: savingRate ? 0.7 : 1 }]}
            >
              {savingRate ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar</Text>
              )}
            </ThemedTouchable>
          </View>

          {/* Desplazamiento mínimo (opcional) */}
          <Text style={[styles.inputLabel, { color: textColor, marginTop: 12 }]}>
            Desplazamiento / Salida Mínima (Opcional)
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor }]}>
            <TextInput
              value={calloutFeeText}
              onChangeText={setCalloutFeeText}
              placeholder="Ej. 25"
              placeholderTextColor={subtextColor}
              keyboardType="numeric"
              style={[styles.rateInput, { color: textColor }]}
            />
            <Text style={[styles.currencySuffix, { color: subtextColor }]}>€</Text>
          </View>
        </View>

        {/* SECTION 2: Dynamic Rate Specifications (The pro adds their own specs, NOT static) */}
        <View style={[styles.sectionCard, { marginTop: 22 }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="list-outline" size={20} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Especificaciones y Condiciones
              </Text>
              <Text style={[styles.sectionDesc, { color: subtextColor }]}>
                Añade especificaciones sobre qué incluye tu servicio, garantías y condiciones
              </Text>
            </View>
          </View>

          {/* Add custom specification input */}
          <View style={styles.addSpecRow}>
            <View style={[styles.inputWrapper, { flex: 1, backgroundColor: inputBg, borderColor }]}>
              <TextInput
                value={newSpecText}
                onChangeText={setNewSpecText}
                placeholder="Escribe una especificación..."
                placeholderTextColor={subtextColor}
                returnKeyType="done"
                onSubmitEditing={handleAddSpecification}
                style={[styles.specTextInput, { color: textColor }]}
              />
            </View>
            <ThemedTouchable
              onPress={handleAddSpecification}
              haptic="medium"
              style={styles.addSpecBtn}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addSpecBtnText}>Añadir</Text>
            </ThemedTouchable>
          </View>

          {/* Quick suggestions pills */}
          <Text style={[styles.subSectionTitle, { color: subtextColor, marginTop: 12, marginBottom: 8 }]}>
            Sugerencias rápidas para añadir:
          </Text>
          <View style={styles.suggestedPillsWrap}>
            {SUGGESTED_SPECS.map((spec, idx) => {
              const isAdded = specifications.some((s) => s.toLowerCase() === spec.toLowerCase());
              return (
                <ThemedTouchable
                  key={idx}
                  onPress={() => handleAddSuggestedSpec(spec)}
                  disabled={isAdded}
                  haptic="light"
                  style={[
                    styles.suggestedPill,
                    {
                      backgroundColor: isAdded
                        ? (isDark ? 'rgba(5, 150, 105, 0.2)' : '#D1FAE5')
                        : (isDark ? '#27272A' : '#F4F4F5'),
                      borderColor: isAdded ? '#059669' : borderColor,
                      opacity: isAdded ? 0.6 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name={isAdded ? 'checkmark' : 'add'}
                    size={14}
                    color={isAdded ? '#059669' : subtextColor}
                  />
                  <Text
                    style={[
                      styles.suggestedPillText,
                      { color: isAdded ? '#059669' : textColor },
                    ]}
                  >
                    {spec}
                  </Text>
                </ThemedTouchable>
              );
            })}
          </View>

          {/* Current Active Specifications List */}
          {specifications.length > 0 ? (
            <View style={{ marginTop: 14 }}>
              <Text style={[styles.subSectionTitle, { color: textColor, marginBottom: 8 }]}>
                Tus especificaciones activas ({specifications.length}):
              </Text>
              <View style={styles.specsListContainer}>
                {specifications.map((spec, index) => (
                  <View
                    key={index}
                    style={[
                      styles.specRowItem,
                      {
                        backgroundColor: isDark ? '#1F2432' : '#F8FAFC',
                        borderColor: isDark ? '#2D3548' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Ionicons name="checkmark-circle" size={17} color="#059669" />
                    <Text style={[styles.specItemText, { color: textColor }]}>
                      {spec}
                    </Text>
                    <ThemedTouchable
                      onPress={() => handleRemoveSpecification(index)}
                      haptic="light"
                      style={styles.removeSpecBtn}
                    >
                      <Ionicons name="close-circle" size={18} color="#EF4444" />
                    </ThemedTouchable>
                  </View>
                ))}
              </View>

              {/* Save specifications button */}
              <ThemedTouchable
                onPress={handleSaveSpecifications}
                disabled={savingSpecs}
                haptic="medium"
                style={[styles.saveSpecsBtn, { opacity: savingSpecs ? 0.7 : 1 }]}
              >
                {savingSpecs ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.saveSpecsBtnText}>Guardar Especificaciones</Text>
                  </>
                )}
              </ThemedTouchable>
            </View>
          ) : (
            <View style={styles.emptySpecsBox}>
              <Text style={[styles.emptySpecsText, { color: subtextColor }]}>
                Aún no has añadido especificaciones personalizadas. Añade qué incluye tu tarifa o pulsa en las sugerencias superiores.
              </Text>
            </View>
          )}
        </View>

        {/* SECTION 3: Active or New Promotion (Dynamic, user-specified) */}
        <View style={[styles.sectionCard, { marginTop: 22 }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="pricetag" size={20} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Descuentos y Ofertas Especiales</Text>
              <Text style={[styles.sectionDesc, { color: subtextColor }]}>
                Aparece destacada en el Home y se aplica automáticamente en presupuestos
              </Text>
            </View>
          </View>

          {loadingPromos ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color="#0284C7" />
            </View>
          ) : activePromo ? (
            /* Active Promotion Display with Real User Specifications */
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

              {/* Real specification / description entered by professional */}
              {activePromo.description ? (
                <View
                  style={[
                    styles.promoDescBox,
                    {
                      backgroundColor: isDark ? '#181C26' : '#FFFFFF',
                      borderColor: isDark ? '#2D3548' : '#E0F2FE',
                    },
                  ]}
                >
                  <Text style={[styles.promoDescTitle, { color: subtextColor }]}>
                    Especificaciones de la oferta:
                  </Text>
                  <Text style={[styles.promoDescContent, { color: textColor }]}>
                    {activePromo.description}
                  </Text>
                </View>
              ) : null}

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
                    <Text style={styles.deletePromoText}>Eliminar Oferta</Text>
                  </>
                )}
              </ThemedTouchable>
            </View>
          ) : (
            /* Create Promotion Form (Dynamic, user defines title & custom specs) */
            <View style={styles.createPromoForm}>
              {/* Promo Title */}
              <Text style={[styles.fieldLabel, { color: textColor }]}>
                Título de la Oferta *
              </Text>
              <TextInput
                value={promoTitle}
                onChangeText={setPromoTitle}
                placeholder="Ej. Descuento Reformas Primavera"
                placeholderTextColor={subtextColor}
                style={[
                  styles.titleInput,
                  { backgroundColor: inputBg, borderColor, color: textColor },
                ]}
              />

              {/* Dynamic Specifications & Description of Offer */}
              <Text style={[styles.fieldLabel, { color: textColor, marginTop: 14 }]}>
                Especificaciones y Condiciones del Descuento *
              </Text>
              <TextInput
                value={promoDescription}
                onChangeText={setPromoDescription}
                placeholder="Especifica condiciones (ej. Aplicable en mano de obra para trabajos superiores a 250€. Materiales excluidos)..."
                placeholderTextColor={subtextColor}
                multiline
                numberOfLines={3}
                style={[
                  styles.multilineInput,
                  { backgroundColor: inputBg, borderColor, color: textColor },
                ]}
              />

              {/* Discount Percentage Pills + Custom Input */}
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
                      setCustomDiscountText('');
                    }}
                    haptic="light"
                    style={[
                      styles.percentPill,
                      selectedDiscountPercent === pct && !customDiscountText && styles.percentPillActive,
                      { borderColor },
                    ]}
                  >
                    <Text
                      style={[
                        styles.percentPillText,
                        selectedDiscountPercent === pct && !customDiscountText && styles.percentPillTextActive,
                        { color: selectedDiscountPercent === pct && !customDiscountText ? '#0284C7' : subtextColor },
                      ]}
                    >
                      {pct}%
                    </Text>
                  </ThemedTouchable>
                ))}
              </View>

              {/* Custom percentage input */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <Text style={{ fontSize: 12.5, fontFamily: 'PlusJakartaSans-Medium', color: subtextColor }}>
                  O introduce otro porcentaje:
                </Text>
                <View style={[styles.customPercentWrap, { backgroundColor: inputBg, borderColor }]}>
                  <TextInput
                    value={customDiscountText}
                    onChangeText={(txt) => {
                      setCustomDiscountText(txt);
                      const num = parseFloat(txt);
                      if (!isNaN(num)) setSelectedDiscountPercent(num);
                    }}
                    placeholder="Ej. 18"
                    placeholderTextColor={subtextColor}
                    keyboardType="numeric"
                    maxLength={2}
                    style={[styles.customPercentInput, { color: textColor }]}
                  />
                  <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-Bold', color: subtextColor }}>%</Text>
                </View>
              </View>

              {/* Promo Type: Permanente vs Temporal */}
              <Text style={[styles.fieldLabel, { color: textColor, marginTop: 16 }]}>Vigencia</Text>
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
    paddingBottom: 32,
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
    lineHeight: 17,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-SemiBold',
    marginBottom: 6,
  },
  subSectionTitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  rateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputWrapper: {
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
  addSpecRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  specTextInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  addSpecBtn: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addSpecBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  suggestedPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  suggestedPillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  specsListContainer: {
    gap: 8,
  },
  specRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  specItemText: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans-Medium',
    lineHeight: 18,
  },
  removeSpecBtn: {
    padding: 3,
  },
  saveSpecsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#059669',
    marginTop: 12,
  },
  saveSpecsBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  emptySpecsBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#9CA3AF',
    marginTop: 8,
  },
  emptySpecsText: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-Regular',
    textAlign: 'center',
    lineHeight: 17,
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
  promoDescBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  promoDescTitle: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  promoDescContent: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Medium',
    lineHeight: 18,
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
  customPercentWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    width: 70,
  },
  customPercentInput: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
  },
  titleInput: {
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  multilineInput: {
    minHeight: 74,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans-Medium',
    textAlignVertical: 'top',
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
