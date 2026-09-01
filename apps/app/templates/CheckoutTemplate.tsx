import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useCartStore } from '@/store/useCartStore';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { ThemedPressed } from '@/components/ui/ThemedPressed';

export function CheckoutTemplate() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, updateQuantity, removeFromCart, clearCart, totalAmount } = useCartStore();

  const [selectedPayment, setSelectedPayment] = useState<'apple' | 'card' | 'cod'>('apple');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const subtotal = totalAmount();
  const shipping = subtotal > 200 || subtotal === 0 ? 0 : 15.0;
  const total = subtotal + shipping;

  const handlePlaceOrder = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setOrderSuccess(true);
      clearCart();
    }, 1200);
  };

  const handleFinishOrder = () => {
    setOrderSuccess(false);
    router.replace('/(tabs)');
  };

  return (
    <View className="flex-1 bg-[#F8F8FA]">
      {/* Header */}
      <View
        style={{ paddingTop: Math.max(insets.top, 16) }}
        className="bg-white px-6 pb-4 flex-row items-center border-b border-[#F0F0F2] shadow-sm"
      >
        <ThemedTouchable
          onPress={() => router.back()}
          haptic="light"
          className="w-10 h-10 rounded-full bg-[#F4F4F6] items-center justify-center mr-4"
        >
          <Ionicons name="chevron-back" size={20} color="#18181B" />
        </ThemedTouchable>
        <Text className="text-[20px] font-satoshi-black text-[#18181B]">
          Cart & Checkout
        </Text>
      </View>

      {items.length > 0 ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 130 }}
        >
          {/* Cart Items Section */}
          <Text className="text-base font-satoshi-bold text-[#18181B] mb-3">
            Order Items ({items.length})
          </Text>
          <View className="gap-3 mb-6">
            {items.map((item, idx) => (
              <View
                key={`${item.product.id}-${item.color}-${item.dimension}-${idx}`}
                className="bg-white rounded-[24px] p-4 flex-row items-center border border-[#F0F0F2] shadow-sm"
              >
                {/* Product Thumbnail */}
                <View className="w-20 h-20 rounded-[18px] bg-[#F8F8FA] items-center justify-center p-1 mr-3.5">
                  <Image
                    source={item.product.image}
                    className="w-full h-full"
                    resizeMode="contain"
                  />
                </View>

                {/* Details */}
                <View className="flex-1">
                  <Text numberOfLines={1} className="text-base font-satoshi-bold text-[#18181B] mb-1">
                    {item.product.name}
                  </Text>
                  <View className="flex-row items-center gap-2 mb-2">
                    <View
                      style={{ backgroundColor: item.color }}
                      className="w-3.5 h-3.5 rounded-full border border-black/10"
                    />
                    <Text className="text-xs font-satoshi text-[#71717A]">
                      Size: {item.dimension}
                    </Text>
                  </View>
                  <Text className="text-base font-satoshi-bold text-[#C87D20]">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </Text>
                </View>

                {/* Quantity Controls */}
                <View className="items-end justify-between h-20">
                  <ThemedTouchable
                    onPress={() => removeFromCart(item.product.id, item.color, item.dimension)}
                    haptic="light"
                    className="p-1"
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </ThemedTouchable>

                  <View className="flex-row items-center bg-[#F4F4F6] rounded-full px-2 py-1 gap-2.5">
                    <ThemedTouchable
                      onPress={() => updateQuantity(item.product.id, item.color, item.dimension, -1)}
                      haptic="light"
                    >
                      <Ionicons name="remove" size={14} color="#18181B" />
                    </ThemedTouchable>
                    <Text className="text-xs font-satoshi-bold text-[#18181B]">
                      {item.quantity}
                    </Text>
                    <ThemedTouchable
                      onPress={() => updateQuantity(item.product.id, item.color, item.dimension, 1)}
                      haptic="light"
                    >
                      <Ionicons name="add" size={14} color="#18181B" />
                    </ThemedTouchable>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Delivery Address Card */}
          <Text className="text-base font-satoshi-bold text-[#18181B] mb-3">
            Shipping Address
          </Text>
          <View className="bg-white rounded-[24px] p-4.5 mb-6 border border-[#F0F0F2] shadow-sm flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-3">
              <View className="w-10 h-10 rounded-full bg-[#C87D20]/10 items-center justify-center mr-3">
                <Ionicons name="location-outline" size={20} color="#C87D20" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-satoshi-bold text-[#18181B]">Home</Text>
                <Text className="text-xs font-satoshi text-[#71717A] mt-0.5">
                  742 Evergreen Terrace, Springfield
                </Text>
              </View>
            </View>
            <ThemedTouchable haptic="selection">
              <Text className="text-xs font-satoshi-bold text-[#C87D20]">Edit</Text>
            </ThemedTouchable>
          </View>

          {/* Payment Methods */}
          <Text className="text-base font-satoshi-bold text-[#18181B] mb-3">
            Payment Method
          </Text>
          <View className="gap-2.5 mb-6">
            {[
              { id: 'apple', label: 'Apple Pay / Google Pay', icon: 'logo-apple' },
              { id: 'card', label: 'Credit Card (•••• 4242)', icon: 'card-outline' },
              { id: 'cod', label: 'Cash on Delivery', icon: 'cash-outline' },
            ].map((p) => {
              const isSelected = selectedPayment === p.id;
              return (
                <ThemedTouchable
                  key={p.id}
                  haptic="selection"
                  onPress={() => setSelectedPayment(p.id as any)}
                  className={`bg-white rounded-[20px] p-4 flex-row items-center justify-between border ${
                    isSelected ? 'border-[#C87D20] shadow-sm' : 'border-[#F0F0F2]'
                  }`}
                >
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 rounded-full bg-[#F4F4F6] items-center justify-center mr-3">
                      <Ionicons name={p.icon as any} size={18} color="#18181B" />
                    </View>
                    <Text className="text-sm font-satoshi-bold text-[#18181B]">
                      {p.label}
                    </Text>
                  </View>
                  <View
                    className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                      isSelected ? 'border-[#C87D20] bg-[#C87D20]' : 'border-[#D4D4D8]'
                    }`}
                  >
                    {isSelected && <View className="w-2 h-2 rounded-full bg-white" />}
                  </View>
                </ThemedTouchable>
              );
            })}
          </View>

          {/* Order Cost Breakdown */}
          <Text className="text-base font-satoshi-bold text-[#18181B] mb-3">
            Summary
          </Text>
          <View className="bg-white rounded-[24px] p-4.5 border border-[#F0F0F2] shadow-sm gap-2.5 mb-6">
            <View className="flex-row justify-between">
              <Text className="text-sm font-satoshi text-[#71717A]">Subtotal</Text>
              <Text className="text-sm font-satoshi-bold text-[#18181B]">
                ${subtotal.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm font-satoshi text-[#71717A]">Shipping</Text>
              <Text className="text-sm font-satoshi-bold text-[#10B981]">
                {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
              </Text>
            </View>
            <View className="h-[1px] bg-[#F0F0F2] my-1" />
            <View className="flex-row justify-between items-center">
              <Text className="text-base font-satoshi-black text-[#18181B]">Total</Text>
              <Text className="text-[20px] font-satoshi-black text-[#C87D20]">
                ${total.toFixed(2)}
              </Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        /* Empty Cart State */
        <View className="flex-1 items-center justify-center px-8 pb-20">
          <View className="w-20 h-20 rounded-full bg-white items-center justify-center mb-4 shadow-sm border border-[#E5E5EA]">
            <Ionicons name="bag-handle-outline" size={36} color="#9CA3AF" />
          </View>
          <Text className="text-lg font-satoshi-bold text-[#18181B] text-center mb-1">
            Your Cart is Empty
          </Text>
          <Text className="text-sm font-satoshi text-[#9CA3AF] text-center mb-6">
            Explore our curated furniture collections and add items to your cart.
          </Text>
          <ThemedPressed
            onPress={() => router.push('/(tabs)')}
            haptic="medium"
            scaleOnPress
            className="bg-[#C87D20] rounded-full px-6 py-3 shadow-md"
          >
            <Text className="text-white font-satoshi-bold text-sm">
              Start Shopping
            </Text>
          </ThemedPressed>
        </View>
      )}

      {/* Fixed Checkout Action Bottom Dock */}
      {items.length > 0 && (
        <View
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          className="absolute bottom-0 left-0 right-0 bg-white px-6 py-4 border-t border-[#F0F0F2] shadow-2xl elevation-12 flex-row justify-between items-center"
        >
          <View>
            <Text className="text-xs font-satoshi text-[#9CA3AF]">Total Amount</Text>
            <Text className="text-[24px] font-satoshi-black text-[#18181B] tracking-tight">
              ${total.toFixed(2)}
            </Text>
          </View>
          <ThemedPressed
            onPress={handlePlaceOrder}
            haptic="heavy"
            scaleOnPress
            disabled={isProcessing}
            className="bg-[#C87D20] rounded-full px-8 py-3.5 shadow-md elevation-4 flex-row items-center gap-2"
          >
            <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
            <Text className="text-white text-[15px] font-satoshi-bold tracking-wide">
              {isProcessing ? 'Processing...' : 'Place Order'}
            </Text>
          </ThemedPressed>
        </View>
      )}

      {/* Order Success Modal */}
      <Modal visible={orderSuccess} transparent animationType="fade">
        <View className="flex-1 bg-black/60 backdrop-blur-md items-center justify-center px-6">
          <View className="bg-white rounded-[36px] p-7 items-center w-full max-w-[340px] shadow-2xl">
            <View className="w-20 h-20 rounded-full bg-[#10B981]/15 items-center justify-center mb-4">
              <Ionicons name="checkmark-circle" size={56} color="#10B981" />
            </View>
            <Text className="text-[22px] font-satoshi-black text-[#18181B] text-center mb-1">
              Order Confirmed!
            </Text>
            <Text className="text-sm font-satoshi text-[#71717A] text-center mb-5 leading-5">
              Thank you for your purchase. Your luxury furniture is being prepared for delivery.
            </Text>
            <View className="bg-[#F8F8FA] rounded-2xl p-3 w-full mb-5 items-center">
              <Text className="text-xs font-satoshi text-[#9CA3AF]">Order ID</Text>
              <Text className="text-sm font-satoshi-bold text-[#18181B] mt-0.5">
                #YEWI-{(Math.random() * 90000 + 10000).toFixed(0)}
              </Text>
            </View>
            <ThemedPressed
              onPress={handleFinishOrder}
              haptic="medium"
              scaleOnPress
              className="bg-[#18181B] w-full rounded-full py-3.5 items-center"
            >
              <Text className="text-white font-satoshi-bold text-sm">
                Back to Home
              </Text>
            </ThemedPressed>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default CheckoutTemplate;
