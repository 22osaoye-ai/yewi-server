import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/hooks/useAppTheme';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import {
  SUPPORTED_COUNTRIES,
  SupportedCountry,
  getCountryByCodeOrPrefix,
  validatePhoneNumber,
  formatPhoneDisplay,
  PhoneValidationResult,
} from '@/constants/countryPhoneConfig';

interface PhoneInputProps {
  label?: string;
  countryCode: 'ES' | 'FR' | 'GB' | string;
  onCountryChange?: (country: SupportedCountry) => void;
  value: string;
  onChangePhone: (nationalNumber: string, result: PhoneValidationResult) => void;
  error?: string;
  hint?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

export function PhoneInput({
  label = 'Teléfono',
  countryCode,
  onCountryChange,
  value,
  onChangePhone,
  error,
  hint,
  autoFocus = false,
  disabled = false,
}: PhoneInputProps) {
  const { colors, isDark } = useAppTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const country = getCountryByCodeOrPrefix(countryCode);

  const handleSelectCountry = (c: SupportedCountry) => {
    Haptics.selectionAsync().catch(() => {});
    setModalVisible(false);
    if (onCountryChange) {
      onCountryChange(c);
    }
    // Re-validate with new country
    const result = validatePhoneNumber(c.code, c.prefix, value);
    onChangePhone(value, result);
  };

  const handleTextChange = (text: string) => {
    const rawDigits = text.replace(/\D/g, '');
    const truncated = rawDigits.slice(0, country.digitsLength);
    const result = validatePhoneNumber(country.code, country.prefix, truncated);
    onChangePhone(truncated, result);
  };

  const formattedValue = formatPhoneDisplay(country.code, value);

  return (
    <View className="mb-4">
      {/* Direct Clean Label */}
      <Text
        style={{
          fontSize: 13,
          fontFamily: 'Satoshi-Bold',
          color: colors.textPrimary,
          marginBottom: 6,
          marginLeft: 2,
        }}
      >
        {label}
      </Text>

      {/* Input Group with Prefix Picker */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: isDark ? '#1C1C1E' : '#F4F4F5',
          borderWidth: 1.5,
          borderColor: error
            ? '#EF4444'
            : isFocused
            ? colors.primary
            : isDark
            ? '#2E2E34'
            : '#E4E4E7',
          borderRadius: 14,
          overflow: 'hidden',
          minHeight: 52,
        }}
      >
        {/* Country Selector Button */}
        <Pressable
          onPress={() => !disabled && setModalVisible(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 14,
            borderRightWidth: 1,
            borderRightColor: isDark ? '#2E2E34' : '#E4E4E7',
            backgroundColor: isDark ? '#242428' : '#ECECEE',
          }}
        >
          <Text style={{ fontSize: 18, marginRight: 6 }}>{country.flag}</Text>
          <Text
            style={{
              fontSize: 14.5,
              fontFamily: 'Satoshi-Bold',
              color: colors.textPrimary,
              marginRight: 4,
            }}
          >
            {country.prefix}
          </Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color={colors.textSecondary}
          />
        </Pressable>

        {/* National Number Text Input */}
        <TextInput
          value={formattedValue}
          onChangeText={handleTextChange}
          placeholder={country.placeholder}
          placeholderTextColor={isDark ? '#71717A' : '#A1A1AA'}
          keyboardType="phone-pad"
          autoFocus={autoFocus}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            flex: 1,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 16,
            fontFamily: 'Satoshi-Medium',
            color: colors.textPrimary,
          }}
        />

        {value.length > 0 && !disabled && (
          <Pressable
            onPress={() => handleTextChange('')}
            style={{ paddingHorizontal: 12 }}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </View>

      {/* Error or Hint feedback */}
      {error ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, marginLeft: 2 }}>
          <Ionicons name="alert-circle" size={14} color="#EF4444" style={{ marginRight: 4 }} />
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'Satoshi-Medium',
              color: '#EF4444',
              flex: 1,
            }}
          >
            {error}
          </Text>
        </View>
      ) : hint ? (
        <Text
          style={{
            fontSize: 12,
            fontFamily: 'Satoshi-Regular',
            color: colors.textSecondary,
            marginTop: 4,
            marginLeft: 2,
          }}
        >
          {hint}
        </Text>
      ) : null}

      {/* Country Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={[
              styles.modalCard,
              { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2E2E34' : '#E4E4E7' },
            ]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Satoshi-Bold',
                  color: colors.textPrimary,
                }}
              >
                Seleccionar País & Prefijo
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Text
              style={{
                fontSize: 12.5,
                fontFamily: 'Satoshi-Regular',
                color: colors.textSecondary,
                marginBottom: 12,
              }}
            >
              Países autorizados en esta fase de Yewi:
            </Text>

            {SUPPORTED_COUNTRIES.map((c) => {
              const isSelected = c.code === country.code;
              return (
                <ThemedTouchable
                  key={c.code}
                  onPress={() => handleSelectCountry(c)}
                  haptic="selection"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderRadius: 12,
                    backgroundColor: isSelected
                      ? isDark
                        ? '#2E2E34'
                        : '#F1F5F9'
                      : 'transparent',
                    marginBottom: 6,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 22, marginRight: 12 }}>{c.flag}</Text>
                    <View>
                      <Text
                        style={{
                          fontSize: 15,
                          fontFamily: 'Satoshi-Bold',
                          color: colors.textPrimary,
                        }}
                      >
                        {c.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: 'Satoshi-Regular',
                          color: colors.textSecondary,
                        }}
                      >
                        {c.digitsLength} dígitos • {c.placeholder}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text
                      style={{
                        fontSize: 14.5,
                        fontFamily: 'Satoshi-Black',
                        color: colors.primary,
                        marginRight: 8,
                      }}
                    >
                      {c.prefix}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                    )}
                  </View>
                </ThemedTouchable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
});
