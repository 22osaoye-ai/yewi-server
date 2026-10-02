import React from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { AppText } from '../primitives/Text';
import { Icon } from '../primitives/Icon';
import { Avatar } from '../components/Avatar';

export interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  userAvatarUri?: string | null;
  userName?: string;
  unreadNotifications?: boolean;
  onNotificationsPress?: () => void;
  onSearchPress?: () => void;
  onSettingsPress?: () => void;
  onProfilePress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title = 'Yewi Pro',
  subtitle,
  userAvatarUri,
  userName,
  unreadNotifications = false,
  onNotificationsPress,
  onSearchPress,
  onSettingsPress,
  onProfilePress,
  style,
}) => {
  const HEADER_ICON_SIZE = 22; // Strict Rule 7: Exactly 22px for all header icons

  const handleAction = (cb?: () => void) => {
    if (cb) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      cb();
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Left: Brand/User identity */}
      <View style={styles.identityContainer}>
        {onProfilePress ? (
          <TouchableOpacity
            onPress={() => handleAction(onProfilePress)}
            activeOpacity={0.8}
            style={styles.profileBtn}
          >
            <Avatar uri={userAvatarUri} name={userName} size="sm" isOnline />
          </TouchableOpacity>
        ) : null}

        <View style={styles.titleWrapper}>
          <AppText variant="h3" weight="bold" numberOfLines={1} style={styles.title}>
            {title}
          </AppText>
          {subtitle && (
            <AppText variant="caption" style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </AppText>
          )}
        </View>
      </View>

      {/* Right: Actions Cluster (strictly 22px icons) */}
      <View style={styles.actionsCluster}>
        {onSearchPress && (
          <TouchableOpacity
            onPress={() => handleAction(onSearchPress)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.actionBtn}
          >
            <Icon name="Search" size={HEADER_ICON_SIZE} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        {onNotificationsPress && (
          <TouchableOpacity
            onPress={() => handleAction(onNotificationsPress)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.actionBtn}
          >
            <View style={styles.iconWithBadge}>
              <Icon name="Bell" size={HEADER_ICON_SIZE} color={colors.textSecondary} />
              {unreadNotifications && <View style={styles.notificationDot} />}
            </View>
          </TouchableOpacity>
        )}

        {onSettingsPress && (
          <TouchableOpacity
            onPress={() => handleAction(onSettingsPress)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.actionBtn}
          >
            <Icon name="Settings" size={HEADER_ICON_SIZE} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  identityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  profileBtn: {
    marginRight: spacing.sm,
  },
  titleWrapper: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: 1,
  },
  actionsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  iconWithBadge: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
});
