import React, { useEffect, useState } from 'react';
import { Image, ImageProps, ImageSourcePropType, View, StyleSheet, ActivityIndicator } from 'react-native';

interface CachedImageProps {
  uri?: string | null;
  style?: any;
  resizeMode?: ImageProps['resizeMode'];
  accessibilityLabel?: string;
  placeholder?: React.ReactNode;
}

export const CachedImage: React.FC<CachedImageProps> = ({ uri, style, resizeMode = 'cover', accessibilityLabel, placeholder }) => {
  const [loading, setLoading] = useState<boolean>(!!uri);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    if (!uri) {
      setLoading(false);
      return;
    }

    // Try to prefetch to warm cache; fall back silently on error
    Image.prefetch(uri)
      .then(() => {
        if (mounted) setLoading(false);
      })
      .catch(() => {
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [uri]);

  if (!uri) {
    return <View style={[styles.container, style]}>{placeholder ?? null}</View>;
  }

  return (
    <View style={[styles.container, style]} accessible accessibilityLabel={accessibilityLabel}>
      {loading && (placeholder ?? <ActivityIndicator size="small" />)}
      {!error && (
        <Image
          source={{ uri }}
          style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
          resizeMode={resizeMode}
          onLoad={() => setLoading(false)}
          onError={() => setError(true)}
        />
      )}
      {error && (placeholder ?? null)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
});
