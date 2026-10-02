import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../tokens/colors';

export type IconName =
  | 'Package'
  | 'Receipt'
  | 'ChartNoAxesCombined'
  | 'Search'
  | 'Settings'
  | 'Bell'
  | 'Building2'
  | 'Hammer'
  | 'House'
  | 'Calculator'
  | 'Wallet'
  | 'CircleDollarSign'
  | 'Check'
  | 'ChevronRight'
  | 'ChevronDown'
  | 'ChevronLeft'
  | 'TrendingUp'
  | 'TrendingDown'
  | 'Plus'
  | 'Minus'
  | 'Close'
  | 'Filter'
  | 'Shield'
  | 'Clock'
  | 'FileText'
  | 'Sparkles'
  | 'ArrowUpRight';

export interface IconProps {
  name: IconName;
  size?: number; // Defaults to 22 (Rule 7: Homogeneidad Estricta de Iconos)
  color?: string;
  style?: StyleProp<TextStyle>;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 22,
  color = colors.textPrimary,
  style,
}) => {
  switch (name) {
    case 'Package':
      return <Feather name="package" size={size} color={color} style={style} />;
    case 'Receipt':
      return <Ionicons name="receipt-outline" size={size} color={color} style={style} />;
    case 'ChartNoAxesCombined':
      return <Ionicons name="stats-chart-outline" size={size} color={color} style={style} />;
    case 'Search':
      return <Ionicons name="search-outline" size={size} color={color} style={style} />;
    case 'Settings':
      return <Ionicons name="settings-outline" size={size} color={color} style={style} />;
    case 'Bell':
      return <Ionicons name="notifications-outline" size={size} color={color} style={style} />;
    case 'Building2':
      return <Ionicons name="business-outline" size={size} color={color} style={style} />;
    case 'Hammer':
      return <Ionicons name="hammer-outline" size={size} color={color} style={style} />;
    case 'House':
      return <Ionicons name="home-outline" size={size} color={color} style={style} />;
    case 'Calculator':
      return <Ionicons name="calculator-outline" size={size} color={color} style={style} />;
    case 'Wallet':
      return <Ionicons name="wallet-outline" size={size} color={color} style={style} />;
    case 'CircleDollarSign':
      return <MaterialCommunityIcons name="currency-usd" size={size} color={color} style={style} />;
    case 'Check':
      return <Ionicons name="checkmark" size={size} color={color} style={style} />;
    case 'ChevronRight':
      return <Ionicons name="chevron-forward" size={size} color={color} style={style} />;
    case 'ChevronDown':
      return <Ionicons name="chevron-down" size={size} color={color} style={style} />;
    case 'ChevronLeft':
      return <Ionicons name="chevron-back" size={size} color={color} style={style} />;
    case 'TrendingUp':
      return <Feather name="trending-up" size={size} color={color} style={style} />;
    case 'TrendingDown':
      return <Feather name="trending-down" size={size} color={color} style={style} />;
    case 'Plus':
      return <Ionicons name="add" size={size} color={color} style={style} />;
    case 'Minus':
      return <Ionicons name="remove" size={size} color={color} style={style} />;
    case 'Close':
      return <Ionicons name="close" size={size} color={color} style={style} />;
    case 'Filter':
      return <Ionicons name="filter-outline" size={size} color={color} style={style} />;
    case 'Shield':
      return <Ionicons name="shield-checkmark-outline" size={size} color={color} style={style} />;
    case 'Clock':
      return <Ionicons name="time-outline" size={size} color={color} style={style} />;
    case 'FileText':
      return <Ionicons name="document-text-outline" size={size} color={color} style={style} />;
    case 'Sparkles':
      return <Ionicons name="sparkles-outline" size={size} color={color} style={style} />;
    case 'ArrowUpRight':
      return <Feather name="arrow-up-right" size={size} color={color} style={style} />;
    default:
      return <Ionicons name="ellipse-outline" size={size} color={color} style={style} />;
  }
};
