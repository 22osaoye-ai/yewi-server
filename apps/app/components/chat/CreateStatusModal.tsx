import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuthStore } from '@/store/useAuthStore';
import { useRealtimeStore } from '@/store/useRealtimeStore';
import { statusesApi } from '@/services/statusesApi';
import { paymentsApi } from '@/services/paymentsApi';
import { toast } from '@/store/useToastStore';

interface CreateStatusModalProps {
  visible: boolean;
  onClose: () => void;
  onStatusCreated: () => void;
}

export function CreateStatusModal({
  visible,
  onClose,
  onStatusCreated,
}: CreateStatusModalProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();
  const subscription = useRealtimeStore((state) => state.subscription);

  const [isPro, setIsPro] = useState(
    Boolean(
      user?.isPro ||
      (user as any)?.professionalProfile?.isPro ||
      subscription?.isPro ||
      subscription?.subscription?.status === 'ACTIVE' ||
      subscription?.subscription?.status === 'TRIALING'
    )
  );

  useEffect(() => {
    if (visible && user?.id) {
      const currentPro = Boolean(
        user?.isPro ||
        (user as any)?.professionalProfile?.isPro ||
        subscription?.isPro ||
        subscription?.subscription?.status === 'ACTIVE' ||
        subscription?.subscription?.status === 'TRIALING'
      );
      setIsPro(currentPro);

      paymentsApi
        .getSubscriptionStatus()
        .then((subData) => {
          const hasPro = Boolean(
            subData?.isPro ||
            subData?.subscription?.status === 'ACTIVE' ||
            subData?.subscription?.status === 'TRIALING'
          );
          if (hasPro) {
            setIsPro(true);
            if (!user.isPro) {
              useAuthStore.getState().updateUser({ isPro: true });
            }
          }
        })
        .catch(() => {});
    }
  }, [visible, user?.id]);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const asset = result.assets[0];
        const uri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setSelectedImage(uri);
      }
    } catch {
      toast.error('Error', 'No se pudo seleccionar la imagen.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        toast.error('Permiso Denegado', 'Se requiere acceso a la cámara.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const asset = result.assets[0];
        const uri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setSelectedImage(uri);
      }
    } catch {
      toast.error('Error', 'No se pudo abrir la cámara.');
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage && !caption.trim()) {
      toast.error('Estado Vacío', 'Por favor selecciona una foto o escribe un mensaje.');
      return;
    }

    try {
      setIsSubmitting(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      await statusesApi.createStatus({
        mediaUrl: selectedImage || undefined,
        mediaType: selectedImage ? 'IMAGE' : 'TEXT',
        caption: caption.trim() || undefined,
        backgroundColor: '#C87D20',
      });

      toast.success('¡Estado Publicado!', 'Tu estado estará visible durante 24 horas para todos los clientes.');
      setSelectedImage(null);
      setCaption('');
      onStatusCreated();
      onClose();
    } catch (err: any) {
      toast.error('Error al Publicar', err.message || 'No se pudo publicar el estado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToPro = () => {
    onClose();
    router.push('/subscription');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <View
          style={[
            styles.container,
            {
              paddingTop: Math.max(insets.top + 8, 20),
              paddingBottom: Math.max(insets.bottom + 16, 24),
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                {isPro ? 'Publicar Estado' : 'Estados Yewi Pro'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {isPro
                  ? 'Comparte tus trabajos recientes por 24 horas'
                  : 'Exclusivo para profesionales verificados'}
              </Text>
            </View>

            <ThemedTouchable onPress={onClose} haptic="light">
              <Ionicons name="close-circle" size={26} color={colors.textMuted} />
            </ThemedTouchable>
          </View>

          {!isPro ? (
            /* Yewi Pro Paywall / Explanation for non-pro users */
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.proWallContent}
            >
              <View
                style={[
                  styles.proBadgeBig,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Ionicons name="star" size={40} color={colors.primary} />
              </View>

              <Text style={[styles.proWallTitle, { color: colors.textPrimary }]}>
                Publica Estados con Yewi Pro
              </Text>

              <Text style={[styles.proWallDescription, { color: colors.textSecondary }]}>
                Los estados de 24 horas permiten a los profesionales mostrar sus reformas, acabados y ofertas directamente en la barra superior del Home a miles de clientes activos.
              </Text>

              <View style={styles.benefitsList}>
                <View style={styles.benefitRow}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={[styles.benefitText, { color: colors.textPrimary }]}>
                    Aparece destacado en la barra de historias del Home
                  </Text>
                </View>
                <View style={styles.benefitRow}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={[styles.benefitText, { color: colors.textPrimary }]}>
                    Recibe respuestas y mensajes directos de clientes interesados
                  </Text>
                </View>
                <View style={styles.benefitRow}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={[styles.benefitText, { color: colors.textPrimary }]}>
                    Presupuestos ilimitados y sello de Profesional Verificado
                  </Text>
                </View>
              </View>

              <ThemedTouchable
                onPress={handleGoToPro}
                haptic="medium"
                style={[styles.proUpgradeBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.proUpgradeBtnText}>
                  Descubrir Yewi Pro
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </ThemedTouchable>
            </ScrollView>
          ) : (
            /* Creation Form for Pro Sellers */
            <ScrollView
              style={{ flex: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 16 }}
            >
              {/* Media Picker Box */}
              {selectedImage ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: selectedImage }} style={styles.previewImage} contentFit="cover" />
                  <ThemedTouchable
                    onPress={() => setSelectedImage(null)}
                    haptic="medium"
                    style={styles.removeImageBtn}
                  >
                    <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                  </ThemedTouchable>
                </View>
              ) : (
                <View style={styles.pickerButtonsRow}>
                  <ThemedTouchable
                    onPress={handleTakePhoto}
                    haptic="light"
                    style={[styles.mediaOptionBtn, { backgroundColor: isDark ? '#1F2432' : '#F1F5F9', borderColor: colors.border }]}
                  >
                    <Ionicons name="camera-outline" size={32} color={colors.primary} />
                    <Text style={[styles.mediaOptionText, { color: colors.textPrimary }]}>
                      Tomar Foto
                    </Text>
                  </ThemedTouchable>

                  <ThemedTouchable
                    onPress={handlePickImage}
                    haptic="light"
                    style={[styles.mediaOptionBtn, { backgroundColor: isDark ? '#1F2432' : '#F1F5F9', borderColor: colors.border }]}
                  >
                    <Ionicons name="images-outline" size={32} color={colors.primary} />
                    <Text style={[styles.mediaOptionText, { color: colors.textPrimary }]}>
                      Galería
                    </Text>
                  </ThemedTouchable>
                </View>
              )}

              {/* Caption Input */}
              <View style={{ marginTop: 18, marginBottom: 24 }}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                  Pie de foto o descripción
                </Text>
                <TextInput
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="Ej: Cambio de cuadro eléctrico terminado hoy en Zaragoza..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  style={[
                    styles.captionTextInput,
                    {
                      backgroundColor: isDark ? '#1E2330' : '#F8FAFC',
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                />
              </View>

              {/* Submit Button */}
              <ThemedTouchable
                onPress={handleSubmit}
                disabled={isSubmitting}
                haptic="medium"
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: isSubmitting ? 0.7 : 1,
                  },
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="send" size={18} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Publicar Estado</Text>
                  </>
                )}
              </ThemedTouchable>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Satoshi-Black',
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontFamily: 'Satoshi-Medium',
    marginTop: 2,
  },
  proWallContent: {
    paddingHorizontal: 24,
    paddingTop: 30,
    alignItems: 'center',
  },
  proBadgeBig: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  proWallTitle: {
    fontSize: 22,
    fontFamily: 'Satoshi-Black',
    textAlign: 'center',
    marginBottom: 8,
  },
  proWallDescription: {
    fontSize: 14,
    fontFamily: 'Satoshi-Regular',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  benefitsList: {
    width: '100%',
    gap: 12,
    marginBottom: 30,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: 'Satoshi-Medium',
  },
  proUpgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 52,
    borderRadius: 26,
  },
  proUpgradeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Satoshi-Bold',
  },
  pickerButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaOptionBtn: {
    flex: 1,
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mediaOptionText: {
    fontSize: 13,
    fontFamily: 'Satoshi-Bold',
  },
  previewContainer: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 13.5,
    fontFamily: 'Satoshi-Bold',
    marginBottom: 6,
  },
  captionTextInput: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    fontSize: 14,
    fontFamily: 'Satoshi-Regular',
    minHeight: 90,
    textAlignVertical: 'top',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 25,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Satoshi-Bold',
  },
});
