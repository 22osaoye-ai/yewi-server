import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
  FlatList,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { requireOptionalNativeModule } from 'expo';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

let MediaLibrary: any = null;
try {
  if (requireOptionalNativeModule('ExpoMediaLibraryNext')) {
    MediaLibrary = require('expo-media-library');
  } else if (requireOptionalNativeModule('ExpoMediaLibrary')) {
    MediaLibrary = require('expo-media-library/legacy');
  }
} catch {
  MediaLibrary = null;
}
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { manipulateAsync, SaveFormat, FlipType } from 'expo-image-manipulator';
import {
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { statusesApi } from '@/services/statusesApi';
import { toast } from '@/store/useToastStore';
import { useAppTheme } from '@/hooks/useAppTheme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRID_PADDING = 16;
const GRID_GAP = 6;
const TILE_SIZE = Math.floor((SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * 2) / 3);

interface CreateStatusModalProps {
  visible: boolean;
  onClose: () => void;
  onStatusCreated: () => void;
}

const TEXT_BACKGROUNDS = [
  '#059669', // WhatsApp Emerald green
  '#1E1B4B', // Indigo night
  '#7C3AED', // Purple
  '#DC2626', // Red
  '#D97706', // Amber
  '#0284C7', // Sky blue
  '#BE185D', // Pink/Magenta
  '#18181B', // Dark sleek
];

const COLOR_PALETTE = [
  '#FFFFFF', // White
  '#FACC15', // Yellow
  '#EF4444', // Red
  '#10B981', // WhatsApp Green
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#F97316', // Orange
  '#8B5CF6', // Purple
  '#000000', // Black
];

const FONT_PRESETS = [
  { id: 'modern', label: 'Moderno', font: 'PlusJakartaSans-Bold' },
  { id: 'serif', label: 'Elegante', font: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  { id: 'mono', label: 'Máquina', font: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  { id: 'script', label: 'Cursiva', font: Platform.OS === 'ios' ? 'Snell Roundhand' : 'sans-serif' },
  { id: 'impact', label: 'Impacto', font: Platform.OS === 'ios' ? 'Impact' : 'sans-serif-condensed' },
];

export interface PhotoFilter {
  id: string;
  name: string;
  icon: string;
  overlayColor?: string;
  vignette?: boolean;
}

export const PHOTO_FILTERS: PhotoFilter[] = [
  { id: 'normal', name: 'Normal', icon: 'image-outline' },
  { id: 'vivid', name: 'Vívido', icon: 'flame-outline', overlayColor: 'rgba(255, 120, 0, 0.09)' },
  { id: 'warm', name: 'Cálido', icon: 'sunny-outline', overlayColor: 'rgba(255, 180, 50, 0.16)' },
  { id: 'cool', name: 'Frío', icon: 'snow-outline', overlayColor: 'rgba(0, 160, 255, 0.14)' },
  { id: 'bw', name: 'B&N', icon: 'contrast-outline', overlayColor: 'rgba(0, 0, 0, 0.55)' },
  { id: 'vintage', name: 'Vintage', icon: 'camera-reverse-outline', overlayColor: 'rgba(160, 120, 60, 0.22)' },
  { id: 'drama', name: 'Drama', icon: 'sparkles-outline', overlayColor: 'rgba(20, 0, 40, 0.25)', vignette: true },
];


interface DrawPath {
  d: string;
  color: string;
}

export function CreateStatusModal({
  visible,
  onClose,
  onStatusCreated,
}: CreateStatusModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  // Mode: TEXT or PHOTO
  const [isTextStatusMode, setIsTextStatusMode] = useState(false);
  const [textStatusContent, setTextStatusContent] = useState('');
  const [textBgColorIndex, setTextBgColorIndex] = useState(0);
  const [textStatusFont, setTextStatusFont] = useState('PlusJakartaSans-Bold');

  // Photo Media state
  const [originalMediaUri, setOriginalMediaUri] = useState<string | null>(null);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Gallery state
  const [recentPhotos, setRecentPhotos] = useState<Array<{ id: string; uri: string }>>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [hasGalleryPermission, setHasGalleryPermission] = useState<boolean | null>(null);

  // 3-dots Options Menu
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // Drawing state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawColor, setDrawColor] = useState('#FFFFFF');
  const [drawPaths, setDrawPaths] = useState<DrawPath[]>([]);
  const [currentPath, setCurrentPath] = useState('');

  // Non-destructive photo filters state
  const [activeFilterId, setActiveFilterId] = useState('normal');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Redo stack for drawing
  const [redoPaths, setRedoPaths] = useState<DrawPath[]>([]);

  // Load recent photos from gallery
  const loadRecentPhotos = useCallback(async () => {
    if (!MediaLibrary) {
      setHasGalleryPermission(false);
      setLoadingPhotos(false);
      return;
    }
    try {
      setLoadingPhotos(true);
      const perm = await MediaLibrary.getPermissionsAsync();
      let isGranted = perm.granted;
      if (!isGranted && perm.canAskAgain) {
        const req = await MediaLibrary.requestPermissionsAsync();
        isGranted = req.granted;
      }
      setHasGalleryPermission(isGranted);

      if (isGranted) {
        const assetsPage = await MediaLibrary.getAssetsAsync({
          first: 45,
          mediaType: ['photo'],
          sortBy: ['creationTime'],
        });
        setRecentPhotos(assetsPage.assets.map((a: any) => ({ id: a.id, uri: a.uri })));
      }
    } catch {
      setHasGalleryPermission(false);
    } finally {
      setLoadingPhotos(false);
    }
  }, []);

  useEffect(() => {
    if (visible && !mediaUri && !isTextStatusMode) {
      loadRecentPhotos();
    }
  }, [visible, mediaUri, isTextStatusMode, loadRecentPhotos]);

  // Handle selecting photo from recent gallery grid
  const handleSelectRecentPhoto = (photoUri: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setOriginalMediaUri(photoUri);
    setMediaUri(photoUri);
    setDrawPaths([]);
    setRedoPaths([]);
    setActiveFilterId('normal');
    setShowFiltersPanel(false);
    setIsDrawingMode(false);
  };

  // Launch camera directly
  const handleTakePhoto = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        toast.error('Permiso Denegado', 'Se requiere acceso a la cámara.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const asset = result.assets[0];
        const uri = asset.base64
          ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
          : asset.uri;
        setOriginalMediaUri(uri);
        setMediaUri(uri);
        setDrawPaths([]);
        setRedoPaths([]);
        setActiveFilterId('normal');
        setShowFiltersPanel(false);
        setIsDrawingMode(false);
      }
    } catch {
      toast.error('Error', 'No se pudo abrir la cámara.');
    }
  };

  // Open native system gallery picker
  const handleOpenNativePicker = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const asset = result.assets[0];
        const uri = asset.base64
          ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
          : asset.uri;
        setOriginalMediaUri(uri);
        setMediaUri(uri);
        setDrawPaths([]);
        setRedoPaths([]);
        setActiveFilterId('normal');
        setShowFiltersPanel(false);
        setIsDrawingMode(false);
      }
    } catch {
      toast.error('Error', 'No se pudo seleccionar la foto.');
    }
  };

  // Cycle background color in Text Status Mode
  const handleCycleTextBgColor = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setTextBgColorIndex((prev) => (prev + 1) % TEXT_BACKGROUNDS.length);
  };

  // Rotate photo 90 degrees clockwise
  const handleRotate90 = async () => {
    if (!mediaUri) return;
    try {
      setIsProcessing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const manip = await manipulateAsync(
        mediaUri,
        [{ rotate: 90 }],
        { compress: 0.9, format: SaveFormat.JPEG, base64: true }
      );
      const uri = manip.base64 ? `data:image/jpeg;base64,${manip.base64}` : manip.uri;
      setMediaUri(uri);
      toast.success('Foto girada 90°');
    } catch {
      toast.error('Error', 'No se pudo girar la foto.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Flip photo horizontally
  const handleFlipHorizontal = async () => {
    if (!mediaUri) return;
    try {
      setIsProcessing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const manip = await manipulateAsync(
        mediaUri,
        [{ flip: FlipType.Horizontal }],
        { compress: 0.9, format: SaveFormat.JPEG, base64: true }
      );
      const uri = manip.base64 ? `data:image/jpeg;base64,${manip.base64}` : manip.uri;
      setMediaUri(uri);
      toast.success('Foto volteada');
    } catch {
      toast.error('Error', 'No se pudo voltear la foto.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset to original photo
  const handleResetOriginal = () => {
    if (originalMediaUri) {
      setMediaUri(originalMediaUri);
      setDrawPaths([]);
      setRedoPaths([]);
      setActiveFilterId('normal');
      setShowFiltersPanel(false);
      setIsDrawingMode(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      toast.success('Foto restablecida');
    }
  };

  // Undo last drawing stroke
  const handleUndoStroke = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setDrawPaths((prev) => prev.slice(0, -1));
  };

  // Submit Text Status
  const handleSubmitTextStatus = async () => {
    if (!textStatusContent.trim()) {
      toast.error('Estado Vacío', 'Escribe algo para publicar tu estado.');
      return;
    }

    try {
      setIsSubmitting(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      await statusesApi.createStatus({
        mediaType: 'TEXT',
        caption: textStatusContent.trim(),
        backgroundColor: TEXT_BACKGROUNDS[textBgColorIndex],
      });

      toast.success('¡Estado Publicado!', 'Tu estado de texto estará visible durante 24 horas.');
      handleCloseAll();
      onStatusCreated();
    } catch (err: any) {
      toast.error('Error al Publicar', err.message || 'No se pudo publicar el estado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Photo Status
  const handleSubmitPhotoStatus = async () => {
    if (!mediaUri) {
      toast.error('Sin Foto', 'Por favor selecciona una foto para publicar.');
      return;
    }

    try {
      setIsSubmitting(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      // Optimización blindada: redimensionar a 1200px y convertir a JPEG base64 ligero (~250KB)
      // Esto evita payloads excesivos (>10MB) y resuelve URIs locales tipo ph:// o content://
      let uploadMediaUrl = mediaUri;
      try {
        const manipResult = await manipulateAsync(
          mediaUri,
          [{ resize: { width: 1200 } }],
          { compress: 0.78, format: SaveFormat.JPEG, base64: true }
        );
        if (manipResult.base64) {
          uploadMediaUrl = `data:image/jpeg;base64,${manipResult.base64}`;
        }
      } catch (manipErr) {
        console.warn('Advertencia optimizando imagen antes de publicar:', manipErr);
      }

      const fullStatusPayload = {
        userCaption: caption.trim(),
        filter: activeFilterId !== 'normal' ? activeFilterId : undefined,
        paths: drawPaths.length > 0 ? drawPaths : null,
        canvasWidth: SCREEN_WIDTH,
        canvasHeight: Math.round(SCREEN_HEIGHT * 0.75),
      };

      const finalCaption = (drawPaths.length > 0 || activeFilterId !== 'normal')
        ? JSON.stringify(fullStatusPayload)
        : caption.trim();

      await statusesApi.createStatus({
        mediaUrl: uploadMediaUrl,
        mediaType: 'IMAGE',
        caption: finalCaption || undefined,
        backgroundColor: '#000000',
      });

      toast.success('¡Estado Publicado!', 'Tu foto estará visible durante 24 horas.');
      handleCloseAll();
      onStatusCreated();
    } catch (err: any) {
      toast.error('Error al Publicar', err.message || 'No se pudo publicar el estado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Undo stroke action
  const handleUndoAction = () => {
    if (drawPaths.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const last = drawPaths[drawPaths.length - 1];
      setRedoPaths((prev) => [...prev, last]);
      setDrawPaths((prev) => prev.slice(0, -1));
    }
  };

  // Redo stroke action
  const handleRedoAction = () => {
    if (redoPaths.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const last = redoPaths[redoPaths.length - 1];
      setDrawPaths((prev) => [...prev, last]);
      setRedoPaths((prev) => prev.slice(0, -1));
    }
  };

  // Reset and close everything
  const handleCloseAll = () => {
    setIsTextStatusMode(false);
    setTextStatusContent('');
    setMediaUri(null);
    setOriginalMediaUri(null);
    setCaption('');
    setDrawPaths([]);
    setRedoPaths([]);
    setActiveFilterId('normal');
    setShowFiltersPanel(false);
    setIsDrawingMode(false);
    setShowOptionsMenu(false);
    onClose();
  };

  // Grid contains exclusively recent photos (NO camera tile in grid)
  const gridData = useMemo(() => {
    return recentPhotos;
  }, [recentPhotos]);

  const currentFilter = useMemo(() => {
    return PHOTO_FILTERS.find((f) => f.id === activeFilterId) || PHOTO_FILTERS[0];
  }, [activeFilterId]);

  const currentTextBg = TEXT_BACKGROUNDS[textBgColorIndex];

  return (
    <>
      {/* 1. WHATSAPP BOTTOMSHEET "Añade un estado": Solo Texto y Foto + Recientes Grid */}
      <AppBottomSheet
        visible={visible && !mediaUri && !isTextStatusMode}
        onClose={handleCloseAll}
        title="Añade un estado"
      >
        <View style={styles.sheetBody}>
          {/* Top Quick Actions Row: Texto (Letra) y Foto al lado */}
          <View style={styles.whatsappActionsRow}>
            {/* 1. TEXTO (Letra) */}
            <ThemedTouchable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setIsTextStatusMode(true);
              }}
              haptic="selection"
              style={styles.actionItem}
              accessibilityRole="button"
              accessibilityLabel="Crear estado de texto"
            >
              <View style={[styles.actionCircle, { backgroundColor: isDark ? '#262D31' : '#E5E7EB' }]}>
                <Ionicons name="pencil" size={22} color={isDark ? '#F9FAFB' : '#111827'} />
              </View>
              <Text style={[styles.actionLabel, { color: isDark ? '#E4E4E7' : '#374151' }]}>
                Texto
              </Text>
            </ThemedTouchable>

            {/* 2. FOTO (al lado del texto) */}
            <ThemedTouchable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                handleOpenNativePicker();
              }}
              haptic="selection"
              style={styles.actionItem}
              accessibilityRole="button"
              accessibilityLabel="Elegir foto"
            >
              <View style={[styles.actionCircle, { backgroundColor: isDark ? '#262D31' : '#E5E7EB' }]}>
                <Ionicons name="image" size={22} color={isDark ? '#F9FAFB' : '#111827'} />
              </View>
              <Text style={[styles.actionLabel, { color: isDark ? '#E4E4E7' : '#374151' }]}>
                Foto
              </Text>
            </ThemedTouchable>
          </View>

          {/* Section Row: "Recientes ▾" */}
          <View style={styles.recentsHeaderRow}>
            <View style={styles.recentsDropdownBtn}>
              <Text style={[styles.recentsTitle, { color: isDark ? '#F9FAFB' : '#111827' }]}>
                Recientes
              </Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color={isDark ? '#9CA3AF' : '#6B7280'}
                style={{ marginLeft: 4 }}
              />
            </View>
          </View>

          {/* Grid: Item 0 = Cámara; Items 1..N = Galería Reciente */}
          {loadingPhotos && recentPhotos.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Cargando fotos de tu dispositivo...
              </Text>
            </View>
          ) : (
            <FlatList
              data={gridData}
              keyExtractor={(item) => item.id}
              numColumns={3}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: SCREEN_HEIGHT * 0.52 }}
              contentContainerStyle={styles.gridContent}
              columnWrapperStyle={{ gap: GRID_GAP, marginBottom: GRID_GAP }}
              renderItem={({ item }) => (
                <ThemedTouchable
                  onPress={() => handleSelectRecentPhoto(item.uri)}
                  haptic="light"
                  style={[
                    styles.photoTile,
                    { width: TILE_SIZE, height: TILE_SIZE },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Seleccionar foto"
                >
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.photoImg}
                    contentFit="cover"
                    transition={80}
                  />
                </ThemedTouchable>
              )}
              ListEmptyComponent={
                !loadingPhotos && hasGalleryPermission === false ? (
                  <View style={styles.permissionBox}>
                    <Ionicons name="images-outline" size={42} color={colors.textMuted} />
                    <Text style={[styles.permissionTitle, { color: colors.textPrimary }]}>
                      Permiso de Fotos Requerido
                    </Text>
                    <Text style={[styles.permissionSub, { color: colors.textSecondary }]}>
                      Permite acceso a tu galería para explorar tus fotos recientes directamente aquí.
                    </Text>
                    <ThemedTouchable
                      onPress={loadRecentPhotos}
                      haptic="medium"
                      style={styles.permissionBtn}
                    >
                      <Text style={styles.permissionBtnText}>Permitir acceso</Text>
                    </ThemedTouchable>
                  </View>
                ) : null
              }
            />
          )}
        </View>
      </AppBottomSheet>

      {/* 2. TEXT STATUS FULL-SCREEN CREATOR (Opened via "Texto" button) */}
      {isTextStatusMode && (
        <Modal
          visible={isTextStatusMode}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setIsTextStatusMode(false)}
          statusBarTranslucent
        >
          <View style={[styles.textStatusContainer, { backgroundColor: currentTextBg }]}>
            {/* Top Bar: Back, Palette, Font */}
            <View
              style={[
                styles.textStatusTopBar,
                { paddingTop: Math.max(insets.top + 8, 22) },
              ]}
            >
              <ThemedTouchable
                onPress={() => setIsTextStatusMode(false)}
                haptic="light"
                style={styles.textStatusCircleBtn}
                accessibilityRole="button"
                accessibilityLabel="Volver"
              >
                <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
              </ThemedTouchable>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {/* Font cycle */}
                <ThemedTouchable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    const nextIdx = (FONT_PRESETS.findIndex((f) => f.font === textStatusFont) + 1) % FONT_PRESETS.length;
                    setTextStatusFont(FONT_PRESETS[nextIdx].font);
                  }}
                  haptic="light"
                  style={styles.textStatusCircleBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Cambiar tipografía"
                >
                  <MaterialCommunityIcons name="format-size" size={22} color="#FFFFFF" />
                </ThemedTouchable>

                {/* Color Palette cycle */}
                <ThemedTouchable
                  onPress={handleCycleTextBgColor}
                  haptic="light"
                  style={styles.textStatusCircleBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Cambiar color de fondo"
                >
                  <Ionicons name="color-palette-outline" size={22} color="#FFFFFF" />
                </ThemedTouchable>
              </View>
            </View>

            {/* Central Big Text Input */}
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              <View style={styles.textStatusCenter}>
                <TextInput
                  placeholder="Escribe un estado..."
                  placeholderTextColor="rgba(255, 255, 255, 0.55)"
                  value={textStatusContent}
                  onChangeText={setTextStatusContent}
                  multiline
                  autoFocus
                  maxLength={300}
                  style={[
                    styles.textStatusInput,
                    { fontFamily: textStatusFont },
                  ]}
                />
              </View>

              {/* Bottom Send Floating Button */}
              <View
                style={[
                  styles.textStatusBottomRow,
                  { paddingBottom: Math.max(insets.bottom + 16, 26) },
                ]}
              >
                <View style={{ flex: 1 }} />
                <ThemedTouchable
                  onPress={handleSubmitTextStatus}
                  disabled={isSubmitting || !textStatusContent.trim()}
                  haptic="medium"
                  style={[
                    styles.textStatusSendBtn,
                    { opacity: textStatusContent.trim() ? 1 : 0.5 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Publicar estado de texto"
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="send" size={22} color="#FFFFFF" />
                  )}
                </ThemedTouchable>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      )}

      {/* 3. PHOTO STATUS FULL-SCREEN EDITOR (Opened when photo selected/captured) */}
      {Boolean(mediaUri) && (
        <Modal
          visible={Boolean(visible && mediaUri)}
          animationType="fade"
          transparent={false}
          onRequestClose={() => setMediaUri(null)}
          statusBarTranslucent
        >
          <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.editorContainer}>
              {/* Top Toolbar (WhatsApp Style) */}
              <View
                style={[
                  styles.editorTopBar,
                  { paddingTop: Math.max(insets.top + 6, 20) },
                ]}
              >
                {/* Back button returns to the Gallery BottomSheet */}
                <ThemedTouchable
                  onPress={() => setMediaUri(null)}
                  haptic="light"
                  style={styles.circularBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Volver a la galería"
                >
                  <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                </ThemedTouchable>

                {/* Editing Controls */}
                {isDrawingMode ? (
                  /* Drawing Mode Toolbar */
                  <View style={styles.drawingBar}>
                    <View style={styles.colorPalette}>
                      {COLOR_PALETTE.slice(0, 6).map((c) => (
                        <Pressable
                          key={c}
                          onPress={() => setDrawColor(c)}
                          style={[
                            styles.colorDot,
                            { backgroundColor: c },
                            drawColor === c && styles.colorDotActive,
                          ]}
                        />
                      ))}
                    </View>

                    {drawPaths.length > 0 && (
                      <ThemedTouchable
                        onPress={handleUndoAction}
                        haptic="light"
                        style={styles.toolIconBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Deshacer trazo"
                      >
                        <Ionicons name="arrow-undo" size={20} color="#FFFFFF" />
                      </ThemedTouchable>
                    )}

                    {redoPaths.length > 0 && (
                      <ThemedTouchable
                        onPress={handleRedoAction}
                        haptic="light"
                        style={styles.toolIconBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Rehacer trazo"
                      >
                        <Ionicons name="arrow-redo" size={20} color="#FFFFFF" />
                      </ThemedTouchable>
                    )}

                    <ThemedTouchable
                      onPress={() => setIsDrawingMode(false)}
                      haptic="medium"
                      style={[styles.toolIconBtn, { backgroundColor: '#10B981' }]}
                      accessibilityRole="button"
                      accessibilityLabel="Finalizar dibujo"
                    >
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    </ThemedTouchable>
                  </View>
                ) : (
                  /* Standard Top Tools Bar */
                  <View style={styles.toolsBar}>
                    {/* Undo */}
                    {drawPaths.length > 0 && (
                      <ThemedTouchable
                        onPress={handleUndoAction}
                        haptic="light"
                        style={styles.toolIconBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Deshacer"
                      >
                        <Ionicons name="arrow-undo" size={20} color="#FFFFFF" />
                      </ThemedTouchable>
                    )}

                    {/* Redo */}
                    {redoPaths.length > 0 && (
                      <ThemedTouchable
                        onPress={handleRedoAction}
                        haptic="light"
                        style={styles.toolIconBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Rehacer"
                      >
                        <Ionicons name="arrow-redo" size={20} color="#FFFFFF" />
                      </ThemedTouchable>
                    )}

                    {/* 3-dots Menu */}
                    <ThemedTouchable
                      onPress={() => setShowOptionsMenu(true)}
                      haptic="light"
                      style={styles.toolIconBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Opciones de la foto"
                    >
                      <Ionicons name="ellipsis-horizontal" size={18} color="#FFFFFF" />
                    </ThemedTouchable>
                  </View>
                )}
              </View>

              {/* Photo Canvas Area (Natural Dimensions, No Auto-Crop) */}
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
              >
                <View style={styles.canvasContainer}>
                  {mediaUri && (
                    <Image
                      source={{ uri: mediaUri }}
                      style={StyleSheet.absoluteFill}
                      contentFit="contain"
                    />
                  )}

                  {/* Non-Destructive Active Filter Overlay */}
                  {currentFilter?.overlayColor ? (
                    <View
                      style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: currentFilter.overlayColor },
                      ]}
                      pointerEvents="none"
                    />
                  ) : null}

                  {/* Non-Destructive Drama Vignette Overlay */}
                  {currentFilter?.vignette ? (
                    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                      <Defs>
                        <LinearGradient id="dramaVignette" x1="0" y1="0" x2="0" y2="1">
                          <Stop offset="0%" stopColor="#000000" stopOpacity="0.5" />
                          <Stop offset="25%" stopColor="#000000" stopOpacity="0.0" />
                          <Stop offset="75%" stopColor="#000000" stopOpacity="0.0" />
                          <Stop offset="100%" stopColor="#000000" stopOpacity="0.65" />
                        </LinearGradient>
                      </Defs>
                      <Rect width="100%" height="100%" fill="url(#dramaVignette)" />
                    </Svg>
                  ) : null}

                  {/* Svg Drawing Touch Layer */}
                  <View
                    style={StyleSheet.absoluteFill}
                    pointerEvents={isDrawingMode ? 'auto' : 'none'}
                    onTouchStart={(e) => {
                      if (!isDrawingMode) return;
                      const { locationX, locationY } = e.nativeEvent;
                      setCurrentPath(`M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`);
                    }}
                    onTouchMove={(e) => {
                      if (!isDrawingMode) return;
                      const { locationX, locationY } = e.nativeEvent;
                      setCurrentPath((prev) => `${prev} L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`);
                    }}
                    onTouchEnd={() => {
                      if (!isDrawingMode) return;
                      if (currentPath) {
                        setDrawPaths((prev) => [...prev, { d: currentPath, color: drawColor }]);
                        setCurrentPath('');
                      }
                    }}
                  >
                    <Svg style={StyleSheet.absoluteFill}>
                      {drawPaths.map((p, i) => (
                        <Path
                          key={i}
                          d={p.d}
                          stroke={p.color}
                          strokeWidth={5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      ))}
                      {currentPath ? (
                        <Path
                          d={currentPath}
                          stroke={drawColor}
                          strokeWidth={5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      ) : null}
                    </Svg>
                  </View>


                </View>

                {/* Non-Destructive Filters Carousel (Toggleable) */}
                {!isDrawingMode && showFiltersPanel && (
                  <View style={styles.filtersCarouselWrap}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.filtersScroll}
                    >
                      {PHOTO_FILTERS.map((f) => {
                        const isSelected = activeFilterId === f.id;
                        return (
                          <ThemedTouchable
                            key={f.id}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                              setActiveFilterId(f.id);
                            }}
                            haptic="selection"
                            style={[
                              styles.filterChip,
                              isSelected && styles.filterChipActive,
                            ]}
                          >
                            <Ionicons
                              name={f.icon as any}
                              size={15}
                              color={isSelected ? '#10B981' : '#FFFFFF'}
                              style={{ marginRight: 5 }}
                            />
                            <Text
                              style={[
                                styles.filterChipText,
                                isSelected && styles.filterChipTextActive,
                              ]}
                            >
                              {f.name}
                            </Text>
                          </ThemedTouchable>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* Editor Bottom Toolbar: Filtros (✨), Pincel (🖌), Girar (⟳) */}
                {!isDrawingMode && (
                  <View style={styles.editorToolbarRow}>

                    <ThemedTouchable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setShowFiltersPanel((prev) => !prev);
                      }}
                      haptic="light"
                      style={[
                        styles.editorToolBtn,
                        (showFiltersPanel || activeFilterId !== 'normal') && styles.editorToolBtnActive,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Filtros de imagen"
                    >
                      <Ionicons
                        name="sparkles"
                        size={19}
                        color={activeFilterId !== 'normal' ? '#10B981' : '#FFFFFF'}
                      />
                      <Text
                        style={[
                          styles.editorToolLabel,
                          activeFilterId !== 'normal' && { color: '#10B981' },
                        ]}
                      >
                        {activeFilterId !== 'normal' ? currentFilter.name : 'Filtros'}
                      </Text>
                    </ThemedTouchable>

                    <ThemedTouchable
                      onPress={() => setIsDrawingMode(true)}
                      haptic="light"
                      style={[
                        styles.editorToolBtn,
                        drawPaths.length > 0 && styles.editorToolBtnActive,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Dibujar con pincel"
                    >
                      <Ionicons name="brush-outline" size={19} color="#FFFFFF" />
                      <Text style={styles.editorToolLabel}>Pincel</Text>
                    </ThemedTouchable>

                    <ThemedTouchable
                      onPress={handleRotate90}
                      disabled={isProcessing}
                      haptic="light"
                      style={styles.editorToolBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Girar 90 grados"
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons name="reload-outline" size={19} color="#FFFFFF" />
                      )}
                      <Text style={styles.editorToolLabel}>Girar</Text>
                    </ThemedTouchable>
                  </View>
                )}

                {/* Bottom Caption Input & WhatsApp Green Send Button */}
                {!isDrawingMode && (
                  <View
                    style={[
                      styles.bottomBar,
                      { paddingBottom: Math.max(insets.bottom + 12, 20) },
                    ]}
                  >
                    <View style={styles.captionInputWrap}>
                      <Ionicons
                        name="text-outline"
                        size={18}
                        color="rgba(255, 255, 255, 0.6)"
                        style={{ marginRight: 8 }}
                      />
                      <TextInput
                        placeholder="Añadir un comentario..."
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={caption}
                        onChangeText={setCaption}
                        style={styles.captionTextInput}
                      />
                    </View>

                    <ThemedTouchable
                      onPress={handleSubmitPhotoStatus}
                      disabled={isSubmitting}
                      haptic="medium"
                      style={styles.sendButton}
                      accessibilityRole="button"
                      accessibilityLabel="Publicar estado"
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons name="send" size={20} color="#FFFFFF" />
                      )}
                    </ThemedTouchable>
                  </View>
                )}
              </KeyboardAvoidingView>
            </View>
          </GestureHandlerRootView>
        </Modal>
      )}



      {/* 5. 3-DOTS OPTIONS MENU (AppBottomSheet standard) */}
      <AppBottomSheet
        visible={showOptionsMenu}
        onClose={() => setShowOptionsMenu(false)}
        title="Opciones de la foto"
      >
        <View style={styles.sheetOptions}>


          <ThemedTouchable
            onPress={() => {
              setShowOptionsMenu(false);
              handleRotate90();
            }}
            haptic="selection"
            style={styles.sheetOptionItem}
          >
            <Ionicons name="reload-outline" size={22} color={isDark ? '#F9FAFB' : '#111827'} style={{ marginRight: 14 }} />
            <Text style={[styles.sheetOptionText, { color: isDark ? '#F9FAFB' : '#111827' }]}>
              Girar 90° a la derecha
            </Text>
          </ThemedTouchable>

          <ThemedTouchable
            onPress={() => {
              setShowOptionsMenu(false);
              handleFlipHorizontal();
            }}
            haptic="selection"
            style={styles.sheetOptionItem}
          >
            <Ionicons name="swap-horizontal-outline" size={22} color={isDark ? '#F9FAFB' : '#111827'} style={{ marginRight: 14 }} />
            <Text style={[styles.sheetOptionText, { color: isDark ? '#F9FAFB' : '#111827' }]}>
              Voltear horizontalmente
            </Text>
          </ThemedTouchable>

          {originalMediaUri && (
            <ThemedTouchable
              onPress={() => {
                setShowOptionsMenu(false);
                handleResetOriginal();
              }}
              haptic="selection"
              style={styles.sheetOptionItem}
            >
              <Ionicons name="refresh-outline" size={22} color={isDark ? '#F9FAFB' : '#111827'} style={{ marginRight: 14 }} />
              <Text style={[styles.sheetOptionText, { color: isDark ? '#F9FAFB' : '#111827' }]}>
                Restablecer foto original
              </Text>
            </ThemedTouchable>
          )}

          <ThemedTouchable
            onPress={() => {
              setShowOptionsMenu(false);
              setMediaUri(null);
            }}
            haptic="medium"
            style={[styles.sheetOptionItem, { borderBottomWidth: 0 }]}
          >
            <Ionicons name="trash-outline" size={22} color="#EF4444" style={{ marginRight: 14 }} />
            <Text style={[styles.sheetOptionText, { color: '#EF4444' }]}>
              Descartar foto y volver a galería
            </Text>
          </ThemedTouchable>
        </View>
      </AppBottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  // Gallery Sheet styles
  sheetBody: {
    paddingTop: 2,
    paddingBottom: 8,
  },
  whatsappActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  actionItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  recentsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 10,
    marginTop: 4,
  },
  recentsDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentsTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -0.2,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  gridContent: {
    paddingBottom: 16,
  },
  photoTile: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#27272A',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  permissionBox: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    marginTop: 12,
    marginBottom: 6,
  },
  permissionSub: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Regular',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  permissionBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 999,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
  },

  // Text Status Full-screen
  textStatusContainer: {
    flex: 1,
  },
  textStatusTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  textStatusCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textStatusCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  textStatusInput: {
    fontSize: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    width: '100%',
  },
  textStatusBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  textStatusSendBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },

  // Editor styles
  editorContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  editorTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  circularBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toolIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorPalette: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 6,
  },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotActive: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.2 }],
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },


  // Filters carousel
  filtersCarouselWrap: {
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderColor: '#10B981',
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#D4D4D8',
  },
  filterChipTextActive: {
    color: '#10B981',
    fontFamily: 'PlusJakartaSans-Bold',
  },

  // Editor bottom toolbar row
  editorToolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  editorToolBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  editorToolBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  editorToolLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    marginTop: 3,
  },

  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    gap: 12,
  },
  captionInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  captionTextInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#FFFFFF',
    padding: 0,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },



  // Sheet options list
  sheetOptions: {
    paddingTop: 6,
    paddingBottom: 16,
  },
  sheetOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.12)',
  },
  sheetOptionText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Medium',
  },
});

export default CreateStatusModal;
