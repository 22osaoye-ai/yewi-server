import React, { useState } from 'react';
import { View, Image, useWindowDimensions, Text } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { Product } from '@/types/product';
import { DETAIL_COLORS, DETAIL_DIMENSIONS, DETAIL_THUMBNAILS } from '@/constants/detail';
import { DimensionOption } from '@/types/detail';
import { DetailHeader } from '@/components/detail/DetailHeader';
import { LiquidColorPicker } from '@/components/detail/LiquidColorPicker';
import { DetailBottomSheet } from '@/components/detail/DetailBottomSheet';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useCartStore } from '@/store/useCartStore';

interface DetailTemplateProps {
  product: Product;
}

export function DetailTemplate({ product }: DetailTemplateProps) {
  const router = useRouter();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();

  const [selectedColor, setSelectedColor] = useState(1); // Default to Orange
  const [selectedDimension, setSelectedDimension] = useState<string>('3x3');
  const [selectedImage, setSelectedImage] = useState(1); // Default to Thumbnail 2
  const [showCartToast, setShowCartToast] = useState(false);

  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const addToCart = useCartStore((state) => state.addToCart);

  const isFav = isFavorite(product.id);

  // Real-Time Color Customization image selection
  const activeColorImage =
    selectedColor === 0
      ? require('@/assets/images/blue_armchair.png')
      : selectedImage === 1
      ? require('@/assets/images/orange_side.png')
      : require('@/assets/images/orange_armchair.png');

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSelectDimension = (dim: DimensionOption) => {
    setSelectedDimension(dim);
  };

  const handleBuyNow = () => {
    const chosenColor = DETAIL_COLORS[selectedColor]?.hex || '#D95B1E';
    addToCart(product, chosenColor, selectedDimension, 1);

    setShowCartToast(true);
    setTimeout(() => {
      setShowCartToast(false);
      router.push('/vouchers');
    }, 600);
  };

  return (
    <View className="flex-1 bg-[#F0F0F2]">
      {/* Top Header Bar */}
      <DetailHeader
        onBack={handleBack}
        isFavorite={isFav}
        onFavorite={() => toggleFavorite(product.id)}
      />

      {/* Floating Added to Cart Toast Notification */}
      {showCartToast && (
        <Animated.View
          entering={FadeInUp.duration(300)}
          exiting={FadeOutUp.duration(200)}
          className="absolute top-24 self-center bg-[#18181B] px-5 py-2.5 rounded-full z-50 shadow-xl border border-white/20"
        >
          <Text className="text-white font-satoshi-bold text-xs tracking-wide">
            ✓ Added to Cart! Proceeding to Checkout...
          </Text>
        </Animated.View>
      )}

      {/* Main Hero Product Section with Liquid Droplet Connector */}
      <View className="flex-1 items-center justify-center relative overflow-hidden -mt-8">
        <Image
          source={activeColorImage}
          style={{
            width: SCREEN_WIDTH * 1.1,
            height: SCREEN_HEIGHT * 0.5,
            transform: [{ scale: 1.15 }, { translateY: -10 }],
          }}
          resizeMode="contain"
        />

        {/* Slender Stick Droplet Connector & Color Palette */}
        <LiquidColorPicker
          colors={DETAIL_COLORS}
          selectedColor={selectedColor}
          onSelectColor={setSelectedColor}
        />
      </View>

      {/* Unified Frosted Bottom Sheet with Wave Crest Top */}
      <DetailBottomSheet
        title={product.name || 'Comfort Wood Chair'}
        price={`$${product.price ? product.price.toFixed(2) : '102.00'}`}
        description={
          product.description ||
          'The Comfort Wood Chair offers a perfect balance of style and support. Crafted from premium wood, it brings natural warmth and lasting comfort.'
        }
        dimensions={DETAIL_DIMENSIONS}
        selectedDimension={selectedDimension}
        onSelectDimension={handleSelectDimension}
        thumbnails={DETAIL_THUMBNAILS}
        selectedImage={selectedImage}
        onSelectImage={setSelectedImage}
        onBuyNow={handleBuyNow}
      />
    </View>
  );
}

export default DetailTemplate;
