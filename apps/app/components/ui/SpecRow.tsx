import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutAnimation, Platform, UIManager, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedTouchable } from './ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

if (Platform.OS === 'android' && !(global as any).nativeFabricUIManager && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface SpecRowProps {
  icon?: keyof typeof Ionicons.glyphMap;
  customIcon?: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  detail?: string;
  infoTooltip?: string;
  noBorder?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function SpecRow({
  icon,
  customIcon,
  label,
  value,
  detail,
  infoTooltip,
  noBorder = false,
  onPress,
  style,
}: SpecRowProps) {
  const { colors, isDark } = useAppTheme();
  const [isOpen, setIsOpen] = useState(false);

  const toggleTooltip = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen((prev) => !prev);
  };

  const dividerColor = isDark ? '#27272A' : '#E5E7EB';

  const content = (
    <View
      style={[
        styles.container,
        !noBorder && { borderBottomColor: dividerColor, borderBottomWidth: 1 },
        style,
      ]}
    >
      <View style={styles.mainRow}>
        {/* Left Icon Graphic */}
        {(icon || customIcon) && (
          <View style={styles.iconContainer}>
            {customIcon ? (
              customIcon
            ) : icon ? (
              <Ionicons
                name={icon}
                size={26}
                color={colors.textPrimary}
              />
            ) : null}
          </View>
        )}

        {/* Center: Label + Big Bold Value */}
        <View style={styles.textContainer}>
          <ThemedTouchable
            onPress={infoTooltip ? toggleTooltip : undefined}
            disabled={!infoTooltip}
            haptic="light"
            style={styles.labelRow}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.labelText,
                { color: colors.textSecondary },
              ]}
            >
              {label.toUpperCase()}
            </Text>
            {infoTooltip && (
              <View
                style={[
                  styles.infoBadge,
                  { backgroundColor: isDark ? '#27272A' : '#E5E7EB' },
                ]}
              >
                <Text
                  style={[
                    styles.infoBadgeText,
                    { color: colors.textSecondary },
                  ]}
                >
                  i
                </Text>
              </View>
            )}
          </ThemedTouchable>

          {typeof value === 'string' ? (
            <Text
              numberOfLines={1}
              style={[
                styles.valueText,
                { color: colors.textPrimary },
              ]}
            >
              {value}
            </Text>
          ) : (
            value
          )}

          {detail && (
            <Text
              numberOfLines={2}
              style={[
                styles.detailText,
                { color: colors.textSecondary },
              ]}
            >
              {detail}
            </Text>
          )}
        </View>

        {/* Right Toggle Button (When Info is present) or Right Chevron */}
        {infoTooltip ? (
          <ThemedTouchable
            onPress={toggleTooltip}
            haptic="light"
            style={styles.toggleButton}
            accessibilityLabel="Ver explicación"
          >
            <Ionicons
              name={isOpen ? 'close' : 'chevron-forward'}
              size={18}
              color={colors.textSecondary}
            />
          </ThemedTouchable>
        ) : onPress ? (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textMuted}
          />
        ) : null}
      </View>

      {/* Expandable Solid Dark Explanation Box (Inspired by On Running / Technical Specs) */}
      {isOpen && infoTooltip && (
        <View
          style={[
            styles.tooltipBox,
            {
              backgroundColor: isDark ? '#1C1F26' : '#0D0C22',
            },
          ]}
        >
          <Text style={styles.tooltipText}>
            {infoTooltip}
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress && !infoTooltip) {
    return (
      <ThemedTouchable onPress={onPress} haptic="selection">
        {content}
      </ThemedTouchable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 38,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  labelText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: 1.1,
  },
  infoBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  infoBadgeText: {
    fontSize: 9.5,
    fontFamily: 'PlusJakartaSans-Bold',
    lineHeight: 11,
  },
  valueText: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    marginTop: 2,
  },
  toggleButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipBox: {
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 6,
  },
  tooltipText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#FFFFFF',
    lineHeight: 18,
  },
});

export default SpecRow;
