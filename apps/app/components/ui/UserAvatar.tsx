import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedTouchable } from './ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

interface UserAvatarProps {
  size?: number;
  initial?: string;
  imageUri?: string;
  isOnline?: boolean;
  onPressCamera?: () => void;
  backgroundColor?: string;
  dotBorderColor?: string;
  style?: ViewStyle;
}

export function UserAvatar({
  size = 60,
  initial = 'J',
  imageUri,
  isOnline = true,
  onPressCamera,
  backgroundColor,
  dotBorderColor,
  style,
}: UserAvatarProps) {
  const { colors, isDark } = useAppTheme();
  const [imageError, setImageError] = React.useState(false);

  // Reset error when imageUri changes
  React.useEffect(() => {
    setImageError(false);
  }, [imageUri]);

  const defaultBg = isDark ? '#1E293B' : '#E0F2FE';
  const resolvedBg = backgroundColor ?? (imageUri && !imageError ? 'transparent' : defaultBg);
  const textColor = isDark ? colors.primary : '#0369A1';
  const cameraBtnSize = Math.max(Math.round(size * 0.38), 24);
  const onlineDotSize = Math.max(Math.round(size * 0.22), 10);
  const fontSize = Math.round(size * 0.4);
  const resolvedDotBorderColor = dotBorderColor ?? (isDark ? '#181A20' : '#FFFFFF');

  const hasValidImage = Boolean(imageUri && !imageError);

  return (
    <View style={[styles.wrapper, { width: size, height: size }, style]}>
      {/* Main Avatar Container */}
      <View
        style={[
          styles.avatarContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: resolvedBg,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        {hasValidImage ? (
          <Image
            source={{ uri: imageUri }}
            onError={() => setImageError(true)}
            style={{ width: size, height: size, borderRadius: size / 2 }}
          />
        ) : initial ? (
          <Text
            numberOfLines={1}
            style={[
              styles.initialText,
              { fontSize, color: textColor },
            ]}
          >
            {initial.slice(0, 2).toUpperCase()}
          </Text>
        ) : (
          <Ionicons
            name="person"
            size={Math.round(size * 0.5)}
            color={textColor}
          />
        )}
      </View>

      {/* Camera Action Button Overlay (Bottom-Left) */}
      {onPressCamera && (
        <ThemedTouchable
          onPress={onPressCamera}
          haptic="medium"
          style={[
            styles.cameraBtn,
            {
              width: cameraBtnSize,
              height: cameraBtnSize,
              borderRadius: cameraBtnSize / 2,
            },
          ]}
        >
          <Ionicons
            name="camera"
            size={Math.round(cameraBtnSize * 0.55)}
            color="#18181B"
          />
        </ThemedTouchable>
      )}

      {/* Online Status Indicator Dot (Bottom-Right) */}
      <View
        style={[
          styles.onlineDot,
          {
            width: onlineDotSize,
            height: onlineDotSize,
            borderRadius: onlineDotSize / 2,
            backgroundColor: isOnline ? '#10B981' : '#9CA3AF',
            borderColor: resolvedDotBorderColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  initialText: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    color: '#FFFFFF',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    borderWidth: 2,
    borderColor: '#0B3C26',
  },
});

export default UserAvatar;
