import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Modal, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useClerk } from '@clerk/expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { CustomSwitch } from '@/components/ui/CustomSwitch';
import {
  usePreferencesStore,
  SupportedCurrency,
  SupportedLanguage,
} from '@/store/usePreferencesStore';
import { useAppTheme } from '@/hooks/useAppTheme';
import { notificationService } from '@/services/notificationService';
import { authService } from '@/services/authService';
import { biometricService } from '@/services/biometricService';
import { useAuthStore } from '@/store/useAuthStore';

interface PreferencesScreenProps {
  onBack: () => void;
  onShowAlert: (title: string, message: string) => void;
}

export function PreferencesScreen({
  onBack,
  onShowAlert,
}: PreferencesScreenProps) {
  const router = useRouter();
  const { signOut } = useClerk();
  const insets = useSafeAreaInsets();
  const { colors, t, isDark } = useAppTheme();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    try {
      await biometricService.clearCredentials().catch(() => {});
      await authService.deleteAccount?.().catch(() => {});
      await signOut?.().catch(() => {});
      setShowDeleteModal(false);
      router.replace('/auth/login');
    } catch {
      setIsDeletingAccount(false);
      onShowAlert('Error', 'No se pudo eliminar la cuenta. Por favor inténtalo de nuevo.');
    }
  };
  const {
    pushNotificationsEnabled,
    darkMode,
    currency,
    language,
    biometricsEnabled,
    setPushNotificationsEnabled,
    setDarkMode,
    setCurrency,
    setLanguage,
    setBiometricsEnabled,
  } = usePreferencesStore();

  const [biometricInfo, setBiometricInfo] = useState<{
    label: string;
    icon: 'finger-print-outline' | 'scan-outline' | 'eye-outline';
  }>({
    label: 'Huella digital',
    icon: 'finger-print-outline',
  });

  useEffect(() => {
    biometricService.getBiometricType().then((info) => {
      setBiometricInfo({ label: info.label, icon: info.icon });
    });
  }, []);

  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const currencyLabels: Record<SupportedCurrency, { name: string; symbol: string }> = {
    EUR: { name: 'Euro', symbol: 'EUR (€)' },
    USD: { name: 'Dólar Estadounidense', symbol: 'USD ($)' },
    GBP: { name: 'Libra Esterlina', symbol: 'GBP (£)' },
  };

  const languageLabels: Record<SupportedLanguage, string> = {
    es: 'Español (España)',
    en: 'English (US / UK)',
  };

  const handleSelectCurrency = async (curr: SupportedCurrency) => {
    await Haptics.selectionAsync().catch(() => {});
    setCurrency(curr);
    setCurrencyModalVisible(false);
    onShowAlert('Moneda Actualizada', `Moneda establecida a ${currencyLabels[curr].symbol}.`);
  };

  const handleSelectLanguage = async (lang: SupportedLanguage) => {
    await Haptics.selectionAsync().catch(() => {});
    setLanguage(lang);
    setLanguageModalVisible(false);
    onShowAlert('Idioma Actualizado', `Idioma cambiado a ${languageLabels[lang]}.`);
  };

  const handleToggleNotifications = async (val: boolean) => {
    await Haptics.selectionAsync().catch(() => {});
    setPushNotificationsEnabled(val);

    if (val) {
      const granted = await notificationService.requestPermissions();
      if (granted) {
        await notificationService.sendLocalNotification({
          title: '🔔 Notificaciones Activadas',
          body: 'Recibirás avisos de nuevos presupuestos, pedidos y mensajes en tiempo real.',
        });
      } else {
        onShowAlert(
          'Permiso Requerido',
          'Para recibir alertas en tu dispositivo, habilita los permisos de notificaciones en los ajustes del sistema.'
        );
      }
    }
  };

  const handleSendTestNotification = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const granted = await notificationService.requestPermissions();
    if (!granted) {
      onShowAlert(
        'Permiso de Notificación',
        'Por favor activa los permisos de notificaciones para ver la prueba.'
      );
      return;
    }

    await notificationService.sendLocalNotification({
      title: '🛠️ Nuevo Presupuesto en Yewi',
      body: 'Un profesional certificado ha enviado un presupuesto de 85€ para tu solicitud de Electricidad.',
      data: { screen: 'requests' },
    });
  };

  const handleToggleDarkMode = async (val: boolean) => {
    await Haptics.selectionAsync().catch(() => {});
    setDarkMode(val);
  };

  const handleToggleBiometrics = async (val: boolean) => {
    if (val) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const hasHardware = await biometricService.isHardwareSupported();
      if (!hasHardware) {
        onShowAlert(
          'Biometría no disponible',
          'Este dispositivo no cuenta con hardware biométrico (huella o Face ID).'
        );
        return;
      }

      const isEnrolled = await biometricService.isEnrolled();
      if (!isEnrolled) {
        onShowAlert(
          'Sin registros biométricos',
          'Configura tu huella digital o Face ID en los Ajustes de tu dispositivo primero.'
        );
        return;
      }

      const success = await biometricService.promptBiometric(
        `Confirma tu ${biometricInfo.label.toLowerCase()} para activarlo en Yewi`
      );

      if (!success) {
        return;
      }

      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        await biometricService.saveCredentials(currentUser);
      }

      setBiometricsEnabled(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onShowAlert(
        `${biometricInfo.label} activada`,
        `Ya puedes iniciar sesión en Yewi rápidamente con tu ${biometricInfo.label.toLowerCase()}.`
      );
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      await biometricService.clearCredentials();
      setBiometricsEnabled(false);
      onShowAlert(
        `${biometricInfo.label} desactivada`,
        'Se ha deshabilitado el acceso biométrico.'
      );
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: colors.background,
          paddingTop: Math.max(insets.top + 8, 28),
          paddingBottom: 16,
          paddingHorizontal: 18,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
        }}
      >
        <ThemedTouchable
          onPress={onBack}
          haptic="light"
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 14,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </ThemedTouchable>
        <Text
          style={{
            fontSize: 20,
            fontFamily: 'PlusJakartaSans-ExtraBold',
            color: colors.textPrimary,
            letterSpacing: -0.4,
          }}
        >
          {t.preferencesTitle}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 20,
          paddingHorizontal: 18,
          paddingBottom: 140,
        }}
      >
        <Text
          style={{
            fontSize: 17,
            fontFamily: 'PlusJakartaSans-ExtraBold',
            color: colors.textPrimary,
            marginBottom: 10,
            marginLeft: 4,
            letterSpacing: -0.3,
          }}
        >
          {t.systemSettings}
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
          {/* Push Notifications */}
          <View
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
            <View className="flex-1 mr-3">
              <Text
                style={{
                  fontSize: 15.5,
                  fontFamily: 'PlusJakartaSans-Bold',
                  color: colors.textPrimary,
                }}
              >
                {t.pushNotifications}
              </Text>
              <Text
                style={{
                  fontSize: 12.5,
                  fontFamily: 'PlusJakartaSans-Regular',
                  color: colors.textSecondary,
                  marginTop: 2,
                }}
              >
                {t.pushNotificationsDesc}
              </Text>
            </View>
            <CustomSwitch
              value={pushNotificationsEnabled}
              onValueChange={handleToggleNotifications}
              activeColor={colors.primary}
            />
          </View>

          {/* Test Notification Action Row */}
          {pushNotificationsEnabled && (
            <ThemedTouchable
              onPress={handleSendTestNotification}
              haptic="selection"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 14,
                paddingHorizontal: 18,
                backgroundColor: colors.surfaceAlt,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderSubtle,
              }}
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="notifications-circle-outline" size={22} color={colors.primary} />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'PlusJakartaSans-Bold',
                    color: colors.primary,
                    marginLeft: 12,
                  }}
                >
                  Probar notificación local
                </Text>
              </View>
              <Ionicons name="send-outline" size={16} color={colors.primary} />
            </ThemedTouchable>
          )}

          {/* Dark Theme */}
          <View
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
            <View className="flex-1 mr-3">
              <Text
                style={{
                  fontSize: 15.5,
                  fontFamily: 'PlusJakartaSans-Bold',
                  color: colors.textPrimary,
                }}
              >
                {t.darkMode}
              </Text>
              <Text
                style={{
                  fontSize: 12.5,
                  fontFamily: 'PlusJakartaSans-Regular',
                  color: colors.textSecondary,
                  marginTop: 2,
                }}
              >
                {t.darkModeDesc}
              </Text>
            </View>
            <CustomSwitch
              value={darkMode}
              onValueChange={handleToggleDarkMode}
              activeColor={colors.primary}
            />
          </View>

          {/* Biometrics (Huella digital / Face ID) */}
          <View
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
            <View className="flex-1 mr-3">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <Ionicons
                  name={biometricInfo.icon}
                  size={18}
                  color={colors.primary}
                />
                <Text
                  style={{
                    fontSize: 15.5,
                    fontFamily: 'PlusJakartaSans-Bold',
                    color: colors.textPrimary,
                  }}
                >
                  {biometricInfo.label}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 12.5,
                  fontFamily: 'PlusJakartaSans-Regular',
                  color: colors.textSecondary,
                  marginTop: 2,
                }}
              >
                {t.biometricsDesc}
              </Text>
            </View>
            <CustomSwitch
              value={biometricsEnabled}
              onValueChange={handleToggleBiometrics}
              activeColor={colors.primary}
            />
          </View>

          {/* Currency */}
          <ThemedTouchable
            onPress={() => setCurrencyModalVisible(true)}
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
            <View>
              <Text
                style={{
                  fontSize: 15.5,
                  fontFamily: 'PlusJakartaSans-Bold',
                  color: colors.textPrimary,
                }}
              >
                {t.currency}
              </Text>
              <Text
                style={{
                  fontSize: 12.5,
                  fontFamily: 'PlusJakartaSans-Regular',
                  color: colors.textSecondary,
                  marginTop: 2,
                }}
              >
                {t.currencyDesc}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'PlusJakartaSans-Bold',
                  color: colors.primary,
                  marginRight: 6,
                }}
              >
                {currencyLabels[currency].symbol}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </ThemedTouchable>

          {/* Language */}
          <ThemedTouchable
            onPress={() => setLanguageModalVisible(true)}
            haptic="selection"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
              paddingHorizontal: 18,
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 15.5,
                  fontFamily: 'PlusJakartaSans-Bold',
                  color: colors.textPrimary,
                }}
              >
                {t.language}
              </Text>
              <Text
                style={{
                  fontSize: 12.5,
                  fontFamily: 'PlusJakartaSans-Regular',
                  color: colors.textSecondary,
                  marginTop: 2,
                }}
              >
                {t.languageDesc}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'PlusJakartaSans-Bold',
                  color: colors.primary,
                  marginRight: 6,
                }}
              >
                {languageLabels[language]}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </ThemedTouchable>
        </View>

        {/* Zona de Cuenta y Seguridad */}
        <View style={{ marginTop: 24, marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 12.5,
              fontFamily: 'PlusJakartaSans-Bold',
              color: colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 10,
              marginLeft: 4,
            }}
          >
            Cuenta y Privacidad
          </Text>

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.18)',
              overflow: 'hidden',
            }}
          >
            <ThemedTouchable
              onPress={() => setShowDeleteModal(true)}
              haptic="medium"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 16,
                paddingHorizontal: 18,
              }}
            >
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'PlusJakartaSans-Bold',
                    color: '#EF4444',
                  }}
                >
                  Eliminar mi cuenta definitivamente
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'PlusJakartaSans-Regular',
                    color: colors.textSecondary,
                    marginTop: 2,
                  }}
                >
                  Elimina permanentemente tu perfil, solicitudes y datos según el RGPD.
                </Text>
              </View>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </ThemedTouchable>
          </View>
        </View>
      </ScrollView>

      {/* Currency Modal */}
      <Modal
        visible={currencyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}
          onPress={() => setCurrencyModalVisible(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              padding: 24,
              paddingBottom: 40,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={{
                width: 48,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.border,
                alignSelf: 'center',
                marginBottom: 20,
              }}
            />
            <Text
              style={{
                fontSize: 18,
                fontFamily: 'PlusJakartaSans-ExtraBold',
                color: colors.textPrimary,
                marginBottom: 16,
              }}
            >
              {t.selectCurrency}
            </Text>

            {(['EUR', 'USD', 'GBP'] as SupportedCurrency[]).map((curr) => {
              const isSelected = currency === curr;
              return (
                <ThemedTouchable
                  key={curr}
                  onPress={() => handleSelectCurrency(curr)}
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
                  <View>
                    <Text
                      style={{
                        fontSize: 15.5,
                        fontFamily: isSelected ? 'PlusJakartaSans-Bold' : 'PlusJakartaSans-Medium',
                        color: isSelected ? colors.primary : colors.textPrimary,
                      }}
                    >
                      {currencyLabels[curr].symbol}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12.5,
                        fontFamily: 'PlusJakartaSans-Regular',
                        color: colors.textSecondary,
                        marginTop: 1,
                      }}
                    >
                      {currencyLabels[curr].name}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  )}
                </ThemedTouchable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Language Modal */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}
          onPress={() => setLanguageModalVisible(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              padding: 24,
              paddingBottom: 40,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={{
                width: 48,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.border,
                alignSelf: 'center',
                marginBottom: 20,
              }}
            />
            <Text
              style={{
                fontSize: 18,
                fontFamily: 'PlusJakartaSans-ExtraBold',
                color: colors.textPrimary,
                marginBottom: 16,
              }}
            >
              {t.selectLanguage}
            </Text>

            {(['es', 'en'] as SupportedLanguage[]).map((lang) => {
              const isSelected = language === lang;
              return (
                <ThemedTouchable
                  key={lang}
                  onPress={() => handleSelectLanguage(lang)}
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
                  <Text
                    style={{
                      fontSize: 15.5,
                      fontFamily: isSelected ? 'PlusJakartaSans-Bold' : 'PlusJakartaSans-Medium',
                      color: isSelected ? colors.primary : colors.textPrimary,
                    }}
                  >
                    {languageLabels[lang]}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  )}
                </ThemedTouchable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal de Confirmación de Eliminación de Cuenta */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}
          onPress={() => setShowDeleteModal(false)}
        >
          <Pressable
            style={{
              width: '100%',
              maxWidth: 380,
              backgroundColor: isDark ? '#1C1E26' : '#FFFFFF',
              borderRadius: 24,
              padding: 24,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              elevation: 10,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Ionicons name="warning" size={24} color="#EF4444" />
            </View>

            <Text
              style={{
                fontSize: 19,
                fontFamily: 'PlusJakartaSans-ExtraBold',
                color: isDark ? '#FFFFFF' : '#0F172A',
                marginBottom: 8,
                letterSpacing: -0.3,
              }}
            >
              ¿Eliminar cuenta definitivamente?
            </Text>

            <Text
              style={{
                fontSize: 13.5,
                fontFamily: 'PlusJakartaSans-Regular',
                color: colors.textSecondary,
                lineHeight: 20,
                marginBottom: 24,
              }}
            >
              Esta acción es irreversible y eliminará permanentemente tu perfil, solicitudes e historial de acuerdo con el RGPD.
            </Text>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <ThemedTouchable
                onPress={() => setShowDeleteModal(false)}
                haptic="light"
                disabled={isDeletingAccount}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : colors.border,
                  backgroundColor: isDark ? '#27272A' : '#F4F4F5',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'PlusJakartaSans-Bold',
                    color: colors.textPrimary,
                  }}
                >
                  Cancelar
                </Text>
              </ThemedTouchable>

              <ThemedTouchable
                onPress={handleDeleteAccount}
                haptic="heavy"
                disabled={isDeletingAccount}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 999,
                  backgroundColor: '#EF4444',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isDeletingAccount ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'PlusJakartaSans-Bold',
                      color: '#FFFFFF',
                    }}
                  >
                    Eliminar
                  </Text>
                )}
              </ThemedTouchable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export default PreferencesScreen;
