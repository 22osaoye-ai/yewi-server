import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedTouchable } from './ThemedTouchable';

interface UserAvatarProps {
  size?: number;
  initial?: string;
  imageUri?: string;
  isOnline?: boolean;
  onPressCamera?: () => void;
  backgroundColor?: string;
  style?: ViewStyle;
}

export function UserAvatar({
  size = 60,
  initial = 'J',
  imageUri,
  isOnline = true,
  onPressCamera,
  backgroundColor = '#C87D20',
  style,
}: UserAvatarProps) {
  const cameraBtnSize = Math.max(Math.round(size * 0.4), 24);
  const onlineDotSize = Math.max(Math.round(size * 0.22), 12);
  const fontSize = Math.round(size * 0.45);

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
            backgroundColor,
          },
        ]}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
          />
        ) : (
          <Text style={[styles.initialText, { fontSize }]}>
            {initial.toUpperCase()}
          </Text>
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
    fontFamily: 'Satoshi-Black',
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
