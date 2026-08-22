import { Platform } from 'react-native';

export const Colors = {
  // Base Canvas & Surfaces (Warm Organic Luxury - Estilo Imagen 2 & 4)
  background: '#FAF8F5',       // Warm Organic Sand / Canvas base
  backgroundAlt: '#F5ECE3',    // Soft Warm Pastel Beige
  surface: '#FFFFFF',          // Crisp pure white elevated cards
  surfaceWarm: '#F5F1EA',      // Warm product island container
  card: '#FFFFFF',
  
  // Borders & Dividers
  border: '#E8E2D5',           // Soft luxury border
  borderLight: '#F2ECE2',
  borderDark: '#D8D1C2',

  // Typography
  text: '#111813',             // Deep Onyx Black (Heavy, Prestigious)
  textSecondary: '#6C756F',    // Warm Slate Muted
  textMuted: '#9BA39E',        // Very subtle text
  textLight: '#FFFFFF',

  // Signature Brand Colors
  primary: '#111813',          // Pure Onyx Primary
  primaryDark: '#081C15',      // Onyx Forest
  primaryLight: '#1B4332',     // Deep Forest Green
  secondary: '#1B4332',        // Brand secondary
  accent: '#1B4332',           // Deep Forest Emerald
  emerald: '#059669',
  
  // Accents & Prices
  price: '#D9483B',            // Warm Terracotta for prices
  danger: '#DC2626',           // Red danger
  success: '#059669',          // Emerald success
  coral: '#E05A47',            // Signature Coral Dot
  
  // Badges & Pills
  inputBg: '#FFFFFF',
  pillInactiveBg: '#EDE8DE',
  pillInactiveText: '#2D3748',
  pillActiveBg: '#111813',
  pillActiveText: '#FFFFFF',

  creditsBadgeBg: 'rgba(217, 119, 6, 0.12)',
  creditsBadgeText: '#D97706',
  urgentBadgeBg: '#FEE2E2',
  urgentBadgeText: '#DC2626',
  proBadgeBg: 'rgba(27, 67, 50, 0.1)',
  proBadgeText: '#1B4332',

  // Pastel Category Backgrounds
  pastelLavender: '#D5D4F5',
  pastelButtercup: '#F8E8A2',
  pastelSage: '#C6DEC6',
  pastelPeach: '#F4D3C6',
  pastelSky: '#E0F2FE',
  pastelMint: '#D1FAE5',
};

export const Typography = {
  fonts: {
    black: 'Satoshi-Black',
    bold: 'Satoshi-Bold',
    regular: 'Satoshi-Regular',
    light: 'Satoshi-Light',
    medium: 'Satoshi-Medium',
  },
  titleLulo: {
    fontFamily: 'Satoshi-Black',
    fontWeight: '900' as const,
    letterSpacing: 0.5,
    color: Colors.text,
  },
  headingSatoshiBold: {
    fontFamily: 'Satoshi-Bold',
    fontWeight: '800' as const,
    letterSpacing: -0.3,
    color: Colors.text,
  },
  bodySatoshi: {
    fontFamily: 'Satoshi-Regular',
    fontWeight: '500' as const,
    color: Colors.text,
  },
  bodySatoshiLight: {
    fontFamily: 'Satoshi-Light',
    fontWeight: '300' as const,
    color: Colors.textSecondary,
  },
  bodySatoshiSemibold: {
    fontFamily: 'Satoshi-Medium',
    fontWeight: '700' as const,
    color: Colors.text,
  },
};

export const Shadows = {
  subtle: {
    shadowColor: '#1A2A20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sm: {
    shadowColor: '#1A2A20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#1A2A20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1A2A20',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  card: {
    shadowColor: '#1A2A20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  floating: {
    shadowColor: '#111813',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
};
