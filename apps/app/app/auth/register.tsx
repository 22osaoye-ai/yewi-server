import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSignUp } from '@clerk/expo';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { CustomAlert } from '@/components/ui/CustomAlert';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthButton } from '@/components/auth/AuthButton';
import { AuthRoleSelector, UserAuthRole } from '@/components/auth/AuthRoleSelector';
import { PasswordRequirements } from '@/components/auth/PasswordRequirements';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { validateSpanishNifCifNie } from '@/utils/spanishValidators';
import { CATEGORIES_LIST } from '@/constants/categories';
import { useAppTheme } from '@/hooks/useAppTheme';
import { translateClerkError } from '@/utils/clerkErrorTranslator';
import {
  validatePhoneNumber,
  getCountryByCodeOrPrefix,
  SupportedCountry,
} from '@/constants/countryPhoneConfig';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { signUp, errors } = useSignUp();

  // Wizard Navigation
  const [role, setRole] = useState<UserAuthRole>('CLIENT');
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Basic Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState<'ES' | 'FR' | 'GB'>('ES');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [password, setPassword] = useState('');

  // Verification step
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  // Extended Professional Fields (Split into Step 5 Fiscal & Step 6 Location)
  const [taxId, setTaxId] = useState(''); // NIF / NIE / CIF
  const [taxIdError, setTaxIdError] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [province, setProvince] = useState('Zaragoza');
  const [city, setCity] = useState('Zaragoza Capital');
  const [address, setAddress] = useState('Calle Alfonso I, 14');
  const [postalCode, setPostalCode] = useState('50003');
  const [hourlyRate, setHourlyRate] = useState('35');
  const [serviceRadiusKm, setServiceRadiusKm] = useState('50');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['Electricidad', 'Fontanería']);
  const [bio, setBio] = useState('');

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const totalSteps = role === 'CLIENT' ? 4 : 7;

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ visible: true, title, message });
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const handleNext = () => {
    // Step 1 Validation: Role selected
    if (step === 1) {
      setStep(2);
      return;
    }

    // Step 2 Validation: First Name & Last Name
    if (step === 2) {
      if (!firstName.trim() || !lastName.trim()) {
        showAlert('Campos obligatorios', 'Por favor ingresa tu nombre y apellidos.');
        return;
      }
      setStep(3);
      return;
    }

    // Step 3 Validation: Email & Phone
    if (step === 3) {
      if (!email.trim() || !email.includes('@')) {
        showAlert('Correo inválido', 'Ingresa un correo electrónico válido.');
        return;
      }
      if (phoneNumber.trim()) {
        const country = getCountryByCodeOrPrefix(countryCode);
        const check = validatePhoneNumber(countryCode, country.prefix, phoneNumber);
        if (!check.isValid) {
          setPhoneError(check.message || 'Teléfono no válido.');
          showAlert('Teléfono Inválido', check.message || 'Por favor verifica el número de teléfono.');
          return;
        }
        setPhoneError('');
      }
      setStep(4);
      return;
    }

    // Step 4 Validation: Password
    if (step === 4) {
      if (password.length < 8) {
        showAlert('Contraseña insegura', 'La contraseña debe tener al menos 8 caracteres.');
        return;
      }

      if (role === 'CLIENT') {
        handleRegister();
        return;
      } else {
        setStep(5);
        return;
      }
    }

    // Step 5 Validation (Pro Only): NIF / CIF Fiscal Check (Zero Scroll)
    if (step === 5 && role === 'PROFESSIONAL') {
      if (!taxId.trim()) {
        showAlert('NIF/CIF Obligatorio', 'Por favor ingresa tu NIF, NIE o CIF de autónomo o empresa.');
        return;
      }

      const taxCheck = validateSpanishNifCifNie(taxId);
      if (!taxCheck.isValid) {
        setTaxIdError(taxCheck.message || 'NIF/CIF no válido');
        showAlert('NIF/CIF Inválido', taxCheck.message || 'El documento introducido no es un NIF, NIE o CIF válido en España.');
        return;
      }
      setTaxIdError('');
      setStep(6);
      return;
    }

    // Step 6 Validation (Pro Only): Location Autocomplete (Zero Scroll)
    if (step === 6 && role === 'PROFESSIONAL') {
      if (!city.trim() || !address.trim() || !postalCode.trim()) {
        showAlert('Ubicación Requerida', 'Por favor selecciona la ubicación de tu servicio.');
        return;
      }

      setStep(7);
      return;
    }

    // Step 7 (Pro Finish): Categories & Rates
    if (step === 7 && role === 'PROFESSIONAL') {
      handleRegister();
    }
  };

  const handleBack = () => {
    if (isVerifying) {
      setIsVerifying(false);
      return;
    }

    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleRegister = async () => {
    if (!signUp) {
      showAlert('Error', 'Servicio de autenticación no inicializado aún.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Iniciar registro en Clerk
      const { error } = await signUp.password({
        emailAddress: email.trim(),
        password,
      });

      if (error) {
        const errorMsg = translateClerkError(
          errors || error,
          'No se pudo completar el registro.'
        );
        showAlert('Error de registro', errorMsg);
        setIsLoading(false);
        return;
      }

      // 2. Adjuntar metadatos de rol y datos de contacto
      const countryConfig = getCountryByCodeOrPrefix(countryCode);
      const e164Phone = phoneNumber.trim()
        ? validatePhoneNumber(countryCode, countryConfig.prefix, phoneNumber).e164 || phoneNumber.trim()
        : '';

      await signUp.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        unsafeMetadata: {
          roles: [role],
          role,
          country: countryConfig.name,
          phoneNumber: e164Phone,
          ...(role === 'PROFESSIONAL'
            ? {
                taxId: taxId.trim().toUpperCase(),
                businessName: businessName.trim(),
                province,
                city,
                address,
                postalCode,
                hourlyRate: parseFloat(hourlyRate) || 35,
                serviceRadiusKm: parseInt(serviceRadiusKm, 10) || 50,
                skills: selectedSkills,
                bio: bio.trim(),
              }
            : {}),
        },
      });

      // 3. Preparar verificación de correo (código OTP)
      if ((signUp as any).prepareVerification) {
        await (signUp as any).prepareVerification({ strategy: 'email_code' });
      } else if ((signUp.verifications as any)?.emailAddress?.sendCode) {
        await (signUp.verifications as any).emailAddress.sendCode();
      }
      setIsVerifying(true);
    } catch (err: any) {
      console.error('Registration Error:', err);
      showAlert('Error', translateClerkError(err, 'Ocurrió un error inesperado al registrar.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode.trim() || verificationCode.length < 6) {
      showAlert('Código incompleto', 'Por favor ingresa el código de 6 dígitos.');
      return;
    }

    if (!signUp) return;

    setIsLoading(true);
    try {
      let completeSignUp: any;
      if ((signUp as any).attemptVerification) {
        completeSignUp = await (signUp as any).attemptVerification({
          strategy: 'email_code',
          code: verificationCode.trim(),
        });
      } else if ((signUp.verifications as any)?.emailAddress?.verifyCode) {
        completeSignUp = await (signUp.verifications as any).emailAddress.verifyCode({
          code: verificationCode.trim(),
        });
      }

      if (completeSignUp?.status === 'complete' || signUp.status === 'complete') {
        await signUp.finalize({
          navigate: ({ session, decorateUrl }) => {
            if (session?.currentTask) return;
            router.replace('/(tabs)');
          },
        });
      }
    } catch (err: any) {
      const errorMsg = translateClerkError(
        errors || err,
        'Código de verificación inválido o expirado.'
      );
      showAlert('Código inválido', errorMsg);
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: Math.max(insets.top + 12, 28),
          paddingHorizontal: 24,
          paddingBottom: Math.max(insets.bottom + 20, 32) + 60,
          justifyContent: 'space-between',
        }}
      >
        <View>
          {/* Verification Code Form */}
          {isVerifying ? (
            <View>
              <AuthHeader
                title="Verifica tu Correo"
                subtitle={`Hemos enviado un código de 6 dígitos a ${email}. Introdúcelo a continuación para activar tu cuenta.`}
                onBack={handleBack}
                showLogo={false}
                align="left"
              />

              <Input
                label="Código de Verificación"
                leftIcon="key-outline"
                value={verificationCode}
                onChangeText={setVerificationCode}
                placeholder="123456"
                keyboardType="numeric"
                autoFocus
              />
            </View>
          ) : (
            <>
              {/* Progress Bar Indicator at Top */}
              <View className="mb-5">
                <View className="flex-row justify-between items-center mb-1.5">
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'Satoshi-Bold',
                      color: colors.primary,
                      letterSpacing: 1.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    Paso {step} de {totalSteps}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'Satoshi-Medium',
                      color: colors.textSecondary,
                    }}
                  >
                    {Math.round((step / totalSteps) * 100)}% completado
                  </Text>
                </View>
                <View
                  style={{
                    width: '100%',
                    height: 6,
                    backgroundColor: colors.border,
                    borderRadius: 999,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      width: `${(step / totalSteps) * 100}%`,
                      height: '100%',
                      backgroundColor: colors.primary,
                      borderRadius: 999,
                    }}
                  />
                </View>
              </View>

              {/* STEP 1: ROLE SELECTION */}
              {step === 1 && (
                <View>
                  <AuthHeader
                    title="¿Cómo deseas utilizar Yewi?"
                    subtitle="Elige el tipo de cuenta que mejor se adapta a lo que necesitas hoy."
                    onBack={handleBack}
                    showLogo
                    align="left"
                  />

                  <AuthRoleSelector selectedRole={role} onSelectRole={setRole} />
                </View>
              )}

              {/* STEP 2: PERSONAL IDENTITY */}
              {step === 2 && (
                <View>
                  <AuthHeader
                    title="¿Cómo te llamas?"
                    subtitle="Ingresa tu nombre y apellidos para personalizar tu experiencia."
                    onBack={handleBack}
                    showLogo={false}
                    align="left"
                  />

                  <Input
                    label="Nombre"
                    leftIcon="person-outline"
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Juan"
                    autoFocus
                  />

                  <Input
                    label="Apellidos"
                    leftIcon="person-outline"
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Pérez"
                  />
                </View>
              )}

              {/* STEP 3: CONTACT INFORMATION */}
              {step === 3 && (
                <View>
                  <AuthHeader
                    title="Información de Contacto"
                    subtitle="Tu correo y teléfono para recibir confirmaciones de tus solicitudes."
                    onBack={handleBack}
                    showLogo={false}
                    align="left"
                  />

                  <Input
                    label="Correo Electrónico"
                    leftIcon="mail-outline"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="juan.perez@ejemplo.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoFocus
                  />

                  <PhoneInput
                    label="Teléfono"
                    countryCode={countryCode}
                    onCountryChange={(c) => {
                      setCountryCode(c.code as 'ES' | 'FR' | 'GB');
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

              {/* STEP 4: SECURITY & PASSWORD */}
              {step === 4 && (
                <View>
                  <AuthHeader
                    title="Crea tu Contraseña"
                    subtitle="Elige una contraseña segura para proteger tu cuenta de Yewi."
                    onBack={handleBack}
                    showLogo={false}
                    align="left"
                  />

                  <Input
                    label="Contraseña"
                    leftIcon="lock-closed-outline"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    isPassword
                    autoFocus
                  />

                  <PasswordRequirements password={password} />
                </View>
              )}

              {/* STEP 5 (PROFESSIONAL ONLY): FISCAL VERIFICATION (ZERO SCROLL) */}
              {step === 5 && role === 'PROFESSIONAL' && (
                <View>
                  <AuthHeader
                    title="Verificación Fiscal"
                    subtitle="Valida tu NIF/CIF de autónomo o empresa para ofrecer servicios en Yewi."
                    onBack={handleBack}
                    showLogo={false}
                    align="left"
                  />

                  <Input
                    label="NIF / NIE / CIF (Autónomo o Empresa)"
                    leftIcon="shield-checkmark-outline"
                    value={taxId}
                    onChangeText={(val) => {
                      setTaxId(val);
                      if (val.length >= 8) {
                        const res = validateSpanishNifCifNie(val);
                        setTaxIdError(res.isValid ? '' : (res.message || 'Formato de NIF/CIF inválido'));
                      } else {
                        setTaxIdError('');
                      }
                    }}
                    placeholder="Ej. 12345678Z o B12345678"
                    autoCapitalize="characters"
                    error={taxIdError}
                    hint="✓ Validación oficial de dígito de control AEAT España"
                    autoFocus
                  />

                  <Input
                    label="Nombre Comercial / Razón Social"
                    leftIcon="business-outline"
                    value={businessName}
                    onChangeText={setBusinessName}
                    placeholder="Ej. Reformas & Diseño Express"
                  />
                </View>
              )}

              {/* STEP 6 (PROFESSIONAL ONLY): LOCATION API (ZERO SCROLL) */}
              {step === 6 && role === 'PROFESSIONAL' && (
                <View>
                  <AuthHeader
                    title="Ubicación de Servicio"
                    subtitle="Detecta tu posición GPS o busca tu ciudad y municipio."
                    onBack={handleBack}
                    showLogo={false}
                    align="left"
                  />

                  <AddressAutocomplete
                    onAddressSelect={(data) => {
                      setProvince(data.province);
                      setCity(data.city);
                      setAddress(data.address);
                      setPostalCode(data.postalCode);
                    }}
                    initialCity={city}
                    initialAddress={address}
                    initialPostalCode={postalCode}
                  />
                </View>
              )}

              {/* STEP 7 (PROFESSIONAL ONLY): CATEGORIES & RATES */}
              {step === 7 && role === 'PROFESSIONAL' && (
                <View>
                  <AuthHeader
                    title="Categorías & Tarifas"
                    subtitle="Selecciona las categorías oficiales de Yewi en las que trabajarás."
                    onBack={handleBack}
                    showLogo={false}
                    align="left"
                  />

                  <Text
                    style={{
                      fontSize: 12.5,
                      fontFamily: 'Satoshi-Bold',
                      color: colors.textPrimary,
                      marginBottom: 8,
                      marginLeft: 4,
                    }}
                  >
                    Categorías Oficiales (Selecciona al menos 1)
                  </Text>
                  <View className="flex-row flex-wrap gap-2.5 mb-4">
                    {CATEGORIES_LIST.map((cat) => (
                      <CategoryChip
                        key={cat.id}
                        label={cat.name}
                        isSelected={selectedSkills.includes(cat.name)}
                        onPress={() => toggleSkill(cat.name)}
                      />
                    ))}
                  </View>

                  <View className="flex-row gap-3 mb-2">
                    <View className="flex-1">
                      <Input
                        label="Tarifa Estimada (€/h)"
                        leftIcon="cash-outline"
                        value={hourlyRate}
                        onChangeText={setHourlyRate}
                        placeholder="35"
                        keyboardType="numeric"
                      />
                    </View>
                    <View className="flex-1">
                      <Input
                        label="Radio Cobertura (km)"
                        leftIcon="navigate-outline"
                        value={serviceRadiusKm}
                        onChangeText={setServiceRadiusKm}
                        placeholder="50"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        {/* Bottom Floating Step Action Button & Login Link */}
        <View
          style={{
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.borderSubtle,
          }}
        >
          <AuthButton
            title={
              isVerifying
                ? isLoading
                  ? 'Verificando...'
                  : 'Verificar Correo'
                : step === totalSteps
                ? isLoading
                  ? 'Registrando...'
                  : role === 'PROFESSIONAL'
                  ? 'Completar Registro Profesional'
                  : 'Completar Registro'
                : 'Continuar →'
            }
            onPress={isVerifying ? handleVerifyEmail : handleNext}
            isLoading={isLoading}
            variant="primary"
          />

          {step === 1 && !isVerifying && (
            <View className="flex-row justify-center items-center mt-3">
              <Text
                style={{
                  fontSize: 13.5,
                  fontFamily: 'Satoshi-Regular',
                  color: colors.textSecondary,
                }}
              >
                ¿Ya tienes una cuenta?{' '}
              </Text>
              <ThemedTouchable
                onPress={() => router.push('/auth/login')}
                haptic="selection"
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Satoshi-Black',
                    color: colors.primary,
                  }}
                >
                  Iniciar Sesión
                </Text>
              </ThemedTouchable>
            </View>
          )}
        </View>

        {/* Required for Clerk bot protection */}
        <View nativeID="clerk-captcha" />
      </ScrollView>

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
