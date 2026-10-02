import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from './ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

export interface SourceOption {
  id: string;
  name: string;
}

export const DEFAULT_SOURCES: SourceOption[] = [
  { id: 'cat-1', name: 'Electricidad' },
  { id: 'cat-2', name: 'Fontanería' },
  { id: 'cat-3', name: 'Reformas' },
  { id: 'cat-4', name: 'Pintura' },
  { id: 'cat-5', name: 'Climatización' },
  { id: 'cat-6', name: 'Cocina' },
  { id: 'cat-7', name: 'Baños' },
  { id: 'cat-8', name: 'Pladur' },
  { id: 'cat-9', name: 'Manitas' },
  { id: 'cat-10', name: 'Cerrajería' },
];

interface ChooseSourceCardProps {
  title?: string;
  subtitle?: string;
  sources?: SourceOption[];
  selectedIds?: string[];
  onToggleSource?: (id: string) => void;
  maxSelection?: number;
}

export function ChooseSourceCard({
  sources = DEFAULT_SOURCES,
  selectedIds = ['cat-3'],
  onToggleSource,
  maxSelection = 3,
}: ChooseSourceCardProps) {
  const { colors, isDark } = useAppTheme();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(142);
  const [isSaved, setIsSaved] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const displayedSources = showAll ? sources : sources.slice(0, 8);

  const handlePressSource = (id: string) => {
    const isSelected = selectedIds.includes(id);

    if (isSelected) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onToggleSource?.(id);
    } else {
      if (selectedIds.length >= maxSelection) {
        // Alerta táctil de límite alcanzado (máximo 3)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      onToggleSource?.(id);
    }
  };

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsLiked((prev) => {
      setLikesCount((c) => (prev ? c - 1 : c + 1));
      return !prev;
    });
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsSaved((prev) => !prev);
  };

  const selectionCount = selectedIds.length;
  const isLimitReached = selectionCount >= maxSelection;

  return (
    <View
      style={[
        styles.instagramCard,
        {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderColor: isDark ? colors.border : '#E2E8F0',
        },
      ]}
    >
      {/* 1. Header estilo Instagram Post: Avatar + Usuario + Menú */}
      <View style={styles.igHeader}>
        <View style={styles.authorRow}>
          {/* Avatar con anillo estilo historia */}
          <View style={styles.storyRing}>
            <View style={[styles.avatarInner, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarLetter}>Y</Text>
            </View>
          </View>

          <View style={styles.authorDetails}>
            <View style={styles.usernameRow}>
              <Text style={[styles.usernameText, { color: colors.textPrimary }]}>
                yewi.hogar
              </Text>
              <Ionicons
                name="checkmark-circle"
                size={13}
                color={colors.primary}
                style={{ marginLeft: 3 }}
              />
            </View>
            <Text style={[styles.locationText, { color: colors.textSecondary }]}>
              Madrid, España · Elige 3 oficios
            </Text>
          </View>
        </View>

        <Pressable
          hitSlop={8}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={18}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>

      {/* 2. Media Canvas: Imagen de fondo editorial + Píldoras interactivas */}
      <View style={styles.mediaContainer}>
        {/* Imagen de fondo editorial de reformas */}
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
          }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />

        {/* Oscurecedor sutil para legibilidad de las píldoras */}
        <View style={styles.mediaOverlay} />

        {/* Badge superior derecho: Contador 1/3, 2/3, 3/3 */}
        <View style={styles.counterBadge}>
          <Text style={styles.counterBadgeText}>
            {selectionCount}/{maxSelection} oficios
          </Text>
        </View>

        {/* Cuadrícula de oficios seleccionables */}
        <View style={styles.chipsCanvas}>
          <Text style={styles.chipsInstruction}>
            {isLimitReached
              ? '✓ 3 seleccionados (toca para cambiar)'
              : `Selecciona ${maxSelection - selectionCount} más`}
          </Text>

          <View style={styles.chipsWrap}>
            {displayedSources.map((source) => {
              const isSelected = selectedIds.includes(source.id);

              return (
                <ThemedTouchable
                  key={source.id}
                  onPress={() => handlePressSource(source.id)}
                  haptic="selection"
                  scaleOnPress
                  activeOpacity={0.88}
                  style={[
                    styles.chipButton,
                    isSelected ? styles.chipSelected : styles.chipUnselected,
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={source.name}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
                    ]}
                  >
                    {source.name}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark"
                      size={13}
                      color="#0F172A"
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </ThemedTouchable>
              );
            })}
          </View>
        </View>
      </View>

      {/* 3. Barra de Acciones Instagram (Like, Comentario, Compartir, Guardar) */}
      <View style={styles.actionsBar}>
        <View style={styles.leftActions}>
          <ThemedTouchable
            onPress={handleLike}
            haptic="light"
            style={styles.actionIconBtn}
            accessibilityLabel="Me gusta"
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={isLiked ? '#EF4444' : colors.textPrimary}
            />
          </ThemedTouchable>

          <ThemedTouchable
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})}
            haptic="light"
            style={styles.actionIconBtn}
            accessibilityLabel="Comentar"
          >
            <Ionicons
              name="chatbubble-outline"
              size={22}
              color={colors.textPrimary}
            />
          </ThemedTouchable>

          <ThemedTouchable
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})}
            haptic="light"
            style={styles.actionIconBtn}
            accessibilityLabel="Compartir"
          >
            <Ionicons
              name="paper-plane-outline"
              size={22}
              color={colors.textPrimary}
            />
          </ThemedTouchable>
        </View>

        <ThemedTouchable
          onPress={handleSave}
          haptic="light"
          style={styles.actionIconBtn}
          accessibilityLabel="Guardar"
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={colors.textPrimary}
          />
        </ThemedTouchable>
      </View>

      {/* 4. Pie de Foto & Comentarios estilo Instagram */}
      <View style={styles.captionContainer}>
        <Text style={[styles.likesText, { color: colors.textPrimary }]}>
          {likesCount} Me gusta
        </Text>

        <Text style={[styles.captionBody, { color: colors.textPrimary }]}>
          <Text style={styles.captionUsername}>yewi.hogar </Text>
          Personaliza tu experiencia eligiendo hasta 3 oficios. Tu feed de obras y presupuestos se adaptará a lo que elijas.
        </Text>

        {sources.length > 8 && (
          <Pressable
            onPress={() => setShowAll((prev) => !prev)}
            style={styles.viewMoreBtn}
          >
            <Text style={[styles.viewMoreText, { color: colors.textSecondary }]}>
              {showAll ? 'Ver menos oficios' : `Ver todos los ${sources.length} oficios`}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  instagramCard: {
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  igHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    padding: 2,
    borderWidth: 1.5,
    borderColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },
  authorDetails: {
    marginLeft: 10,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernameText: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -0.2,
  },
  locationText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Regular',
    marginTop: 1,
  },
  mediaContainer: {
    width: '100%',
    height: 250,
    position: 'relative',
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  counterBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    zIndex: 2,
  },
  counterBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: 0.2,
  },
  chipsCanvas: {
    width: '100%',
    paddingHorizontal: 16,
    zIndex: 2,
  },
  chipsInstruction: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  chipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  chipUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  chipSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  chipText: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  chipTextUnselected: {
    color: '#FFFFFF',
  },
  chipTextSelected: {
    color: '#0F172A',
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconBtn: {
    padding: 3,
  },
  captionContainer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  likesText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 4,
  },
  captionBody: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-Regular',
    lineHeight: 18,
  },
  captionUsername: {
    fontFamily: 'PlusJakartaSans-Bold',
  },
  viewMoreBtn: {
    marginTop: 6,
  },
  viewMoreText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
  },
});
