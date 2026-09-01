// src/types/product.ts
export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  priceUnit?: string;
  rating?: number;
  reviewsCount?: number;
  image: any;
  images?: any[];
  description?: string;
  colors?: string[];
  dimensions?: string[];
  cardBg?: string;
  category?: string;
  city?: string;
  badge?: string;
  verified?: boolean;
}