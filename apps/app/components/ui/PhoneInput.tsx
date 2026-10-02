import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  Pressable,
  StyleSheet,
  ActivityIndicator,
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
  status?: 'idle' | 'checking' | 'valid' | 'invalid';
  validMessage?: string;
  rightComponent?: React.ReactNode;
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
  status = 'idle',
  validMessage,
  rightComponent,
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
      {/* Label */}
      {label && (
        <Text
          numberOfLines={1}
          style={{
            fontSize: 13,
            fontFamily: 'PlusJakartaSans-Bold',
            color: colors.textPrimary,
            marginBottom: 6,
            marginLeft: 2,
          }}
        >
          {label}
        </Text>
      )}

      {/* Input Group with Country Prefix */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: isDark ? '#1C1C1E' : '#F8FAFC',
          borderWidth: 1.5,
          borderColor: error || status === 'invalid'
            ? '#EF4444'
            : status === 'valid'
            ? '#10B981'
            : isFocused
            ? colors.primary
            : isDark
            ? '#2E2E34'
            : '#E2E8F0',
          borderRadius: 16,
          overflow: 'hidden',
          minHeight: 52,
          shadowColor: isFocused ? colors.primary : 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: isFocused ? 0.15 : 0,
          shadowRadius: 8,
          elevation: isFocused ? 2 : 0,
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
            borderRightColor: isDark ? '#2E2E34' : '#E2E8F0',
            backgroundColor: isDark ? '#242428' : '#F1F5F9',
          }}
        >
          <Text style={{ fontSize: 18, marginRight: 6 }}>{country.flag}</Text>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 14,
              fontFamily: 'PlusJakartaSans-Bold',
              color: colors.textPrimary,
              marginRight: 4,
            }}
          >
            {country.prefix}
          </Text>
          <Ionicons
            name="chevron-down"
            size={13}
            color={colors.textSecondary}
          />
        </Pressable>

        {/* National Number Text Input */}
        <TextInput
          value={formattedValue}
          onChangeText={handleTextChange}
          placeholder={country.placeholder}
          placeholderTextColor={isDark ? '#71717A' : '#94A3B8'}
          keyboardType="phone-pad"
          autoFocus={autoFocus}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            flex: 1,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 15,
            fontFamily: 'PlusJakartaSans-Medium',
            color: colors.textPrimary,
          }}
        />

        {value.length > 0 && !disabled && (
          <Pressable
            onPress={() => handleTextChange('')}
            hitSlop={8}
            style={{ paddingHorizontal: 10 }}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
        )}

        {/* Status Indicator Icon */}
        {!rightComponent && status === 'checking' && (
          <View style={{ paddingHorizontal: 10 }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
        {!rightComponent && status === 'valid' && (
          <View style={{ paddingHorizontal: 10 }}>
            <Ionicons name="checkmark-circle" size={19} color="#10B981" />
          </View>
        )}
        {!rightComponent && status === 'invalid' && !error && (
          <View style={{ paddingHorizontal: 10 }}>
            <Ionicons name="alert-circle" size={19} color="#EF4444" />
          </View>
        )}
        {rightComponent && (
          <View style={{ paddingHorizontal: 8 }}>
            {rightComponent}
          </View>
        )}
      </View>

      {/* Error, Valid Message, Checking or Hint feedback */}
      {error ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, marginLeft: 2 }}>
          <Ionicons name="alert-circle" size={14} color="#EF4444" style={{ marginRight: 4 }} />
          <Text
            numberOfLines={1}
            style={{
              fontSize: 12,
              fontFamily: 'PlusJakartaSans-Medium',
              color: '#EF4444',
              flex: 1,
            }}
          >
            {error}
          </Text>
        </View>
      ) : status === 'valid' && validMessage ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, marginLeft: 2 }}>
          <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginRight: 4 }} />
          <Text
            numberOfLines={1}
            style={{
              fontSize: 12,
              fontFamily: 'PlusJakartaSans-Medium',
              color: '#10B981',
              flex: 1,
            }}
          >
            {validMessage}
          </Text>
        </View>
      ) : status === 'checking' ? (
        <Text
          numberOfLines={1}
          style={{
            fontSize: 12,
            fontFamily: 'PlusJakartaSans-Regular',
            color: colors.primary,
            marginTop: 4,
            marginLeft: 2,
          }}
        >
          Comprobando...
        </Text>
      ) : hint ? (
        <Text
          numberOfLines={1}
          style={{
            fontSize: 12,
            fontFamily: 'PlusJakartaSans-Regular',
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
              {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                borderColor: isDark ? '#2E2E34' : '#E2E8F0',
              },
            ]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 16,
                  fontFamily: 'PlusJakartaSans-Bold',
                  color: colors.textPrimary,
                }}
              >
                País
              </Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

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
                    borderRadius: 14,
                    backgroundColor: isSelected
                      ? isDark
                        ? '#2E2E34'
                        : '#F0F9FF'
                      : 'transparent',
                    marginBottom: 6,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                    <Text style={{ fontSize: 22, marginRight: 12 }}>{c.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 14,
                          fontFamily: 'PlusJakartaSans-Bold',
                          color: colors.textPrimary,
                        }}
                      >
                        {c.name}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 11.5,
                          fontFamily: 'PlusJakartaSans-Regular',
                          color: colors.textSecondary,
                        }}
                      >
                        {c.digitsLength} dígitos • {c.placeholder}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 14,
                        fontFamily: 'PlusJakartaSans-ExtraBold',
                        color: colors.primary,
                        marginRight: 6,
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
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
});
