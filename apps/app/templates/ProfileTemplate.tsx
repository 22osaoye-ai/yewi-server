import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Share, Modal, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeInUp,
  SlideInDown,
  SlideOutDown,
  Easing,
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useAuth as useClerkAuth } from '@clerk/expo';
import { GlassView } from 'expo-glass-effect';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect, Circle, Path } from 'react-native-svg';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { CustomAlert } from '@/components/ui/CustomAlert';
import { Badge, Button } from '@/components/ui';
import { AuthInput } from '@/components/auth/AuthInput';
import { useAuthStore } from '@/store/useAuthStore';
import { authService } from '@/services/authService';
import { professionalsApi } from '@/services/professionalsApi';
import { ProfilePhotoModal } from '@/components/profile/ProfilePhotoModal';
import { ManageRatesModal } from '@/components/profile/ManageRatesModal';
import { CATEGORIES_LIST } from '@/constants/categories';
import { useAppTheme } from '@/hooks/useAppTheme';
import { isUserProfessional } from '@/hooks/useUserRole';
import { spanishGeoService, SPANISH_PROVINCES } from '@/services/spanishGeoService';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { HomePromoBanner } from '@/components/ui/HomePromoBanner';
import { useRealtimeStore } from '@/store/useRealtimeStore';
import { gigsApi, GigDetail } from '@/services/gigsApi';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { AmbientScreenBackground } from '@/components/ui/AmbientScreenBackground';
import { SAMPLE_PROJECTS } from '@/constants/sampleData';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { Image } from 'expo-image';

import { paymentsApi } from '@/services/paymentsApi';
import { SkeletonBanner } from '@/components/ui/Skeleton';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PROFILE_CARD_WIDTH = Math.floor((SCREEN_WIDTH - 40 - 12) / 2);
const PROFILE_CARD_HEIGHT = Math.round(PROFILE_CARD_WIDTH * 1.25);
const REQUEST_CARD_WIDTH = Math.floor(SCREEN_WIDTH - 40);
const REQUEST_CARD_HEIGHT = 185;
const REVIEW_CARD_WIDTH = Math.floor(SCREEN_WIDTH - 40);
const REVIEW_CARD_HEIGHT = 195;

import { getScoopedCardPath } from '@/components/ui/ScoopedCard';

export const getRequestCardCutoutPath = getScoopedCardPath;

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
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const unreadCount = useRealtimeStore((state) => state.unreadCount);
  const isProfessional = isUserProfessional(user);
  const [isPro, setIsPro] = useState<boolean>(isProfessional);
  const [isCheckingPro, setIsCheckingPro] = useState<boolean>(false);

  // Reanimated scroll shared value for sticky animated header
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Seamless synchronized header transition
  const headerBgStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [60, 100],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity,
    };
  });

  // Header identity (compact avatar + title + role) fades in simultaneously without distortion
  const headerIdentityStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      scrollY.value,
      [70, 110],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity: progress,
      transform: [
        { translateY: interpolate(progress, [0, 1], [6, 0]) },
      ],
    };
  });

  // Hero avatar fades out smoothly into header with zero awkward scaling or detached translation
  const heroAvatarAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [70, 110],
      [1, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity,
    };
  });

  // Hero identity name & badge fades out smoothly on scroll over the exact same range
  const heroIdentityAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [70, 110],
      [1, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity,
    };
  });

  useEffect(() => {
    setIsPro(isProfessional);
  }, [isProfessional]);

  const { signOut } = useClerkAuth();

  // Modal & Status States
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showPhotoModal, setShowPhotoModal] = useState<boolean>(false);
  const [showRatesModal, setShowRatesModal] = useState<boolean>(false);
  const [showSellerModal, setShowSellerModal] = useState<boolean>(false);
  const [showCountryModal, setShowCountryModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryPrefix>(COUNTRY_PREFIXES[0]);

  const [sellerStep, setSellerStep] = useState<number>(1);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      await authService.deleteAccount();
      await signOut?.().catch(() => {});
      setShowDeleteModal(false);
      router.replace('/auth/login');
    } catch (e: any) {
      showAlert('Error', e.message || 'No se pudo eliminar la cuenta en este momento.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Projects & Profile Tabs State
  const [showActionsMenu, setShowActionsMenu] = useState<boolean>(false);
  const [showMyProjectsModal, setShowMyProjectsModal] = useState<boolean>(false);
  const [myProjects, setMyProjects] = useState<GigDetail[]>([]);
  const [loadingMyProjects, setLoadingMyProjects] = useState<boolean>(false);
  const [profileTab, setProfileTab] = useState<'projects' | 'requests' | 'saved'>('projects');
  const { favorites, toggleFavorite } = useFavoritesStore();
  const savedProjects = useMemo(() => {
    const filtered = SAMPLE_PROJECTS.filter(
      (p) => favorites.includes(p.id) || favorites.includes(p.id.replace('gig-', ''))
    );
    return filtered.length > 0 ? filtered : SAMPLE_PROJECTS.slice(0, 4);
  }, [favorites]);

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

  useEffect(() => {
    fetchMyProjects();
  }, [fetchMyProjects]);

  const displayProjects = myProjects.length > 0 ? myProjects : SAMPLE_PROJECTS.slice(0, 6);

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
        taxId: taxId.trim(),
        bio: `Servicios profesionales de ${businessName.trim() || user?.firstName || 'calidad'}.`,
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

  const displayName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Usuario Yewi'
    : 'Invitado';

  const userRoleBadge = isProfessional ? 'Profesional' : t.client;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* 1. STICKY ANIMATED HEADER (Solid clean surface fading in on scroll, Mini Avatar + Name) */}
      <Animated.View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          height: insets.top + 70,
          paddingTop: insets.top,
          justifyContent: 'center',
        }}
      >
        {/* Solid Opaque Background on scroll - 100% ZERO TRANSPARENCY */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              borderBottomWidth: 1,
              borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 4,
            },
            headerBgStyle,
          ]}
          pointerEvents="none"
        />

        {/* Content Row: 70px height matching Home AppHeader */}
        <View
          style={{
            height: 70,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left: Back button + Avatar (52x52 matching Home) + Title */}
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
            <ThemedTouchable
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)/search');
                }
              }}
              haptic="light"
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                marginRight: 10,
                backgroundColor: isDark ? '#27272A' : '#FFFFFF',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 6,
                elevation: 2,
              }}
              accessibilityRole="button"
              accessibilityLabel="Atrás"
            >
              <Ionicons name="chevron-back" size={24} color={isDark ? '#F1F5F9' : '#0D0C22'} />
            </ThemedTouchable>

            {/* Unified Header Identity: Compact 40x40 Avatar + Name + Subtitle (Zero deformation, perfect cross-fade) */}
            <Animated.View
              style={[
                headerIdentityStyle,
                { flexDirection: 'row', alignItems: 'center', flex: 1 },
              ]}
              pointerEvents="box-none"
            >
              <ThemedTouchable
                onPress={() => setShowPhotoModal(true)}
                haptic="light"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  overflow: 'hidden',
                  marginRight: 10,
                  borderWidth: 1.5,
                  borderColor: isDark ? '#38BDF8' : '#7DD3FC',
                  backgroundColor: isDark ? '#1E293B' : '#E0F2FE',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 2,
                }}
                accessibilityRole="button"
                accessibilityLabel="Perfil de usuario"
              >
                {user?.avatarUrl ? (
                  <Image
                    source={{ uri: user.avatarUrl }}
                    style={{ width: 40, height: 40 }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.primary }}>
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                )}
              </ThemedTouchable>

              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 15.5,
                    fontFamily: 'PlusJakartaSans-Bold',
                    color: colors.textPrimary,
                    letterSpacing: -0.2,
                  }}
                >
                  {displayName}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 11,
                    fontFamily: 'PlusJakartaSans-Medium',
                    color: colors.textSecondary,
                  }}
                >
                  {userRoleBadge}
                </Text>
              </View>
            </Animated.View>
          </View>

          {/* Right: Actions Cluster matching Home AppHeader (48x48, size 24, crisp background) */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* 3-Dots Button for Quick Actions Dropdown (Editar, Configuración, Compartir) */}
            <ThemedTouchable
              onPress={() => setShowActionsMenu(true)}
              haptic="light"
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: isDark ? '#27272A' : '#FFFFFF',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 6,
                elevation: 2,
              }}
              accessibilityRole="button"
              accessibilityLabel="Más opciones"
            >
              <Ionicons name="ellipsis-horizontal" size={24} color={isDark ? '#F1F5F9' : '#0D0C22'} />
            </ThemedTouchable>

            <ThemedTouchable
              onPress={() => router.push('/notifications' as any)}
              haptic="light"
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: isDark ? '#27272A' : '#FFFFFF',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 6,
                elevation: 2,
              }}
              accessibilityRole="button"
              accessibilityLabel="Notificaciones"
            >
              <Ionicons name="notifications-outline" size={24} color={isDark ? '#F1F5F9' : '#0D0C22'} />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: '#EF4444',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 4,
                    borderWidth: 1.5,
                    borderColor: colors.surface,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 9, fontFamily: 'PlusJakartaSans-ExtraBold' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </ThemedTouchable>
          </View>
        </View>

      </Animated.View>

      {/* 2. SCROLLABLE BODY CONTENT */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          minHeight: SCREEN_HEIGHT + 140,
          paddingBottom: 140,
        }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* MOVIE DETAIL CINEMATIC BACKDROP HERO (Home-matched ambient gradient & filled glassmorphism panel) */}
        <View style={{ width: '100%', position: 'relative' }}>
          {/* Backdrop Cover Image */}
          <View
            style={{
              width: '100%',
              height: 280,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Image
              source={{
                uri:
                  (user as any)?.coverImageUrl ||
                  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=85',
              }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />

            {/* Top vignette for button readability */}
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: 'rgba(0, 0, 0, 0.15)',
                },
              ]}
            />

            {/* Seamless Pure Fade Gradient into Home Ambient Turquoise */}
            <Svg
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            >
              <Defs>
                <SvgLinearGradient id="heroAmbientFade" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={colors.background} stopOpacity={0.0} />
                  <Stop offset="35%" stopColor={colors.background} stopOpacity={0.0} />
                  <Stop offset="65%" stopColor={colors.background} stopOpacity={0.50} />
                  <Stop offset="85%" stopColor={colors.background} stopOpacity={0.88} />
                  <Stop offset="94%" stopColor={colors.background} stopOpacity={1.0} />
                  <Stop offset="100%" stopColor={colors.background} stopOpacity={1.0} />
                </SvgLinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#heroAmbientFade)" />
            </Svg>
          </View>

          {/* USER IDENTITY SECTION (Direct ambient layout, NO enclosing box/card) */}
          <View
            style={{
              paddingHorizontal: 20,
              marginTop: -46,
              zIndex: 10,
            }}
          >
            {/* Identity Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              {/* WhatsApp Animated Hero Avatar: ascends and shrinks towards header */}
              <Animated.View style={heroAvatarAnimatedStyle}>
                <ThemedTouchable
                  onPress={() => setShowPhotoModal(true)}
                  haptic="light"
                  activeOpacity={0.9}
                  accessibilityRole="button"
                  accessibilityLabel="Cambiar foto de perfil"
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: 42,
                    borderWidth: 3.5,
                    borderColor: isDark ? '#1E293B' : '#FFFFFF',
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.16,
                    shadowRadius: 8,
                    elevation: 5,
                  }}
                >
                  {user?.avatarUrl ? (
                    <Image
                      source={{ uri: user.avatarUrl }}
                      style={{ width: 78, height: 78, borderRadius: 39 }}
                      contentFit="cover"
                      transition={150}
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <Text
                      style={{
                        fontSize: 32,
                        fontFamily: 'PlusJakartaSans-ExtraBold',
                        color: isDark ? colors.primary : '#0369A1',
                      }}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </ThemedTouchable>
              </Animated.View>

              {/* Title & Metadata Column - Fades out before header title arrives */}
              <Animated.View style={[heroIdentityAnimatedStyle, { flex: 1, justifyContent: 'center' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text
                    style={{
                      fontSize: 22,
                      fontFamily: 'PlusJakartaSans-ExtraBold',
                      color: isDark ? '#FFFFFF' : '#0F172A',
                      letterSpacing: -0.3,
                    }}
                    numberOfLines={1}
                  >
                    {displayName}
                  </Text>
                  {isProfessional && (
                    <Ionicons name="checkmark-circle" size={20} color="#0284C7" />
                  )}
                </View>

                {/* Badges: Location */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3.5 }}>
                    <Ionicons name="location-sharp" size={13.5} color={isDark ? '#38BDF8' : '#0284C7'} />
                    <Text style={{ fontSize: 12.5, fontFamily: 'PlusJakartaSans-SemiBold', color: isDark ? '#E2E8F0' : '#334155' }}>
                      {user?.city ? `${user.city}, España` : 'España'}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            </View>

            {/* Description / Bio Tagline directly on ambient background */}
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'PlusJakartaSans-Medium',
                color: isDark ? '#CBD5E1' : '#334155',
                marginTop: 12,
                lineHeight: 18,
                paddingHorizontal: 2,
              }}
              numberOfLines={2}
            >
              {user?.professionalProfile?.businessName
                ? `${user.professionalProfile.businessName} · Trabajos garantizados y atención inmediata.`
                : 'Profesional verificado en reformas y proyectos para el hogar.'}
            </Text>
          </View>
        </View>

        {/* Stats Row - Clean floating layout directly on background, NO enclosing card or box */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            marginTop: 22,
            paddingHorizontal: 24,
          }}
        >
          {/* Stat 1: Proyectos */}
          <ThemedTouchable
            onPress={() => setProfileTab('projects')}
            haptic="selection"
            style={{ alignItems: 'center', flex: 1 }}
          >
            <Text
              style={{
                fontSize: 18,
                fontFamily: 'PlusJakartaSans-Bold',
                color: isDark ? '#FFFFFF' : '#0F172A',
                letterSpacing: -0.2,
              }}
            >
              {displayProjects.length}
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'PlusJakartaSans-Regular',
                color: isDark ? '#94A3B8' : '#475569',
                marginTop: 4,
              }}
            >
              Proyectos
            </Text>
          </ThemedTouchable>

          {/* Thin Vertical Divider */}
          <View
            style={{
              width: 1,
              height: 28,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)',
            }}
          />

          {/* Stat 2: Valoración */}
          <ThemedTouchable
            onPress={() => setProfileTab('projects')}
            haptic="selection"
            style={{ alignItems: 'center', flex: 1 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: 'PlusJakartaSans-Bold',
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  letterSpacing: -0.2,
                }}
              >
                4.9
              </Text>
              <Ionicons name="star" size={13} color="#F59E0B" />
            </View>
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'PlusJakartaSans-Regular',
                color: isDark ? '#94A3B8' : '#475569',
                marginTop: 4,
              }}
            >
              Valoración
            </Text>
          </ThemedTouchable>

          {/* Thin Vertical Divider */}
          <View
            style={{
              width: 1,
              height: 28,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)',
            }}
          />

          {/* Stat 3: Solicitudes */}
          <ThemedTouchable
            onPress={() => setProfileTab('requests')}
            haptic="selection"
            style={{ alignItems: 'center', flex: 1 }}
          >
            <Text
              style={{
                fontSize: 18,
                fontFamily: 'PlusJakartaSans-Bold',
                color: isDark ? '#FFFFFF' : '#0F172A',
                letterSpacing: -0.2,
              }}
            >
              {isProfessional ? '100%' : '12'}
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'PlusJakartaSans-Regular',
                color: isDark ? '#94A3B8' : '#475569',
                marginTop: 4,
              }}
            >
              Solicitudes
            </Text>
          </ThemedTouchable>
        </View>

        {/* Dynamic Pro Action / Onboarding Banner (Clean & Focused) */}
        {isProfessional ? (
          <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 20, marginTop: 18 }}>
            <ThemedTouchable
              onPress={() => router.push('/publish?type=service' as any)}
              haptic="medium"
              style={{
                flex: 1,
                height: 44,
                borderRadius: 999,
                backgroundColor: '#0284C7',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Ionicons name="add" size={19} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 13.5, fontFamily: 'PlusJakartaSans-Bold' }}>
                Publicar Proyecto
              </Text>
            </ThemedTouchable>

            <ThemedTouchable
              onPress={() => setShowRatesModal(true)}
              haptic="light"
              style={{
                height: 44,
                paddingHorizontal: 16,
                borderRadius: 999,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.05)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: isDark ? '#FFFFFF' : '#0F172A', fontSize: 13, fontFamily: 'PlusJakartaSans-SemiBold' }}>
                Editar Tarifas
              </Text>
            </ThemedTouchable>
          </View>
        ) : (
          <ThemedTouchable
            onPress={() => setShowSellerModal(true)}
            haptic="medium"
            style={{
              marginHorizontal: 20,
              marginTop: 14,
              padding: 14,
              borderRadius: 20,
              backgroundColor: isDark ? 'rgba(2, 132, 199, 0.12)' : '#F0F9FF',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(2, 132, 199, 0.25)' : '#BAE6FD',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 10 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#0284C7',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="briefcase" size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13.5, fontFamily: 'PlusJakartaSans-Bold', color: isDark ? '#FFFFFF' : '#0369A1' }}>
                  Activar Perfil Profesional
                </Text>
                <Text numberOfLines={1} style={{ fontSize: 11.5, fontFamily: 'PlusJakartaSans-Regular', color: isDark ? '#94A3B8' : '#0284C7', marginTop: 1 }}>
                  Publica tus servicios y recibe cobros protegidos por Escrow
                </Text>
              </View>
            </View>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: '#0284C7',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontFamily: 'PlusJakartaSans-Bold' }}>
                Empezar
              </Text>
            </View>
          </ThemedTouchable>
        )}

        {/* 3 TABS: PROYECTOS, SOLICITUDES, GUARDADOS - Styled like App TabBar (Active Capsule Pill with Icon + Title) */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            marginHorizontal: 20,
            marginTop: 22,
            marginBottom: 20,
          }}
        >
          {[
            { id: 'projects' as const, label: 'Proyectos', icon: 'grid' as const },
            { id: 'requests' as const, label: 'Solicitudes', icon: 'document-text' as const },
            { id: 'saved' as const, label: 'Guardados', icon: 'bookmark' as const },
          ].map((tab) => {
            const isFocused = profileTab === tab.id;

            if (isFocused) {
              return (
                <ThemedTouchable
                  key={tab.id}
                  onPress={() => setProfileTab(tab.id)}
                  haptic="selection"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isDark ? '#27272A' : '#F1F5F9',
                    borderRadius: 999,
                    paddingLeft: 4,
                    paddingRight: 18,
                    paddingVertical: 4,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.04)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1.5 },
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                    elevation: 2,
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: true }}
                  accessibilityLabel={tab.label}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: '#0284C7',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={tab.icon} size={24} color="#FFFFFF" />
                  </View>
                  <Text
                    style={{
                      fontFamily: 'PlusJakartaSans-Bold',
                      fontSize: 13.5,
                      marginLeft: 8,
                      color: isDark ? '#FFFFFF' : '#0F172A',
                      letterSpacing: -0.2,
                    }}
                  >
                    {tab.label}
                  </Text>
                </ThemedTouchable>
              );
            }

            return (
              <ThemedTouchable
                key={tab.id}
                onPress={() => setProfileTab(tab.id)}
                haptic="selection"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: false }}
                accessibilityLabel={tab.label}
              >
                <Ionicons
                  name={`${tab.icon}-outline` as any}
                  size={24}
                  color={isDark ? '#64748B' : '#94A3B8'}
                />
              </ThemedTouchable>
            );
          })}
        </View>

        {/* TAB 1: PORTAFOLIO / PROYECTOS (Consistent Yewi Cards: Rating Badge + Price Pill + Circular Arrow ↗) */}
        {profileTab === 'projects' && (
          <Animated.View entering={FadeIn.duration(160)}>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                rowGap: 16,
              }}
            >
              {displayProjects.map((p) => {
                const coverUri =
                  p.coverImages?.[0] ||
                  p.professionalProfile?.portfolioItems?.[0]?.imageUrls?.[0] ||
                  'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80';
                const price = p.packages?.[0]?.price || 300;
                const rating = p.professionalProfile?.avgRating || 5.0;

                return (
                  <ThemedTouchable
                    key={p.id}
                    onPress={() => {
                      router.push({
                        pathname: '/detail',
                        params: { id: p.id, entityType: 'gig' },
                      });
                    }}
                    haptic="light"
                    activeOpacity={0.92}
                    style={{
                      width: PROFILE_CARD_WIDTH,
                      height: PROFILE_CARD_HEIGHT,
                      borderRadius: 28,
                      overflow: 'hidden',
                      position: 'relative',
                      backgroundColor: isDark ? '#1C1E26' : '#F1F3F5',
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={p.title}
                  >
                    {/* Full Card Image (Exact Home Standard - Edge-to-Edge) */}
                    <Image
                      source={{ uri: coverUri }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      transition={150}
                      cachePolicy="memory-disk"
                    />

                    {/* Top-Left Rating Pill Badge (Exact match to Home Image 3) */}
                    <View
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 3.5,
                        paddingHorizontal: 9,
                        paddingVertical: 5,
                        borderRadius: 999,
                        backgroundColor: '#FFFFFF',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.06,
                        shadowRadius: 3,
                        elevation: 2,
                      }}
                    >
                      <Ionicons name="star" size={11.5} color="#F59E0B" />
                      <Text style={{ fontSize: 11.5, fontFamily: 'PlusJakartaSans-Bold', color: '#0F172A' }}>
                        {rating.toFixed(1)}
                      </Text>
                    </View>

                    {/* Top-Right Edit Action Button (for professional owner) */}
                    {isProfessional && (
                      <ThemedTouchable
                        onPress={(e) => {
                          e.stopPropagation?.();
                          router.push(`/publish?type=service&editId=${p.id}` as any);
                        }}
                        haptic="light"
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: '#FFFFFF',
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 3,
                          elevation: 3,
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Editar Proyecto"
                      >
                        <Ionicons name="pencil" size={13} color="#0284C7" />
                      </ThemedTouchable>
                    )}

                    {/* Bottom-Left Price Pill Badge (Exact match to Home Image 3) */}
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 10,
                        left: 10,
                        flexDirection: 'row',
                        alignItems: 'baseline',
                        paddingHorizontal: 11,
                        paddingVertical: 6.5,
                        borderRadius: 999,
                        backgroundColor: '#FFFFFF',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.06,
                        shadowRadius: 3,
                        elevation: 2,
                      }}
                    >
                      <Text style={{ fontSize: 10.5, fontFamily: 'PlusJakartaSans-Medium', color: '#64748B' }}>
                        Desde{' '}
                      </Text>
                      <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#0F172A' }}>
                        {price} €
                      </Text>
                    </View>

                    {/* Bottom-Right Circular Action Arrow ↗ (Exact match to Home Image 3) */}
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 10,
                        right: 10,
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: '#FFFFFF',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.06,
                        shadowRadius: 3,
                        elevation: 2,
                      }}
                    >
                      <Ionicons
                        name="arrow-up"
                        size={16}
                        color="#0F172A"
                        style={{ transform: [{ rotate: '45deg' }] }}
                      />
                    </View>
                  </ThemedTouchable>
                );
              })}
            </View>

            {/* SECTION: OPINIONES Y VALORACIONES (Merged under Proyectos) */}
            <View style={{ marginTop: 32, paddingHorizontal: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily: 'PlusJakartaSans-ExtraBold',
                    color: colors.textPrimary,
                    letterSpacing: -0.3,
                  }}
                >
                  Opiniones y Reseñas
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                    borderRadius: 999,
                  }}
                >
                  <Ionicons name="star" size={13} color="#F59E0B" />
                  <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans-Bold', color: '#D97706' }}>
                    4.9 · 42 op.
                  </Text>
                </View>
              </View>

              {/* Rating Summary Card with Relief */}
              <View
                style={{
                  backgroundColor: isDark ? '#1C1E26' : '#FFFFFF',
                  borderRadius: 24,
                  padding: 20,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  elevation: 4,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                  marginBottom: 16,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ fontSize: 34, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.textPrimary }}>
                      4.9
                    </Text>
                    <View>
                      <View style={{ flexDirection: 'row', gap: 2 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Ionicons key={s} name="star" size={15} color="#F59E0B" />
                        ))}
                      </View>
                      <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans-Medium', color: colors.textSecondary, marginTop: 2 }}>
                        42 opiniones verificadas
                      </Text>
                    </View>
                  </View>
                  {/* Elevated Top Valorado Pill */}
                  <View
                    style={{
                      backgroundColor: isDark ? 'rgba(5, 150, 105, 0.25)' : '#D1FAE5',
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                      borderRadius: 999,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1.5 },
                      shadowOpacity: 0.06,
                      shadowRadius: 3,
                      elevation: 2,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans-Bold', color: '#059669' }}>
                      Top Valorado
                    </Text>
                  </View>
                </View>

                {/* Rating Bars - 5★ to 1★ complete breakdown */}
                <View style={{ gap: 6, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', paddingTop: 14 }}>
                  {[
                    { star: 5, pct: 92 },
                    { star: 4, pct: 8 },
                    { star: 3, pct: 0 },
                    { star: 2, pct: 0 },
                    { star: 1, pct: 0 },
                  ].map(({ star, pct }) => (
                    <View key={star} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans-Medium', color: colors.textMuted, width: 22 }}>
                        {star}★
                      </Text>
                      <View style={{ flex: 1, height: 7, borderRadius: 3.5, backgroundColor: isDark ? '#27272A' : '#E4E4E7', overflow: 'hidden' }}>
                        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: pct > 0 ? '#F59E0B' : 'transparent', borderRadius: 3.5 }} />
                      </View>
                      <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans-Medium', color: colors.textMuted, width: 28, textAlign: 'right' }}>
                        {pct}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Customer Review Items with Cutout Scoop */}
              <View style={{ gap: 16 }}>
                {[
                  {
                    id: '1',
                    name: 'Carlos Mendoza',
                    date: 'Hace 3 días',
                    rating: 5,
                    comment: 'Excelente profesional. Trabajo impecable, muy puntual y con custodia escrow sin sorpresas.',
                    work: 'Reforma de Baño',
                  },
                  {
                    id: '2',
                    name: 'Elena Gómez',
                    date: 'Hace 1 semana',
                    rating: 5,
                    comment: 'Muy recomendable. La comunicación fue perfecta y el resultado final superó las expectativas.',
                    work: 'Instalación Eléctrica',
                  },
                  {
                    id: '3',
                    name: 'Miguel Ángel Torres',
                    date: 'Hace 2 semanas',
                    rating: 5,
                    comment: 'Formal, limpio y rápido en la reparación de fontanería. Volveré a contar con sus servicios seguro.',
                    work: 'Fontanería General',
                  },
                ].map((rev) => (
                  <ThemedTouchable
                    key={rev.id}
                    onPress={() => router.push('/(tabs)/reviews' as any)}
                    haptic="light"
                    activeOpacity={0.92}
                    style={{
                      width: REVIEW_CARD_WIDTH,
                      height: REVIEW_CARD_HEIGHT,
                      position: 'relative',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.08,
                      shadowRadius: 10,
                      elevation: 3,
                    }}
                  >
                    <Svg
                      width={REVIEW_CARD_WIDTH}
                      height={REVIEW_CARD_HEIGHT}
                      viewBox={`0 0 ${REVIEW_CARD_WIDTH} ${REVIEW_CARD_HEIGHT}`}
                      style={StyleSheet.absoluteFill}
                    >
                      <Path
                        d={getRequestCardCutoutPath(REVIEW_CARD_WIDTH, REVIEW_CARD_HEIGHT)}
                        fill={isDark ? '#1C1E26' : '#FFFFFF'}
                      />
                    </Svg>

                    {/* Top Area: Reviewer Avatar + Name + Stars */}
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingTop: 16,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            backgroundColor: isDark ? 'rgba(2, 132, 199, 0.25)' : '#E0F2FE',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans-Bold', color: '#0284C7' }}>
                            {rev.name.charAt(0)}
                          </Text>
                        </View>
                        <View>
                          <Text style={{ fontSize: 13.5, fontFamily: 'PlusJakartaSans-Bold', color: isDark ? '#FFFFFF' : '#0F172A' }}>
                            {rev.name}
                          </Text>
                          <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans-Medium', color: isDark ? '#94A3B8' : '#64748B', marginTop: 1 }}>
                            {rev.date}
                          </Text>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 2 }}>
                        {[...Array(rev.rating)].map((_, i) => (
                          <Ionicons key={i} name="star" size={13} color="#F59E0B" />
                        ))}
                      </View>
                    </View>

                    {/* Comment Body */}
                    <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
                      <Text
                        numberOfLines={3}
                        style={{
                          fontSize: 12.5,
                          fontFamily: 'PlusJakartaSans-Regular',
                          color: isDark ? '#CBD5E1' : '#334155',
                          lineHeight: 19,
                        }}
                      >
                        {rev.comment}
                      </Text>
                    </View>

                    {/* Bottom Row inside the Cutout & Docked */}
                    <View
                      style={{
                        position: 'absolute',
                        left: 8,
                        bottom: 8,
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: isDark ? '#27272A' : '#111113',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000000',
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.16,
                        shadowRadius: 4,
                        elevation: 4,
                        zIndex: 10,
                      }}
                    >
                      <Ionicons
                        name="arrow-up"
                        size={18}
                        color="#FFFFFF"
                        style={{ transform: [{ rotate: '45deg' }] }}
                      />
                    </View>

                    <View
                      style={{
                        position: 'absolute',
                        left: 58,
                        bottom: 8,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: isDark ? '#27272A' : '#F1F5F9',
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                        justifyContent: 'center',
                        paddingHorizontal: 16,
                        zIndex: 10,
                        shadowColor: '#000000',
                        shadowOpacity: 0.08,
                        shadowRadius: 5,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 3,
                      }}
                    >
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 12.5,
                          fontFamily: 'PlusJakartaSans-Bold',
                          color: isDark ? '#F8FAFC' : '#0F172A',
                          letterSpacing: -0.2,
                        }}
                      >
                        {rev.work}
                      </Text>
                    </View>

                    <View
                      style={{
                        position: 'absolute',
                        right: 10,
                        bottom: 8,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: isDark ? '#27272A' : '#F1F5F9',
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 14,
                        gap: 6,
                        zIndex: 10,
                        shadowColor: '#000000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      <Ionicons name="shield-checkmark" size={15} color="#059669" />
                      <Text
                        style={{
                          fontSize: 12.5,
                          fontFamily: 'PlusJakartaSans-Bold',
                          color: '#059669',
                        }}
                      >
                        Escrow
                      </Text>
                    </View>
                  </ThemedTouchable>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* TAB 2: SOLICITUDES & ENCARGOS (Category Lookbook Relief & Elevated Tactile Cards) */}
        {profileTab === 'requests' && (
          <Animated.View entering={FadeIn.duration(160)} style={{ paddingHorizontal: 20 }}>
            {/* Quick Summary Strip - Clean Crisp Cards on Ambient Background */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              {/* Card 1: Solicitudes */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: isDark ? '#1C1E26' : '#FFFFFF',
                  borderRadius: 22,
                  paddingVertical: 14,
                  paddingHorizontal: 10,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 2,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 18,
                    fontFamily: 'PlusJakartaSans-ExtraBold',
                    color: colors.textPrimary,
                  }}
                >
                  3
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 11,
                    fontFamily: 'PlusJakartaSans-Bold',
                    color: isDark ? '#94A3B8' : '#64748B',
                    marginTop: 3,
                  }}
                >
                  Solicitudes
                </Text>
              </View>

              {/* Card 2: Escrow Retenido - Compact no-wrap font size */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: isDark ? '#1C1E26' : '#FFFFFF',
                  borderRadius: 22,
                  paddingVertical: 14,
                  paddingHorizontal: 8,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 2,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 15,
                    fontFamily: 'PlusJakartaSans-ExtraBold',
                    color: '#059669',
                    letterSpacing: -0.3,
                  }}
                >
                  2.450 €
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 11,
                    fontFamily: 'PlusJakartaSans-Bold',
                    color: isDark ? '#94A3B8' : '#64748B',
                    marginTop: 3,
                  }}
                >
                  Escrow Ret.
                </Text>
              </View>

              {/* Card 3: Garantizado */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: isDark ? '#1C1E26' : '#FFFFFF',
                  borderRadius: 22,
                  paddingVertical: 14,
                  paddingHorizontal: 8,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 2,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 15,
                    fontFamily: 'PlusJakartaSans-ExtraBold',
                    color: '#0284C7',
                    letterSpacing: -0.3,
                  }}
                >
                  100%
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 11,
                    fontFamily: 'PlusJakartaSans-Bold',
                    color: isDark ? '#94A3B8' : '#64748B',
                    marginTop: 3,
                  }}
                >
                  Garantizado
                </Text>
              </View>
            </View>

            {/* List of Active Requests - Category Relief Cards */}
            <View style={{ gap: 14, marginBottom: 16 }}>
              {[
                {
                  id: 'req-1',
                  title: 'Reforma Integral de Cocina con Isla',
                  category: 'Reformas',
                  client: 'Carlos Mendoza',
                  clientAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
                  budget: '2.800 €',
                  date: '14 Sept 2026',
                  statusLabel: 'En progreso',
                  statusColor: '#0284C7',
                  cardBgLight: '#BAE6FD', // Soft Sky Blue (Image 3)
                  cardBgDark: '#1E3A5F',
                  iconName: 'construct',
                  iconColor: '#1D4ED8',
                  haloColor: 'rgba(255, 255, 255, 0.65)',
                  textColor: '#0F172A',
                  escrowProtected: true,
                },
                {
                  id: 'req-2',
                  title: 'Instalación y Boletín Cuadro REBT',
                  category: 'Electricidad',
                  client: 'Elena Gómez',
                  clientAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
                  budget: '420 €',
                  date: '08 Sept 2026',
                  statusLabel: 'Completada',
                  statusColor: '#059669',
                  cardBgLight: '#FDE68A', // Soft Warm Amber (Image 3)
                  cardBgDark: '#451A03',
                  iconName: 'flash',
                  iconColor: '#B45309',
                  haloColor: 'rgba(255, 255, 255, 0.65)',
                  textColor: '#0F172A',
                  escrowProtected: true,
                },
                {
                  id: 'req-3',
                  title: 'Sustitución Grifería Termostática Ducha',
                  category: 'Fontanería',
                  client: 'Marcos Rivas',
                  clientAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
                  budget: '180 €',
                  date: 'Ayer',
                  statusLabel: 'Presupuesto',
                  statusColor: '#D97706',
                  cardBgLight: '#C7D2FE', // Soft Indigo (Image 3)
                  cardBgDark: '#312E81',
                  iconName: 'water',
                  iconColor: '#4338CA',
                  haloColor: 'rgba(255, 255, 255, 0.65)',
                  textColor: '#0F172A',
                  escrowProtected: false,
                },
              ].map((req) => (
                <ThemedTouchable
                  key={req.id}
                  onPress={() => router.push('/(tabs)/requests')}
                  haptic="light"
                  activeOpacity={0.92}
                  style={{
                    width: REQUEST_CARD_WIDTH,
                    height: REQUEST_CARD_HEIGHT,
                    position: 'relative',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.08,
                    shadowRadius: 10,
                    elevation: 3,
                  }}
                >
                  {/* Scooped Cutout Background Shape - Leaves circular hole at bottom-left (Image 3) */}
                  <Svg
                    width={REQUEST_CARD_WIDTH}
                    height={REQUEST_CARD_HEIGHT}
                    viewBox={`0 0 ${REQUEST_CARD_WIDTH} ${REQUEST_CARD_HEIGHT}`}
                    style={StyleSheet.absoluteFill}
                  >
                    <Path
                      d={getRequestCardCutoutPath(REQUEST_CARD_WIDTH, REQUEST_CARD_HEIGHT)}
                      fill={isDark ? '#1C1E26' : req.cardBgLight}
                      stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'}
                      strokeWidth="1"
                    />
                  </Svg>

                  {/* Top Area: Category Icon in Halo + Date + Elevated Status Badge */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingTop: 16,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 21,
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : req.haloColor,
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1.5 },
                          shadowOpacity: 0.05,
                          shadowRadius: 3,
                          elevation: 2,
                        }}
                      >
                        <Ionicons name={req.iconName as any} size={20} color={req.iconColor} />
                      </View>
                      <View>
                        <Text style={{ fontSize: 13.5, fontFamily: 'PlusJakartaSans-Bold', color: isDark ? '#FFFFFF' : req.textColor }}>
                          {req.category}
                        </Text>
                        <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans-Medium', color: isDark ? '#94A3B8' : '#475569', marginTop: 1 }}>
                          {req.date}
                        </Text>
                      </View>
                    </View>

                    {/* Elevated Status Pill Badge matching Image 3 */}
                    <View
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 5,
                        borderRadius: 999,
                        backgroundColor: isDark ? '#27272A' : '#FFFFFF',
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans-ExtraBold', color: req.statusColor }}>
                        {req.statusLabel}
                      </Text>
                    </View>
                  </View>

                  {/* Title */}
                  <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: 15.5,
                        fontFamily: 'PlusJakartaSans-ExtraBold',
                        color: isDark ? '#FFFFFF' : req.textColor,
                        lineHeight: 21,
                      }}
                    >
                      {req.title}
                    </Text>
                  </View>

                  {/* Bottom Row inside the Cutout & Docked (Image 3 design): */}
                  {/* 1. Client Avatar nestled inside the Cutout Hole ("el hueco ese") */}
                  <View
                    style={{
                      position: 'absolute',
                      left: 8,
                      bottom: 8,
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: isDark ? '#27272A' : '#FFFFFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      borderWidth: 2,
                      borderColor: isDark ? '#27272A' : '#FFFFFF',
                      shadowColor: '#000000',
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.16,
                      shadowRadius: 4,
                      elevation: 4,
                      zIndex: 10,
                    }}
                  >
                    {req.clientAvatar ? (
                      <Image
                        source={{ uri: req.clientAvatar }}
                        style={{ width: 44, height: 44 }}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans-ExtraBold', color: req.iconColor }}>
                        {req.client.charAt(0)}
                      </Text>
                    )}
                  </View>

                  {/* 2. Client Name docked into the adjacent Pill (like "Reformas" in Image 3) */}
                  <View
                    style={{
                      position: 'absolute',
                      left: 58,
                      bottom: 8,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: isDark ? '#27272A' : '#FFFFFF',
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                      justifyContent: 'center',
                      paddingHorizontal: 16,
                      zIndex: 10,
                      shadowColor: '#000000',
                      shadowOpacity: 0.08,
                      shadowRadius: 5,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 3,
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 13,
                        fontFamily: 'PlusJakartaSans-Bold',
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        letterSpacing: -0.2,
                      }}
                    >
                      {req.client}
                    </Text>
                  </View>

                  {/* 3. Budget Pill on the Right */}
                  <View
                    style={{
                      position: 'absolute',
                      right: 10,
                      bottom: 8,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: isDark ? '#27272A' : '#FFFFFF',
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 14,
                      gap: 6,
                      zIndex: 10,
                      shadowColor: '#000000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    {req.escrowProtected && (
                      <Ionicons name="shield-checkmark" size={14} color="#059669" />
                    )}
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 12.5,
                        fontFamily: 'PlusJakartaSans-ExtraBold',
                        color: '#059669',
                      }}
                    >
                      {req.budget}
                    </Text>
                  </View>
                </ThemedTouchable>
              ))}
            </View>

            {/* Escrow Custody Assurance Banner with Relief */}
            <View
              style={{
                backgroundColor: isDark ? '#1C1E26' : '#FFFFFF',
                borderRadius: 22,
                padding: 18,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(5, 150, 105, 0.3)' : '#A7F3D0',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                marginBottom: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Ionicons name="shield-checkmark" size={26} color="#059669" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans-Bold', color: isDark ? '#10B981' : '#065F46' }}>
                  Custodia Escrow Yewi Protegida
                </Text>
                <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans-Regular', color: isDark ? '#94A3B8' : '#047857', marginTop: 2 }}>
                  Los fondos se retienen de forma segura y solo se liberan tras tu conformidad del trabajo.
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* TAB 3: GUARDADOS / FAVORITOS (Consistent with Bookmark Icon & Home signature cards) */}
        {profileTab === 'saved' && (
          <Animated.View entering={FadeIn.duration(160)} style={{ paddingHorizontal: 20 }}>
            {savedProjects.length > 0 ? (
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  rowGap: 16,
                }}
              >
                {savedProjects.map((p) => {
                  const coverUri =
                    p.coverImages?.[0] ||
                    p.professionalProfile?.portfolioItems?.[0]?.imageUrls?.[0] ||
                    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80';
                  const price = p.packages?.[0]?.price || 300;
                  const rating = p.professionalProfile?.avgRating || 5.0;

                  return (
                    <ThemedTouchable
                      key={p.id}
                      onPress={() => {
                        router.push({
                          pathname: '/detail',
                          params: { id: p.id, entityType: 'gig' },
                        });
                      }}
                      haptic="light"
                      activeOpacity={0.92}
                      style={{
                        width: PROFILE_CARD_WIDTH,
                        height: PROFILE_CARD_HEIGHT,
                        borderRadius: 28,
                        overflow: 'hidden',
                        position: 'relative',
                        backgroundColor: isDark ? '#1C1E26' : '#F1F3F5',
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={p.title}
                    >
                      {/* Full Card Image (Exact Home Standard - Edge-to-Edge) */}
                      <Image
                        source={{ uri: coverUri }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        transition={150}
                        cachePolicy="memory-disk"
                      />

                      {/* Top-Left Rating Pill Badge (Exact match to Home Image 3) */}
                      <View
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 3.5,
                          paddingHorizontal: 9,
                          paddingVertical: 5,
                          borderRadius: 999,
                          backgroundColor: '#FFFFFF',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.06,
                          shadowRadius: 3,
                          elevation: 2,
                        }}
                      >
                        <Ionicons name="star" size={11.5} color="#F59E0B" />
                        <Text style={{ fontSize: 11.5, fontFamily: 'PlusJakartaSans-Bold', color: '#0F172A' }}>
                          {rating.toFixed(1)}
                        </Text>
                      </View>

                      {/* Top-Right Bookmark Active Button to Un-favorite */}
                      <ThemedTouchable
                        onPress={() => toggleFavorite(p.id)}
                        haptic="selection"
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: '#FFFFFF',
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.08,
                          shadowRadius: 3,
                          elevation: 2,
                        }}
                      >
                        <Ionicons name="bookmark" size={16} color="#0284C7" />
                      </ThemedTouchable>

                      {/* Bottom-Left Price Pill Badge (Exact match to Home Image 3) */}
                      <View
                        style={{
                          position: 'absolute',
                          bottom: 10,
                          left: 10,
                          flexDirection: 'row',
                          alignItems: 'baseline',
                          paddingHorizontal: 11,
                          paddingVertical: 6.5,
                          borderRadius: 999,
                          backgroundColor: '#FFFFFF',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.06,
                          shadowRadius: 3,
                          elevation: 2,
                        }}
                      >
                        <Text style={{ fontSize: 10.5, fontFamily: 'PlusJakartaSans-Medium', color: '#64748B' }}>
                          Desde{' '}
                        </Text>
                        <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#0F172A' }}>
                          {price} €
                        </Text>
                      </View>

                      {/* Bottom-Right Circular Action Arrow ↗ (Exact match to Home Image 3) */}
                      <View
                        style={{
                          position: 'absolute',
                          bottom: 10,
                          right: 10,
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: '#FFFFFF',
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.06,
                          shadowRadius: 3,
                          elevation: 2,
                        }}
                      >
                        <Ionicons
                          name="arrow-up"
                          size={16}
                          color="#0F172A"
                          style={{ transform: [{ rotate: '45deg' }] }}
                        />
                      </View>
                    </ThemedTouchable>
                  );
                })}
              </View>
            ) : (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 48,
                  paddingHorizontal: 24,
                }}
              >
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: isDark ? '#1E293B' : '#E0F2FE',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Ionicons name="bookmark-outline" size={28} color={isDark ? '#38BDF8' : '#0284C7'} />
                </View>
                <Text
                  style={{
                    fontSize: 17,
                    fontFamily: 'PlusJakartaSans-Bold',
                    color: colors.textPrimary,
                    textAlign: 'center',
                    marginBottom: 6,
                  }}
                >
                  Sin proyectos guardados
                </Text>
                <Text
                  style={{
                    fontSize: 13.5,
                    fontFamily: 'PlusJakartaSans-Regular',
                    color: colors.textSecondary,
                    textAlign: 'center',
                    lineHeight: 20,
                    maxWidth: 280,
                    marginBottom: 22,
                  }}
                >
                  Toca el icono de marcador en cualquier proyecto para tenerlo a mano y pedir presupuesto cuando quieras.
                </Text>
                <ThemedTouchable
                  onPress={() => router.push('/(tabs)/search')}
                  haptic="medium"
                  style={{
                    paddingHorizontal: 24,
                    height: 44,
                    borderRadius: 999,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontFamily: 'PlusJakartaSans-Bold' }}>
                    Explorar proyectos
                  </Text>
                </ThemedTouchable>
              </View>
            )}
          </Animated.View>
        )}

        {/* Footer Version with clean editorial spacing */}
        <View className="items-center mt-12 mb-6">
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'PlusJakartaSans-Medium',
              color: colors.textMuted,
            }}
          >
            Yewi v1.0.0 · España
          </Text>
        </View>


      </Animated.ScrollView>

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

      {/* Manage Rates & Discounts Modal */}
      <ManageRatesModal
        visible={showRatesModal}
        onClose={() => setShowRatesModal(false)}
        initialHourlyRate={parseFloat(hourlyRate) || undefined}
        onRateUpdated={(newRate) => setHourlyRate(String(newRate))}
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
                <Text style={{ fontSize: 18, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.textPrimary }}>
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
                <Text style={{ fontSize: 12.5, fontFamily: 'PlusJakartaSans-Bold', color: colors.textSecondary }}>
                  Paso {sellerStep} de 3
                </Text>
              </View>

              {/* STEP 1: Datos de Empresa / Autónomo */}
              {sellerStep === 1 && (
                <View>
                  <Text style={{ fontSize: 21, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.textPrimary, marginBottom: 2 }}>
                    {t.stepCompany}
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-Regular', color: colors.textSecondary, marginBottom: 14 }}>
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
                        fontFamily: 'PlusJakartaSans-Bold',
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
                        <Text style={{ fontSize: 13.5, fontFamily: 'PlusJakartaSans-Bold', color: colors.textPrimary }}>
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
                  <Text style={{ fontSize: 21, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.textPrimary, marginBottom: 2 }}>
                    {t.stepServices}
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-Regular', color: colors.textSecondary, marginBottom: 12 }}>
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
                        fontFamily: 'PlusJakartaSans-Medium',
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
                  <Text style={{ fontSize: 21, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.textPrimary, marginBottom: 2 }}>
                    {t.stepLocation}
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-Regular', color: colors.textSecondary, marginBottom: 12 }}>
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
                    <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans-Bold', color: colors.textPrimary }}>
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
                    <Text style={{ fontSize: 14.5, fontFamily: 'PlusJakartaSans-Bold', color: colors.textPrimary }}>
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
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: 'PlusJakartaSans-Bold' }}>
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
        animationType="none"
        onRequestClose={() => setShowCountryModal(false)}
      >
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(140)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingHorizontal: 0,
          }}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowCountryModal(false)}
          />
          <Animated.View
            entering={SlideInDown.duration(200).easing(Easing.out(Easing.cubic))}
            exiting={SlideOutDown.duration(150).easing(Easing.in(Easing.cubic))}
            style={{
              width: '100%',
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              paddingTop: 8,
              paddingHorizontal: 22,
              paddingBottom: Math.max(insets.bottom + 16, 28),
              maxHeight: '75%',
              borderTopWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -8 },
              shadowOpacity: 0.14,
              shadowRadius: 24,
              elevation: 20,
            }}
          >
            {/* Drag Indicator Handle (Pill) */}
            <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: 6, marginBottom: 8 }}>
              <View
                style={{
                  width: 38,
                  height: 4.5,
                  borderRadius: 999,
                  backgroundColor: isDark ? '#48484A' : '#D1D5DB',
                }}
              />
            </View>
            {/* Header Row: Title & Circular X */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: 'PlusJakartaSans-Bold',
                  color: isDark ? '#F9FAFB' : '#111827',
                  letterSpacing: -0.3,
                }}
              >
                Selecciona tu país
              </Text>
              <ThemedTouchable
                onPress={() => setShowCountryModal(false)}
                haptic="light"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isDark ? '#2A2A2E' : '#F0F0F2',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityRole="button"
                accessibilityLabel="Cerrar modal"
              >
                <Ionicons name="close" size={15} color={isDark ? '#A1A1AA' : '#6B7280'} />
              </ThemedTouchable>
            </View>
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
                          fontFamily: isSelected ? 'PlusJakartaSans-Bold' : 'PlusJakartaSans-Medium',
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
                          fontFamily: 'PlusJakartaSans-Bold',
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
          </Animated.View>
        </Animated.View>
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
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text numberOfLines={1} style={{ fontSize: 20, fontFamily: 'PlusJakartaSans-ExtraBold', color: colors.textPrimary }}>
                Mis Proyectos
              </Text>
              <Text numberOfLines={1} style={{ fontSize: 12.5, fontFamily: 'PlusJakartaSans-Medium', color: colors.textSecondary, marginTop: 2 }}>
                Servicios a precio cerrado ofrecidos por ti
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
            <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-Bold', color: colors.textSecondary }}>
              Proyectos activos ({myProjects.length})
            </Text>
            <ThemedTouchable
              onPress={() => {
                setShowMyProjectsModal(false);
                router.push({ pathname: '/publish', params: { type: 'service' } });
              }}
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
              <Text numberOfLines={1} style={{ color: '#FFFFFF', fontSize: 13, fontFamily: 'PlusJakartaSans-Bold' }}>
                Proyecto
              </Text>
            </ThemedTouchable>
          </View>

          {/* Projects List */}
          {loadingMyProjects ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ fontSize: 13.5, fontFamily: 'PlusJakartaSans-Medium', color: colors.textSecondary, marginTop: 10 }}>
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
              <Text style={{ fontSize: 17, fontFamily: 'PlusJakartaSans-Bold', color: colors.textPrimary, marginBottom: 6, textAlign: 'center' }}>
                Aún no has publicado ningún proyecto
              </Text>
              <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-Regular', color: colors.textSecondary, textAlign: 'center', marginBottom: 20, maxWidth: 280, lineHeight: 19 }}>
                Publica trabajos específicos (ej: Cambio de baldosas 200€ en 5 días) para que los clientes de tu zona te contraten directamente.
              </Text>
              <ThemedTouchable
                onPress={() => {
                  setShowMyProjectsModal(false);
                  router.push({ pathname: '/publish', params: { type: 'service' } });
                }}
                haptic="medium"
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 999,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                }}
              >
                <Text numberOfLines={1} style={{ color: '#FFFFFF', fontSize: 14, fontFamily: 'PlusJakartaSans-Bold' }}>
                  Crear Proyecto
                </Text>
              </ThemedTouchable>
            </View>
          )}
        </View>
      </Modal>


      {/* Delete Account Confirmation Modal (Apple & Google Compliance - Mobbin Floating BottomSheet) */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(140)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingHorizontal: 0,
          }}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowDeleteModal(false)}
          />
          <Animated.View
            entering={SlideInDown.duration(200).easing(Easing.out(Easing.cubic))}
            exiting={SlideOutDown.duration(150).easing(Easing.in(Easing.cubic))}
            style={{
              width: '100%',
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              paddingTop: 8,
              paddingHorizontal: 22,
              paddingBottom: Math.max(insets.bottom + 16, 28),
              borderTopWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              position: 'relative',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -8 },
              shadowOpacity: 0.14,
              shadowRadius: 24,
              elevation: 20,
            }}
          >
            {/* Drag Indicator Handle (Pill) */}
            <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: 6, marginBottom: 8 }}>
              <View
                style={{
                  width: 38,
                  height: 4.5,
                  borderRadius: 999,
                  backgroundColor: isDark ? '#48484A' : '#D1D5DB',
                }}
              />
            </View>
            {/* Close x button on top right */}
            <ThemedTouchable
              onPress={() => setShowDeleteModal(false)}
              haptic="light"
              style={{
                position: 'absolute',
                top: 22,
                right: 22,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isDark ? '#2A2A2E' : '#F0F0F2',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
              accessibilityRole="button"
              accessibilityLabel="Cerrar modal"
            >
              <Ionicons name="close" size={15} color={isDark ? '#A1A1AA' : '#6B7280'} />
            </ThemedTouchable>

            <Text
              style={{
                fontSize: 20,
                fontFamily: 'PlusJakartaSans-ExtraBold',
                color: isDark ? '#FFFFFF' : '#111827',
                lineHeight: 26,
                paddingRight: 32,
                marginBottom: 10,
              }}
            >
              ¿Seguro que quieres eliminar tu cuenta?
            </Text>

            <Text
              style={{
                fontSize: 14,
                fontFamily: 'PlusJakartaSans-Regular',
                color: isDark ? '#A1A1AA' : '#6B7280',
                lineHeight: 20,
                marginBottom: 24,
              }}
            >
              Esta acción es irreversible y eliminará permanentemente tu perfil, solicitudes y accesos de acuerdo con el RGPD. No se puede deshacer.
            </Text>

            {/* Two Pill Buttons: Cancel & Delete (Exact Reference Image 2) */}
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <ThemedTouchable
                onPress={() => setShowDeleteModal(false)}
                haptic="light"
                disabled={isDeletingAccount}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: isDark ? '#3A3A3C' : '#E5E7EB',
                  backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans-Bold', color: isDark ? '#FFFFFF' : '#111827' }}>
                  Cancelar
                </Text>
              </ThemedTouchable>

              <ThemedTouchable
                onPress={handleDeleteAccount}
                haptic="heavy"
                disabled={isDeletingAccount}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#EA3829',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isDeletingAccount ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans-Bold', color: '#FFFFFF' }}>
                    Eliminar
                  </Text>
                )}
              </ThemedTouchable>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* QUICK ACTIONS DROPDOWN MODAL (3-Dots Menu) */}
      <Modal
        visible={showActionsMenu}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setShowActionsMenu(false)}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setShowActionsMenu(false)}
        />

        <Animated.View
          entering={FadeInDown.duration(180)}
          style={{
            position: 'absolute',
            top: insets.top + 61,
            right: 16,
            width: 220,
            borderRadius: 20,
            backgroundColor: isDark ? '#1C1E26' : '#FFFFFF',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            paddingVertical: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDark ? 0.35 : 0.12,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          {/* Option 1: Editar Perfil */}
          <ThemedTouchable
            onPress={() => {
              setShowActionsMenu(false);
              router.push('/(tabs)/profile/account' as any);
            }}
            haptic="selection"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              gap: 12,
            }}
          >
            <Ionicons name="person-outline" size={20} color={colors.textPrimary} style={{ width: 22, textAlign: 'center' }} />
            <Text
              style={{
                fontSize: 14.5,
                fontFamily: 'PlusJakartaSans-Bold',
                color: colors.textPrimary,
                letterSpacing: -0.2,
              }}
            >
              Editar perfil
            </Text>
          </ThemedTouchable>

          {/* Option 2: Configuración */}
          <ThemedTouchable
            onPress={() => {
              setShowActionsMenu(false);
              router.push('/(tabs)/profile/preferences' as any);
            }}
            haptic="selection"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              gap: 12,
            }}
          >
            <Ionicons name="settings-outline" size={20} color={colors.textPrimary} style={{ width: 22, textAlign: 'center' }} />
            <Text
              style={{
                fontSize: 14.5,
                fontFamily: 'PlusJakartaSans-Bold',
                color: colors.textPrimary,
                letterSpacing: -0.2,
              }}
            >
              Configuración
            </Text>
          </ThemedTouchable>

          {/* Option 3: Mensajes */}
          <ThemedTouchable
            onPress={() => {
              setShowActionsMenu(false);
              router.push('/chat' as any);
            }}
            haptic="selection"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              gap: 12,
            }}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.textPrimary} style={{ width: 22, textAlign: 'center' }} />
            <Text
              style={{
                fontSize: 14.5,
                fontFamily: 'PlusJakartaSans-Bold',
                color: colors.textPrimary,
                letterSpacing: -0.2,
              }}
            >
              Mensajes
            </Text>
          </ThemedTouchable>

          {/* Subtle separator */}
          <View
            style={{
              height: 1,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              marginVertical: 4,
              marginHorizontal: 14,
            }}
          />

          {/* Option 4: Compartir */}
          <ThemedTouchable
            onPress={async () => {
              setShowActionsMenu(false);
              try {
                await Share.share({
                  title: 'Perfil en Yewi',
                  message: `Echa un vistazo al perfil de ${user?.firstName || 'este usuario'} en Yewi: https://yewi.app/profile/${user?.id || ''}`,
                });
              } catch {
                // dismissed
              }
            }}
            haptic="selection"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              gap: 12,
            }}
          >
            <Ionicons name="share-social-outline" size={20} color={colors.primary} style={{ width: 22, textAlign: 'center' }} />
            <Text
              style={{
                fontSize: 14.5,
                fontFamily: 'PlusJakartaSans-Bold',
                color: colors.primary,
                letterSpacing: -0.2,
              }}
            >
              Compartir
            </Text>
          </ThemedTouchable>

          {/* Subtle separator */}
          <View
            style={{
              height: 1,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              marginVertical: 4,
              marginHorizontal: 14,
            }}
          />

          {/* Option 5: Cerrar sesión */}
          <ThemedTouchable
            onPress={async () => {
              setShowActionsMenu(false);
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              await signOut?.().catch(() => {});
              router.replace('/auth/login');
            }}
            haptic="medium"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              gap: 12,
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ width: 22, textAlign: 'center' }} />
            <Text
              style={{
                fontSize: 14.5,
                fontFamily: 'PlusJakartaSans-Bold',
                color: '#EF4444',
                letterSpacing: -0.2,
              }}
            >
              Cerrar sesión
            </Text>
          </ThemedTouchable>
        </Animated.View>
      </Modal>

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
