import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Product } from '@/types/product';
import { ProductCard } from '@/components/ui/ProductCard';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { HomePromoBanner } from '@/components/ui/HomePromoBanner';
import { useCartStore } from '@/store/useCartStore';

const CATEGORIES = ['All', 'Chair', 'Table', 'Sofa', 'Lamp'];

interface HomeTemplateProps {
  products: Product[];
}

export function HomeTemplate({ products }: HomeTemplateProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('Chair');
  const totalCartCount = useCartStore((state) => state.totalCount());

  const handleProductPress = (productId: string) => {
    router.push({
      pathname: '/detail',
      params: { id: productId, entityType: 'gig' },
    });
  };

  const handleSearchPress = () => {
    router.push('/(tabs)/search');
  };

  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((p) =>
          p.category?.toLowerCase() === selectedCategory.toLowerCase() ||
          p.name.toLowerCase().includes(selectedCategory.toLowerCase())
        );

  return (
    <View className="flex-1 bg-[#F8F8FA]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 50, paddingBottom: 130 }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-[22px] mb-[18px]">
          <View>
            <Text className="text-[29px] font-satoshi-black text-[#18181B] leading-[34px] tracking-tight">
              Find Your
            </Text>
            <Text className="text-[29px] font-satoshi-black text-[#18181B] leading-[34px] tracking-tight">
              Dream Furniture
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            {/* Cart Icon with Badge */}
            <ThemedTouchable
              onPress={() => router.push('/vouchers')}
              haptic="light"
              className="w-11 h-11 rounded-full bg-white items-center justify-center border border-[#F0F0F2] shadow-sm relative"
            >
              <Ionicons name="bag-handle-outline" size={20} color="#18181B" />
              {totalCartCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-[#C87D20] w-5 h-5 rounded-full items-center justify-center border-2 border-white">
                  <Text className="text-[10px] font-satoshi-bold text-white">
                    {totalCartCount}
                  </Text>
                </View>
              )}
            </ThemedTouchable>

            {/* User Avatar */}
            <View className="relative">
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
                }}
                className="w-[48px] h-[48px] rounded-full border-2 border-white"
              />
              <View className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#10B981] border-2 border-white" />
            </View>
          </View>
        </View>

        {/* Search Bar & Filter Button with EXACT original height and thickness */}
        <View className="flex-row items-center px-[22px] mb-4">
          <ThemedTouchable
            onPress={handleSearchPress}
            haptic="light"
            className="flex-1 flex-row items-center bg-white rounded-full px-4 py-2 border border-[#F0F0F2] shadow-sm elevation-2"
          >
            <Ionicons name="search-outline" size={24} color="#9CA3AF" />
            <Text className="flex-1 ml-2.5 text-[15px] text-[#9CA3AF] font-satoshi-bold">
              Search furniture
            </Text>
          </ThemedTouchable>
        </View>

        {/* Promo Ad Banner */}
        <View className="px-[22px] mb-4">
          <HomePromoBanner
            onPress={() => {
              router.push('/(tabs)/search');
            }}
          />
        </View>

        {/* Category Pills */}
        <View className="mb-[18px]">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 22 }}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <ThemedTouchable
                  key={cat}
                  haptic="selection"
                  onPress={() => setSelectedCategory(cat)}
                  className={`rounded-full px-[24px] py-2.5 mr-2.5 ${
                    isSelected ? 'bg-[#C87D20]' : 'bg-[#F0F0F2]'
                  }`}
                >
                  <Text
                    className={`text-sm font-satoshi-bold ${
                      isSelected ? 'text-white' : 'text-[#71717A]'
                    }`}
                  >
                    {cat}
                  </Text>
                </ThemedTouchable>
              );
            })}
          </ScrollView>
        </View>

        {/* Section Header */}
        <View className="flex-row justify-between items-center px-[22px] mb-3.5">
          <Text className="text-[22px] font-satoshi-black text-[#18181B] tracking-tight">
            Chair Collections
          </Text>
          <ThemedTouchable
            haptic="light"
            className="w-8 h-8 rounded-full bg-[#E4E4E7] items-center justify-center"
          >
            <Ionicons name="arrow-forward" size={16} color="#374151" />
          </ThemedTouchable>
        </View>

        {/* Horizontal Colored Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 22,
            paddingTop: 45,
            paddingBottom: 20,
          }}
        >
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPress={() => handleProductPress(product.id)}
            />
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

export default HomeTemplate;
