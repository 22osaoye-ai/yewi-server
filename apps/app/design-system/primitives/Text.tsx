import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { typography } from '../tokens/typography';

export type TextWeight = keyof typeof typography.fonts | 'semibold';

export interface TextProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label' | 'metric';
  color?: keyof typeof colors;
  weight?: TextWeight;
  align?: TextStyle['textAlign'];
}

export function Text({
  children,
  style,
  variant = 'body',
  color = 'textPrimary',
  weight = 'medium',
  align = 'left',
  ...props
}: TextProps) {
  const getVariantStyle = (): TextStyle => {
    switch (variant) {
      case 'h1':
        return {
          fontSize: typography.sizes['3xl'],
          fontFamily: typography.fonts.extraBold,
          letterSpacing: typography.letterSpacing.tight,
          lineHeight: 34,
        };
      case 'h2':
        return {
          fontSize: typography.sizes.xl,
          fontFamily: typography.fonts.bold,
          letterSpacing: typography.letterSpacing.subtle,
          lineHeight: 26,
        };
      case 'h3':
        return {
          fontSize: typography.sizes.md,
          fontFamily: typography.fonts.bold,
          letterSpacing: typography.letterSpacing.subtle,
          lineHeight: 22,
        };
      case 'metric':
        return {
          fontSize: typography.sizes['2xl'],
          fontFamily: typography.fonts.extraBold,
          letterSpacing: typography.letterSpacing.tight,
          lineHeight: 30,
        };
      case 'label':
        return {
          fontSize: typography.sizes.xs,
          fontFamily: typography.fonts.semiBold,
          letterSpacing: typography.letterSpacing.wide,
          lineHeight: 16,
        };
      case 'caption':
        return {
          fontSize: typography.sizes.xs,
          fontFamily: typography.fonts.regular,
          lineHeight: 15,
        };
      case 'body':
      default:
        return {
          fontSize: typography.sizes.sm,
          fontFamily: typography.fonts.medium,
          lineHeight: 20,
        };
    }
  };

  const resolvedFont =
    weight === 'semibold'
      ? typography.fonts.semiBold
      : typography.fonts[weight] || typography.fonts.medium;

  return (
    <RNText
      style={[
        getVariantStyle(),
        {
          color: colors[color] || colors.textPrimary,
          fontFamily: resolvedFont,
          textAlign: align,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}

export const AppText = Text;
