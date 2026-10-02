import React from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { shadows } from '../tokens/shadows';
import { AppText } from '../primitives/Text';
import { Icon, IconName } from '../primitives/Icon';

export interface TabItem {
  id: string;
  label: string; // Zero-overflow: strictly 1 word (Rule 5)
  icon: IconName;
  badgeCount?: number;
}

export interface BottomNavigationProps {
  tabs: TabItem[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  style?: StyleProp<ViewStyle>;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  style,
}) => {
  const insets = useSafeAreaInsets();
  const TAB_ICON_SIZE = 22; // Strict Rule 7: strictly 22px for all TabBar icons

  const handlePress = (id: string) => {
    if (id !== activeTabId) {
      Haptics.selectionAsync();
      onSelectTab(id);
    }
  };

  return (
    <View
      style={[
        styles.wrapper,
        { paddingBottom: Math.max(insets.bottom, 12) },
        style,
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.floatingDock}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.8}
              onPress={() => handlePress(tab.id)}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
            >
              <View style={styles.iconContainer}>
                <Icon
                  name={tab.icon}
                  size={TAB_ICON_SIZE}
                  color={isActive ? colors.accent : colors.textMuted}
                />
                {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                  <View style={styles.badge}>
                    <AppText variant="caption" weight="bold" style={styles.badgeText}>
                      {tab.badgeCount > 99 ? '99+' : tab.badgeCount}
                    </AppText>
                  </View>
                )}
              </View>
              <AppText
                variant="caption"
                weight={isActive ? 'bold' : 'medium'}
                style={[
                  styles.tabLabel,
                  { color: isActive ? colors.accent : colors.textMuted },
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  floatingDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(18, 24, 24, 0.94)',
    borderRadius: radius['3xl'],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    width: '100%',
    maxWidth: 420,
    ...shadows.elevated,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.xl,
    flex: 1,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(36, 213, 196, 0.08)',
  },
  iconContainer: {
    position: 'relative',
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  badgeText: {
    fontSize: 9,
    color: '#FFFFFF',
    lineHeight: 11,
  },
});
