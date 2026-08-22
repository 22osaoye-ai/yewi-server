import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CachedImage } from './CachedImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/auth.store';
import { Colors, Shadows, Typography } from './Theme';
import { AppLogo } from './ui/AppLogo';

export const Header: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, activeRole } = useAuthStore();
  const router = useRouter();

  const firstName = user?.profile?.firstName || 'Invitado';
  const initial = firstName.charAt(0).toUpperCase();

  const handleProfilePress = () => {
    if (isAuthenticated) {
      if (activeRole === 'PROFESSIONAL') {
        router.push('/(pro)/wallet');
      } else {
        router.push('/(client)/profile');
      }
    } else {
      router.push('/(auth)/login');
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top + 8, 16),
        },
      ]}
    >
      <View style={styles.topRow}>
        {/* Left: Official Brand Logo Yewi. */}
        <TouchableOpacity
          style={styles.brandRow}
          onPress={() => {
            if (activeRole === 'PROFESSIONAL') {
              router.push('/(pro)/opportunities');
            } else {
              router.push('/(client)/home');
            }
          }}
          activeOpacity={0.8}
        >
          <AppLogo size={26} />
        </TouchableOpacity>

        {/* Right: User Avatar & Name Pill */}
        <TouchableOpacity
          style={styles.userPill}
          onPress={handleProfilePress}
          activeOpacity={0.85}
        >
          <View style={styles.avatarCircle}>
            {user?.profile?.avatarUrl ? (
              <CachedImage
                uri={user.profile.avatarUrl}
                style={styles.avatarImage}
                resizeMode="cover"
                accessibilityLabel={`${firstName} avatar`}
                placeholder={<View style={[styles.avatarImage, { backgroundColor: '#EDE8DE' }]} />}
              />
            ) : (
              <Text style={styles.avatarInitial}>{initial}</Text>
            )}
          </View>

          <Text style={styles.userNameText} numberOfLines={1}>
            {firstName}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  diamondEmblem: {
    width: 24,
    height: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  diamondSquare: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#111813',
  },
  brandText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.8,
    color: '#111813',
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: 14,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    ...Shadows.subtle,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#111813',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  userNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111813',
    maxWidth: 100,
  },
});
