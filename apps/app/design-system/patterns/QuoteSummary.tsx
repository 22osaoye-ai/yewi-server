import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { shadows } from '../tokens/shadows';
import { AppText } from '../primitives/Text';
import { Icon } from '../primitives/Icon';
import { AppButton } from '../components/AppButton';

export interface QuoteSummaryProps {
  subtotal: number;
  taxRate?: number; // e.g. 0.21 for 21%
  marginRate?: number; // e.g. 0.15 for 15%
  escrowPercentage?: number; // e.g. 10 for 10%
  onSend?: () => void;
  onExportPdf?: () => void;
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const QuoteSummary: React.FC<QuoteSummaryProps> = ({
  subtotal,
  taxRate = 0.21,
  marginRate = 0.15,
  escrowPercentage = 10,
  onSend,
  onExportPdf,
  isLoading = false,
  style,
}) => {
  const marginAmount = subtotal * marginRate;
  const taxableBase = subtotal + marginAmount;
  const taxAmount = taxableBase * taxRate;
  const total = taxableBase + taxAmount;
  const escrowAmount = (total * escrowPercentage) / 100;

  const formatEuro = (val: number) =>
    val.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerRow}>
        <AppText variant="h3" weight="bold" style={styles.title}>
          Resumen
        </AppText>
        <View style={styles.escrowPill}>
          <Icon name="Shield" size={14} color={colors.accent} />
          <AppText variant="caption" weight="semibold" style={styles.escrowText}>
            Escrow {escrowPercentage}%
          </AppText>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Financial lines */}
      <View style={styles.row}>
        <AppText variant="body" style={styles.label}>
          Materiales y mano de obra
        </AppText>
        <AppText variant="body" weight="medium" style={styles.value}>
          {formatEuro(subtotal)}
        </AppText>
      </View>

      <View style={styles.row}>
        <AppText variant="body" style={styles.label}>
          Margen profesional ({(marginRate * 100).toFixed(0)}%)
        </AppText>
        <AppText variant="body" weight="medium" style={styles.value}>
          {formatEuro(marginAmount)}
        </AppText>
      </View>

      <View style={styles.row}>
        <AppText variant="body" style={styles.label}>
          IVA ({(taxRate * 100).toFixed(0)}%)
        </AppText>
        <AppText variant="body" weight="medium" style={styles.value}>
          {formatEuro(taxAmount)}
        </AppText>
      </View>

      <View style={[styles.divider, styles.dividerBold]} />

      {/* Total */}
      <View style={styles.totalRow}>
        <View>
          <AppText variant="caption" weight="medium" style={styles.totalLabel}>
            TOTAL PRESUPUESTO
          </AppText>
          <AppText variant="caption" style={styles.escrowNotice}>
            Depósito inicial: {formatEuro(escrowAmount)}
          </AppText>
        </View>
        <AppText variant="h2" weight="bold" style={styles.totalAmount}>
          {formatEuro(total)}
        </AppText>
      </View>

      {/* Actions (Rule 5 Zero-Overflow labels) */}
      <View style={styles.actionButtons}>
        {onExportPdf && (
          <AppButton
            label="PDF"
            variant="secondary"
            size="md"
            icon="Receipt"
            onPress={onExportPdf}
            style={styles.actionBtnSecondary}
          />
        )}
        {onSend && (
          <AppButton
            label="Enviar"
            variant="primary"
            size="md"
            icon="Check"
            onPress={onSend}
            loading={isLoading}
            style={styles.actionBtnPrimary}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.lg,
    ...shadows.elevated,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
  },
  escrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(36, 213, 196, 0.25)',
    gap: 4,
  },
  escrowText: {
    color: colors.accent,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.sm,
  },
  dividerBold: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginVertical: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    color: colors.textSecondary,
  },
  value: {
    color: colors.textPrimary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
  },
  totalLabel: {
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  escrowNotice: {
    color: colors.textMuted,
    marginTop: 2,
  },
  totalAmount: {
    color: colors.accent,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtnSecondary: {
    flex: 1,
  },
  actionBtnPrimary: {
    flex: 2,
  },
});
