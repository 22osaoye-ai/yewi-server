import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StyleProp,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { AppText } from '../primitives/Text';
import { Icon } from '../primitives/Icon';
import { AppButton } from '../components/AppButton';
import { StatusBadge } from '../components/StatusBadge';

export interface ComparisonSupplierOffer {
  id: string;
  name: string;
  price: number;
  deliveryTime: string;
  inStock: boolean;
  rating?: number;
  badge?: string; // e.g. "Mejor precio", "Rápido"
}

export interface SupplierComparisonProps {
  productName: string;
  currentPrice: number;
  trendPercentage?: number; // e.g. -3.8
  trendPeriod?: string; // e.g. "esta semana"
  unit?: string;
  suppliers: ComparisonSupplierOffer[];
  selectedSupplierId?: string;
  onSelectSupplier: (supplierId: string) => void;
  onAddToQuote: (selectedSupplier: ComparisonSupplierOffer) => void;
  onBack?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const SupplierComparison: React.FC<SupplierComparisonProps> = ({
  productName,
  currentPrice,
  trendPercentage = -3.8,
  trendPeriod = 'esta semana',
  unit = 'ud',
  suppliers,
  selectedSupplierId,
  onSelectSupplier,
  onAddToQuote,
  onBack,
  style,
}) => {
  const isTrendDown = trendPercentage < 0;
  const selected = suppliers.find((s) => s.id === selectedSupplierId) ?? suppliers[0];

  const handleSelect = (id: string) => {
    Haptics.selectionAsync();
    onSelectSupplier(id);
  };

  const handleAdd = () => {
    if (selected) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onAddToQuote(selected);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.backBtn}
          >
            <Icon name="ChevronLeft" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        <AppText variant="h3" weight="bold" numberOfLines={1} style={styles.productTitle}>
          {productName}
        </AppText>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Current Reference Card */}
        <View style={styles.referenceCard}>
          <AppText variant="caption" weight="medium" style={styles.referenceLabel}>
            PRECIO ACTUAL
          </AppText>
          <View style={styles.priceRow}>
            <AppText variant="h1" weight="bold" style={styles.priceValue}>
              {currentPrice.toFixed(2)} €
            </AppText>
            <AppText variant="body" style={styles.unitText}>
              / {unit}
            </AppText>
          </View>
          <View style={styles.trendRow}>
            <Icon
              name={isTrendDown ? 'TrendingDown' : 'TrendingUp'}
              size={16}
              color={isTrendDown ? colors.success : colors.danger}
            />
            <AppText
              variant="caption"
              weight="semibold"
              style={[
                styles.trendText,
                { color: isTrendDown ? colors.success : colors.danger },
              ]}
            >
              {Math.abs(trendPercentage)}% {trendPeriod}
            </AppText>
          </View>
        </View>

        {/* Section title */}
        <View style={styles.sectionHeader}>
          <AppText variant="body" weight="semibold" style={styles.sectionTitle}>
            Comparar proveedores
          </AppText>
          <AppText variant="caption" style={styles.supplierCount}>
            {suppliers.length} opciones
          </AppText>
        </View>

        {/* Suppliers List */}
        <View style={styles.suppliersList}>
          {suppliers.map((supplier) => {
            const isSelected = supplier.id === (selectedSupplierId ?? selected?.id);
            return (
              <TouchableOpacity
                key={supplier.id}
                activeOpacity={0.8}
                onPress={() => handleSelect(supplier.id)}
                style={[
                  styles.supplierCard,
                  isSelected && styles.supplierCardSelected,
                ]}
              >
                <View style={styles.supplierHeader}>
                  <View style={styles.supplierNameRow}>
                    <View
                      style={[
                        styles.selectDot,
                        isSelected && styles.selectDotActive,
                      ]}
                    />
                    <AppText
                      variant="body"
                      weight="bold"
                      style={isSelected ? styles.supplierNameActive : styles.supplierName}
                    >
                      {supplier.name}
                    </AppText>
                  </View>
                  <AppText variant="h3" weight="bold" style={styles.supplierPrice}>
                    {supplier.price.toFixed(2)} €
                  </AppText>
                </View>

                <View style={styles.supplierFooter}>
                  <View style={styles.stockRow}>
                    <Icon
                      name={supplier.inStock ? 'Check' : 'Clock'}
                      size={14}
                      color={supplier.inStock ? colors.success : colors.warning}
                    />
                    <AppText variant="caption" style={styles.stockText}>
                      {supplier.inStock ? 'Disponible' : supplier.deliveryTime}
                    </AppText>
                  </View>

                  {supplier.badge && (
                    <StatusBadge
                      label={supplier.badge}
                      variant={supplier.badge.toLowerCase().includes('precio') ? 'accent' : 'info'}
                      showDot={false}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom CTA (Rule 5 Zero-Overflow: "Añadir") */}
      <View style={styles.bottomBar}>
        <AppButton
          label="Añadir"
          variant="primary"
          size="lg"
          icon="Plus"
          onPress={handleAdd}
          style={styles.addBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backBtn: {
    marginRight: spacing.sm,
  },
  productTitle: {
    color: colors.textPrimary,
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  referenceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius['2xl'],
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.lg,
  },
  referenceLabel: {
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  priceValue: {
    color: colors.textPrimary,
  },
  unitText: {
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
  },
  supplierCount: {
    color: colors.textMuted,
  },
  suppliersList: {
    gap: spacing.sm,
  },
  supplierCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  supplierCardSelected: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.accent,
  },
  supplierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  supplierNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  selectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderSubtle,
  },
  selectDotActive: {
    backgroundColor: colors.accent,
  },
  supplierName: {
    color: colors.textSecondary,
  },
  supplierNameActive: {
    color: colors.textPrimary,
  },
  supplierPrice: {
    color: colors.accent,
  },
  supplierFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockText: {
    color: colors.textSecondary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: 'rgba(11, 15, 15, 0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  addBtn: {
    width: '100%',
  },
});
