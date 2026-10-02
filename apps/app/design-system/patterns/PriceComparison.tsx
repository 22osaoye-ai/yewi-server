import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Surface } from '../primitives/Surface';
import { Text } from '../primitives/Text';
import { AppCard } from '../components/AppCard';
import { PriceBadge } from '../components/PriceBadge';
import { SupplierBadge } from '../components/SupplierBadge';
import { AppButton } from '../components/AppButton';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';

export interface SupplierOffer {
  id: string;
  supplierName: string;
  price: number;
  available: boolean;
  deliveryTime: string;
  isBestPrice?: boolean;
}

export interface PriceComparisonProps {
  materialName: string;
  category?: string;
  currentAveragePrice: number;
  weeklyTrendPercent: number; // e.g., -3.8
  unit?: string;
  suppliers: SupplierOffer[];
  onSelectSupplier?: (supplier: SupplierOffer) => void;
  onAddToBudget?: (supplier: SupplierOffer) => void;
}

export function PriceComparison({
  materialName,
  category = 'Materiales de Obra',
  currentAveragePrice,
  weeklyTrendPercent,
  unit = 'ud',
  suppliers,
  onSelectSupplier,
  onAddToBudget,
}: PriceComparisonProps) {
  const [selectedId, setSelectedId] = useState<string>(
    suppliers[0]?.id || ''
  );

  const selectedSupplier = suppliers.find((s) => s.id === selectedId) || suppliers[0];

  const handleSelect = (s: SupplierOffer) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedId(s.id);
    onSelectSupplier?.(s);
  };

  const handleAdd = () => {
    if (!selectedSupplier) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onAddToBudget?.(selectedSupplier);
  };

  return (
    <Surface variant="base" rounded="3xl" style={styles.cardWrapper}>
      {/* Header & Current Market Price */}
      <View style={styles.headerBlock}>
        <View style={styles.titleRow}>
          <Text variant="caption" color="textMuted" weight="semiBold" style={styles.capsCategory}>
            {category.toUpperCase()}
          </Text>
          <PriceBadge
            amount={currentAveragePrice}
            period={unit}
            variant="accent"
            trend={weeklyTrendPercent < 0 ? 'down' : 'up'}
            trendPercent={Math.abs(weeklyTrendPercent)}
          />
        </View>

        <Text variant="h2" color="textPrimary" weight="bold" style={styles.titleText}>
          {materialName}
        </Text>

        <View style={styles.trendRow}>
          <Text variant="caption" color="textSecondary">
            Precio de referencia:
          </Text>
          <Text
            variant="caption"
            weight="bold"
            style={{
              color: weeklyTrendPercent <= 0 ? colors.success : colors.danger,
              marginLeft: 4,
            }}
          >
            {weeklyTrendPercent <= 0 ? '↓' : '↑'} {Math.abs(weeklyTrendPercent)}% esta semana
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Supplier Comparison Section */}
      <View style={styles.suppliersSection}>
        <Text variant="label" color="textSecondary" weight="bold" style={styles.sectionHeader}>
          COMPARAR PROVEEDORES
        </Text>

        <View style={styles.supplierList}>
          {suppliers.map((supplier) => {
            const isSelected = supplier.id === selectedId;
            return (
              <AppCard
                key={supplier.id}
                onPress={() => handleSelect(supplier)}
                variant={isSelected ? 'highlight' : 'elevated'}
                hasGlow={isSelected}
                rounded="xl"
                style={[
                  styles.supplierCard,
                  isSelected && { borderColor: colors.accent, backgroundColor: colors.surfaceHighlight },
                ]}
              >
                <View style={styles.supplierLeft}>
                  <SupplierBadge
                    name={supplier.supplierName}
                    isVerified={supplier.available}
                    deliveryTime={supplier.deliveryTime}
                  />
                  {supplier.isBestPrice && (
                    <View style={styles.bestPricePill}>
                      <Text variant="caption" weight="bold" style={styles.bestPriceText}>
                        Mejor precio
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.supplierRight}>
                  <Text variant="h3" weight="extraBold" color={isSelected ? 'accent' : 'textPrimary'}>
                    {supplier.price.toFixed(2)} €
                  </Text>
                  <Text variant="caption" color="textMuted">
                    por {unit}
                  </Text>
                </View>
              </AppCard>
            );
          })}
        </View>
      </View>

      {/* Action CTA */}
      <View style={styles.actionRow}>
        <AppButton
          label="Añadir"
          onPress={handleAdd}
          variant="primary"
          size="lg"
          style={styles.ctaButton}
        />
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    padding: spacing.screenPadding,
    gap: 14,
  },
  headerBlock: {
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capsCategory: {
    letterSpacing: 0.8,
    fontSize: 10.5,
  },
  titleText: {
    fontSize: 18,
    letterSpacing: -0.3,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: 2,
  },
  suppliersSection: {
    gap: 8,
  },
  sectionHeader: {
    fontSize: 10.5,
    letterSpacing: 0.6,
  },
  supplierList: {
    gap: 8,
  },
  supplierCard: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  supplierLeft: {
    gap: 4,
    flex: 1,
  },
  supplierRight: {
    alignItems: 'flex-end',
  },
  bestPricePill: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.xs,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  bestPriceText: {
    color: colors.accent,
    fontSize: 9.5,
  },
  actionRow: {
    marginTop: 4,
  },
  ctaButton: {
    width: '100%',
  },
});
