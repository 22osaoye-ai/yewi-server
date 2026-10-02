import React from 'react';
import { View, StyleSheet, Image, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { AppText } from '../primitives/Text';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  isOnline?: boolean;
  style?: StyleProp<ViewStyle>;
}

const sizeMap: Record<AvatarSize, { dimension: number; fontSize: number; dotSize: number }> = {
  sm: { dimension: 32, fontSize: 12, dotSize: 8 },
  md: { dimension: 40, fontSize: 14, dotSize: 10 },
  lg: { dimension: 52, fontSize: 18, dotSize: 12 },
  xl: { dimension: 64, fontSize: 22, dotSize: 14 },
};

function getInitials(name?: string): string {
  if (!name) return 'Y';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 'md',
  isOnline,
  style,
}) => {
  const { dimension, fontSize, dotSize } = sizeMap[size];

  return (
    <View style={[{ width: dimension, height: dimension }, styles.wrapper, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            { width: dimension, height: dimension, borderRadius: dimension / 2 },
          ]}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
            },
          ]}
        >
          <AppText
            variant="caption"
            weight="bold"
            style={{ fontSize, color: colors.accent }}
          >
            {getInitials(name)}
          </AppText>
        </View>
      )}

      {isOnline !== undefined && (
        <View
          style={[
            styles.statusDot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: isOnline ? colors.success : colors.textMuted,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  fallback: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(36, 213, 196, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: colors.background,
  },
});
