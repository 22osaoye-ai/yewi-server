// src/components/ui/ProductCard.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Product } from '@/types/product';
import { CurvedCard } from './CurvedCard';
import { ThemedTouchable } from './ThemedTouchable';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

const CARD_WIDTH = 260;
const CARD_HEIGHT = 360;

export function ProductCard({ product, onPress }: ProductCardProps) {
  const cardBg = product.cardBg || '#DE7C60';
  const rating = product.rating || 4.9;
  const city = product.city || 'Zaragoza';
  const priceDisplay = `${product.price.toFixed(0)}€${product.priceUnit ? ' ' + product.priceUnit : '/h'}`;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  return (
    <View className="w-[260px] h-[395px] mr-[22px] relative mt-2.5">
      {/* Floating Service Hero Image & Badges */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.94}
        className="absolute -top-[42px] left-[12px] right-[12px] z-20"
      >
        <View
          style={{
            height: 185,
            borderRadius: 22,
            overflow: 'hidden',
            backgroundColor: '#1E1B4B',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.22,
            shadowRadius: 10,
            elevation: 8,
            borderWidth: 2,
            borderColor: 'rgba(255, 255, 255, 0.4)',
          }}
        >
          <Image
            source={product.image}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />

          {/* Dark gradient overlay for text readability */}
          <View
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.22)',
            }}
          />

          {/* Top Row Badges: Location & Rating */}
          <View
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              right: 10,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {/* City Chip */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                paddingHorizontal: 8,
                paddingVertical: 3.5,
                borderRadius: 999,
                backdropFilter: 'blur(4px)',
              }}
            >
              <Ionicons name="location" size={11} color="#FBBF24" style={{ marginRight: 3 }} />
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontFamily: 'Satoshi-Bold' }}>
                {city}
              </Text>
            </View>

            {/* Rating Chip */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                paddingHorizontal: 8,
                paddingVertical: 3.5,
                borderRadius: 999,
              }}
            >
              <Ionicons name="star" size={11} color="#FBBF24" style={{ marginRight: 3 }} />
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontFamily: 'Satoshi-Black' }}>
                {rating.toFixed(1)}
              </Text>
            </View>
          </View>

          {/* Bottom Highlight Badge (e.g. 20% DTO, Urgencias 24h) */}
          {product.badge && (
            <View
              style={{
                position: 'absolute',
                bottom: 10,
                left: 10,
                backgroundColor: '#DC2626',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 6,
                shadowColor: '#DC2626',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 10, fontFamily: 'Satoshi-Black' }}>
                {product.badge}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Curved SVG Card Shape */}
      <TouchableOpacity onPress={handlePress} activeOpacity={0.95}>
        <CurvedCard
          width={CARD_WIDTH}
          height={CARD_HEIGHT}
          backgroundColor={cardBg}
        >
          {/* Top spacer for floating service image */}
          <View className="h-[155px]" />

          {/* Service Info */}
          <View className="mt-auto pb-1">
            <Text
              numberOfLines={2}
              className="text-white text-[18px] font-satoshi-bold tracking-tight leading-[22px]"
            >
              {product.name}
            </Text>

            <View className="flex-row items-center mt-1">
              <Text
                numberOfLines={1}
                className="text-white/85 text-xs font-satoshi-medium flex-1"
              >
                {product.brand}
              </Text>
              {product.verified && (
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color="#34D399"
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>

            <View className="flex-row items-baseline mt-2">
              <Text className="text-white text-[21px] font-satoshi-black tracking-tight">
                {priceDisplay}
              </Text>
              {product.reviewsCount && (
                <Text className="text-white/70 text-[11px] font-satoshi-medium ml-2">
                  ({product.reviewsCount} opiniones)
                </Text>
              )}
            </View>
          </View>
        </CurvedCard>
      </TouchableOpacity>

      {/* Floating Action Button (Pedir Presupuesto / Contactar) */}
      <ThemedTouchable
        onPress={handlePress}
        haptic="medium"
        activeOpacity={0.9}
        className="absolute right-0 bottom-[35px] w-[108px] h-[48px] rounded-full bg-[#18181B] flex-row items-center justify-center gap-1.5 shadow-xl z-30 border border-white/10"
      >
        <Text className="text-white text-[14px] font-satoshi-bold">Pedir</Text>
        <Feather name="arrow-right" size={15} color="#FFFFFF" />
      </ThemedTouchable>
    </View>
  );
}

export default ProductCard;