import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { AuthInput } from '@/components/auth/AuthInput';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { CustomAlert } from '@/components/ui/CustomAlert';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { authService } from '@/services/authService';

import { professionalsApi, PortfolioItem } from '@/services/professionalsApi';
import { CATEGORIES_LIST } from '@/constants/categories';
import {
  spanishGeoService,
  SPANISH_PROVINCES,
} from '@/services/spanishGeoService';

function isValidTaxId(id: string): boolean {
  if (!id) return false;
  const clean = id.trim().toUpperCase().replace(/[-\s]/g, '');
  if (clean.length !== 9) return false;

  const dniRegex = /^(\d{8})([A-Z])$/;
  const nieRegex = /^[XYZ]\d{7}[A-Z]$/;
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

  if (cifRegex.test(clean)) return true;
  return false;
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 9 && /^[6789]/.test(digits);
}

const STEPS = [
  { id: 1, title: 'Identidad y Contacto' },
  { id: 2, title: 'Especialidades' },
  { id: 3, title: 'Biografía y Servicios' },
  { id: 4, title: 'Tarifas y Cobertura' },
  { id: 5, title: 'Portafolio de Trabajos' },
];

export default function ProfessionalProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { user, updateUser } = useAuthStore();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Form State
  const [businessName, setBusinessName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('35');
  const [serviceRadius, setServiceRadius] = useState('30');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [province, setProvince] = useState('');
  const [region, setRegion] = useState('');
  const [address, setAddress] = useState('');

  // Portfolio State
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [showAddProject, setShowAddProject] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectImageUri, setProjectImageUri] = useState<string | null>(null);
  const [savingProject, setSavingProject] = useState(false);

  // Errors & Alerts
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = (title: string, message: string) => {
    setAlert({ visible: true, title, message });
  };

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const pro = await professionalsApi.getMyProfile();
      setBusinessName(pro.businessName || '');
      setTaxId(pro.taxId || user?.professionalProfile?.taxId || '');
      setPhone(
        user?.phoneNumber ? user.phoneNumber.replace('+34', '').trim() : '',
      );
      setSelectedSkills(
        pro.skills && pro.skills.length > 0 ? pro.skills : ['Electricidad'],
      );
      setBio(pro.bio || '');
      setHourlyRate(pro.hourlyRate ? String(pro.hourlyRate) : '35');
      setServiceRadius(
        pro.serviceRadiusKm ? String(pro.serviceRadiusKm) : '30',
      );
      setCity(pro.city || user?.city || 'Zaragoza');
      setPostalCode(pro.postalCode || user?.postalCode || '50001');
      setProvince(pro.province || user?.province || 'Zaragoza');
      setRegion(pro.region || user?.region || 'Aragón');
      setAddress(pro.address || user?.address || '');
      setPortfolioItems(pro.portfolioItems || []);
    } catch {
      setBusinessName(user?.professionalProfile?.businessName || '');
      setTaxId(user?.professionalProfile?.taxId || '');
      setPhone(
        user?.phoneNumber ? user.phoneNumber.replace('+34', '').trim() : '',
      );
      setSelectedSkills(
        user?.professionalProfile?.skills?.length
          ? user.professionalProfile.skills
          : ['Electricidad'],
      );
      setBio(user?.bio || '');
      setHourlyRate('35');
      setServiceRadius('30');
      setCity(user?.city || 'Zaragoza');
      setPostalCode(user?.postalCode || '50001');
      setProvince(user?.province || 'Zaragoza');
      setRegion(user?.region || 'Aragón');
      setAddress(user?.address || '');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
    if (errors.skills) setErrors((prev) => ({ ...prev, skills: '' }));
  };

  const handlePostalCodeChange = (txt: string) => {
    setPostalCode(txt);
    if (errors.postalCode) setErrors((prev) => ({ ...prev, postalCode: '' }));
    if (txt.length >= 2) {
      const prefix = txt.slice(0, 2);
      const matched = SPANISH_PROVINCES.find((p) => p.code === prefix);
      if (matched) {
        setProvince(matched.name);
        setRegion(matched.regionName);
      }
    }
  };

  const handleDetectLocation = async () => {
    try {
      setIsLocating(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => {},
      );
      const geo = await spanishGeoService.detectGPSLocation();
      if (geo) {
        setCity(geo.city);
        setPostalCode(geo.postalCode);
        setProvince(geo.province);
        setRegion(geo.region);
        if (geo.address) setAddress(geo.address);
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => {});
      }
    } catch {
      showAlert(
        'Error de ubicación',
        'No se pudo detectar la ubicación GPS. Puedes introducirla manualmente.',
      );
    } finally {
      setIsLocating(false);
    }
  };

  const handlePickProjectImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert(
          'Permiso Denegado',
          'Se requiere acceso a la galería para añadir fotos a tu portafolio.',
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Prefer base64 data uri if available for Cloudinary upload, otherwise uri
        const finalImage = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setProjectImageUri(finalImage);
      }
    } catch (e: any) {
      showAlert('Error', e.message || 'No se pudo seleccionar la imagen.');
    }
  };

  const handleAddProject = async () => {
    if (!projectTitle.trim()) {
      showAlert(
        'Campo requerido',
        'Introduce un título para el trabajo realizado.',
      );
      return;
    }
    if (!projectDescription.trim()) {
      showAlert(
        'Campo requerido',
        'Describe brevemente los trabajos realizados.',
      );
      return;
    }

    setSavingProject(true);
    try {
      let finalUploadedUrl = projectImageUri;

      // Upload image to Cloudinary via backend
      if (projectImageUri) {
        try {
          const uploadRes =
            await professionalsApi.uploadPortfolioImage(projectImageUri);
          if (uploadRes?.url) {
            finalUploadedUrl = uploadRes.url;
          }
        } catch (uploadErr) {
          console.warn(
            'Could not upload to Cloudinary, using local URI fallback:',
            uploadErr,
          );
        }
      }

      const newItem = await professionalsApi.addPortfolioItem({
        title: projectTitle.trim(),
        description: projectDescription.trim(),
        imageUrls: finalUploadedUrl ? [finalUploadedUrl] : [],
        tags: selectedSkills.slice(0, 3),
      });

      setPortfolioItems((prev) => [newItem, ...prev]);
      setShowAddProject(false);
      setProjectTitle('');
      setProjectDescription('');
      setProjectImageUri(null);
      toast.success(
        'Proyecto Añadido',
        'El trabajo ha sido subido y guardado en tu portafolio.',
      );
    } catch (e: any) {
      toast.error(
        'Error al guardar',
        e.message || 'No se pudo guardar el proyecto.',
      );
    } finally {
      setSavingProject(false);
    }
  };

  const handleDeleteProject = (itemId: string) => {
    showAlert(
      'Eliminar Trabajo',
      '¿Deseas eliminar este proyecto de tu portafolio?',
    );
    // Direct delete with toast
    professionalsApi
      .deletePortfolioItem(itemId)
      .then(() => {
        setPortfolioItems((prev) => prev.filter((p) => p.id !== itemId));
        toast.info('Proyecto eliminado');
      })
      .catch((e: any) => {
        toast.error('Error', e.message || 'No se pudo eliminar el proyecto.');
      });
  };

  const handleNext = () => {
    const errs: Record<string, string> = {};

    if (currentStep === 1) {
      if (!businessName.trim())
        errs.businessName = 'El nombre comercial o de autónomo es obligatorio';
      if (!taxId.trim()) errs.taxId = 'El NIF, CIF o NIE es obligatorio';
      else if (!isValidTaxId(taxId))
        errs.taxId = 'Formato inválido (ej: 12345678Z, B12345678)';
      if (!phone.trim()) errs.phone = 'El teléfono de contacto es obligatorio';
      else if (!isValidPhone(phone)) errs.phone = 'Introduce 9 dígitos válidos';

      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }
      setErrors({});
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (selectedSkills.length === 0)
        errs.skills = 'Selecciona al menos una categoría de especialidad';

      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }
      setErrors({});
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      if (!bio.trim() || bio.trim().length < 15)
        errs.bio = 'Escribe al menos 15 caracteres describiendo tus servicios';

      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }
      setErrors({});
      setCurrentStep(4);
      return;
    }

    if (currentStep === 4) {
      if (!city.trim()) errs.city = 'El municipio o localidad es obligatorio';
      if (!postalCode.trim() || postalCode.trim().length < 4)
        errs.postalCode = 'Código postal inválido';
      if (!province.trim()) errs.province = 'La provincia es obligatoria';

      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }
      setErrors({});
      setCurrentStep(5);
      return;
    }

    if (currentStep === 5) {
      handleSaveFullProfile();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  const handleSaveFullProfile = async () => {
    setSaving(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
      () => {},
    );

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const fullPhone = cleanPhone ? `+34${cleanPhone}` : undefined;

      // 1. Update user profile
      await authService.updateProfile({
        phoneNumber: fullPhone,
        country: 'España',
        region: region.trim() || 'Aragón',
        province: province.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        address: address.trim() || undefined,
      });

      // 2. Update professional profile
      await professionalsApi.updateMyProfile({
        businessName: businessName.trim(),
        bio: bio.trim(),
        taxId: taxId.trim(),
        skills: selectedSkills,
        hourlyRate: parseFloat(hourlyRate) || 35,
        serviceRadiusKm: parseInt(serviceRadius, 10) || 30,
        city: city.trim(),
        postalCode: postalCode.trim(),
        province: province.trim(),
        region: region.trim() || 'Aragón',
        country: 'España',
        address: address.trim() || undefined,
      });

      // 3. Update store
      const updatedRoles = Array.from(
        new Set([...(user?.roles || ['CLIENT']), 'PROFESSIONAL']),
      );
      updateUser({
        roles: updatedRoles as any,
        phoneNumber: fullPhone,
        city: city.trim(),
        postalCode: postalCode.trim(),
        province: province.trim(),
        professionalProfile: {
          businessName: businessName.trim(),
          taxId: taxId.trim(),
          skills: selectedSkills,
          hourlyRate: parseFloat(hourlyRate) || 35,
          serviceRadiusKm: parseInt(serviceRadius, 10) || 30,
        },
      });

      toast.success(
        '¡Perfil Profesional Guardado!',
        'Tu información y portafolio están listos y visibles para clientes.',
      );
      setTimeout(() => {
        router.back();
      }, 400);
    } catch (e: any) {
      toast.error(
        'Error al guardar',
        e.message || 'No se pudo guardar el perfil profesional.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {/* Top Header & Stepper Indicator */}
      <View
        style={{
          paddingTop: Math.max(insets.top + 8, 20),
          paddingHorizontal: 22,
          paddingBottom: 14,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <ThemedTouchable
            onPress={handleBack}
            haptic="light"
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </ThemedTouchable>

          <Text
            style={{
              fontSize: 17,
              fontFamily: 'Satoshi-Black',
              color: colors.textPrimary,
            }}
          >
            Perfil Profesional
          </Text>

          <View style={{ width: 40 }} />
        </View>

        {/* Stepper Progress Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              flex: 1,
              marginRight: 12,
            }}
          >
            {STEPS.map((s) => (
              <View
                key={s.id}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor:
                    s.id <= currentStep ? colors.primary : colors.border,
                }}
              />
            ))}
          </View>
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'Satoshi-Bold',
              color: colors.textSecondary,
            }}
          >
            Paso {currentStep} de 5
          </Text>
        </View>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator color={colors.primary} size="large" />
          <Text
            style={{
              fontSize: 13.5,
              fontFamily: 'Satoshi-Medium',
              color: colors.textSecondary,
              marginTop: 12,
            }}
          >
            Cargando perfil profesional...
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 22,
              paddingTop: 18,
              paddingBottom: 32,
            }}
          >
            {/* PASO 1: IDENTIDAD Y CONTACTO */}
            {currentStep === 1 && (
              <View style={{ gap: 14 }}>
                <Text
                  style={{
                    fontSize: 21,
                    fontFamily: 'Satoshi-Black',
                    color: colors.textPrimary,
                    marginBottom: 2,
                  }}
                >
                  Datos de la Empresa o Autónomo
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Satoshi-Regular',
                    color: colors.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  Esta información identificará tu negocio ante los clientes que
                  soliciten presupuestos.
                </Text>

                <AuthInput
                  label="Nombre comercial o razón social *"
                  placeholder="Ej: Hermanos Gómez Electricidad"
                  value={businessName}
                  onChangeText={(txt) => {
                    setBusinessName(txt);
                    if (errors.businessName)
                      setErrors((prev) => ({ ...prev, businessName: '' }));
                  }}
                  error={errors.businessName}
                  iconName="business-outline"
                />

                <AuthInput
                  label="NIF, CIF o NIE *"
                  placeholder="Ej: 12345678Z o B12345678"
                  value={taxId}
                  onChangeText={(txt) => {
                    setTaxId(txt.toUpperCase());
                    if (errors.taxId)
                      setErrors((prev) => ({ ...prev, taxId: '' }));
                  }}
                  autoCapitalize="characters"
                  error={errors.taxId}
                  iconName="card-outline"
                />

                <AuthInput
                  label="Teléfono de contacto directo *"
                  placeholder="Ej: 612 345 678"
                  value={phone}
                  onChangeText={(txt) => {
                    setPhone(txt);
                    if (errors.phone)
                      setErrors((prev) => ({ ...prev, phone: '' }));
                  }}
                  keyboardType="phone-pad"
                  error={errors.phone}
                  iconName="call-outline"
                />
              </View>
            )}

            {/* PASO 2: CATEGORÍAS Y ESPECIALIDADES */}
            {currentStep === 2 && (
              <View style={{ gap: 14 }}>
                <Text
                  style={{
                    fontSize: 21,
                    fontFamily: 'Satoshi-Black',
                    color: colors.textPrimary,
                    marginBottom: 2,
                  }}
                >
                  Categorías de Especialidad
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Satoshi-Regular',
                    color: colors.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  Selecciona todos los sectores en los que ofreces servicios
                  profesionales.
                </Text>

                <View className="flex-row flex-wrap gap-2.5">
                  {CATEGORIES_LIST.map((cat) => {
                    const isSelected = selectedSkills.includes(cat.name);
                    return (
                      <CategoryChip
                        key={cat.id}
                        label={cat.name}
                        isSelected={isSelected}
                        onPress={() => toggleSkill(cat.name)}
                      />
                    );
                  })}
                </View>

                {errors.skills ? (
                  <Text
                    style={{
                      color: '#EF4444',
                      fontSize: 12,
                      fontFamily: 'Satoshi-Medium',
                      marginTop: 8,
                    }}
                  >
                    {errors.skills}
                  </Text>
                ) : null}
              </View>
            )}

            {/* PASO 3: BIOGRAFÍA Y SERVICIOS (DEDICADO) */}
            {currentStep === 3 && (
              <View style={{ gap: 14 }}>
                <Text
                  style={{
                    fontSize: 21,
                    fontFamily: 'Satoshi-Black',
                    color: colors.textPrimary,
                    marginBottom: 2,
                  }}
                >
                  Biografía y Presentación
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Satoshi-Regular',
                    color: colors.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  Explica tu experiencia, los tipos de trabajos que realizas y
                  qué garantías ofreces a los clientes.
                </Text>

                <AuthInput
                  label="Biografía"
                  placeholder="Describe tu trayectoria, qué trabajos realizas, si das garantía por escrito, experiencia con marcas y tus estándares de calidad..."
                  value={bio}
                  onChangeText={(txt) => {
                    setBio(txt);
                    if (errors.bio) setErrors((prev) => ({ ...prev, bio: '' }));
                  }}
                  multiline
                  numberOfLines={8}
                  style={{ minHeight: 180, textAlignVertical: 'top' }}
                  error={errors.bio}
                  iconName="document-text-outline"
                />

                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Satoshi-Medium',
                    color: colors.textMuted,
                    textAlign: 'right',
                  }}
                >
                  {bio.length} caracteres
                </Text>
              </View>
            )}

            {/* PASO 4: TARIFAS Y COBERTURA */}
            {currentStep === 4 && (
              <View style={{ gap: 14 }}>
                <Text
                  style={{
                    fontSize: 21,
                    fontFamily: 'Satoshi-Black',
                    color: colors.textPrimary,
                    marginBottom: 2,
                  }}
                >
                  Tarifas y Zona de Trabajo
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Satoshi-Regular',
                    color: colors.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  Indica tu tarifa orientativa y el radio geográfico en el que
                  aceptas desplazamientos.
                </Text>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <AuthInput
                      label="Tarifa por hora (€/h)"
                      placeholder="35"
                      value={hourlyRate}
                      onChangeText={setHourlyRate}
                      keyboardType="numeric"
                      iconName="pricetag-outline"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AuthInput
                      label="Radio cobertura (km)"
                      placeholder="30"
                      value={serviceRadius}
                      onChangeText={setServiceRadius}
                      keyboardType="numeric"
                      iconName="map-outline"
                    />
                  </View>
                </View>

                {/* GPS Auto Detect */}
                <ThemedTouchable
                  onPress={handleDetectLocation}
                  haptic="light"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 12,
                    borderRadius: 14,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    gap: 8,
                  }}
                >
                  {isLocating ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Ionicons
                        name="navigate"
                        size={16}
                        color={colors.primary}
                      />
                      <Text
                        style={{
                          fontSize: 13,
                          fontFamily: 'Satoshi-Bold',
                          color: colors.primary,
                        }}
                      >
                        Autocompletar con ubicación GPS actual
                      </Text>
                    </>
                  )}
                </ThemedTouchable>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <AuthInput
                      label="Municipio / Ciudad *"
                      placeholder="Ej: Zaragoza"
                      value={city}
                      onChangeText={(txt) => {
                        setCity(txt);
                        if (errors.city)
                          setErrors((prev) => ({ ...prev, city: '' }));
                      }}
                      error={errors.city}
                      iconName="location-outline"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AuthInput
                      label="Código Postal *"
                      placeholder="50001"
                      value={postalCode}
                      onChangeText={handlePostalCodeChange}
                      keyboardType="numeric"
                      error={errors.postalCode}
                      iconName="navigate-outline"
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <AuthInput
                      label="Provincia *"
                      placeholder="Zaragoza"
                      value={province}
                      onChangeText={setProvince}
                      error={errors.province}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AuthInput
                      label="Dirección / Taller"
                      placeholder="Opcional"
                      value={address}
                      onChangeText={setAddress}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* PASO 5: PORTAFOLIO DE TRABAJOS (CLOUDINARY) */}
            {currentStep === 5 && (
              <View style={{ gap: 14 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 21,
                      fontFamily: 'Satoshi-Black',
                      color: colors.textPrimary,
                    }}
                  >
                    Portafolio de Trabajos
                  </Text>
                  <ThemedTouchable
                    onPress={() =>
                      router.push({
                        pathname: '/detail',
                        params: { id: user?.id, entityType: 'professional' },
                      })
                    }
                    haptic="light"
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.surfaceAlt,
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: colors.border,
                      gap: 4,
                    }}
                  >
                    <Ionicons
                      name="eye-outline"
                      size={14}
                      color={colors.primary}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Satoshi-Bold',
                        color: colors.primary,
                      }}
                    >
                      Ver cómo te ven
                    </Text>
                  </ThemedTouchable>
                </View>

                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Satoshi-Regular',
                    color: colors.textSecondary,
                    marginBottom: 4,
                  }}
                >
                  Tus fotografías se optimizan y alojan en la nube para que los
                  clientes aprecien la calidad de tus reformas y acabados.
                </Text>

                {!showAddProject ? (
                  <ThemedTouchable
                    onPress={() => setShowAddProject(true)}

                    haptic="light"
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 18,
                      paddingVertical: 16,
                      paddingHorizontal: 16,
                      borderWidth: 1.5,
                      borderColor: colors.primary,
                      borderStyle: 'dashed',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={22}
                      color={colors.primary}
                    />
                    <Text
                      style={{
                        color: colors.primary,
                        fontFamily: 'Satoshi-Bold',
                        fontSize: 14.5,
                      }}
                    >
                      + Añadir Proyecto al Portafolio
                    </Text>
                  </ThemedTouchable>
                ) : (
                  <View
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 20,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 15.5,
                          fontFamily: 'Satoshi-Bold',
                          color: colors.textPrimary,
                        }}
                      >
                        Nuevo Trabajo Realizado
                      </Text>
                      <Pressable
                        onPress={() => setShowAddProject(false)}
                        hitSlop={8}
                      >
                        <Ionicons
                          name="close"
                          size={20}
                          color={colors.textSecondary}
                        />
                      </Pressable>
                    </View>

                    <AuthInput
                      label="Título del trabajo *"
                      placeholder="Ej: Reforma de baño completa"
                      value={projectTitle}
                      onChangeText={setProjectTitle}
                    />

                    <AuthInput
                      label="Descripción *"
                      placeholder="Detalles de ejecución, saneamiento, materiales..."
                      value={projectDescription}
                      onChangeText={setProjectDescription}
                      multiline
                      numberOfLines={3}
                    />

                    <ThemedTouchable
                      onPress={handlePickProjectImage}
                      haptic="light"
                      style={{
                        height: 140,
                        borderRadius: 14,
                        backgroundColor: colors.surfaceAlt,
                        borderWidth: 1,
                        borderColor: colors.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      {projectImageUri ? (
                        <Image
                          source={{ uri: projectImageUri }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={{ alignItems: 'center', gap: 6 }}>
                          <Ionicons
                            name="cloud-upload-outline"
                            size={32}
                            color={colors.primary}
                          />
                          <Text
                            style={{
                              fontSize: 13,
                              fontFamily: 'Satoshi-Bold',
                              color: colors.primary,
                            }}
                          >
                            Subir foto (Optimización Cloudinary)
                          </Text>
                        </View>
                      )}
                    </ThemedTouchable>

                    <ThemedTouchable
                      onPress={handleAddProject}
                      disabled={savingProject}
                      haptic="medium"
                      style={{
                        backgroundColor: colors.primary,
                        borderRadius: 999,
                        height: 48,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 4,
                      }}
                    >
                      {savingProject ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text
                          style={{
                            color: '#FFFFFF',
                            fontFamily: 'Satoshi-Bold',
                            fontSize: 14.5,
                          }}
                        >
                          Guardar y Subir a Cloudinary
                        </Text>
                      )}
                    </ThemedTouchable>
                  </View>
                )}

                {/* Existing Portfolio Items */}
                {portfolioItems.length > 0 ? (
                  portfolioItems.map((item) => (
                    <View
                      key={item.id}
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: 18,
                        padding: 14,
                        borderWidth: 1,
                        borderColor: colors.border,
                        flexDirection: 'row',
                        gap: 12,
                      }}
                    >
                      {item.imageUrls?.[0] ? (
                        <Image
                          source={{ uri: item.imageUrls[0] }}
                          style={{
                            width: 80,
                            height: 80,
                            borderRadius: 12,
                            backgroundColor: colors.surfaceAlt,
                          }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={{
                            width: 80,
                            height: 80,
                            borderRadius: 12,
                            backgroundColor: colors.surfaceAlt,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Ionicons
                            name="image-outline"
                            size={24}
                            color={colors.textMuted}
                          />
                        </View>
                      )}

                      <View
                        style={{ flex: 1, justifyContent: 'space-between' }}
                      >
                        <View>
                          <Text
                            numberOfLines={1}
                            style={{
                              fontSize: 14.5,
                              fontFamily: 'Satoshi-Bold',
                              color: colors.textPrimary,
                            }}
                          >
                            {item.title}
                          </Text>
                          <Text
                            numberOfLines={2}
                            style={{
                              fontSize: 12.5,
                              fontFamily: 'Satoshi-Regular',
                              color: colors.textSecondary,
                              marginTop: 2,
                              lineHeight: 16,
                            }}
                          >
                            {item.description}
                          </Text>
                        </View>

                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'flex-end',
                            marginTop: 4,
                          }}
                        >
                          <Pressable
                            onPress={() => handleDeleteProject(item.id)}
                            hitSlop={8}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={14}
                              color="#EF4444"
                            />
                            <Text
                              style={{
                                color: '#EF4444',
                                fontFamily: 'Satoshi-Bold',
                                fontSize: 12,
                              }}
                            >
                              Eliminar
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <View
                    style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 20,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Satoshi-Regular',
                        color: colors.textMuted,
                        textAlign: 'center',
                      }}
                    >
                      Aún no has añadido proyectos. Puedes añadir fotos ahora o
                      continuar para finalizar tu perfil.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Standard Yewi Stepper Action Footer */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingHorizontal: 22,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom + 16, 24),
              backgroundColor: colors.surface,
              borderTopWidth: 1,
              borderTopColor: colors.borderSubtle,
            }}
          >
            {currentStep > 1 && (
              <View style={{ width: 100 }}>
                <ThemedTouchable
                  onPress={handleBack}
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
                  <Text
                    style={{
                      fontSize: 14.5,
                      fontFamily: 'Satoshi-Bold',
                      color: colors.textPrimary,
                    }}
                  >
                    Atrás
                  </Text>
                </ThemedTouchable>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <ThemedTouchable
                onPress={handleNext}
                disabled={saving}
                haptic="medium"
                style={{
                  height: 50,
                  borderRadius: 999,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 15,
                      fontFamily: 'Satoshi-Bold',
                    }}
                  >
                    {currentStep === 5 ? 'Guardar Perfil' : 'Continuar'}
                  </Text>
                )}
              </ThemedTouchable>
            </View>
          </View>
        </View>
      )}

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert((prev) => ({ ...prev, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}
