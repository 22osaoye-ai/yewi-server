import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { AppText } from '../primitives/Text';
import { Icon } from '../primitives/Icon';

export interface QuoteLineProps {
  id: string;
  concept: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice?: number;
  category?: string;
  onPress?: () => void;
  onDelete?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const QuoteLine: React.FC<QuoteLineProps> = ({
  concept,
  quantity,
  unit,
  unitPrice,
  totalPrice,
  category,
  onPress,
  onDelete,
  style,
}) => {
  const lineTotal = totalPrice ?? quantity * unitPrice;

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onDelete();
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress ? handlePress : undefined}
      style={[styles.container, style]}
    >
      <View style={styles.leftCol}>
        {category && (
          <AppText variant="caption" weight="medium" style={styles.category}>
            {category}
          </AppText>
        )}
        <AppText variant="body" weight="semibold" numberOfLines={2} style={styles.concept}>
          {concept}
        </AppText>
        <AppText variant="caption" style={styles.details}>
          {quantity} {unit} × {unitPrice.toFixed(2)} €
        </AppText>
      </View>

      <View style={styles.rightCol}>
        <AppText variant="body" weight="bold" style={styles.totalPrice}>
          {lineTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
        </AppText>
        {onDelete && (
          <TouchableOpacity
            onPress={handleDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.deleteBtn}
          >
            <Icon name="Close" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.xs,
  },
  leftCol: {
    flex: 1,
    marginRight: spacing.md,
  },
  category: {
    color: colors.accent,
    textTransform: 'uppercase',
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  concept: {
    color: colors.textPrimary,
    marginBottom: 2,
  },
  details: {
    color: colors.textSecondary,
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  totalPrice: {
    color: colors.textPrimary,
  },
  deleteBtn: {
    marginTop: 4,
    padding: 2,
  },
});
