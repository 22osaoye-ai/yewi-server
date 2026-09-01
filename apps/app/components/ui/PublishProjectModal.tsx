import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from './ThemedTouchable';
import { AuthInput } from '@/components/auth/AuthInput';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { CATEGORIES_LIST } from '@/constants/categories';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuthStore } from '@/store/useAuthStore';
import { gigsApi, GigDetail } from '@/services/gigsApi';
import { toast } from '@/store/useToastStore';

interface PublishProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (project: GigDetail) => void;
}

export function PublishProjectModal({ visible, onClose, onSuccess }: PublishProjectModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();

  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Baños');
  const [price, setPrice] = useState('200');
  const [deliveryDays, setDeliveryDays] = useState('5');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState(user?.city || 'Zaragoza');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.warning('Título Obligatorio', 'Introduce un título para tu proyecto o servicio.');
      return;
    }

    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      toast.warning('Precio Inválido', 'Introduce el precio o tarifa en euros.');
      return;
    }

    if (!deliveryDays.trim() || isNaN(Number(deliveryDays)) || Number(deliveryDays) <= 0) {
      toast.warning('Plazo Inválido', 'Indica el número estimado de días para completar el trabajo.');
      return;
    }

    if (!description.trim() || description.trim().length < 15) {
      toast.warning('Descripción Detallada', 'Describe detalladamente qué incluye tu proyecto (mínimo 15 caracteres).');
      return;
    }

    setSubmitting(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      const created = await gigsApi.create({
        title: title.trim(),
        category: selectedCategory,
        price: parseFloat(price),
        deliveryDays: parseInt(deliveryDays, 10),
        description: description.trim(),
        city: city.trim() || user?.city || 'Zaragoza',
      });

      toast.success(
        '¡Proyecto Publicado!',
        'Tu proyecto está activo y visible para que los clientes te contacten directamente.'
      );

      setTitle('');
      setDescription('');
      setPrice('200');
      setDeliveryDays('5');
      onClose();

      if (onSuccess && created) {
        onSuccess(created);
      }
    } catch (e: any) {
      toast.error('Error al Publicar', e.message || 'No se pudo publicar el proyecto.');
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
            paddingBottom: Math.max(insets.bottom + 16, 24),
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 22,
              paddingBottom: 14,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderSubtle,
            }}
          >
            <View>
              <Text style={{ fontSize: 20, fontFamily: 'Satoshi-Black', color: colors.textPrimary }}>
                Publicar Proyecto / Servicio
              </Text>
              <Text style={{ fontSize: 12.5, fontFamily: 'Satoshi-Medium', color: colors.textSecondary, marginTop: 2 }}>
                Ofrece un trabajo a precio cerrado para clientes de tu zona
              </Text>
            </View>

            <ThemedTouchable onPress={onClose} haptic="light">
              <Ionicons name="close-circle" size={26} color={colors.textMuted} />
            </ThemedTouchable>
          </View>

          {/* Form Body */}
          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 24 }}
          >
            {/* Title */}
            <AuthInput
              label="Título del Proyecto *"
              placeholder="Ej: Cambio de baldosas de baño"
              value={title}
              onChangeText={setTitle}
              iconName="construct-outline"
            />

            {/* Category Selector Chips */}
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Satoshi-Bold',
                color: colors.textPrimary,
                marginTop: 14,
                marginBottom: 8,
              }}
            >
              Categoría del Servicio *
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {CATEGORIES_LIST.map((cat) => (
                <CategoryChip
                  key={cat.id}
                  label={cat.name}
                  isSelected={selectedCategory === cat.name}
                  onPress={() => setSelectedCategory(cat.name)}
                />
              ))}
            </View>

            {/* Price & Delivery Days */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <AuthInput
                  label="Precio Total (€) *"
                  placeholder="200"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  iconName="cash-outline"
                />
              </View>

              <View style={{ flex: 1 }}>
                <AuthInput
                  label="Plazo (Días) *"
                  placeholder="5"
                  value={deliveryDays}
                  onChangeText={setDeliveryDays}
                  keyboardType="numeric"
                  iconName="time-outline"
                />
              </View>
            </View>

            {/* City */}
            <AuthInput
              label="Localidad / Cobertura"
              placeholder="Ej: Zaragoza y alrededores"
              value={city}
              onChangeText={setCity}
              iconName="location-outline"
            />

            {/* Description */}
            <View style={{ marginTop: 14 }}>
              <AuthInput
                label="Detalles de lo que incluye *"
                placeholder="Explica qué materiales aportas, metros cuadrados incluidos, saneamiento, preparación y garantía por escrito..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                style={{ minHeight: 110, textAlignVertical: 'top' }}
                iconName="document-text-outline"
              />
            </View>
          </ScrollView>

          {/* Submit Footer */}
          <View style={{ paddingHorizontal: 22, paddingTop: 10 }}>
            <ThemedTouchable
              onPress={handleSubmit}
              disabled={submitting}
              haptic="medium"
              style={{
                height: 52,
                borderRadius: 999,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="rocket-outline" size={18} color="#FFFFFF" />
                  <Text style={{ fontSize: 15, fontFamily: 'Satoshi-Bold', color: '#FFFFFF' }}>
                    Confirmar y Publicar Proyecto
                  </Text>
                </>
              )}
            </ThemedTouchable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
