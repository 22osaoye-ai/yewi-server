import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, Flame, Send, Sparkles } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shadows } from '../../src/components/Theme';
import { useToast } from '../../src/components/Toast';
import { AppBudgetSlider } from '../../src/components/ui/AppBudgetSlider';
import { AppButton } from '../../src/components/ui/AppButton';
import { AppInput } from '../../src/components/ui/AppInput';
import { AppSwitch } from '../../src/components/ui/AppSwitch';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/services/api';
import { Category } from '../../src/types';

export default function NewRequestScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showToast } = useToast();
  const { colors, isDark } = useTheme();

  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('Zaragoza');
  const [postalCode, setPostalCode] = useState('50001');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res: any = await api.get('/categories/tree');
      return res.data || res || [];
    },
  });

  const handleSubmit = async () => {
    if (!categoryId || !title.trim() || !description.trim() || !city.trim() || !postalCode.trim()) {
      showToast({
        type: 'error',
        title: 'Campos requeridos',
        message: 'Por favor selecciona la categoría y completa la descripción de tu proyecto.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const res: any = await api.post('/leads/requests', {
        categoryId,
        title: title.trim(),
        description: description.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        country: 'ES',
        latitude: 41.6488,
        longitude: -0.8891,
        isUrgent,
        budgetMin: budgetMin ? parseFloat(budgetMin) : undefined,
        budgetMax: budgetMax ? parseFloat(budgetMax) : undefined,
        questionnaireAnswers: {
          urgency: isUrgent ? 'Urgente' : 'Normal',
        },
      });

      showToast({
        type: 'success',
        title: '¡Solicitud Publicada!',
        message: 'Los profesionales de Zaragoza han sido notificados.',
      });

      router.replace('/(client)/requests');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al publicar la solicitud.';
      showToast({
        type: 'error',
        title: 'Error de Publicación',
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: 16,
              paddingBottom: Math.max(insets.bottom + 60, 80),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Publicar Solicitud de Servicio
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Recibe hasta 5 presupuestos de profesionales verificados en Zaragoza
            </Text>
          </View>

          {/* Selector de Categoría */}
          <Text style={[styles.label, { color: colors.text }]}>
            1. Selecciona la Categoría *
          </Text>
          {isLoadingCategories ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 10 }} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryPicker}
            >
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catOption,
                      {
                        backgroundColor: isSelected ? colors.text : colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setCategoryId(cat.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.catOptionText,
                        {
                          color: isSelected
                            ? (isDark ? '#111813' : '#FFFFFF')
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Formulario using AppInput & AppButton */}
          <View
            style={[
              styles.formSection,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <AppInput
              label="2. ¿Qué necesitas hacer? *"
              placeholder="Ej. Reparación de caldera o fuga en baño"
              value={title}
              onChangeText={setTitle}
            />

            <AppInput
              label="3. Detalles y Requerimientos *"
              placeholder="Describe el trabajo, medidas, materiales requeridos..."
              multiline
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <AppInput
                  label="Ciudad *"
                  placeholder="Zaragoza"
                  value={city}
                  onChangeText={setCity}
                />
              </View>

              <View style={{ flex: 1 }}>
                <AppInput
                  label="Código Postal *"
                  placeholder="50001"
                  keyboardType="number-pad"
                  value={postalCode}
                  onChangeText={setPostalCode}
                />
              </View>
            </View>

            {/* Slider de Presupuesto Estimado */}
            <AppBudgetSlider
              min={20}
              max={1500}
              minValue={parseInt(budgetMin, 10) || 50}
              maxValue={parseInt(budgetMax, 10) || 200}
              onRangeChange={(newMin, newMax) => {
                setBudgetMin(newMin.toString());
                setBudgetMax(newMax.toString());
              }}
            />

            {/* Toggle de Urgencia */}
            <View
              style={[
                styles.urgentRow,
                { backgroundColor: colors.surfaceWarm, borderColor: colors.border },
              ]}
            >
              <View style={styles.urgentTextWrap}>
                <Flame size={20} color={isUrgent ? colors.danger : colors.textSecondary} />
                <View>
                  <Text style={[styles.urgentTitle, { color: colors.text }]}>
                    ¿Es un trabajo urgente?
                  </Text>
                  <Text style={[styles.urgentSubtitle, { color: colors.textSecondary }]}>
                    Avisa a profesionales con disponibilidad inmediata
                  </Text>
                </View>
              </View>
              <AppSwitch
                value={isUrgent}
                onValueChange={setIsUrgent}
                activeColor={colors.danger}
                inActiveColor={colors.border}
              />
            </View>

            <AppButton
              title="Publicar Solicitud Gratis"
              onPress={handleSubmit}
              isLoading={isSubmitting}
              leftIcon={<Send size={16} color={isDark ? '#111813' : '#FFFFFF'} />}
              containerStyle={{ marginTop: 8 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 4,
  },
  categoryPicker: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    marginBottom: 14,
  },
  catOption: {
    borderRadius: 9999,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  catOptionText: {
    fontSize: 13,
    fontWeight: '800',
  },
  formSection: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    marginTop: 4,
    ...Shadows.subtle,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  urgentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 20,
    padding: 14,
    marginVertical: 12,
    borderWidth: 1,
  },
  urgentTextWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  urgentTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  urgentSubtitle: {
    fontSize: 11,
  },
});
