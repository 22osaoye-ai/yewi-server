import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { ThemedTouchable } from './ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

export interface TopRatedProductItem {
  id: string;
  name: string;
  category?: string;
  price?: number;
  discount?: string;
  image?: any;
  imageUrl?: string;
  rating?: number;
  reviewsCount?: number;
  trade?: string;
  verified?: boolean;
}

export type TopRatedItem = TopRatedProductItem;

export const DEFAULT_TOP_RATED_PRODUCTS: TopRatedProductItem[] = [
  {
    id: 'top-1',
    name: 'Sillón Velvet Blue',
    category: 'Sillón',
    price: 320,
    discount: '-5%',
    image: require('@/assets/images/blue_armchair.png'),
    rating: 5.0,
    reviewsCount: 64,
  },
  {
    id: 'top-2',
    name: 'Sillón Terracota',
    category: 'Sillón',
    price: 290,
    discount: '-10%',
    image: require('@/assets/images/orange_armchair.png'),
    rating: 4.9,
    reviewsCount: 52,
  },
  {
    id: 'top-3',
    name: 'Sillón Lounge Side',
    category: 'Sillón',
    price: 340,
    discount: '-8%',
    image: require('@/assets/images/orange_side.png'),
    rating: 4.9,
    reviewsCount: 48,
  },
  {
    id: 'top-4',
    name: 'Sofá Cream Confort',
    category: 'Sofá',
    price: 680,
    discount: '-15%',
    image: require('@/assets/images/cream_sofa.jpg'),
    rating: 4.9,
    reviewsCount: 41,
  },
  {
    id: 'top-5',
    name: 'Mesa Centro Nordic',
    category: 'Mesa',
    price: 195,
    discount: '-12%',
    image: require('@/assets/images/coffee_table.jpg'),
    rating: 4.8,
    reviewsCount: 39,
  },
  {
    id: 'top-6',
    name: 'Lámpara Cerámica',
    category: 'Iluminación',
    price: 110,
    discount: '-5%',
    image: require('@/assets/images/ceramic_lamp.jpg'),
    rating: 5.0,
    reviewsCount: 35,
  },
  {
    id: 'top-7',
    name: 'Puf Velvet Round',
    category: 'Puf',
    price: 85,
    discount: '-10%',
    image: require('@/assets/images/round_pouf.jpg'),
    rating: 4.9,
    reviewsCount: 28,
  },
  {
    id: 'top-8',
    name: 'Taburete Rústico',
    category: 'Taburete',
    price: 75,
    discount: '-5%',
    image: require('@/assets/images/rustic_stool.jpg'),
    rating: 4.8,
    reviewsCount: 45,
  },
];

export const DEFAULT_TOP_RATED = DEFAULT_TOP_RATED_PRODUCTS;

interface TopRatedCarouselProps {
  items?: TopRatedProductItem[];
  onSelectItem?: (item: TopRatedProductItem) => void;
  onShowAll?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_HORIZONTAL_MARGIN = 16;
const CONTAINER_WIDTH = SCREEN_WIDTH - CONTAINER_HORIZONTAL_MARGIN * 2;
const CARD_WIDTH = Math.min(CONTAINER_WIDTH - 50, 260);
const CARD_GAP = 16;
const SIDE_SPACING = (CONTAINER_WIDTH - CARD_WIDTH) / 2;

export function TopRatedCarousel({
  items = DEFAULT_TOP_RATED_PRODUCTS,
  onSelectItem,
  onShowAll,
}: TopRatedCarouselProps) {
  const { colors, isDark } = useAppTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Colores solicitados: Nuestro azul del proyecto en sólido + con baja opacidad
  const solidBlue = isDark ? '#38BDF8' : '#0284C7';
  const faintBlue = isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(2, 132, 199, 0.35)';

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / (CARD_WIDTH + CARD_GAP));
      if (index >= 0 && index < items.length && index !== activeIndex) {
        setActiveIndex(index);
      }
    },
    [activeIndex, items.length]
  );

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / (CARD_WIDTH + CARD_GAP));
      if (index >= 0 && index < items.length) {
        setActiveIndex(index);
        Haptics.selectionAsync().catch(() => {});
      }
    },
    [items.length]
  );

  const scrollToIndex = useCallback((index: number) => {
    setActiveIndex(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    scrollViewRef.current?.scrollTo({
      x: index * (CARD_WIDTH + CARD_GAP),
      animated: true,
    });
  }, []);

  return (
    <View
      style={[
        styles.outerContainer,
        {
          borderColor: isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(2, 132, 199, 0.18)',
        },
      ]}
    >
      {/* Fondo con Gradiente Atmosférico del Azul del Proyecto */}
      <View style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="topRatedAtmosphere" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop
                offset="0%"
                stopColor={isDark ? '#082F49' : '#E0F2FE'}
                stopOpacity={isDark ? 0.85 : 0.8}
              />
              <Stop
                offset="55%"
                stopColor={isDark ? '#0C2D48' : '#BAE6FD'}
                stopOpacity={isDark ? 0.6 : 0.45}
              />
              <Stop
                offset="100%"
                stopColor={isDark ? '#121214' : '#F0F9FF'}
                stopOpacity={isDark ? 0.35 : 0.15}
              />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#topRatedAtmosphere)" />
        </Svg>
      </View>

      {/* 1. Header: Eyebrow + Título Fijo 'Yewi Top 10' con Azul Sólido y Azul Baja Opacidad */}
      <View style={styles.headerBox}>
        {/* Eyebrow con icono */}
        <View style={styles.eyebrowPill}>
          <Ionicons name="sparkles" size={12} color={solidBlue} style={{ marginRight: 5 }} />
          <Text style={[styles.eyebrowLabel, { color: solidBlue }]}>
            EXCLUSIVO
          </Text>
        </View>

        {/* Título Grande 'Yewi Top 10' */}
        <Text style={styles.heroBrandTitle}>
          <Text style={{ color: solidBlue }}>Yewi </Text>
          <Text style={{ color: faintBlue }}>Top 10</Text>
        </Text>
      </View>

      {/* 2. Carrusel Central: Tarjeta de Arco Blanco con el Sillón Sobresaliendo */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_GAP}
        snapToAlignment="start"
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.carouselTrack,
          {
            paddingLeft: SIDE_SPACING,
            paddingRight: SIDE_SPACING,
          },
        ]}
      >
        {items.map((item, index) => {
          const isItemActive = index === activeIndex;
          return (
            <View
              key={item.id}
              style={[
                styles.cardStage,
                {
                  width: CARD_WIDTH,
                  transform: [{ scale: isItemActive ? 1 : 0.94 }],
                },
              ]}
            >
              {/* Pedestal / Arco Blanco (Fondo de la Tarjeta) */}
              <View
                style={[
                  styles.whiteArchPedestal,
                  {
                    backgroundColor: '#FFFFFF',
                  },
                ]}
              >
                {/* Descuento Pill en la esquina superior derecha */}
                {item.discount && (
                  <View style={styles.discountPill}>
                    <Text style={styles.discountText}>{item.discount}</Text>
                  </View>
                )}

                {/* Pie Informativo dentro del Arco: Nombre del Producto y Precio */}
                <View style={styles.pedestalInfo}>
                  <Text style={styles.productNameText} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.productPriceText}>
                    {item.price} €
                  </Text>
                </View>

                {/* Botón Flotante Circular Central con icono de bolsa/compra */}
                <ThemedTouchable
                  onPress={() => onSelectItem?.(item)}
                  haptic="selection"
                  style={styles.actionFloatingButton}
                  activeOpacity={0.88}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver ${item.name}`}
                >
                  <Ionicons name="bag-handle-outline" size={17} color="#FFFFFF" />
                </ThemedTouchable>
              </View>

              {/* El Sillón / Objeto Recortado que flota y sobresale por encima del arco */}
              <ThemedTouchable
                onPress={() => onSelectItem?.(item)}
                haptic="selection"
                activeOpacity={0.92}
                style={styles.floatingObjectContainer}
              >
                <Image
                  source={item.image || (item.imageUrl ? { uri: item.imageUrl } : undefined)}
                  style={styles.cutoutProductImage}
                  resizeMode="contain"
                />
              </ThemedTouchable>
            </View>
          );
        })}
      </ScrollView>

      {/* 3. Barra Inferior en Cápsula: 'Ver más' + Miniaturas de selección */}
      <View style={styles.capsuleBarContainer}>
        <View style={styles.capsuleBar}>
          {/* Lado Izquierdo: Botón 'Ver más' */}
          <ThemedTouchable
            onPress={onShowAll}
            haptic="light"
            activeOpacity={0.75}
            style={styles.capsuleLeftButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.capsuleLeftText}>Ver más</Text>
          </ThemedTouchable>

          {/* Lado Derecho: Fila de miniaturas de previsualización */}
          <View style={styles.miniThumbnailsRow}>
            {items.slice(0, 4).map((item, idx) => {
              const isThumbActive = idx === activeIndex;
              return (
                <ThemedTouchable
                  key={item.id}
                  onPress={() => scrollToIndex(idx)}
                  haptic="selection"
                  activeOpacity={0.8}
                  style={[
                    styles.miniThumbBox,
                    isThumbActive && styles.miniThumbBoxActive,
                  ]}
                >
                  <Image
                    source={item.image || (item.imageUrl ? { uri: item.imageUrl } : undefined)}
                    style={styles.miniThumbImg}
                    resizeMode="contain"
                  />
                </ThemedTouchable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    marginHorizontal: CONTAINER_HORIZONTAL_MARGIN,
    marginVertical: 14,
    borderRadius: 36,
    borderWidth: 1,
    overflow: 'hidden',
    paddingTop: 28,
    paddingBottom: 22,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  eyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  eyebrowLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: 1.4,
  },
  heroBrandTitle: {
    fontSize: 34,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    letterSpacing: -1,
    lineHeight: 40,
    textAlign: 'center',
  },
  carouselTrack: {
    paddingTop: 36,
    paddingBottom: 16,
    gap: CARD_GAP,
  },
  cardStage: {
    height: 310,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  whiteArchPedestal: {
    width: '100%',
    height: 225,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
    justifyContent: 'flex-end',
    paddingBottom: 22,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
  },
  discountPill: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  pedestalInfo: {
    alignItems: 'center',
    marginBottom: 10,
  },
  productNameText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#0F172A',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  productPriceText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    color: '#0F172A',
    marginTop: 2,
    textAlign: 'center',
  },
  actionFloatingButton: {
    position: 'absolute',
    bottom: -18,
    alignSelf: 'center',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 20,
  },
  floatingObjectContainer: {
    position: 'absolute',
    top: -16,
    alignSelf: 'center',
    width: 195,
    height: 195,
    zIndex: 10,
  },
  cutoutProductImage: {
    width: '100%',
    height: '100%',
  },
  capsuleBarContainer: {
    marginTop: 20,
    paddingHorizontal: 22,
  },
  capsuleBar: {
    backgroundColor: '#0F172A',
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  capsuleLeftButton: {
    paddingVertical: 2,
  },
  capsuleLeftText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  miniThumbnailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniThumbBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  miniThumbBoxActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    transform: [{ scale: 1.15 }],
  },
  miniThumbImg: {
    width: '100%',
    height: '100%',
  },
});
