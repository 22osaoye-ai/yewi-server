import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from './ThemedTouchable';
import { AuthInput } from '@/components/auth/AuthInput';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { CATEGORIES_LIST } from '@/constants/categories';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUserRole } from '@/hooks/useUserRole';
import { leadsApi } from '@/services/leadsApi';
import { toast } from '@/store/useToastStore';

interface PublishProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (project: any) => void;
}

export function PublishProjectModal({ visible, onClose, onSuccess }: PublishProjectModalProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { user, isAuthenticated, isProfessional } = useUserRole();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Baños');
  const [price, setPrice] = useState('200');
  const [deliveryDays, setDeliveryDays] = useState('5');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState(user?.city || 'Zaragoza');
  const [submitting, setSubmitting] = useState(false);

  const handleNextStep = () => {
    if (!isAuthenticated) {
      toast.warning('Autenticación Requerida', 'Debes iniciar sesión para publicar un proyecto.');
      onClose();
      router.replace('/auth/login');
      return;
    }

    if (step === 1) {
      if (!title.trim()) {
        toast.warning('Título Obligatorio', 'Introduce un título para tu proyecto o servicio.');
        return;
      }
      setStep(2);
      Haptics.selectionAsync().catch(() => {});
      return;
    }

    if (step === 2) {
      if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
        toast.warning('Precio Inválido', 'Introduce el precio o tarifa en euros.');
        return;
      }
      if (!deliveryDays.trim() || isNaN(Number(deliveryDays)) || Number(deliveryDays) <= 0) {
        toast.warning('Plazo Inválido', 'Indica el número estimado de días para completar el trabajo.');
        return;
      }
      setStep(3);
      Haptics.selectionAsync().catch(() => {});
      return;
    }

    if (step === 3) {
      if (!description.trim() || description.trim().length < 15) {
        toast.warning('Descripción Detallada', 'Describe detalladamente qué incluye tu proyecto (mínimo 15 caracteres).');
        return;
      }
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.warning('Autenticación Requerida', 'Debes iniciar sesión para publicar un proyecto.');
      onClose();
      router.replace('/auth/login');
      return;
    }

    if (isProfessional) {
      toast.error('Acceso Denegado', 'Los profesionales no pueden crear solicitudes de trabajo.');
      onClose();
      return;
    }

    setSubmitting(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      const created = await leadsApi.createRequest({
        title: title.trim(),
        category: selectedCategory,
        categoryId: selectedCategory,
        budgetEstimated: parseFloat(price) || undefined,
        budgetMax: parseFloat(price) || undefined,
        description: description.trim(),
        city: city.trim() || user?.city || 'Zaragoza',
        postalCode: user?.postalCode || '50001',
      });

      toast.success(
        '¡Solicitud Publicada!',
        'Los profesionales de tu zona recibirán tu solicitud y te enviarán presupuestos con custodia Escrow.'
      );

      setTitle('');
      setDescription('');
      setPrice('150');
      setDeliveryDays('3');
      setStep(1);
      onClose();

      if (onSuccess && created) {
        onSuccess(created);
      }
      router.push('/(tabs)/requests');
    } catch (e: any) {
      toast.error('Error al Publicar', e.message || 'No se pudo publicar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={{
            flex: 1,
            paddingTop: Math.max(insets.top + 8, 20),
            paddingHorizontal: 22,
            paddingBottom: Math.max(insets.bottom + 16, 24),
            justifyContent: 'space-between',
          }}
        >
          {/* Top Stepper Header */}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text numberOfLines={1} style={{ fontSize: 20, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.textPrimary }}>
                  Pedir Servicio
                </Text>
                <Text numberOfLines={1} style={{ fontSize: 12.5, fontFamily: 'PlusJakartaSans-Medium', color: colors.textSecondary, marginTop: 1 }}>
                  Paso {step} de 3 · {step === 1 ? 'Trabajo y Categoría' : step === 2 ? 'Presupuesto Estimado' : 'Detalles y Zona'}
                </Text>
              </View>

              <ThemedTouchable onPress={onClose} haptic="light">
                <Ionicons name="close-circle" size={26} color={colors.textMuted} />
              </ThemedTouchable>
            </View>

            {/* Stepper Progress Bar & Indicators */}
            <View style={{ marginBottom: 22 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                {[1, 2, 3].map((s) => {
                  const isCompleted = s < step;
                  const isCurrent = s === step;
                  return (
                    <View
                      key={s}
                      style={{
                        flex: 1,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: isCompleted || isCurrent ? colors.primary : isDark ? '#27272A' : '#E4E4E7',
                        opacity: isCurrent ? 1 : isCompleted ? 0.8 : 0.45,
                      }}
                    />
                  );
                })}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 }}>
                {[
                  { stepNum: 1, label: 'Básico' },
                  { stepNum: 2, label: 'Tarifa' },
                  { stepNum: 3, label: 'Detalles' },
                ].map((item) => (
                  <Text
                    key={item.stepNum}
                    style={{
                      fontSize: 11,
                      fontFamily: item.stepNum === step ? 'PlusJakartaSans-Bold' : 'PlusJakartaSans-Medium',
                      color: item.stepNum === step ? colors.primary : colors.textMuted,
                    }}
                  >
                    {item.label}
                  </Text>
                ))}
              </View>
            </View>
          </View>

          {/* Stepper Step Content - NO SCROLL NEEDED */}
          <View style={{ flex: 1, justifyContent: 'center' }}>
            {step === 1 && (
              <View>
                <AuthInput
                  label="¿Qué necesitas reparar o hacer? *"
                  placeholder="Ej: Reparar fuga en tubería de cocina"
                  value={title}
                  onChangeText={setTitle}
                  iconName="construct-outline"
                />

                <Text
                  style={{
                    fontSize: 13.5,
                    fontFamily: 'PlusJakartaSans-Bold',
                    color: colors.textPrimary,
                    marginTop: 10,
                    marginBottom: 10,
                  }}
                >
                  Categoría del Servicio *
                </Text>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {CATEGORIES_LIST.slice(0, 8).map((cat) => (
                    <CategoryChip
                      key={cat.id}
                      label={cat.name}
                      isSelected={selectedCategory === cat.name}
                      onPress={() => setSelectedCategory(cat.name)}
                    />
                  ))}
                </View>
              </View>
            )}

            {step === 2 && (
              <View>
                <AuthInput
                  label="Precio / Tarifa Cerrada (€) *"
                  placeholder="200"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  iconName="cash-outline"
                  hint="Importe final en euros que cobrarás por este proyecto"
                />

                <AuthInput
                  label="Plazo Estimado de Entrega (Días) *"
                  placeholder="5"
                  value={deliveryDays}
                  onChangeText={setDeliveryDays}
                  keyboardType="numeric"
                  iconName="time-outline"
                  hint="Número de días laborales estimados para finalizar el trabajo"
                />

                {parseFloat(price) > 0 && (
                  <View
                    style={{
                      backgroundColor: isDark ? '#1C1E26' : '#F8FAFC',
                      borderRadius: 14,
                      padding: 14,
                      marginTop: 10,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                      <Text style={{ fontSize: 12.5, fontFamily: 'PlusJakartaSans-Regular', color: colors.textSecondary }}>
                        Precio del servicio:
                      </Text>
                      <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-Bold', color: colors.textPrimary }}>
                        {(parseFloat(price) || 0).toFixed(2)} €
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ fontSize: 12.5, fontFamily: 'PlusJakartaSans-Regular', color: colors.textSecondary }}>
                        Comisión Yewi (15%):
                      </Text>
                      <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-Bold', color: colors.textMuted }}>
                        -{((parseFloat(price) || 0) * 0.15).toFixed(2)} €
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: 7,
                        borderTopWidth: 1,
                        borderTopColor: colors.borderSubtle,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Ionicons name="shield-checkmark" size={15} color="#10B981" />
                        <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.textPrimary }}>
                          Cobro Neto Custodiado:
                        </Text>
                      </View>
                      <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#10B981' }}>
                        {((parseFloat(price) || 0) * 0.85).toFixed(2)} €
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {step === 3 && (
              <View>
                <AuthInput
                  label="Descripción del Trabajo *"
                  placeholder="Describe qué materiales incluye, qué tareas realizarás y las condiciones..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  hint="Mínimo 15 caracteres. Sé claro y profesional."
                />

                <AuthInput
                  label="Localidad o Ciudad de Servicio *"
                  placeholder="Ej: Zaragoza"
                  value={city}
                  onChangeText={setCity}
                  iconName="location-outline"
                />
              </View>
            )}
          </View>

          {/* Fixed Footer with 100% Rounded Pill Buttons */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: colors.borderSubtle,
            }}
          >
            {step > 1 && (
              <ThemedTouchable
                onPress={() => {
                  setStep((prev) => (prev > 1 ? ((prev - 1) as any) : 1));
                  Haptics.selectionAsync().catch(() => {});
                }}
                haptic="light"
                style={{
                  height: 50,
                  paddingHorizontal: 22,
                  borderRadius: 999,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 14.5, fontFamily: 'PlusJakartaSans-Bold', color: colors.textPrimary }}>
                  Atrás
                </Text>
              </ThemedTouchable>
            )}

            <ThemedTouchable
              onPress={handleNextStep}
              disabled={submitting}
              haptic="medium"
              style={{
                flex: 1,
                height: 50,
                borderRadius: 999,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text numberOfLines={1} style={{ color: '#FFFFFF', fontSize: 15, fontFamily: 'PlusJakartaSans-Bold' }}>
                  {step === 3 ? 'Publicar' : 'Siguiente'}
                </Text>
              )}
            </ThemedTouchable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
