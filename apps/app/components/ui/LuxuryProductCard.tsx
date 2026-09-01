import React from 'react';
import { View, Text, Image } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Product } from '@/types/product';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

interface LuxuryProductCardProps {
  product: Product;
  cardWidth: number;
  isFeatured?: boolean;
  onPress: () => void;
}

export function LuxuryProductCard({
  product,
  cardWidth,
  isFeatured = false,
  onPress,
}: LuxuryProductCardProps) {
  const { colors, isDark } = useAppTheme();
  const rating = product.rating || 4.9;
  const reviewsCount = product.reviewsCount || 73;

  return (
    <ThemedTouchable
      onPress={onPress}
      haptic="light"
      activeOpacity={0.92}
      style={{
        width: cardWidth,
        backgroundColor: isFeatured ? colors.primary : colors.surface,
        borderRadius: 24,
        padding: 14,
        borderWidth: isFeatured ? 0 : 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: isFeatured ? 0.18 : isDark ? 0.25 : 0.04,
        shadowRadius: 8,
        elevation: isFeatured ? 4 : 2,
        justifyContent: 'space-between',
        minHeight: 148,
      }}
    >
      {/* Top Row: Thumbnail & Product Name */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {/* Round Image Avatar */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: isFeatured ? 'rgba(255, 255, 255, 0.2)' : colors.surfaceAlt,
            borderWidth: 1.5,
            borderColor: isFeatured ? 'rgba(255, 255, 255, 0.4)' : colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <Image
            source={product.image}
            style={{ width: '85%', height: '85%' }}
            resizeMode="contain"
          />
        </View>

        {/* Product Title (2-lines max) */}
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={2}
            style={{
              fontSize: 13,
              fontFamily: 'Satoshi-Bold',
              color: isFeatured ? '#FFFFFF' : colors.textPrimary,
              lineHeight: 17,
              letterSpacing: -0.2,
            }}
          >
            {product.name}
          </Text>
        </View>
      </View>

      {/* Category / Subtitle */}
      <View style={{ marginVertical: 6 }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 12,
            fontFamily: 'Satoshi-Medium',
            color: isFeatured ? 'rgba(255, 255, 255, 0.85)' : colors.textSecondary,
          }}
        >
          {product.category ? `${product.category} Specialist` : 'Servicio Profesional'}
        </Text>
      </View>

      {/* Bottom Row: Rating, Reviews/Price & Diagonal Arrow Button */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        {/* Rating & Reviews */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="star" size={13} color="#FBBF24" />
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'Satoshi-Bold',
                color: isFeatured ? '#FFFFFF' : colors.textPrimary,
              }}
            >
              {rating.toFixed(1)}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 10,
              fontFamily: 'Satoshi-Medium',
              color: isFeatured ? 'rgba(255, 255, 255, 0.75)' : colors.textMuted,
              marginTop: 1,
            }}
          >
            {reviewsCount} Valoraciones • {product.price.toFixed(0)}€/h
          </Text>
        </View>

        {/* Diagonal Arrow Action Button (↗) */}
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: isFeatured ? 'rgba(0, 0, 0, 0.35)' : colors.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          <Feather
            name="arrow-up-right"
            size={16}
            color={isFeatured ? '#FFFFFF' : colors.textPrimary}
          />
        </View>
      </View>
    </ThemedTouchable>
  );
}

export default LuxuryProductCard;
