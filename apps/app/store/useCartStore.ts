import { create } from 'zustand';
import { Product } from '@/types/product';

export interface CartItem {
  product: Product;
  color: string;
  dimension: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addToCart: (product: Product, color: string, dimension: string, quantity?: number) => void;
  removeFromCart: (productId: string, color: string, dimension: string) => void;
  updateQuantity: (productId: string, color: string, dimension: string, delta: number) => void;
  clearCart: () => void;
  totalAmount: () => number;
  totalCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [
    {
      product: {
        id: '1',
        name: 'Comfort Wood Chair',
        brand: 'LuxeLiving',
        price: 102.0,
        image: require('@/assets/images/orange_armchair.png'),
        category: 'Chair',
      },
      color: '#D95B1E',
      dimension: '3x3',
      quantity: 1,
    },
  ],
  addToCart: (product, color, dimension, quantity = 1) => {
    set((state) => {
      const existingIndex = state.items.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.color === color &&
          item.dimension === dimension
      );

      if (existingIndex > -1) {
        const updated = [...state.items];
        updated[existingIndex].quantity += quantity;
        return { items: updated };
      }

      return {
        items: [...state.items, { product, color, dimension, quantity }],
      };
    });
  },
  removeFromCart: (productId, color, dimension) => {
    set((state) => ({
      items: state.items.filter(
        (item) =>
          !(
            item.product.id === productId &&
            item.color === color &&
            item.dimension === dimension
          )
      ),
    }));
  },
  updateQuantity: (productId, color, dimension, delta) => {
    set((state) => {
      const updated = state.items
        .map((item) => {
          if (
            item.product.id === productId &&
            item.color === color &&
            item.dimension === dimension
          ) {
            return { ...item, quantity: item.quantity + delta };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);

      return { items: updated };
    });
  },
  clearCart: () => set({ items: [] }),
  totalAmount: () => {
    return get().items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  },
  totalCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
