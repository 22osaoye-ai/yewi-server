// src/components/detail/ProductDetail.tsx
import { useState } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { Product } from "@/types/product";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface Props {
  product: Product;
}

export default function ProductDetail({ product }: Props) {
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedDimension, setSelectedDimension] = useState("3x3");
  const [selectedImage, setSelectedImage] = useState(0);

  const colors = product.colors || ["#2563EB", "#EF4444", "#8B5CF6", "#EAB308"];
  const dimensions = product.dimensions || ["3x3", "3x5"];
  const imageList = product.images || [product.image, product.image, product.image];

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Top Header Bar */}
        <View className="flex-row justify-between items-center px-5 pt-12 pb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center border border-gray-200 dark:border-gray-700"
          >
            <Ionicons name="chevron-back" size={20} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900 dark:text-white">
            Details
          </Text>
          <TouchableOpacity className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center border border-gray-200 dark:border-gray-700">
            <Ionicons name="heart-outline" size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Hero Image Container with Floating Vertical Color Picker */}
        <View className="relative px-5 py-4 items-center">
          <Image
            source={imageList[selectedImage] || product.image}
            className="w-full h-80 rounded-3xl"
            resizeMode="contain"
          />

          {/* Vertical Color Selector Floating Bar */}
          <View className="absolute right-8 top-12 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md p-2 rounded-full space-y-3 items-center border border-white/40 shadow-sm">
            {colors.map((color, idx) => {
              const isSelected = selectedColor === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedColor(idx)}
                  style={{ backgroundColor: color }}
                  className={`w-6 h-6 rounded-full border-2 ${
                    isSelected ? "border-white shadow-md scale-110" : "border-transparent"
                  }`}
                />
              );
            })}
          </View>
        </View>

        {/* Thumbnail Selector Gallery */}
        <View className="flex-row justify-center space-x-3 px-5 py-2">
          {imageList.map((img, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => setSelectedImage(idx)}
              className={`p-1 rounded-xl border-2 ${
                selectedImage === idx ? "border-amber-600 bg-amber-50" : "border-gray-200 bg-gray-100"
              }`}
            >
              <Image source={img} className="w-14 h-14 rounded-lg" resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Details Section */}
        <View className="px-6 pt-6">
          <View className="flex-row justify-between items-center">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white flex-1">
              {product.name}
            </Text>

            {/* Dimension Chips */}
            <View className="flex-row space-x-2">
              {dimensions.map((dim) => {
                const isSelected = selectedDimension === dim;
                return (
                  <TouchableOpacity
                    key={dim}
                    onPress={() => setSelectedDimension(dim)}
                    className={`px-3 py-1.5 rounded-xl border ${
                      isSelected
                        ? "bg-gray-200 border-gray-300 dark:bg-gray-700"
                        : "bg-gray-100 border-transparent dark:bg-gray-800"
                    }`}
                  >
                    <Text className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                      {dim}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Description */}
          <Text className="text-gray-500 dark:text-gray-400 mt-4 leading-6 text-sm">
            {product.description}
          </Text>
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-6 py-4 flex-row justify-between items-center border-t border-gray-100 dark:border-gray-800">
        <View>
          <Text className="text-2xl font-extrabold text-gray-900 dark:text-white">
            ${product.price.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          style={{ backgroundColor: "#C87D20" }}
          className="px-8 py-3.5 rounded-full shadow-lg"
        >
          <Text className="text-white font-bold text-base">Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}