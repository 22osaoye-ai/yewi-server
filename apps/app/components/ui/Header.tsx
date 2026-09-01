// src/components/ui/Header.tsx
import { View, Text, Image } from "react-native";

export default function Header() {
  return (
    <View className="px-6 pt-4 pb-2 flex-row justify-between items-center bg-transparent">
      <View>
        <Text className="text-[32px] font-extrabold text-zinc-950 leading-[36px] tracking-tight">
          Find Your
        </Text>
        <Text className="text-[32px] font-extrabold text-zinc-950 leading-[36px] tracking-tight">
          Dream Furniture
        </Text>
      </View>

      {/* User Profile Avatar with Online Status */}
      <View className="relative">
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80" }}
          className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
        />
        <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
      </View>
    </View>
  );
}