import React from 'react';
import { View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@/types/product';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useCartStore } from '@/store/useCartStore';

interface ProductGridItemProps {
  product: Product;
  cardWidth: number;
  onPress: () => void;
}

export function ProductGridItem({
  product,
  cardWidth,
  onPress,
}: ProductGridItemProps) {
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const addToCart = useCartStore((state) => state.addToCart);

  const isFav = isFavorite(product.id);
  const rating = product.rating || 4.5;

  const handleToggleFav = () => {
    toggleFavorite(product.id);
  };

  const handleAddToCart = () => {
    const color = product.colors?.[0] || '#D95B1E';
    const dim = product.dimensions?.[0] || '3x3';
    addToCart(product, color, dim, 1);
  };

  return (
    <ThemedTouchable
      onPress={onPress}
      haptic="light"
      activeOpacity={0.92}
      style={{
        width: cardWidth,
        backgroundColor: '#F5F5F7',
        borderRadius: 20,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
        position: 'relative',
      }}
    >
      {/* Top Row: Star Rating Badge (Left) & Minimalist Heart (Right) */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        {/* Star Rating Badge */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Ionicons name="star" size={13} color="#EAB308" />
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'Satoshi-Bold',
              color: '#18181B',
            }}
          >
            {rating.toFixed(1)}
          </Text>
        </View>

        {/* Heart Wishlist Button */}
        <ThemedTouchable
          onPress={handleToggleFav}
          haptic="selection"
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={17}
            color={isFav ? '#EF4444' : '#18181B'}
          />
        </ThemedTouchable>
      </View>

      {/* Center Product Image */}
      <View
        style={{
          width: '100%',
          height: 130,
          alignItems: 'center',
          justifyContent: 'center',
          marginVertical: 4,
          overflow: 'hidden',
          borderRadius: 12,
        }}
      >
        <Image
          source={product.image}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
        />
      </View>

      {/* Bottom Row: Name, Price (Left) & Round Shopping Bag Button (Right) */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: 4,
        }}
      >
        {/* Left: Product Name & Price */}
        <View style={{ flex: 1, paddingRight: 6 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 13,
              fontFamily: 'Satoshi-Bold',
              color: '#18181B',
              letterSpacing: -0.2,
              marginBottom: 2,
            }}
          >
            {product.name}
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Satoshi-Bold',
              color: '#18181B',
            }}
          >
            ${product.price.toFixed(2)}
          </Text>
        </View>

        {/* Right: Round Shopping Bag Button */}
        <ThemedTouchable
          onPress={handleAddToCart}
          haptic="medium"
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 3,
            elevation: 2,
          }}
        >
          <Ionicons name="bag-outline" size={14} color="#18181B" />
        </ThemedTouchable>
      </View>
    </ThemedTouchable>
  );
}

export default ProductGridItem;
