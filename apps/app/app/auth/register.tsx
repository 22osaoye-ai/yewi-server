import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
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
import { authService } from '@/services/authService';

// Caché en memoria ultra-rápida (0ms de latencia, estilo Google y GitHub)
const emailAvailabilityCache = new Map<string, { available: boolean; message: string }>();
const phoneAvailabilityCache = new Map<string, { available: boolean; message: string }>();
const taxIdAvailabilityCache = new Map<string, { available: boolean; message: string }>();

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { signUp } = useSignUp();

  // Wizard Navigation
  const [role, setRole] = useState<UserAuthRole>('CLIENT');
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Basic Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [emailError, setEmailError] = useState('');
  const [countryCode, setCountryCode] = useState<'ES' | 'FR' | 'GB'>('ES');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneStatus, setPhoneStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [phoneError, setPhoneError] = useState('');
  const [password, setPassword] = useState('');

  // Verification step
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Extended Professional Fields (Split into Step 5 Fiscal & Step 6 Location)
  const [taxId, setTaxId] = useState(''); // NIF / NIE / CIF
  const [taxIdStatus, setTaxIdStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
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

  // Controladores de cancelación relámpago para abortar peticiones al instante (Google/GitHub style)
  const emailAbortRef = useRef<AbortController | null>(null);
  const phoneAbortRef = useRef<AbortController | null>(null);
  const taxIdAbortRef = useRef<AbortController | null>(null);

  // Pre-calentar silenciosamente el backend y limpiar cualquier sesión previa de registro
  useEffect(() => {
    try {
      if (signUp && typeof (signUp as any).reset === 'function') {
        (signUp as any).reset().catch?.(() => {});
      }
    } catch {}
    authService.checkAvailability({ email: 'ping@prewarm.local' }).catch(() => {});
    return () => {
      emailAbortRef.current?.abort();
      phoneAbortRef.current?.abort();
      taxIdAbortRef.current?.abort();
    };
  }, []);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const totalSteps = role === 'PROFESSIONAL' ? 7 : 4;

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
      const emailTrim = email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailTrim || !emailRegex.test(emailTrim)) {
        setEmailStatus('invalid');
        setEmailError('Formato de correo no válido');
        showAlert('Correo no válido', 'Por favor ingresa un correo electrónico válido.');
        return;
      }

      if (emailStatus === 'invalid' || emailError) {
        showAlert('Correo no disponible', emailError || 'El correo electrónico ya está registrado.');
        return;
      }

      if (phoneNumber.trim()) {
        const country = getCountryByCodeOrPrefix(countryCode);
        const check = validatePhoneNumber(countryCode, country.prefix, phoneNumber);
        if (!check.isValid) {
          setPhoneStatus('invalid');
          setPhoneError(check.message || 'Teléfono no válido.');
          showAlert('Teléfono Inválido', check.message || 'Por favor verifica el número de teléfono.');
          return;
        }

        if (phoneStatus === 'invalid' || phoneError) {
          showAlert('Teléfono no disponible', phoneError || 'El número de teléfono ya está registrado.');
          return;
        }
      }

      setStep(4);
      return;
    }

    // Step 4 Validation: Password & Security
    if (step === 4) {
      if (password.length < 8) {
        showAlert('Contraseña incompleta', 'La contraseña debe tener al menos 8 caracteres.');
        return;
      }
      if (!/[A-Z]/.test(password)) {
        showAlert('Contraseña incompleta', 'La contraseña debe incluir al menos una letra mayúscula.');
        return;
      }
      if (!/[a-z]/.test(password)) {
        showAlert('Contraseña incompleta', 'La contraseña debe incluir al menos una letra minúscula.');
        return;
      }
      if (!/[0-9]/.test(password)) {
        showAlert('Contraseña incompleta', 'La contraseña debe incluir al menos un número.');
        return;
      }

      if (role === 'PROFESSIONAL') {
        setStep(5);
        return;
      }

      handleRegister();
      return;
    }

    // Step 5 Validation (Pro Only): NIF / CIF Fiscal Check (Zero Scroll)
    if (step === 5 && role === 'PROFESSIONAL') {
      const cleanTax = taxId.trim().toUpperCase();
      if (!cleanTax) {
        setTaxIdStatus('invalid');
        setTaxIdError('El NIF, NIE o CIF es obligatorio');
        showAlert('NIF/CIF Obligatorio', 'Por favor ingresa tu NIF, NIE o CIF de autónomo o empresa.');
        return;
      }

      const taxCheck = validateSpanishNifCifNie(cleanTax);
      if (!taxCheck.isValid) {
        setTaxIdStatus('invalid');
        setTaxIdError(taxCheck.message || 'NIF/CIF no válido');
        showAlert('NIF/CIF Inválido', taxCheck.message || 'El documento introducido no es un NIF, NIE o CIF válido en España.');
        return;
      }

      if (taxIdStatus === 'invalid' || taxIdError) {
        showAlert('NIF/CIF no disponible', taxIdError || 'El documento ya está registrado en otra cuenta.');
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
      handleChangeEmail();
      return;
    }

    if (step > 1) {
      setStep(step - 1);
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/auth/login');
      }
    }
  };

  const handleChangeEmail = async () => {
    try {
      if (signUp?.reset) {
        await signUp.reset();
      }
    } catch (e) {
      console.warn('[RegisterScreen] Error al reiniciar sesión de registro:', e);
    }
    setIsVerifying(false);
    setVerificationCode('');
    setStep(3);
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  useEffect(() => {
    const onBackPress = () => {
      handleBack();
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [step, isVerifying, router]);

  // Comprobación relámpago en tiempo real (Algoritmo Google & GitHub, 0ms caché, 180ms debounce)
  useEffect(() => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      emailAbortRef.current?.abort();
      setEmailStatus('idle');
      setEmailError('');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      emailAbortRef.current?.abort();
      // Si aún no ha completado el dominio, mantener estado neutro (idle) sin llamar a red
      if (trimmed.includes('@') && trimmed.split('@')[1]?.includes('.')) {
        setEmailStatus('invalid');
        setEmailError('Formato no válido');
      } else {
        setEmailStatus('idle');
        setEmailError('');
      }
      return;
    }

    // 1. Comprobación instantánea en caché en memoria (0ms de latencia)
    const cached = emailAvailabilityCache.get(trimmed);
    if (cached) {
      emailAbortRef.current?.abort();
      if (!cached.available) {
        setEmailStatus('invalid');
        setEmailError(cached.message || 'Correo ya registrado');
      } else {
        setEmailStatus('valid');
        setEmailError('');
      }
      return;
    }

    // 2. Abortar cualquier petición previa en vuelo
    emailAbortRef.current?.abort();
    const abortController = new AbortController();
    emailAbortRef.current = abortController;

    setEmailStatus('checking');
    setEmailError('');

    const timer = setTimeout(async () => {
      try {
        const res = await authService.checkAvailability({ email: trimmed }, abortController.signal);
        if (abortController.signal.aborted) return;

        if (res?.email) {
          emailAvailabilityCache.set(trimmed, {
            available: res.email.available,
            message: res.email.message || 'Correo ya registrado',
          });

          if (res.email.available === false) {
            setEmailStatus('invalid');
            setEmailError(res.email.message || 'Correo ya registrado');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          } else {
            setEmailStatus('valid');
            setEmailError('');
          }
        } else {
          // Si el servidor tardó o respondió vacío, asumir optimista (Google style)
          setEmailStatus('valid');
          setEmailError('');
        }
      } catch {
        if (!abortController.signal.aborted) {
          setEmailStatus('valid');
          setEmailError('');
        }
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [email]);

  // Comprobación relámpago de disponibilidad de Teléfono (Algoritmo Google & GitHub)
  useEffect(() => {
    const clean = phoneNumber.trim();
    if (!clean) {
      phoneAbortRef.current?.abort();
      setPhoneStatus('idle');
      setPhoneError('');
      return;
    }

    const countryConfig = getCountryByCodeOrPrefix(countryCode);
    const check = validatePhoneNumber(countryCode, countryConfig.prefix, clean);

    // Validación sintáctica 0ms: Si aún no tiene la longitud requerida, no molestar con red ni errores
    const rawDigits = clean.replace(/\D/g, '');
    if (rawDigits.length < countryConfig.digitsLength) {
      phoneAbortRef.current?.abort();
      setPhoneStatus('idle');
      setPhoneError('');
      return;
    }

    if (!check.isValid) {
      phoneAbortRef.current?.abort();
      setPhoneStatus('invalid');
      setPhoneError(check.message || 'Teléfono no válido');
      return;
    }

    const phoneKey = check.e164 || `${countryConfig.prefix}${clean}`;

    // 1. Comprobación instantánea en caché (0ms)
    const cached = phoneAvailabilityCache.get(phoneKey);
    if (cached) {
      phoneAbortRef.current?.abort();
      if (!cached.available) {
        setPhoneStatus('invalid');
        setPhoneError(cached.message || 'Teléfono ya registrado');
      } else {
        setPhoneStatus('valid');
        setPhoneError('');
      }
      return;
    }

    // 2. Abortar petición en curso previa
    phoneAbortRef.current?.abort();
    const abortController = new AbortController();
    phoneAbortRef.current = abortController;

    setPhoneStatus('checking');
    setPhoneError('');

    const timer = setTimeout(async () => {
      try {
        const res = await authService.checkAvailability(
          {
            phoneNumber: phoneKey,
            country: countryConfig.name,
          },
          abortController.signal
        );
        if (abortController.signal.aborted) return;

        if (res?.phoneNumber) {
          phoneAvailabilityCache.set(phoneKey, {
            available: res.phoneNumber.available,
            message: res.phoneNumber.message || 'Teléfono ya registrado',
          });

          if (res.phoneNumber.available === false) {
            setPhoneStatus('invalid');
            setPhoneError(res.phoneNumber.message || 'Teléfono ya registrado');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          } else {
            setPhoneStatus('valid');
            setPhoneError('');
          }
        } else {
          setPhoneStatus('valid');
          setPhoneError('');
        }
      } catch {
        if (!abortController.signal.aborted) {
          setPhoneStatus('valid');
          setPhoneError('');
        }
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [phoneNumber, countryCode]);

  // Comprobación relámpago de NIF/NIE/CIF (Algoritmo Modulo-23 AEAT en 0ms + comprobación backend)
  useEffect(() => {
    if (role !== 'PROFESSIONAL') return;
    const clean = taxId.trim().toUpperCase();
    if (!clean) {
      taxIdAbortRef.current?.abort();
      setTaxIdStatus('idle');
      setTaxIdError('');
      return;
    }

    if (clean.length < 8) {
      taxIdAbortRef.current?.abort();
      setTaxIdStatus('idle');
      setTaxIdError('');
      return;
    }

    // Algoritmo matemático AEAT local 0ms
    const taxCheck = validateSpanishNifCifNie(clean);
    if (!taxCheck.isValid) {
      taxIdAbortRef.current?.abort();
      setTaxIdStatus('invalid');
      setTaxIdError(taxCheck.message || 'NIF/CIF no válido');
      return;
    }

    // 1. Comprobación instantánea en caché (0ms)
    const cached = taxIdAvailabilityCache.get(clean);
    if (cached) {
      taxIdAbortRef.current?.abort();
      if (!cached.available) {
        setTaxIdStatus('invalid');
        setTaxIdError(cached.message || 'Documento ya registrado');
      } else {
        setTaxIdStatus('valid');
        setTaxIdError('');
      }
      return;
    }

    // 2. Abortar petición en curso previa
    taxIdAbortRef.current?.abort();
    const abortController = new AbortController();
    taxIdAbortRef.current = abortController;

    setTaxIdStatus('checking');
    setTaxIdError('');

    const timer = setTimeout(async () => {
      try {
        const res = await authService.checkAvailability({ taxId: clean }, abortController.signal);
        if (abortController.signal.aborted) return;

        if (res?.taxId) {
          taxIdAvailabilityCache.set(clean, {
            available: res.taxId.available,
            message: res.taxId.message || 'Documento ya registrado',
          });

          if (res.taxId.available === false) {
            setTaxIdStatus('invalid');
            setTaxIdError(res.taxId.message || 'Documento ya registrado');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          } else {
            setTaxIdStatus('valid');
            setTaxIdError('');
          }
        } else {
          setTaxIdStatus('valid');
          setTaxIdError('');
        }
      } catch {
        if (!abortController.signal.aborted) {
          setTaxIdStatus('valid');
          setTaxIdError('');
        }
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [taxId, role]);

  const handleRegister = async () => {
    if (!signUp) {
      showAlert('Error', 'Servicio de autenticación no inicializado aún.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Iniciar registro en Clerk con credenciales
      const { error } = await signUp.password({
        emailAddress: email.trim(),
        password,
      });

      if (error) {
        console.warn('[RegisterScreen] Error de Clerk al registrar:', error);
        const rawCode = (error as any)?.code || (error as any)?.errors?.[0]?.code;
        if (rawCode === 'form_identifier_exists') {
          setEmailStatus('invalid');
          setEmailError('Correo ya registrado');
          setStep(3);
          showAlert(
            'Correo no disponible',
            'Ya existe una cuenta registrada con este correo electrónico. Por favor usa otro correo o inicia sesión.'
          );
          setIsLoading(false);
          return;
        }
        const errorMsg = translateClerkError(
          error,
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

      // Si la cuenta ya está lista (ej. sin requerimiento de validación de correo)
      if (signUp.status === 'complete') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        await signUp.finalize({
          navigate: ({ session }) => {
            if (session?.currentTask) return;
            router.replace('/(tabs)');
          },
        });
        return;
      }

      // 3. Enviar código de confirmación de correo (OTP) mediante API de Clerk
      let sendError: any = null;
      if (signUp.verifications?.sendEmailCode) {
        const res = await signUp.verifications.sendEmailCode();
        sendError = res?.error;
      } else if (typeof (signUp as any).sendEmailCode === 'function') {
        const res = await (signUp as any).sendEmailCode();
        sendError = res?.error;
      } else if (typeof (signUp as any).prepareEmailAddressVerification === 'function') {
        await (signUp as any).prepareEmailAddressVerification({ strategy: 'email_code' });
      } else if (typeof (signUp as any).prepareVerification === 'function') {
        await (signUp as any).prepareVerification({ strategy: 'email_code' });
      }

      if (sendError) {
        const errorMsg = translateClerkError(
          sendError,
          'No se pudo enviar el código de verificación.'
        );
        showAlert('Error de verificación', errorMsg);
        setIsLoading(false);
        return;
      }

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setResendCooldown(45);
      setIsVerifying(true);
    } catch (err: any) {
      console.error('Registration Error:', err);
      showAlert('Error', translateClerkError(err, 'Ocurrió un error inesperado al registrar.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || isResending || !signUp) return;

    setIsResending(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      let sendError: any = null;
      if (signUp.verifications?.sendEmailCode) {
        const res = await signUp.verifications.sendEmailCode();
        sendError = res?.error;
      } else if (typeof (signUp as any).sendEmailCode === 'function') {
        const res = await (signUp as any).sendEmailCode();
        sendError = res?.error;
      } else if (typeof (signUp as any).prepareEmailAddressVerification === 'function') {
        await (signUp as any).prepareEmailAddressVerification({ strategy: 'email_code' });
      }

      if (sendError) {
        const errorMsg = translateClerkError(
          sendError,
          'No se pudo reenviar el código.'
        );
        showAlert('Error al reenviar', errorMsg);
        return;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      showAlert(
        'Código reenviado',
        `Hemos enviado un nuevo código a ${email}. Revisa tu bandeja de entrada y spam.`
      );
      setResendCooldown(45);
    } catch (err: any) {
      showAlert('Error al reenviar', translateClerkError(err, 'No se pudo reenviar el código.'));
    } finally {
      setIsResending(false);
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
      let verifyError: any = null;
      let completeSignUp: any = null;

      if (signUp.verifications?.verifyEmailCode) {
        const res = await signUp.verifications.verifyEmailCode({
          code: verificationCode.trim(),
        });
        verifyError = res?.error;
      } else if (typeof (signUp as any).verifyEmailCode === 'function') {
        const res = await (signUp as any).verifyEmailCode({
          code: verificationCode.trim(),
        });
        verifyError = res?.error;
      } else if (typeof (signUp as any).attemptEmailAddressVerification === 'function') {
        completeSignUp = await (signUp as any).attemptEmailAddressVerification({
          code: verificationCode.trim(),
        });
      } else if (typeof (signUp as any).attemptVerification === 'function') {
        completeSignUp = await (signUp as any).attemptVerification({
          strategy: 'email_code',
          code: verificationCode.trim(),
        });
      }

      if (verifyError) {
        const errorMsg = translateClerkError(
          verifyError,
          'Código de verificación inválido o expirado.'
        );
        showAlert('Código inválido', errorMsg);
        return;
      }

      if (signUp.status === 'complete' || completeSignUp?.status === 'complete') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        await signUp.finalize({
          navigate: ({ session, decorateUrl }) => {
            if (session?.currentTask) return;
            router.replace('/(tabs)');
          },
        });
      } else {
        showAlert('Verificación pendiente', 'Por favor confirma el código recibido para continuar.');
      }
    } catch (err: any) {
      const errorMsg = translateClerkError(
        err,
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
                subtitle={`Hemos enviado un código de 6 dígitos a ${email}. Introdúcelo para activar tu cuenta.`}
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
                maxLength={6}
                autoFocus
              />

              {/* Nota informativa de spam */}
              <View
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)',
                  borderRadius: 12,
                  padding: 12,
                  marginTop: 14,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                }}
              >
                <Text
                  style={{
                    fontSize: 12.5,
                    fontFamily: 'PlusJakartaSans-Regular',
                    color: colors.textSecondary,
                    lineHeight: 18,
                  }}
                >
                  ¿No recibes el correo? Comprueba la carpeta de{' '}
                  <Text style={{ fontFamily: 'PlusJakartaSans-Bold', color: colors.textPrimary }}>
                    correo no deseado (spam)
                  </Text>{' '}
                  o solicita un nuevo código abajo.
                </Text>
              </View>

              {/* Acciones de reenvío y rectificación de correo */}
              <View style={{ marginTop: 20, gap: 10 }}>
                <ThemedTouchable
                  onPress={handleResendCode}
                  disabled={resendCooldown > 0 || isResending}
                  haptic="selection"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 10,
                    opacity: resendCooldown > 0 || isResending ? 0.6 : 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13.5,
                      fontFamily: 'PlusJakartaSans-SemiBold',
                      color: colors.primary,
                    }}
                  >
                    {isResending
                      ? 'Reenviando...'
                      : resendCooldown > 0
                      ? `Reenviar código en ${resendCooldown}s`
                      : 'Reenviar código'}
                  </Text>
                </ThemedTouchable>

                <ThemedTouchable
                  onPress={handleChangeEmail}
                  haptic="selection"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'PlusJakartaSans-Medium',
                      color: colors.textSecondary,
                    }}
                  >
                    Corregir correo
                  </Text>
                </ThemedTouchable>
              </View>
            </View>
          ) : (
            <>
              {/* Progress Bar Indicator at Top */}
              <View className="mb-5">
                <View className="flex-row justify-between items-center mb-1.5">
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'PlusJakartaSans-Bold',
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
                      fontFamily: 'PlusJakartaSans-Medium',
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
                    status={emailStatus}
                    error={emailError}
                    validMessage="✓ Correo disponible"
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
                    onChangePhone={(text) => {
                      setPhoneNumber(text);
                    }}
                    status={phoneStatus}
                    error={phoneError}
                    validMessage="✓ Teléfono disponible"
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
                      setTaxId(val.toUpperCase());
                    }}
                    placeholder="Ej. 12345678Z o B12345678"
                    autoCapitalize="characters"
                    status={taxIdStatus}
                    error={taxIdError}
                    validMessage="✓ Documento válido y libre"
                    hint={taxIdStatus === 'idle' ? "✓ Validación oficial de dígito de control AEAT España" : undefined}
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
                      fontFamily: 'PlusJakartaSans-Bold',
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
                  : 'Verificar'
                : step === totalSteps
                ? isLoading
                  ? 'Registrando...'
                  : role === 'PROFESSIONAL'
                  ? 'Finalizar'
                  : 'Registrar'
                : 'Continuar'
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
                  fontFamily: 'PlusJakartaSans-Regular',
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
                    fontFamily: 'PlusJakartaSans-ExtraBold',
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
