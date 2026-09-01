import React, { useState } from 'react';
import { View, Text, ScrollView, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

interface PreferencesScreenProps {
  onBack: () => void;
  onShowAlert: (title: string, message: string) => void;
}

export function PreferencesScreen({
  onBack,
  onShowAlert,
}: PreferencesScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, t, isDark } = useAppTheme();
  const {
    pushNotificationsEnabled,
    darkMode,
    currency,
    language,
    setPushNotificationsEnabled,
    setDarkMode,
    setCurrency,
    setLanguage,
  } = usePreferencesStore();

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
        }}
      >
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
            fontFamily: 'Satoshi-Black',
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
                  fontFamily: 'Satoshi-Bold',
                  color: colors.textPrimary,
                }}
              >
                {t.pushNotifications}
              </Text>
              <Text
                style={{
                  fontSize: 12.5,
                  fontFamily: 'Satoshi-Regular',
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
                    fontFamily: 'Satoshi-Bold',
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
                  fontFamily: 'Satoshi-Bold',
                  color: colors.textPrimary,
                }}
              >
                {t.darkMode}
              </Text>
              <Text
                style={{
                  fontSize: 12.5,
                  fontFamily: 'Satoshi-Regular',
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
                  fontFamily: 'Satoshi-Bold',
                  color: colors.textPrimary,
                }}
              >
                {t.currency}
              </Text>
              <Text
                style={{
                  fontSize: 12.5,
                  fontFamily: 'Satoshi-Regular',
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
                  fontFamily: 'Satoshi-Bold',
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
                  fontFamily: 'Satoshi-Bold',
                  color: colors.textPrimary,
                }}
              >
                {t.language}
              </Text>
              <Text
                style={{
                  fontSize: 12.5,
                  fontFamily: 'Satoshi-Regular',
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
                  fontFamily: 'Satoshi-Bold',
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
                fontFamily: 'Satoshi-Black',
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
                        fontFamily: isSelected ? 'Satoshi-Bold' : 'Satoshi-Medium',
                        color: isSelected ? colors.primary : colors.textPrimary,
                      }}
                    >
                      {currencyLabels[curr].symbol}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12.5,
                        fontFamily: 'Satoshi-Regular',
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
                fontFamily: 'Satoshi-Black',
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
                      fontFamily: isSelected ? 'Satoshi-Bold' : 'Satoshi-Medium',
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
    </View>
  );
}

export default PreferencesScreen;
