import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from './Input';
import { ThemedTouchable } from './ThemedTouchable';
import {
  spanishGeoService,
  Province,
  Locality,
  StreetCandidate,
} from '@/services/spanishGeoService';
import { useAppTheme } from '@/hooks/useAppTheme';

interface AddressAutocompleteProps {
  onAddressSelect: (data: {
    province: string;
    city: string;
    address: string;
    postalCode: string;
  }) => void;
  initialCity?: string;
  initialAddress?: string;
  initialPostalCode?: string;
}

export function AddressAutocomplete({
  onAddressSelect,
  initialCity = '',
  initialAddress = '',
  initialPostalCode = '',
}: AddressAutocompleteProps) {
  const { colors, isDark } = useAppTheme();
  const [provinceQuery, setProvinceQuery] = useState('Zaragoza');
  const [selectedProvince, setSelectedProvince] = useState<Province>({
    code: '50',
    name: 'Zaragoza',
    regionName: 'Aragón',
  });

  const [localities, setLocalities] = useState<Locality[]>([]);
  const [selectedLocality, setSelectedLocality] = useState<string>(initialCity || 'Zaragoza');

  const [streetQuery, setStreetQuery] = useState(initialAddress || 'Calle de Roger de Flor 23');
  const [streetCandidates, setStreetCandidates] = useState<StreetCandidate[]>([]);
  const [postalCode, setPostalCode] = useState(initialPostalCode || '50017');

  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [showStreetDropdown, setShowStreetDropdown] = useState(false);
  const [isSearchingStreets, setIsSearchingStreets] = useState(false);
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);

  const debounceTimeout = useRef<any>(null);

  // Load initial localities on mount or province change
  useEffect(() => {
    let isMounted = true;
    spanishGeoService.getLocalities(selectedProvince.code).then((locs) => {
      if (isMounted) {
        setLocalities(locs);
        if (locs.length > 0 && !selectedLocality) {
          setSelectedLocality(locs[0].name);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [selectedProvince.code]);

  // Debounced real-time street search using IGN Cartociudad & OpenStreetMap
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (streetQuery.trim().length >= 3) {
      setIsSearchingStreets(true);
      debounceTimeout.current = setTimeout(async () => {
        try {
          const results = await spanishGeoService.searchStreets(
            selectedProvince.name,
            selectedLocality,
            streetQuery
          );
          setStreetCandidates(results);
          if (results.length > 0) {
            setShowStreetDropdown(true);
          }
        } catch {
          setStreetCandidates([]);
        } finally {
          setIsSearchingStreets(false);
        }
      }, 350);
    } else {
      setStreetCandidates([]);
      setShowStreetDropdown(false);
      setIsSearchingStreets(false);
    }

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [streetQuery, selectedProvince.name, selectedLocality]);

  const filteredProvinces = spanishGeoService.searchProvinces(provinceQuery);

  const handleSelectProvince = async (prov: Province) => {
    setSelectedProvince(prov);
    setProvinceQuery(prov.name);
    setShowProvinceDropdown(false);

    const locs = await spanishGeoService.getLocalities(prov.code);
    setLocalities(locs);
    const defaultCity = locs.length > 0 ? locs[0].name : prov.name;
    setSelectedLocality(defaultCity);

    onAddressSelect({
      province: prov.name,
      city: defaultCity,
      address: streetQuery,
      postalCode,
    });
  };

  const handleGPSDetect = async () => {
    setIsDetectingGPS(true);
    try {
      const detected = await spanishGeoService.detectGPSLocation();
      if (detected) {
        setProvinceQuery(detected.province);
        setSelectedLocality(detected.city);
        setStreetQuery(detected.address);
        setPostalCode(detected.postalCode);

        const foundProv = spanishGeoService
          .searchProvinces('')
          .find((p: Province) => p.name.toLowerCase() === detected.province.toLowerCase());
        if (foundProv) {
          setSelectedProvince(foundProv);
        }

        onAddressSelect(detected);
      }
    } catch {
      // Ignore GPS errors
    } finally {
      setIsDetectingGPS(false);
    }
  };

  const handleSelectStreetCandidate = (candidate: StreetCandidate) => {
    setStreetQuery(candidate.name);
    setPostalCode(candidate.postalCode);
    if (candidate.locality) {
      setSelectedLocality(candidate.locality);
    }
    setShowStreetDropdown(false);

    onAddressSelect({
      province: selectedProvince.name,
      city: candidate.locality || selectedLocality,
      address: candidate.name,
      postalCode: candidate.postalCode,
    });
  };

  return (
    <View className="mb-2">
      {/* GPS Location Button */}
      <ThemedTouchable
        onPress={handleGPSDetect}
        haptic="medium"
        style={{
          backgroundColor: colors.primaryLight,
          borderWidth: 1,
          borderColor: colors.primary,
          borderRadius: 999,
          paddingVertical: 12,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        {isDetectingGPS ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
        ) : (
          <Ionicons name="location" size={18} color={colors.primary} style={{ marginRight: 8 }} />
        )}
        <Text style={{ fontSize: 13.5, fontFamily: 'Satoshi-Bold', color: colors.primary }}>
          {isDetectingGPS ? 'Detectando ubicación GPS...' : 'Usar mi ubicación GPS actual'}
        </Text>
      </ThemedTouchable>

      {/* Step 1: Province Selection */}
      <Input
        label="Provincia (Ej. Zaragoza, Huesca, Teruel, Madrid...)"
        leftIcon="location-outline"
        value={provinceQuery}
        onChangeText={(val) => {
          setProvinceQuery(val);
          setShowProvinceDropdown(true);
        }}
        onFocus={() => setShowProvinceDropdown(true)}
        placeholder="Escribe provincia o comunidad..."
        hint="💡 Aragón tiene 3 provincias: Zaragoza, Huesca y Teruel"
      />

      {showProvinceDropdown && filteredProvinces.length > 0 && (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 8,
            marginBottom: 12,
            marginTop: -8,
            maxHeight: 200,
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.25 : 0.08,
            shadowRadius: 6,
          }}
        >
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {filteredProvinces.map((prov) => (
              <ThemedTouchable
                key={prov.code}
                onPress={() => handleSelectProvince(prov)}
                haptic="selection"
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottomWidth: 1,
                  borderBottomColor: colors.borderSubtle,
                }}
              >
                <View className="flex-row items-center">
                  <Text style={{ fontSize: 13.5, fontFamily: 'Satoshi-Bold', color: colors.textPrimary, marginRight: 8 }}>
                    {prov.name}
                  </Text>
                  <Text style={{ fontSize: 11.5, fontFamily: 'Satoshi-Regular', color: colors.textSecondary }}>
                    ({prov.regionName})
                  </Text>
                </View>
                <Text style={{ fontSize: 11.5, fontFamily: 'Satoshi-Bold', color: colors.primary }}>
                  CP: {prov.code}xxx
                </Text>
              </ThemedTouchable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Step 2: Locality / Municipality Picker */}
      {localities.length > 0 && (
        <View className="mb-3">
          <Text style={{ fontSize: 12.5, fontFamily: 'Satoshi-Bold', color: colors.textPrimary, marginBottom: 6, marginLeft: 4 }}>
            Municipio / Localidad ({selectedProvince.name})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            {localities.map((loc) => {
              const isSelected = loc.name === selectedLocality;
              return (
                <ThemedTouchable
                  key={loc.name}
                  onPress={() => {
                    setSelectedLocality(loc.name);
                    onAddressSelect({
                      province: selectedProvince.name,
                      city: loc.name,
                      address: streetQuery,
                      postalCode,
                    });
                  }}
                  haptic="selection"
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 14,
                    borderRadius: 999,
                    backgroundColor: isSelected
                      ? (isDark ? '#FFFFFF' : '#18181B')
                      : colors.surface,
                    borderWidth: 1,
                    borderColor: isSelected
                      ? (isDark ? '#FFFFFF' : '#18181B')
                      : colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12.5,
                      fontFamily: isSelected ? 'Satoshi-Bold' : 'Satoshi-Medium',
                      color: isSelected
                        ? (isDark ? '#121214' : '#FFFFFF')
                        : colors.textPrimary,
                    }}
                  >
                    {loc.name}
                  </Text>
                </ThemedTouchable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Step 3: Street with Real-Time Cartociudad IGN & OpenStreetMap Search */}
      <View className="relative">
        <Input
          label="Calle y Número (Búsqueda IGN / Cartociudad en tiempo real)"
          leftIcon="navigate-outline"
          value={streetQuery}
          onChangeText={(val) => {
            setStreetQuery(val);
          }}
          onFocus={() => {
            if (streetCandidates.length > 0) setShowStreetDropdown(true);
          }}
          placeholder="Ej. Calle de Roger de Flor 23, Gran Vía, etc."
        />
        {isSearchingStreets && (
          <View className="absolute right-4 top-10">
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
      </View>

      {showStreetDropdown && streetCandidates.length > 0 && (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 8,
            marginBottom: 12,
            marginTop: -8,
            maxHeight: 200,
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.25 : 0.08,
            shadowRadius: 6,
          }}
        >
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {streetCandidates.map((st, idx) => (
              <ThemedTouchable
                key={idx}
                onPress={() => handleSelectStreetCandidate(st)}
                haptic="selection"
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottomWidth: 1,
                  borderBottomColor: colors.borderSubtle,
                }}
              >
                <View className="flex-row items-center flex-1 mr-2">
                  <Ionicons name="location-outline" size={15} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 13.5, fontFamily: 'Satoshi-Bold', color: colors.textPrimary, flex: 1 }} numberOfLines={1}>
                    {st.name}
                  </Text>
                </View>
                <View style={{ backgroundColor: colors.primaryLight, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 11.5, fontFamily: 'Satoshi-Bold', color: colors.primary }}>
                    CP: {st.postalCode}
                  </Text>
                </View>
              </ThemedTouchable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Step 4: Auto-filled Postal Code Field */}
      <Input
        label="Código Postal (Autocompletado Oficial)"
        leftIcon="key-outline"
        value={postalCode}
        onChangeText={setPostalCode}
        placeholder="50017"
        keyboardType="numeric"
        editable={false}
        inputContainerStyle={{ backgroundColor: colors.surfaceAlt }}
        hint="✓ Código postal autocompletado con datos oficiales de España"
      />
    </View>
  );
}

export default AddressAutocomplete;
