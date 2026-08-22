import React from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';

export const Skeleton: React.FC<{width?: number | string; height?: number; style?: ViewStyle}> = ({ width = '100%', height = 12, style }) => {
  // Simple static skeleton block for now (can be animated later)
  return <View style={[styles.base, { width, height }, style]} />;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#EDE8DE',
    borderRadius: 8,
  },
});
