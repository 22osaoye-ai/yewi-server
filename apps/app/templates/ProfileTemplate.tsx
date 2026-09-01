import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Share, Modal, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { CustomAlert } from '@/components/ui/CustomAlert';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { AuthInput } from '@/components/auth/AuthInput';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useAuthStore } from '@/store/useAuthStore';
import { authService } from '@/services/authService';
import { professionalsApi } from '@/services/professionalsApi';
import { ProfilePhotoModal } from '@/components/profile/ProfilePhotoModal';
import { CATEGORIES_LIST } from '@/constants/categories';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spanishGeoService, SPANISH_PROVINCES } from '@/services/spanishGeoService';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { HomePromoBanner } from '@/components/ui/HomePromoBanner';
import { useRealtimeStore } from '@/store/useRealtimeStore';
import { gigsApi, GigDetail } from '@/services/gigsApi';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { PublishProjectModal } from '@/components/ui/PublishProjectModal';

import { paymentsApi } from '@/services/paymentsApi';

function isValidTaxId(id: string): boolean {
  if (!id) return false;
  const clean = id.trim().toUpperCase().replace(/[-\s]/g, '');
  if (clean.length !== 9) return false;

  // DNI: 8 digits + 1 letter
  const dniRegex = /^(\d{8})([A-Z])$/;
  // NIE: X, Y, Z + 7 digits + 1 letter
  const nieRegex = /^[XYZ]\d{7}[A-Z]$/;
  // CIF: Letter (ABCDEFGHJNPQRSUVW) + 7 digits + 1 control character (letter or digit)
  const cifRegex = /^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/;

  const dniMatch = clean.match(dniRegex);
  if (dniMatch) {
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const num = parseInt(dniMatch[1], 10);
    const expectedLetter = letters[num % 23];
    return dniMatch[2] === expectedLetter;
  }

  if (nieRegex.test(clean)) {
    let niePrefix = clean[0];
    let numStr = clean.slice(1, 8);
    if (niePrefix === 'X') niePrefix = '0';
    else if (niePrefix === 'Y') niePrefix = '1';
    else if (niePrefix === 'Z') niePrefix = '2';
    const fullNum = parseInt(niePrefix + numStr, 10);
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const expectedLetter = letters[fullNum % 23];
    return clean[8] === expectedLetter;
  }

  if (cifRegex.test(clean)) {
    return true;
  }

  return false;
}

function formatSpanishPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 9 && /^[6789]/.test(digits);
}

export interface CountryPrefix {
  code: string;
  dialCode: string;
  flag: string;
  name: string;
}

const COUNTRY_PREFIXES: CountryPrefix[] = [
  { code: 'ES', dialCode: '+34', flag: '🇪🇸', name: 'España' },
  { code: 'PT', dialCode: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: 'FR', dialCode: '+33', flag: '🇫🇷', name: 'Francia' },
  { code: 'IT', dialCode: '+39', flag: '🇮🇹', name: 'Italia' },
  { code: 'DE', dialCode: '+49', flag: '🇩🇪', name: 'Alemania' },
  { code: 'GB', dialCode: '+44', flag: '🇬🇧', name: 'Reino Unido' },
  { code: 'US', dialCode: '+1', flag: '🇺🇸', name: 'Estados Unidos' },
  { code: 'MX', dialCode: '+52', flag: '🇲🇽', name: 'México' },
  { code: 'AR', dialCode: '+54', flag: '🇦🇷', name: 'Argentina' },
  { code: 'CO', dialCode: '+57', flag: '🇨🇴', name: 'Colombia' },
  { code: 'CL', dialCode: '+56', flag: '🇨🇱', name: 'Chile' },
  { code: 'PE', dialCode: '+51', flag: '🇵🇪', name: 'Perú' },
  { code: 'EC', dialCode: '+593', flag: '🇪🇨', name: 'Ecuador' },
];

export function ProfileTemplate() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, t, isDark } = useAppTheme();
  const favoritesCount = useFavoritesStore((state) => state.favorites.length);
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const unreadCount = useRealtimeStore((state) => state.unreadCount);
  const [isPro, setIsPro] = useState(false);

  const refreshProStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setIsPro(false);
      return;
    }
    try {
      const status = await paymentsApi.getSubscriptionStatus();
      setIsPro(status.isPro === true);
    } catch {
      setIsPro(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshProStatus();
  }, [refreshProStatus]);

  // Modal & Status States
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showPhotoModal, setShowPhotoModal] = useState<boolean>(false);
  const [showSellerModal, setShowSellerModal] = useState<boolean>(false);
  const [showCountryModal, setShowCountryModal] = useState<boolean>(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryPrefix>(COUNTRY_PREFIXES[0]);

  const [sellerStep, setSellerStep] = useState<number>(1);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  // Projects State
  const [showMyProjectsModal, setShowMyProjectsModal] = useState<boolean>(false);
  const [showPublishProjectModal, setShowPublishProjectModal] = useState<boolean>(false);
  const [myProjects, setMyProjects] = useState<GigDetail[]>([]);
  const [loadingMyProjects, setLoadingMyProjects] = useState<boolean>(false);

  const fetchMyProjects = useCallback(async () => {
    setLoadingMyProjects(true);
    try {
      const data = await gigsApi.getMyGigs();
      setMyProjects(Array.isArray(data) ? data : []);
    } catch {
      setMyProjects([]);
    } finally {
      setLoadingMyProjects(false);
    }
  }, []);

  const handleDeleteMyProject = async (id: string) => {
    try {
      await gigsApi.delete(id);
      setMyProjects((prev) => prev.filter((p) => p.id !== id));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e: any) {
      showAlert('Error', e.message || 'No se pudo eliminar el proyecto.');
    }
  };

  // Professional Onboarding Form State
  const [businessName, setBusinessName] = useState(user?.professionalProfile?.businessName || '');
  const [taxId, setTaxId] = useState(user?.professionalProfile?.taxId || '');
  const [proPhone, setProPhone] = useState(user?.phoneNumber ? formatSpanishPhone(user.phoneNumber) : '');
  const [hourlyRate, setHourlyRate] = useState(user?.professionalProfile?.hourlyRate?.toString() || '35');
  const [serviceRadius, setServiceRadius] = useState(user?.professionalProfile?.serviceRadiusKm?.toString() || '30');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    user?.professionalProfile?.skills?.length ? user.professionalProfile.skills : ['Electricidad', 'Fontanería']
  );
  const [proRegion, setProRegion] = useState(user?.region || 'Aragón');
  const [proProvince, setProProvince] = useState(user?.province || 'Zaragoza');
  const [proCity, setProCity] = useState(user?.city || 'Zaragoza');
  const [proPostalCode, setProPostalCode] = useState(user?.postalCode || '50001');
  const [proAddress, setProAddress] = useState(user?.address || '');

  const [isUpgradingRole, setIsUpgradingRole] = useState<boolean>(false);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ visible: true, title, message });
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message:
          '¡Descubre Yewi! La mejor plataforma para contratar profesionales del hogar y reformas.',
      });
    } catch (e) {}
  };

  // Image Picker Logic
  const handleSelectFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permiso Denegado', 'Se requiere acceso a la galería para cambiar tu foto de perfil.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const dataUri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        await authService.updateProfile({ avatarUrl: dataUri });
        setShowPhotoModal(false);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        showAlert('Foto Actualizada', 'Tu nueva foto de perfil ha sido guardada correctamente.');
      }
    } catch (e: any) {
      showAlert('Error', e.message || 'No se pudo seleccionar la imagen.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permiso Denegado', 'Se requiere acceso a la cámara para tomar una foto.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const dataUri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        await authService.updateProfile({ avatarUrl: dataUri });
        setShowPhotoModal(false);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        showAlert('Foto Actualizada', 'Tu nueva foto de perfil ha sido guardada.');
      }
    } catch (e: any) {
      showAlert('Error', e.message || 'No se pudo tomar la foto.');
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await authService.updateProfile({ avatarUrl: '' });
      setShowPhotoModal(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      showAlert('Foto Eliminada', 'Se ha restablecido la foto de perfil.');
    } catch (e: any) {
      showAlert('Error', e.message || 'No se pudo eliminar la foto.');
    }
  };

  // Seller Onboarding Stepper Logic
  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
    if (fieldErrors.skills) {
      setFieldErrors((prev) => ({ ...prev, skills: undefined }));
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      setIsLocating(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

      const geo = await spanishGeoService.detectGPSLocation();

      if (geo) {
        setProCity(geo.city);
        setProPostalCode(geo.postalCode);
        setProProvince(geo.province);
        setProRegion(geo.region);
        if (geo.address) {
          setProAddress(geo.address);
        }
        setFieldErrors((prev) => ({
          ...prev,
          city: undefined,
          postalCode: undefined,
          province: undefined,
          region: undefined,
        }));
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } catch (e: any) {
      showAlert('Error de ubicación', 'No se pudo obtener la ubicación GPS actual. Puedes introducir los datos manualmente.');
    } finally {
      setIsLocating(false);
    }
  };

  const handlePostalCodeChange = (txt: string) => {
    setProPostalCode(txt);
    if (fieldErrors.postalCode) setFieldErrors((prev) => ({ ...prev, postalCode: undefined }));
    if (txt.length >= 2) {
      const prefix = txt.slice(0, 2);
      const matched = SPANISH_PROVINCES.find((p) => p.code === prefix);
      if (matched) {
        setProProvince(matched.name);
        setProRegion(matched.regionName);
        if (fieldErrors.province || fieldErrors.region) {
          setFieldErrors((prev) => ({ ...prev, province: undefined, region: undefined }));
        }
      }
    }
  };

  const handleNextSellerStep = () => {
    if (sellerStep === 1) {
      const errors: Record<string, string> = {};
      if (!businessName.trim()) {
        errors.businessName = 'El nombre comercial o razón social es obligatorio';
      }
      if (!taxId.trim()) {
        errors.taxId = 'El NIF, CIF o NIE es obligatorio';
      } else if (!isValidTaxId(taxId)) {
        errors.taxId = 'Formato inválido. Introduce un NIF, CIF o NIE válido';
      }
      if (!proPhone.trim()) {
        errors.phone = 'El teléfono de contacto es obligatorio';
      } else if (!isValidPhone(proPhone)) {
        errors.phone = 'Introduce un número de 9 dígitos válido (ej. 612 345 678)';
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
      setFieldErrors({});
      setSellerStep(2);
      return;
    }

    if (sellerStep === 2) {
      const errors: Record<string, string> = {};
      if (selectedSkills.length === 0) {
        errors.skills = 'Selecciona al menos una categoría de especialidad';
      }
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
      setFieldErrors({});
      setSellerStep(3);
      return;
    }

    if (sellerStep === 3) {
      const errors: Record<string, string> = {};
      if (!proRegion.trim()) errors.region = 'Comunidad autónoma obligatoria';
      if (!proProvince.trim()) errors.province = 'Provincia obligatoria';
      if (!proCity.trim()) errors.city = 'Localidad o municipio obligatorio';
      if (!proPostalCode.trim() || proPostalCode.trim().length < 4) errors.postalCode = 'Código postal obligatorio';

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
      setFieldErrors({});
      handleCompleteSellerRegistration();
    }
  };

  const handleCompleteSellerRegistration = async () => {
    setIsUpgradingRole(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      const cleanPhoneDigits = proPhone.replace(/\D/g, '');
      const fullPhone = cleanPhoneDigits ? `${selectedCountry.dialCode}${cleanPhoneDigits}` : undefined;

      // 1. Actualizar perfil y ubicación en backend
      await authService.updateProfile({
        phoneNumber: fullPhone,
        country: 'España',
        region: proRegion.trim(),
        province: proProvince.trim(),
        city: proCity.trim(),
        postalCode: proPostalCode.trim(),
        address: proAddress.trim() || undefined,
      });

      // 2. Persistir perfil profesional en PostgreSQL (/professionals/me)
      await professionalsApi.updateMyProfile({
        businessName: businessName.trim(),
        skills: selectedSkills,
        hourlyRate: parseFloat(hourlyRate) || 35,
        serviceRadiusKm: parseInt(serviceRadius, 10) || 30,
        city: proCity.trim(),
        postalCode: proPostalCode.trim(),
        address: proAddress.trim() || undefined,
        country: 'España',
        region: proRegion.trim(),
        province: proProvince.trim(),
      });

      // 3. Actualizar roles y perfil profesional en el store
      const updatedRoles = Array.from(new Set([...(user?.roles || ['CLIENT']), 'PROFESSIONAL']));
      updateUser({
        roles: updatedRoles as any,
        phoneNumber: proPhone.trim(),
        region: proRegion.trim(),
        province: proProvince.trim(),
        city: proCity.trim(),
        postalCode: proPostalCode.trim(),
        address: proAddress.trim(),
        professionalProfile: {
          businessName: businessName.trim(),
          taxId: taxId.trim(),
          skills: selectedSkills,
          hourlyRate: parseFloat(hourlyRate) || 35,
          serviceRadiusKm: parseInt(serviceRadius, 10) || 30,
          address: {
            city: proCity.trim(),
            postalCode: proPostalCode.trim(),
            address: proAddress.trim(),
          },
        },
      });

      setShowSellerModal(false);
      setSellerStep(1);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      showAlert(
        '¡Registro Completado!',
        'Tu cuenta profesional ha sido activada con éxito. Ya puedes recibir presupuestos y pedidos en tu zona.'
      );
    } catch (e: any) {
      showAlert('Error', e.message || 'No se pudo completar el registro profesional.');
    } finally {
      setIsUpgradingRole(false);
    }
  };

  const isProfessional = user?.roles?.includes('PROFESSIONAL');
  const displayName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Usuario Yewi'
    : 'Invitado';

  const userRoleBadge = isProfessional ? 'Profesional' : t.client;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* 1. TOP HEADER BANNER (THEME ADAPTED BG) */}
      <View
        className="px-5 pb-5"
        style={{
          backgroundColor: colors.background,
          paddingTop: Math.max(insets.top + 8, 28),
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
        }}
      >
        <View className="flex-row justify-between items-center">
          {/* Left Avatar & User Info */}
          <ThemedTouchable
            onPress={() => {
              if (!isAuthenticated) router.push('/auth/login');
              else router.push('/(tabs)/profile/account');
            }}
            haptic="selection"
            className="flex-row items-center mr-3 flex-1"
          >
            <UserAvatar
              size={56}
              initial={displayName.charAt(0)}
              imageUri={user?.avatarUrl}
              isOnline={isOnline}
              onPressCamera={() => setShowPhotoModal(true)}
            />
            <View className="ml-3 flex-1">
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: 'Satoshi-Black',
                  color: colors.textPrimary,
                  letterSpacing: -0.5,
                }}
                numberOfLines={1}
              >
                {displayName}
              </Text>
              <Text
                style={{
                  fontSize: 12.5,
                  fontFamily: 'Satoshi-Medium',
                  color: colors.textSecondary,
                  marginTop: 2,
                }}
              >
                {isOnline ? t.online : t.offline} · {userRoleBadge}
              </Text>
            </View>
          </ThemedTouchable>

          {/* Top Right Bell Action -> Navigates to Notifications */}
          <ThemedTouchable
            onPress={() => router.push('/notifications' as any)}
            haptic="light"
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: isDark ? 1 : 0,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
            {unreadCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -3,
                  right: -3,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  paddingHorizontal: 4,
                  backgroundColor: '#EF4444',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1.5,
                  borderColor: colors.surface,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontFamily: 'Satoshi-Black' }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </ThemedTouchable>
        </View>
      </View>

      {/* 2. SCROLLABLE BODY CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 18,
          paddingHorizontal: 18,
          paddingBottom: 140,
        }}
      >
        {/* YEWI PRO SUBSCRIPTION HERO TICKET BANNER */}
        <View style={{ marginBottom: 24 }}>
          <HomePromoBanner
            ad={{
              id: 'yewi-pro-profile',
              variant: isPro ? 'pro' : 'seller',
              badge: isPro ? 'SUSCRIPCIÓN ACTIVA' : 'PLAN PROFESIONAL',
              title: isPro ? 'Yewi Pro Activo' : 'Yewi Pro (9,99 €/mes)',
              description: isPro
                ? 'Disfrutas de prioridad en solicitudes, contacto directo y cobertura en toda España.'
                : 'Multiplica tus clientes: recibe solicitudes primero y accede a contacto directo sin límites.',
              ctaText: isPro ? 'Gestionar Plan' : 'Ver ventajas',
              discountBadge: isPro ? 'PRO' : 'SELLER',
            }}
            onPress={() => router.push('/subscription')}
            onCtaPress={() => router.push('/subscription')}
          />
        </View>


        {/* SECTION 1: Mi Actividad */}
        <Text
          style={{
            fontSize: 17,
            fontFamily: 'Satoshi-Black',
            color: colors.textPrimary,
            marginBottom: 10,
            marginLeft: 4,
            letterSpacing: -0.3,
          }}
        >
          {t.sectionActivity}
        </Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
            marginBottom: 24,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDark ? 0.2 : 0.04,
            shadowRadius: 4,
          }}
        >
          {/* Item 1: Mi Perfil Profesional (o Activar Modo Profesional) */}
          <ThemedTouchable
            onPress={() => {
              if (isProfessional) {
                router.push({
                  pathname: '/detail',
                  params: { id: user?.id, entityType: 'professional' },
                });
              } else {
                router.push('/professional-profile');
              }
            }}
            haptic="selection"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
              paddingHorizontal: 18,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderSubtle,
            }}
          >
            <View className="flex-row items-center flex-1">
              <Ionicons
                name={isProfessional ? 'person-circle-outline' : 'briefcase-outline'}
                size={21}
                color={colors.primary}
              />
              <Text
                style={{
                  fontSize: 15.5,
                  fontFamily: 'Satoshi-Bold',
                  color: isProfessional ? colors.textPrimary : colors.primary,
                  marginLeft: 14,
                }}
              >
                {isProfessional ? 'Ver Mi Perfil Profesional' : 'Activar Modo Profesional'}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={isProfessional ? colors.textMuted : colors.primary}
            />
          </ThemedTouchable>

          {/* Item 1.5: Mis Proyectos y Servicios (Only for Professionals) */}
          {isProfessional && (
            <ThemedTouchable
              onPress={() => {
                setShowMyProjectsModal(true);
                fetchMyProjects();
              }}
              haptic="selection"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 16,
                paddingHorizontal: 18,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderSubtle,
              }}
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="construct-outline" size={21} color={colors.primary} />
                <Text
                  style={{
                    fontSize: 15.5,
                    fontFamily: 'Satoshi-Bold',
                    color: colors.textPrimary,
                    marginLeft: 14,
                  }}
                >
                  Mis Proyectos y Servicios
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </ThemedTouchable>
          )}



          {/* Item 2: Intereses */}
          <ThemedTouchable
            onPress={() => router.push('/(tabs)/profile/interests')}
            haptic="selection"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
              paddingHorizontal: 18,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderSubtle,
            }}
          >
            <View className="flex-row items-center flex-1">
              <MaterialCommunityIcons
                name="folder-text-outline"
                size={21}
                color={colors.textSecondary}
              />
              <Text
                style={{
                  fontSize: 15.5,
                  fontFamily: 'Satoshi-Bold',
                  color: colors.textPrimary,
                  marginLeft: 14,
                }}
              >
                {t.itemInterests}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </ThemedTouchable>

          {/* Item 3: Invitar amigos */}
          <ThemedTouchable
            onPress={handleShareApp}
            haptic="selection"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
              paddingHorizontal: 18,
            }}
          >
            <View className="flex-row items-center flex-1">
              <Ionicons name="paper-plane-outline" size={21} color={colors.textSecondary} />
              <Text
                style={{
                  fontSize: 15.5,
                  fontFamily: 'Satoshi-Bold',
                  color: colors.textPrimary,
                  marginLeft: 14,
                }}
              >
                {t.itemInvite}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </ThemedTouchable>
        </View>

        {/* SECTION 2: Configuración */}
        <Text
          style={{
            fontSize: 17,
            fontFamily: 'Satoshi-Black',
            color: colors.textPrimary,
            marginBottom: 10,
            marginLeft: 4,
            letterSpacing: -0.3,
          }}
        >
          {t.sectionAccount}
        </Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
            marginBottom: 24,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDark ? 0.2 : 0.04,
            shadowRadius: 4,
          }}
        >
          {/* Item 1: Preferencias (Clean Title) */}
          <ThemedTouchable
            onPress={() => router.push('/(tabs)/profile/preferences')}
            haptic="selection"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
              paddingHorizontal: 18,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderSubtle,
            }}
          >
            <View className="flex-row items-center flex-1">
              <Ionicons name="options-outline" size={21} color={colors.textSecondary} />
              <Text
                style={{
                  fontSize: 15.5,
                  fontFamily: 'Satoshi-Bold',
                  color: colors.textPrimary,
                  marginLeft: 14,
                }}
              >
                {t.itemPreferences}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </ThemedTouchable>

          {/* Item 2: Cuenta (Clean Title) */}
          <ThemedTouchable
            onPress={() => router.push('/(tabs)/profile/account')}
            haptic="selection"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
              paddingHorizontal: 18,
            }}
          >
            <View className="flex-row items-center flex-1">
              <Ionicons name="person-outline" size={21} color={colors.textSecondary} />
              <Text
                style={{
                  fontSize: 15.5,
                  fontFamily: 'Satoshi-Bold',
                  color: colors.textPrimary,
                  marginLeft: 14,
                }}
              >
                {t.itemAccount}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </ThemedTouchable>
        </View>

        {/* SECTION 3: Recursos y Modo Profesional */}
        <Text
          style={{
            fontSize: 17,
            fontFamily: 'Satoshi-Black',
            color: colors.textPrimary,
            marginBottom: 10,
            marginLeft: 4,
            letterSpacing: -0.3,
          }}
        >
          {t.sectionResources}
        </Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
            marginBottom: 32,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDark ? 0.2 : 0.04,
            shadowRadius: 4,
          }}
        >
          {/* Item 1: Soporte (Clean Title) */}
          <ThemedTouchable
            onPress={() => router.push('/(tabs)/profile/support')}
            haptic="selection"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
              paddingHorizontal: 18,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderSubtle,
            }}
          >
            <View className="flex-row items-center flex-1">
              <Ionicons name="help-buoy-outline" size={21} color={colors.textSecondary} />
              <Text
                style={{
                  fontSize: 15.5,
                  fontFamily: 'Satoshi-Bold',
                  color: colors.textPrimary,
                  marginLeft: 14,
                }}
              >
                {t.itemSupport}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </ThemedTouchable>

          {/* Item 2: Legal (Clean Title) */}
          <ThemedTouchable
            onPress={() => router.push('/(tabs)/profile/legal')}
            haptic="selection"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
              paddingHorizontal: 18,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderSubtle,
            }}
          >
            <View className="flex-row items-center flex-1">
              <Ionicons
                name="document-text-outline"
                size={21}
                color={colors.textSecondary}
              />
              <Text
                style={{
                  fontSize: 15.5,
                  fontFamily: 'Satoshi-Bold',
                  color: colors.textPrimary,
                  marginLeft: 14,
                }}
              >
                {t.itemLegal}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </ThemedTouchable>

          {/* Item 3: Suscripción Yewi Pro */}
          <ThemedTouchable
            onPress={() => router.push('/subscription')}
            haptic="selection"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
              paddingHorizontal: 18,
            }}
          >

            <View className="flex-row items-center flex-1">
              <Ionicons name="sparkles" size={21} color="#F59E0B" />
              <Text
                style={{
                  fontSize: 15.5,
                  fontFamily: 'Satoshi-Bold',
                  color: colors.textPrimary,
                  marginLeft: 14,
                }}
              >
                Suscripción Yewi Pro (9,99 €)
              </Text>
            </View>
            <View className="flex-row items-center">
              {isPro && (
                <View
                  style={{
                    backgroundColor: '#F59E0B20',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 8,
                    marginRight: 6,
                  }}
                >
                  <Text style={{ fontSize: 11, fontFamily: 'Satoshi-Black', color: '#F59E0B' }}>
                    PRO
                  </Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </ThemedTouchable>
        </View>


        {/* Footer Version */}
        <View className="items-center mb-6">
          <Text
            style={{
              fontSize: 12.5,
              fontFamily: 'Satoshi-Medium',
              color: colors.textMuted,
            }}
          >
            Yewi v1.0.0 · España
          </Text>
        </View>
      </ScrollView>

      {/* Profile Photo Modal */}
      <ProfilePhotoModal
        visible={showPhotoModal}
        isOnline={isOnline}
        hasPhoto={!!user?.avatarUrl}
        onClose={() => setShowPhotoModal(false)}
        onToggleOnline={setIsOnline}
        onSelectFromGallery={handleSelectFromGallery}
        onTakePhoto={handleTakePhoto}
        onRemovePhoto={handleRemovePhoto}
      />

      {/* FULL PROFESSIONAL / SELLER ONBOARDING MODAL (NON-SCROLLING STEPPER) */}
      <Modal
        visible={showSellerModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSellerModal(false)}
      >
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
            <ScrollView
              style={{ flex: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
            >
              <View className="flex-row items-center justify-between mb-3">
                <Text style={{ fontSize: 18, fontFamily: 'Satoshi-Black', color: colors.textPrimary }}>
                  {t.becomeSellerTitle}
                </Text>
                <ThemedTouchable onPress={() => setShowSellerModal(false)} haptic="light">
                  <Ionicons name="close-circle" size={26} color={colors.textMuted} />
                </ThemedTouchable>
              </View>

              {/* Progress Bar (3 steps) */}
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-1.5 flex-1 mr-4">
                  {[1, 2, 3].map((s) => (
                    <View
                      key={s}
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: s <= sellerStep ? colors.primary : colors.border,
                      }}
                    />
                  ))}
                </View>
                <Text style={{ fontSize: 12.5, fontFamily: 'Satoshi-Bold', color: colors.textSecondary }}>
                  Paso {sellerStep} de 3
                </Text>
              </View>

              {/* STEP 1: Datos de Empresa / Autónomo */}
              {sellerStep === 1 && (
                <View>
                  <Text style={{ fontSize: 21, fontFamily: 'Satoshi-Black', color: colors.textPrimary, marginBottom: 2 }}>
                    {t.stepCompany}
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Satoshi-Regular', color: colors.textSecondary, marginBottom: 14 }}>
                    Datos fiscales y de facturación para recibir pagos oficiales.
                  </Text>

                  <AuthInput
                    label="Nombre comercial o Razón social *"
                    leftIcon="business-outline"
                    value={businessName}
                    onChangeText={(txt) => {
                      setBusinessName(txt);
                      if (fieldErrors.businessName) setFieldErrors((prev) => ({ ...prev, businessName: undefined }));
                    }}
                    placeholder="Ej. Instalaciones Hermanos Gómez S.L."
                    error={fieldErrors.businessName}
                  />

                  <AuthInput
                    label="NIF / CIF / NIE de la empresa *"
                    leftIcon="card-outline"
                    value={taxId}
                    onChangeText={(txt) => {
                      setTaxId(txt.toUpperCase());
                      if (fieldErrors.taxId) setFieldErrors((prev) => ({ ...prev, taxId: undefined }));
                    }}
                    placeholder="Ej. B50123456 o 12345678Z"
                    autoCapitalize="characters"
                    maxLength={10}
                    error={fieldErrors.taxId}
                  />

                  {/* Teléfono con botón de prefijo internacional dinámico y autoformateo */}
                  <View style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        fontSize: 13.5,
                        fontFamily: 'Satoshi-Bold',
                        color: colors.textPrimary,
                        marginBottom: 6,
                        marginLeft: 4,
                      }}
                    >
                      Teléfono de contacto profesional *
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <ThemedTouchable
                        onPress={() => setShowCountryModal(true)}
                        haptic="light"
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: colors.surface,
                          borderRadius: 999,
                          paddingHorizontal: 12,
                          height: 48,
                          borderWidth: 1,
                          borderColor: colors.border,
                          gap: 4,
                        }}
                      >
                        <Text style={{ fontSize: 16 }}>{selectedCountry.flag}</Text>
                        <Text style={{ fontSize: 13.5, fontFamily: 'Satoshi-Bold', color: colors.textPrimary }}>
                          {selectedCountry.dialCode}
                        </Text>
                        <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
                      </ThemedTouchable>
                      <View className="flex-1">
                        <AuthInput
                          leftIcon="call-outline"
                          value={proPhone}
                          onChangeText={(txt) => {
                            const formatted = formatSpanishPhone(txt);
                            setProPhone(formatted);
                            if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                          }}
                          placeholder="612 345 678"
                          keyboardType="phone-pad"
                          maxLength={11}
                          error={fieldErrors.phone}
                          containerStyle={{ marginBottom: 0 }}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* STEP 2: Especialidades & Tarifas */}
              {sellerStep === 2 && (
                <View>
                  <Text style={{ fontSize: 21, fontFamily: 'Satoshi-Black', color: colors.textPrimary, marginBottom: 2 }}>
                    {t.stepServices}
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Satoshi-Regular', color: colors.textSecondary, marginBottom: 12 }}>
                    Selecciona las categorías donde prestarás tus servicios.
                  </Text>

                  <View className="flex-row flex-wrap gap-2.5 mb-2">
                    {CATEGORIES_LIST.map((cat) => (
                      <CategoryChip
                        key={cat.id}
                        label={cat.name}
                        isSelected={selectedSkills.includes(cat.name)}
                        onPress={() => toggleSkill(cat.name)}
                      />
                    ))}
                  </View>
                  {fieldErrors.skills ? (
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Satoshi-Medium',
                        color: colors.danger,
                        marginBottom: 12,
                        marginLeft: 4,
                      }}
                    >
                      {fieldErrors.skills}
                    </Text>
                  ) : (
                    <View style={{ marginBottom: 12 }} />
                  )}

                  <View className="flex-row gap-2.5">
                    <View className="flex-1">
                      <AuthInput
                        label="Tarifa / hora (€)"
                        leftIcon="cash-outline"
                        value={hourlyRate}
                        onChangeText={setHourlyRate}
                        placeholder="35"
                        keyboardType="numeric"
                      />
                    </View>
                    <View className="flex-1">
                      <AuthInput
                        label="Radio cobertura (Km)"
                        leftIcon="navigate-outline"
                        value={serviceRadius}
                        onChangeText={setServiceRadius}
                        placeholder="30"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* STEP 3: Ubicación y Dirección Fiscal */}
              {sellerStep === 3 && (
                <View>
                  <Text style={{ fontSize: 21, fontFamily: 'Satoshi-Black', color: colors.textPrimary, marginBottom: 2 }}>
                    {t.stepLocation}
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Satoshi-Regular', color: colors.textSecondary, marginBottom: 12 }}>
                    Ubicación base de tu taller o zona de operaciones.
                  </Text>

                  {/* GPS Auto-detect Button (Conventional Pill Style) */}
                  <ThemedTouchable
                    onPress={handleUseCurrentLocation}
                    disabled={isLocating}
                    haptic="medium"
                    style={{
                      height: 48,
                      borderRadius: 999,
                      backgroundColor: isDark ? '#27272A' : '#F4F4F5',
                      borderWidth: 1,
                      borderColor: colors.border,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                      gap: 8,
                    }}
                  >
                    {isLocating ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Ionicons name="navigate-outline" size={18} color={colors.primary} />
                    )}
                    <Text style={{ fontSize: 14, fontFamily: 'Satoshi-Bold', color: colors.textPrimary }}>
                      {isLocating ? 'Detectando ubicación...' : 'Usar mi ubicación actual'}
                    </Text>
                  </ThemedTouchable>

                  <View className="flex-row gap-2.5">
                    <View className="flex-1">
                      <AuthInput
                        label="Comunidad Autónoma *"
                        leftIcon="globe-outline"
                        value={proRegion}
                        onChangeText={(txt) => {
                          setProRegion(txt);
                          if (fieldErrors.region) setFieldErrors((prev) => ({ ...prev, region: undefined }));
                        }}
                        placeholder="Aragón"
                        error={fieldErrors.region}
                      />
                    </View>
                    <View className="flex-1">
                      <AuthInput
                        label="Provincia *"
                        leftIcon="map-outline"
                        value={proProvince}
                        onChangeText={(txt) => {
                          setProProvince(txt);
                          if (fieldErrors.province) setFieldErrors((prev) => ({ ...prev, province: undefined }));
                        }}
                        placeholder="Zaragoza"
                        error={fieldErrors.province}
                      />
                    </View>
                  </View>

                  <View className="flex-row gap-2.5">
                    <View className="flex-[1.1]">
                      <AuthInput
                        label="Localidad *"
                        leftIcon="location-outline"
                        value={proCity}
                        onChangeText={(txt) => {
                          setProCity(txt);
                          if (fieldErrors.city) setFieldErrors((prev) => ({ ...prev, city: undefined }));
                        }}
                        placeholder="Zaragoza"
                        error={fieldErrors.city}
                      />
                    </View>
                    <View className="flex-[0.9]">
                      <AuthInput
                        label="Código Postal *"
                        leftIcon="mail-unread-outline"
                        value={proPostalCode}
                        onChangeText={handlePostalCodeChange}
                        placeholder="50001"
                        keyboardType="numeric"
                        maxLength={5}
                        error={fieldErrors.postalCode}
                      />
                    </View>
                  </View>

                  <AuthInput
                    label="Dirección fiscal o taller"
                    leftIcon="business-outline"
                    value={proAddress}
                    onChangeText={setProAddress}
                    placeholder="Calle, nave o polígono"
                  />
                </View>
              )}
            </ScrollView>

            {/* Bottom Navigation Buttons (Non-scrolling footer) */}
            <View className="flex-row items-center gap-3 pt-3 border-t border-[#E5E5EA]">
              {sellerStep > 1 && (
                <View style={{ width: 100 }}>
                  <ThemedTouchable
                    onPress={() => setSellerStep((prev) => prev - 1)}
                    haptic="light"
                    style={{
                      height: 50,
                      borderRadius: 999,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14.5, fontFamily: 'Satoshi-Bold', color: colors.textPrimary }}>
                      {t.back}
                    </Text>
                  </ThemedTouchable>
                </View>
              )}

              <View className="flex-1">
                <ThemedTouchable
                  onPress={handleNextSellerStep}
                  disabled={isUpgradingRole}
                  haptic="medium"
                  style={{
                    height: 50,
                    borderRadius: 999,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isUpgradingRole ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: 'Satoshi-Bold' }}>
                      {sellerStep === 3 ? t.activateProBtn : t.next}
                    </Text>
                  )}
                </ThemedTouchable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Country Prefix Selector Modal */}

      <Modal
        visible={showCountryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}
          onPress={() => setShowCountryModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              padding: 22,
              paddingBottom: Math.max(insets.bottom + 16, 28),
              maxHeight: '70%',
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={{
                width: 44,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.border,
                alignSelf: 'center',
                marginBottom: 16,
              }}
            />
            <Text
              style={{
                fontSize: 18,
                fontFamily: 'Satoshi-Black',
                color: colors.textPrimary,
                marginBottom: 14,
              }}
            >
              Selecciona tu país o prefijo
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {COUNTRY_PREFIXES.map((country) => {
                const isSelected = selectedCountry.code === country.code;
                return (
                  <ThemedTouchable
                    key={country.code}
                    onPress={() => {
                      setSelectedCountry(country);
                      setShowCountryModal(false);
                    }}
                    haptic="selection"
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.borderSubtle,
                    }}
                  >
                    <View className="flex-row items-center gap-3">
                      <Text style={{ fontSize: 22 }}>{country.flag}</Text>
                      <Text
                        style={{
                          fontSize: 15,
                          fontFamily: isSelected ? 'Satoshi-Bold' : 'Satoshi-Medium',
                          color: colors.textPrimary,
                        }}
                      >
                        {country.name}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text
                        style={{
                          fontSize: 14.5,
                          fontFamily: 'Satoshi-Bold',
                          color: isSelected ? colors.primary : colors.textSecondary,
                        }}
                      >
                        {country.dialCode}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                      )}
                    </View>
                  </ThemedTouchable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* My Projects & Services Modal */}
      <Modal
        visible={showMyProjectsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMyProjectsModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: Math.max(insets.top + 8, 20) }}>
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingBottom: 14,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderSubtle,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View>
              <Text style={{ fontSize: 20, fontFamily: 'Satoshi-Black', color: colors.textPrimary }}>
                Mis Proyectos Publicados
              </Text>
              <Text style={{ fontSize: 12.5, fontFamily: 'Satoshi-Medium', color: colors.textSecondary, marginTop: 2 }}>
                Trabajos y servicios a precio cerrado ofrecidos por ti
              </Text>
            </View>
            <ThemedTouchable
              onPress={() => setShowMyProjectsModal(false)}
              haptic="light"
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </ThemedTouchable>
          </View>

          {/* Action Bar */}
          <View style={{ paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, fontFamily: 'Satoshi-Bold', color: colors.textSecondary }}>
              Proyectos activos ({myProjects.length})
            </Text>
            <ThemedTouchable
              onPress={() => setShowPublishProjectModal(true)}
              haptic="medium"
              style={{
                backgroundColor: colors.primary,
                borderRadius: 999,
                paddingHorizontal: 14,
                paddingVertical: 7,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: 'Satoshi-Bold' }}>
                + Publicar Proyecto
              </Text>
            </ThemedTouchable>
          </View>

          {/* Projects List */}
          {loadingMyProjects ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ fontSize: 13.5, fontFamily: 'Satoshi-Medium', color: colors.textSecondary, marginTop: 10 }}>
                Cargando tus proyectos...
              </Text>
            </View>
          ) : myProjects.length > 0 ? (
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: Math.max(insets.bottom + 30, 40) }}
              showsVerticalScrollIndicator={false}
            >
              {myProjects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onPress={() => {
                    setShowMyProjectsModal(false);
                    router.push({
                      pathname: '/detail',
                      params: { id: p.id, entityType: 'gig' },
                    });
                  }}
                  onDelete={handleDeleteMyProject}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}>
              <View
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 34,
                  backgroundColor: colors.surfaceAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Ionicons name="construct-outline" size={32} color={colors.primary} />
              </View>
              <Text style={{ fontSize: 17, fontFamily: 'Satoshi-Bold', color: colors.textPrimary, marginBottom: 6, textAlign: 'center' }}>
                Aún no has publicado ningún proyecto
              </Text>
              <Text style={{ fontSize: 13, fontFamily: 'Satoshi-Regular', color: colors.textSecondary, textAlign: 'center', marginBottom: 20, maxWidth: 280, lineHeight: 19 }}>
                Publica trabajos específicos (ej: Cambio de baldosas 200€ en 5 días) para que los clientes de tu zona te contraten directamente.
              </Text>
              <ThemedTouchable
                onPress={() => setShowPublishProjectModal(true)}
                haptic="medium"
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 999,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontFamily: 'Satoshi-Bold' }}>
                  + Publicar Mi Primer Proyecto
                </Text>
              </ThemedTouchable>
            </View>
          )}
        </View>
      </Modal>

      {/* Publish Project Modal */}
      <PublishProjectModal
        visible={showPublishProjectModal}
        onClose={() => setShowPublishProjectModal(false)}
        onSuccess={(newP) => {
          setMyProjects((prev) => [newP, ...prev]);
          setShowPublishProjectModal(false);
        }}
      />

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

export default ProfileTemplate;
