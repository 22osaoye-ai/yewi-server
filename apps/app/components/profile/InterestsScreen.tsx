import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { CATEGORIES_LIST } from '@/constants/categories';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuthStore } from '@/store/useAuthStore';
import { professionalsApi } from '@/services/professionalsApi';

import { useInterestsStore } from '@/store/useInterestsStore';

interface InterestsScreenProps {
  onBack: () => void;
  onShowAlert: (title: string, message: string) => void;
}

export function InterestsScreen({ onBack, onShowAlert }: InterestsScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { interests, setInterests, loadInterests } = useInterestsStore();

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const list = await loadInterests();
        setSelectedInterests(list);
      } catch (e) {
        console.warn('Error al cargar intereses:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [loadInterests]);

  const allInterests = CATEGORIES_LIST.map((c) => c.name);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSaveInterests = async () => {
    if (selectedInterests.length === 0) {
      onShowAlert(
        'Selecciona al menos una',
        'Debes seleccionar al menos una categoría de interés para recibir alertas y ver sellers personalizados.'
      );
      return;
    }

    try {
      setIsSaving(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      // Guardar de forma reactiva en el store global, AsyncStorage y Backend
      await setInterests(selectedInterests);

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      ).catch(() => {});

      onShowAlert(
        'Intereses Actualizados',
        'Tus intereses se han guardado con éxito. Las listas de sellers y solicitudes se han actualizado en tiempo real.'
      );
      onBack();
    } catch (e: any) {
      onShowAlert(
        'Guardado Local',
        'Tus intereses se han guardado en el dispositivo y se sincronizarán con el servidor.'
      );
      onBack();
    } finally {
      setIsSaving(false);
    }
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
          Mis Intereses
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
            marginBottom: 6,
            marginLeft: 4,
            letterSpacing: -0.3,
          }}
        >
          Categorías de tu interés
        </Text>
        <Text
          style={{
            fontSize: 13,
            fontFamily: 'Satoshi-Regular',
            color: colors.textSecondary,
            marginBottom: 16,
            marginLeft: 4,
          }}
        >
          Selecciona los servicios que ofreces o te interesan para recibir notificaciones automáticas cuando un cliente publique una solicitud en tu zona.
        </Text>

        <View
          style={{
            paddingVertical: 16,
            marginBottom: 24,
          }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
          ) : (
            <View className="flex-row flex-wrap gap-2.5">
              {allInterests.map((interest) => (
                <CategoryChip
                  key={interest}
                  label={interest}
                  isSelected={selectedInterests.includes(interest)}
                  onPress={() => toggleInterest(interest)}
                />
              ))}
            </View>
          )}
        </View>

        <ThemedTouchable
          onPress={handleSaveInterests}
          disabled={isSaving}
          haptic="medium"
          style={{
            height: 52,
            borderRadius: 999,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.12,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: 'Satoshi-Bold' }}>
              Guardar Intereses
            </Text>
          )}
        </ThemedTouchable>
      </ScrollView>
    </View>
  );
}

export default InterestsScreen;

