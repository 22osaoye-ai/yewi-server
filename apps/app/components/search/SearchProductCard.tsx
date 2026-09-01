import React from 'react';
import { Product } from '@/types/product';
import { LuxuryProductCard } from '@/components/ui/LuxuryProductCard';

interface SearchProductCardProps {
  product: Product;
  cardWidth: number;
  isFeatured?: boolean;
  onPress: () => void;
}

export function SearchProductCard(props: SearchProductCardProps) {
  return <LuxuryProductCard {...props} />;
}

export default SearchProductCard;
