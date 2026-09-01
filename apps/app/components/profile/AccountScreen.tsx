import React, { useState } from 'react';
import { View, Text, ScrollView, Modal, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';
import { useAuthStore } from '@/store/useAuthStore';
import { authService } from '@/services/authService';
import { useClerk } from '@clerk/expo';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAppTheme } from '@/hooks/useAppTheme';

interface AccountScreenProps {
  onBack: () => void;
  onShowAlert: (title: string, message: string) => void;
}

export function AccountScreen({ onBack, onShowAlert }: AccountScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, t, isDark } = useAppTheme();
  const { user, updateUser } = useAuthStore();
  const { signOut } = useClerk();

  // Edit Profile Modal Stepper State (NO SCROLL)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editStep, setEditStep] = useState<number>(1);
  const [editFirstName, setEditFirstName] = useState(user?.firstName || '');
  const [editLastName, setEditLastName] = useState(user?.lastName || '');
  const [editPhone, setEditPhone] = useState(user?.phoneNumber || '');
  const [editCountry, setEditCountry] = useState(user?.country || 'España');
  const [editRegion, setEditRegion] = useState(user?.region || 'Aragón');
  const [editProvince, setEditProvince] = useState(user?.province || 'Zaragoza');
  const [editCity, setEditCity] = useState(user?.city || 'Zaragoza');
  const [editPostalCode, setEditPostalCode] = useState(user?.postalCode || '50001');
  const [editAddress, setEditAddress] = useState(user?.address || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const openEditModal = () => {
    setEditStep(1);
    setEditFirstName(user?.firstName || '');
    setEditLastName(user?.lastName || '');
    setEditPhone(user?.phoneNumber || '');
    setEditCountry(user?.country || 'España');
    setEditRegion(user?.region || 'Aragón');
    setEditProvince(user?.province || 'Zaragoza');
    setEditCity(user?.city || 'Zaragoza');
    setEditPostalCode(user?.postalCode || '50001');
    setEditAddress(user?.address || '');
    setIsEditModalVisible(true);
  };

  const handlePhoneChange = (text: string) => {
    let cleaned = text.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('+34')) {
      const digits = cleaned.slice(3).replace(/[^0-9]/g, '').slice(0, 9);
      setEditPhone(`+34 ${digits}`);
    } else {
      const digits = cleaned.replace(/[^0-9]/g, '').slice(0, 9);
      setEditPhone(digits);
    }
  };

  const handlePostalCodeChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '').slice(0, 5);
    setEditPostalCode(digits);
  };

  const handleDetectGPS = async () => {
    try {
      setIsDetectingLocation(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        onShowAlert('Ubicación', 'Permiso de ubicación denegado.');
        setIsDetectingLocation(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      if (geo) {
        if (geo.country) setEditCountry(geo.country);
        if (geo.region) setEditRegion(geo.region);
        if (geo.subregion || geo.region) setEditProvince(geo.subregion || geo.region || 'Zaragoza');
        if (geo.city || geo.district) setEditCity(geo.city || geo.district || 'Zaragoza');
        if (geo.postalCode) setEditPostalCode(geo.postalCode.slice(0, 5));
        if (geo.street) setEditAddress(`${geo.street}${geo.streetNumber ? ` ${geo.streetNumber}` : ''}`);
      }
    } catch (e: any) {
      console.warn('GPS location error:', e);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleNextStep = () => {
    if (editStep === 1) {
      const cleanPhone = editPhone.replace(/[\s\-().]/g, '').replace(/^(\+34|0034)/, '');
      if (cleanPhone && !/^[6789]\d{8}$/.test(cleanPhone)) {
        onShowAlert(
          'Teléfono no válido',
          'En España el teléfono debe tener exactamente 9 dígitos y empezar por 6, 7, 8 o 9 (ej. 612 345 678).'
        );
        return;
      }
      setEditStep(2);
      return;
    }

    if (editStep === 2) {
      handleSaveProfile();
    }
  };

  const handleSaveProfile = async () => {
    const cleanCP = editPostalCode.trim();
    if (cleanCP && !/^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/.test(cleanCP)) {
      onShowAlert(
        'Código Postal no válido',
        'El código postal en España debe tener 5 dígitos válidos (entre 01000 y 52999).'
      );
      return;
    }

    setIsSaving(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      await authService.updateProfile({
        firstName: editFirstName.trim() || undefined,
        lastName: editLastName.trim() || undefined,
        phoneNumber: editPhone.replace(/[\s\-().]/g, '') || undefined,
        country: editCountry.trim() || 'España',
        region: editRegion.trim() || undefined,
        province: editProvince.trim() || undefined,
        city: editCity.trim() || undefined,
        postalCode: editPostalCode.trim() || undefined,
        address: editAddress.trim() || undefined,
      });

      updateUser({
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        phoneNumber: editPhone.trim(),
        country: editCountry.trim(),
        region: editRegion.trim(),
        province: editProvince.trim(),
        city: editCity.trim(),
        postalCode: editPostalCode.trim(),
        address: editAddress.trim(),
      });

      setIsEditModalVisible(false);
      onShowAlert('Perfil Actualizado', 'Tus datos se han guardado exitosamente.');
    } catch (e: any) {
      onShowAlert('Error', e.message || 'No se pudo actualizar el perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error('Clerk sign out error:', e);
    }
    await authService.logout();
    router.replace('/auth/login');
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: colors.headerBg,
          paddingTop: Math.max(insets.top + 8, 28),
          paddingBottom: 16,
          paddingHorizontal: 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View className="flex-row items-center">
          <ThemedTouchable
            onPress={onBack}
            haptic="light"
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: isDark ? '#27272A' : 'rgba(255, 255, 255, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </ThemedTouchable>
          <Text
            style={{
              fontSize: 20,
              fontFamily: 'Satoshi-Black',
              color: '#FFFFFF',
              letterSpacing: -0.4,
            }}
          >
            Mi Cuenta
          </Text>
        </View>

        <ThemedTouchable
          onPress={openEditModal}
          haptic="selection"
          style={{
            paddingHorizontal: 14,
            paddingVertical: 6,
            backgroundColor: isDark ? '#27272A' : 'rgba(255, 255, 255, 0.25)',
            borderRadius: 20,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontFamily: 'Satoshi-Bold', fontSize: 13 }}>
            Editar
          </Text>
        </ThemedTouchable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 20,
          paddingHorizontal: 18,
          paddingBottom: 140,
        }}
      >
        {/* Section 1: Personal Info */}
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
          Datos de Contacto
        </Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDark ? 0.2 : 0.04,
            shadowRadius: 4,
            overflow: 'hidden',
            marginBottom: 20,
          }}
        >
          {/* Avatar Row */}
          <View style={{ paddingVertical: 16, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle, flexDirection: 'row', alignItems: 'center' }}>
            <UserAvatar
              size={54}
              initial={user?.firstName?.charAt(0) || 'U'}
              imageUri={user?.avatarUrl}
              isOnline={true}
            />
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={{ fontSize: 16, fontFamily: 'Satoshi-Black', color: colors.textPrimary }}>
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Usuario Yewi'}
              </Text>
              <Text style={{ fontSize: 12.5, fontFamily: 'Satoshi-Regular', color: colors.textSecondary, marginTop: 1 }}>
                Foto de perfil
              </Text>
            </View>
          </View>

          <View style={{ paddingVertical: 14, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }}>
            <Text style={{ fontSize: 15, fontFamily: 'Satoshi-Bold', color: colors.textPrimary }}>
              {user?.email || 'Sin correo asociado'}
            </Text>
            <Text style={{ fontSize: 12.5, fontFamily: 'Satoshi-Regular', color: colors.textSecondary, marginTop: 2 }}>
              Correo electrónico
            </Text>
          </View>

          <View style={{ paddingVertical: 14, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }}>
            <Text style={{ fontSize: 15, fontFamily: 'Satoshi-Bold', color: user?.phoneNumber ? colors.textPrimary : colors.danger }}>
              {user?.phoneNumber && !user.phoneNumber.includes('@') ? user.phoneNumber : 'No configurado'}
            </Text>
            <Text style={{ fontSize: 12.5, fontFamily: 'Satoshi-Regular', color: colors.textSecondary, marginTop: 2 }}>
              Teléfono de contacto
            </Text>
          </View>

          <View style={{ paddingVertical: 14, paddingHorizontal: 18 }}>
            <Text style={{ fontSize: 15, fontFamily: 'Satoshi-Bold', color: colors.primary }}>
              {user?.roles?.includes('PROFESSIONAL') ? 'Profesional' : 'Cliente'}
            </Text>
            <Text style={{ fontSize: 12.5, fontFamily: 'Satoshi-Regular', color: colors.textSecondary, marginTop: 2 }}>
              Tipo de cuenta
            </Text>
          </View>
        </View>

        {/* Section 2: Location Information */}
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
          Ubicación Principal
        </Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDark ? 0.2 : 0.04,
            shadowRadius: 4,
            overflow: 'hidden',
            marginBottom: 20,
          }}
        >
          <View style={{ paddingVertical: 14, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }}>
            <Text style={{ fontSize: 15, fontFamily: 'Satoshi-Bold', color: colors.textPrimary }}>
              {user?.region || 'Aragón'} · {user?.province || 'Zaragoza'}
            </Text>
            <Text style={{ fontSize: 12.5, fontFamily: 'Satoshi-Regular', color: colors.textSecondary, marginTop: 2 }}>
              Comunidad Autónoma y Provincia
            </Text>
          </View>

          <View style={{ paddingVertical: 14, paddingHorizontal: 18, borderBottomWidth: user?.address ? 1 : 0, borderBottomColor: colors.borderSubtle }}>
            <Text style={{ fontSize: 15, fontFamily: 'Satoshi-Bold', color: colors.textPrimary }}>
              {user?.city || 'Zaragoza'} ({user?.postalCode || '50001'})
            </Text>
            <Text style={{ fontSize: 12.5, fontFamily: 'Satoshi-Regular', color: colors.textSecondary, marginTop: 2 }}>
              Localidad y Código Postal
            </Text>
          </View>

          {user?.address ? (
            <View style={{ paddingVertical: 14, paddingHorizontal: 18 }}>
              <Text style={{ fontSize: 15, fontFamily: 'Satoshi-Bold', color: colors.textPrimary }}>
                {user.address}
              </Text>
              <Text style={{ fontSize: 12.5, fontFamily: 'Satoshi-Regular', color: colors.textSecondary, marginTop: 2 }}>
                Dirección
              </Text>
            </View>
          ) : null}
        </View>

        {/* Section 3: Logout */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 50,
            borderWidth: isDark ? 1 : 0,
            borderColor: colors.border,
            overflow: 'hidden',
            marginTop: 10,
          }}
        >
          <ThemedTouchable
            onPress={handleLogout}
            haptic="medium"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 14,
              paddingHorizontal: 18,
            }}
          >
            <View className="flex-row items-center flex-1">
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: colors.dangerBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <Ionicons name="log-out-outline" size={19} color={colors.danger} />
              </View>
              <Text
                style={{
                  fontSize: 15.5,
                  fontFamily: 'Satoshi-Bold',
                  color: colors.danger,
                  letterSpacing: -0.3,
                }}
              >
                Cerrar Sesión
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.danger} />
          </ThemedTouchable>
        </View>
      </ScrollView>

      {/* NON-SCROLLING STEPPER MODAL FOR PROFILE EDIT */}
      <Modal visible={isEditModalVisible} animationType="slide" presentationStyle="pageSheet">
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
                  Editar Perfil
                </Text>
                <ThemedTouchable onPress={() => setIsEditModalVisible(false)} haptic="light">
                  <Ionicons name="close-circle" size={26} color={colors.textMuted} />
                </ThemedTouchable>
              </View>

              {/* Stepper Progress Bar (2 steps) */}
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-1.5 flex-1 mr-4">
                  {[1, 2].map((s) => (
                    <View
                      key={s}
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: s <= editStep ? colors.primary : colors.border,
                      }}
                    />
                  ))}
                </View>
                <Text style={{ fontSize: 12.5, fontFamily: 'Satoshi-Bold', color: colors.textSecondary }}>
                  Paso {editStep} de 2
                </Text>
              </View>

              {/* STEP 1: Datos Personales (NO SCROLL) */}
              {editStep === 1 && (
                <View>
                  <Text style={{ fontSize: 21, fontFamily: 'Satoshi-Black', color: colors.textPrimary, marginBottom: 2 }}>
                    Datos Personales
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Satoshi-Regular', color: colors.textSecondary, marginBottom: 14 }}>
                    Nombre y teléfono de contacto para el servicio.
                  </Text>

                  <AuthInput
                    label="Nombre"
                    leftIcon="person-outline"
                    value={editFirstName}
                    onChangeText={setEditFirstName}
                    placeholder="Nombre"
                  />

                  <AuthInput
                    label="Apellidos"
                    leftIcon="person-outline"
                    value={editLastName}
                    onChangeText={setEditLastName}
                    placeholder="Apellidos"
                  />

                  <AuthInput
                    label="Teléfono de Contacto (9 dígitos) *"
                    leftIcon="call-outline"
                    value={editPhone}
                    onChangeText={handlePhoneChange}
                    placeholder="612 345 678"
                    keyboardType="phone-pad"
                    maxLength={14}
                  />
                </View>
              )}

              {/* STEP 2: Ubicación (NO SCROLL) */}
              {editStep === 2 && (
                <View>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text style={{ fontSize: 21, fontFamily: 'Satoshi-Black', color: colors.textPrimary }}>
                      Ubicación
                    </Text>
                    <ThemedTouchable
                      onPress={handleDetectGPS}
                      disabled={isDetectingLocation}
                      haptic="selection"
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 5,
                        paddingHorizontal: 10,
                        borderRadius: 16,
                        backgroundColor: colors.primaryLight,
                      }}
                    >
                      {isDetectingLocation ? (
                        <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 4 }} />
                      ) : (
                        <Ionicons name="navigate-outline" size={13} color={colors.primary} style={{ marginRight: 4 }} />
                      )}
                      <Text style={{ fontSize: 12, fontFamily: 'Satoshi-Bold', color: colors.primary }}>
                        {isDetectingLocation ? 'Obteniendo...' : 'GPS'}
                      </Text>
                    </ThemedTouchable>
                  </View>

                  <Text style={{ fontSize: 13, fontFamily: 'Satoshi-Regular', color: colors.textSecondary, marginBottom: 12 }}>
                    Zona de cobertura del servicio en España.
                  </Text>

                  <View className="flex-row gap-2.5">
                    <View className="flex-1">
                      <AuthInput
                        label="Comunidad Autónoma *"
                        leftIcon="globe-outline"
                        value={editRegion}
                        onChangeText={setEditRegion}
                        placeholder="Aragón"
                      />
                    </View>
                    <View className="flex-1">
                      <AuthInput
                        label="Provincia *"
                        leftIcon="map-outline"
                        value={editProvince}
                        onChangeText={setEditProvince}
                        placeholder="Zaragoza"
                      />
                    </View>
                  </View>

                  <View className="flex-row gap-2.5">
                    <View className="flex-[1.1]">
                      <AuthInput
                        label="Localidad *"
                        leftIcon="location-outline"
                        value={editCity}
                        onChangeText={setEditCity}
                        placeholder="Zaragoza"
                      />
                    </View>
                    <View className="flex-[0.9]">
                      <AuthInput
                        label="Código Postal *"
                        leftIcon="mail-unread-outline"
                        value={editPostalCode}
                        onChangeText={handlePostalCodeChange}
                        placeholder="50001"
                        keyboardType="numeric"
                        maxLength={5}
                      />
                    </View>
                  </View>

                  <AuthInput
                    label="Dirección (Calle y número)"
                    leftIcon="business-outline"
                    value={editAddress}
                    onChangeText={setEditAddress}
                    placeholder="Calle de Roger de Flor 23"
                  />
                </View>
              )}
            </ScrollView>

            {/* Bottom Stepper Actions (NO SCROLL) */}
            <View className="flex-row items-center gap-3 pt-3 border-t border-[#E5E5EA]">
              {editStep > 1 && (
                <View style={{ width: 100 }}>
                  <ThemedTouchable
                    onPress={() => setEditStep((prev) => prev - 1)}
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
                      Atrás
                    </Text>
                  </ThemedTouchable>
                </View>
              )}

              <View className="flex-1">
                <AuthButton
                  title={editStep === 2 ? 'Guardar Cambios' : 'Continuar →'}
                  onPress={handleNextStep}
                  isLoading={isSaving}
                  variant="primary"
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

export default AccountScreen;
