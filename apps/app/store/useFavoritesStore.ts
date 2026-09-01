import { create } from 'zustand';

interface FavoritesState {
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: ['1'], // Default pre-favorited item
  toggleFavorite: (productId: string) => {
    set((state) => {
      const exists = state.favorites.includes(productId);
      return {
        favorites: exists
          ? state.favorites.filter((id) => id !== productId)
          : [...state.favorites, productId],
      };
    });
  },
  isFavorite: (productId: string) => {
    return get().favorites.includes(productId);
  },
}));
