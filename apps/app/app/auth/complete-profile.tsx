import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '@clerk/expo';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { AuthInput } from '@/components/auth/AuthInput';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { AuthButton } from '@/components/auth/AuthButton';
import { AuthRoleSelector, UserAuthRole } from '@/components/auth/AuthRoleSelector';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { CustomAlert } from '@/components/ui/CustomAlert';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { CATEGORIES_LIST } from '@/constants/categories';
import { useAuthStore } from '@/store/useAuthStore';
import { authService } from '@/services/authService';
import { useAppTheme } from '@/hooks/useAppTheme';
import { translateClerkError } from '@/utils/clerkErrorTranslator';
import {
  validatePhoneNumber,
  getCountryByCodeOrPrefix,
  SupportedCountry,
} from '@/constants/countryPhoneConfig';

export default function CompleteProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { user: clerkUser } = useUser();
  const { user: authUser, setNeedsProfileCompletion, setHasSeenOnboarding } = useAuthStore();

  const [step, setStep] = useState<number>(1);
  const [role, setRole] = useState<UserAuthRole>(
    authUser?.roles?.includes('PROFESSIONAL') ? 'PROFESSIONAL' : 'CLIENT'
  );
  const [firstName, setFirstName] = useState(authUser?.firstName || clerkUser?.firstName || '');
  const [lastName, setLastName] = useState(authUser?.lastName || clerkUser?.lastName || '');
  const [countryCode, setCountryCode] = useState<'ES' | 'FR' | 'GB'>(
    getCountryByCodeOrPrefix(authUser?.country).code
  );
  const [phoneNumber, setPhoneNumber] = useState(
    authUser?.phoneNumber && !authUser.phoneNumber.includes('@')
      ? authUser.phoneNumber.replace(/^\+34|^\+33|^\+44/, '').trim()
      : (clerkUser?.primaryPhoneNumber?.phoneNumber || '').replace(/^\+34|^\+33|^\+44/, '').trim()
  );
  const [phoneError, setPhoneError] = useState('');
  
  // Spanish Location Hierarchy: C.A. -> Provincia -> Localidad / Ciudad -> Código Postal -> Dirección
  const [country, setCountry] = useState(authUser?.country || 'España');
  const [region, setRegion] = useState(authUser?.region || 'Aragón');
  const [province, setProvince] = useState(authUser?.province || 'Zaragoza');
  const [city, setCity] = useState(authUser?.city || authUser?.professionalProfile?.address?.city || 'Zaragoza');
  const [postalCode, setPostalCode] = useState(authUser?.postalCode || '50001');
  const [address, setAddress] = useState(authUser?.address || '');

  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    authUser?.professionalProfile?.skills || ['Electricidad']
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const totalSteps = role === 'PROFESSIONAL' ? 4 : 3;

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ visible: true, title, message });
  };

  const handlePhoneChange = (text: string) => {
    let cleaned = text.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('+34')) {
      const digits = cleaned.slice(3).replace(/[^0-9]/g, '').slice(0, 9);
      setPhoneNumber(`+34 ${digits}`);
    } else {
      const digits = cleaned.replace(/[^0-9]/g, '').slice(0, 9);
      setPhoneNumber(digits);
    }
  };

  const handlePostalCodeChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '').slice(0, 5);
    setPostalCode(digits);
  };

  const validateSpanishPhone = (phone: string): boolean => {
    const cleanDigits = phone.replace(/[\s\-().]/g, '').replace(/^(\+34|0034)/, '');
    return /^[6789]\d{8}$/.test(cleanDigits);
  };

  const validateSpanishPostalCode = (cp: string): boolean => {
    const clean = cp.trim();
    return /^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/.test(clean);
  };

  const handleDetectGPSLocation = async () => {
    try {
      setIsDetectingLocation(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permiso de Ubicación', 'Por favor habilita el permiso de ubicación para autocompletar tu zona.');
        setIsDetectingLocation(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      if (geo) {
        if (geo.country) setCountry(geo.country);
        if (geo.region) setRegion(geo.region);
        if (geo.subregion || geo.region) setProvince(geo.subregion || geo.region || 'Zaragoza');
        if (geo.city || geo.district) setCity(geo.city || geo.district || 'Zaragoza');
        if (geo.postalCode) setPostalCode(geo.postalCode.slice(0, 5));
        if (geo.street) setAddress(`${geo.street}${geo.streetNumber ? ` ${geo.streetNumber}` : ''}`);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } catch (e: any) {
      console.warn('GPS location error:', e);
      showAlert('Aviso de GPS', 'No se pudo obtener la ubicación exacta. Puedes introducir tus datos manualmente.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!firstName.trim()) {
        showAlert('Nombre requerido', 'Por favor introduce tu nombre.');
        return;
      }
      if (phoneNumber.trim()) {
        const countryConfig = getCountryByCodeOrPrefix(countryCode);
        const check = validatePhoneNumber(countryCode, countryConfig.prefix, phoneNumber);
        if (!check.isValid) {
          setPhoneError(check.message || 'Teléfono no válido.');
          showAlert('Teléfono Inválido', check.message || 'Por favor verifica el número de teléfono.');
          return;
        }
        setPhoneError('');
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      if (!city.trim()) {
        showAlert('Localidad requerida', 'Por favor introduce tu localidad o municipio.');
        return;
      }
      if (!validateSpanishPostalCode(postalCode)) {
        showAlert(
          'Código Postal no válido',
          'El código postal en España debe constar de 5 dígitos válidos (entre 01000 y 52999, ej. 50001).'
        );
        return;
      }

      if (role === 'CLIENT') {
        handleSave();
        return;
      }

      setStep(4);
      return;
    }

    if (step === 4) {
      handleSave();
      return;
    }

    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      const countryConfig = getCountryByCodeOrPrefix(countryCode);
      const cleanPhone = phoneNumber.trim()
        ? validatePhoneNumber(countryCode, countryConfig.prefix, phoneNumber).e164 || phoneNumber.trim()
        : '';

      // 1. Actualizar perfil y ubicación en el backend de NestJS
      await authService.updateProfile({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phoneNumber: cleanPhone || undefined,
        country: countryConfig.name,
        region: region.trim() || undefined,
        province: province.trim() || undefined,
        city: city.trim(),
        postalCode: postalCode.trim(),
        address: address.trim() || undefined,
      });

      // 2. Actualizar metadatos de Clerk si está disponible
      if (clerkUser) {
        try {
          await clerkUser.update({
            unsafeMetadata: {
              roles: [role],
              role,
              phoneNumber: cleanPhone,
              country: countryConfig.name,
              region: region.trim(),
              province: province.trim(),
              city: city.trim(),
              postalCode: postalCode.trim(),
            },
          });
        } catch (clerkErr) {
          console.warn('Clerk metadata sync skipped:', clerkErr);
        }
      }

      // 3. Actualizar Zustand Auth Store
      setNeedsProfileCompletion(false);
      setHasSeenOnboarding(true);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace('/(tabs)');
    } catch (e: any) {
      console.error('Error completing profile:', e);
      showAlert('Error al Guardar', translateClerkError(e, 'No se pudo guardar la información de perfil.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <View
        style={{
          flex: 1,
          paddingTop: Math.max(insets.top + 16, 32),
          paddingHorizontal: 24,
          paddingBottom: Math.max(insets.bottom + 16, 28),
          justifyContent: 'space-between',
        }}
      >
        {/* Top Header & Progress Stepper */}
        <View>
          {/* Progress Bar */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-1.5 flex-1 mr-4">
              {Array.from({ length: totalSteps }).map((_, i) => {
                const isActive = i + 1 <= step;
                return (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: isActive ? colors.primary : colors.border,
                    }}
                  />
                );
              })}
            </View>
            <Text style={{ fontSize: 12.5, fontFamily: 'Satoshi-Bold', color: colors.textSecondary }}>
              Paso {step} de {totalSteps}
            </Text>
          </View>

          {/* STEP 1: ROL / TIPO DE CUENTA */}
          {step === 1 && (
            <View>
              <Text
                style={{
                  fontSize: 24,
                  fontFamily: 'Satoshi-Black',
                  color: colors.textPrimary,
                  letterSpacing: -0.5,
                  marginBottom: 6,
                }}
              >
                ¿Cómo deseas utilizar Yewi?
              </Text>
              <Text
                style={{
                  fontSize: 13.5,
                  fontFamily: 'Satoshi-Regular',
                  color: colors.textSecondary,
                  marginBottom: 24,
                }}
              >
                Elige tu tipo de cuenta. Podrás contratar servicios o trabajar como profesional.
              </Text>
              <AuthRoleSelector selectedRole={role} onSelectRole={setRole} />
            </View>
          )}

          {/* STEP 2: DATOS PERSONALES Y TELÉFONO */}
          {step === 2 && (
            <View>
              <Text
                style={{
                  fontSize: 24,
                  fontFamily: 'Satoshi-Black',
                  color: colors.textPrimary,
                  letterSpacing: -0.5,
                  marginBottom: 6,
                }}
              >
                Datos de Contacto
              </Text>
              <Text
                style={{
                  fontSize: 13.5,
                  fontFamily: 'Satoshi-Regular',
                  color: colors.textSecondary,
                  marginBottom: 20,
                }}
              >
                Indica tu nombre y teléfono para comunicarte en la plataforma.
              </Text>

              <AuthInput
                label="Nombre"
                leftIcon="person-outline"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Tu nombre"
              />

              <AuthInput
                label="Apellidos"
                leftIcon="person-outline"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Tus apellidos"
              />

              <PhoneInput
                label="Teléfono"
                countryCode={countryCode}
                onCountryChange={(c) => {
                  setCountryCode(c.code as 'ES' | 'FR' | 'GB');
                  setCountry(c.name);
                  setPhoneError('');
                }}
                value={phoneNumber}
                onChangePhone={(text, res) => {
                  setPhoneNumber(text);
                  if (text.length > 0 && !res.isValid) {
                    setPhoneError(res.message || '');
                  } else {
                    setPhoneError('');
                  }
                }}
                error={phoneError}
              />
            </View>
          )}

          {/* STEP 3: UBICACIÓN GEOGRÁFICA (C.A. -> Provincia -> Localidad -> Código Postal) */}
          {step === 3 && (
            <View>
              <View className="flex-row items-center justify-between mb-1.5">
                <Text
                  style={{
                    fontSize: 24,
                    fontFamily: 'Satoshi-Black',
                    color: colors.textPrimary,
                    letterSpacing: -0.5,
                  }}
                >
                  Tu Ubicación
                </Text>
                <ThemedTouchable
                  onPress={handleDetectGPSLocation}
                  disabled={isDetectingLocation}
                  haptic="selection"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 5,
                    paddingHorizontal: 10,
                    borderRadius: 20,
                    backgroundColor: colors.primaryLight,
                    borderWidth: 1,
                    borderColor: colors.primary,
                  }}
                >
                  {isDetectingLocation ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 4 }} />
                  ) : (
                    <Ionicons name="navigate-outline" size={13} color={colors.primary} style={{ marginRight: 4 }} />
                  )}
                  <Text style={{ fontSize: 11.5, fontFamily: 'Satoshi-Bold', color: colors.primary }}>
                    {isDetectingLocation ? 'Detectando...' : 'Usar GPS'}
                  </Text>
                </ThemedTouchable>
              </View>

              <Text
                style={{
                  fontSize: 13.5,
                  fontFamily: 'Satoshi-Regular',
                  color: colors.textSecondary,
                  marginBottom: 12,
                }}
              >
                Filtrarás profesionales y solicitudes según tu zona geográfica.
              </Text>

              {/* Fila 1: Comunidad Autónoma & Provincia */}
              <View className="flex-row gap-2.5">
                <View className="flex-1">
                  <AuthInput
                    label="Comunidad Autónoma *"
                    leftIcon="globe-outline"
                    value={region}
                    onChangeText={setRegion}
                    placeholder="Ej. Aragón"
                  />
                </View>
                <View className="flex-1">
                  <AuthInput
                    label="Provincia *"
                    leftIcon="map-outline"
                    value={province}
                    onChangeText={setProvince}
                    placeholder="Ej. Zaragoza"
                  />
                </View>
              </View>

              {/* Fila 2: Localidad / Municipio & Código Postal */}
              <View className="flex-row gap-2.5">
                <View className="flex-[1.1]">
                  <AuthInput
                    label="Localidad / Municipio *"
                    leftIcon="location-outline"
                    value={city}
                    onChangeText={setCity}
                    placeholder="Ej. Zaragoza"
                  />
                </View>
                <View className="flex-[0.9]">
                  <AuthInput
                    label="Código Postal *"
                    leftIcon="mail-unread-outline"
                    value={postalCode}
                    onChangeText={handlePostalCodeChange}
                    placeholder="50001"
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
              </View>

              {/* Fila 3: Dirección */}
              <AuthInput
                label="Dirección o Calle (Opcional)"
                leftIcon="business-outline"
                value={address}
                onChangeText={setAddress}
                placeholder="Ej. Gran Vía 12, 3º A"
              />
            </View>
          )}

          {/* STEP 4: CATEGORÍAS PROFESIONALES */}
          {step === 4 && role === 'PROFESSIONAL' && (
            <View>
              <Text
                style={{
                  fontSize: 24,
                  fontFamily: 'Satoshi-Black',
                  color: colors.textPrimary,
                  letterSpacing: -0.5,
                  marginBottom: 6,
                }}
              >
                Tus Especialidades
              </Text>
              <Text
                style={{
                  fontSize: 13.5,
                  fontFamily: 'Satoshi-Regular',
                  color: colors.textSecondary,
                  marginBottom: 16,
                }}
              >
                Selecciona las categorías en las que ofreces servicios.
              </Text>

              <View className="flex-row flex-wrap gap-2.5">
                {CATEGORIES_LIST.map((cat) => (
                  <CategoryChip
                    key={cat.id}
                    label={cat.name}
                    isSelected={selectedSkills.includes(cat.name)}
                    onPress={() => toggleSkill(cat.name)}
                  />
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Bottom Navigation Buttons */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.borderSubtle,
          }}
        >
          {step > 1 && (
            <View style={{ width: 100 }}>
              <ThemedTouchable
                onPress={handlePrevStep}
                haptic="light"
                style={{
                  height: 52,
                  borderRadius: 999,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 15, fontFamily: 'Satoshi-Bold', color: colors.textPrimary }}>
                  Atrás
                </Text>
              </ThemedTouchable>
            </View>
          )}

          <View className="flex-1">
            <AuthButton
              title={step === totalSteps ? 'Finalizar y Entrar →' : 'Continuar →'}
              onPress={handleNextStep}
              isLoading={isLoading}
              variant="primary"
            />
          </View>
        </View>
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttonText="Entendido"
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}
