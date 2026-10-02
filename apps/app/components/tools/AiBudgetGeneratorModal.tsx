import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  Share,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { YewiProModal } from '@/components/subscription/YewiProModal';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import {
  proToolsApi,
  BudgetItemModel,
  BudgetUnit,
  BudgetTemplateModel,
} from '@/services/proToolsApi';

interface AiBudgetGeneratorModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyBudget?: (totalPrice: number, breakdownText: string, estimatedDays: number) => void;
  initialCategory?: string;
  initialTitle?: string;
}

const TEMPLATE_PILLS = [
  { key: 'reforma_bano', label: 'Baño', icon: 'water-outline' },
  { key: 'reforma_cocina', label: 'Cocina', icon: 'restaurant-outline' },
  { key: 'pintura', label: 'Pintura', icon: 'color-palette-outline' },
  { key: 'climatizacion', label: 'Clima', icon: 'snow-outline' },
  { key: 'electricidad', label: 'Eléctrico', icon: 'flash-outline' },
  { key: 'fontaneria', label: 'Fontanería', icon: 'construct-outline' },
  { key: 'reforma_integral', label: 'Integral', icon: 'home-outline' },
  { key: 'custom', label: 'Blanco', icon: 'create-outline' },
];

const UNIT_OPTIONS: BudgetUnit[] = ['m²', 'ud', 'ml', 'h', 'pa'];

export function AiBudgetGeneratorModal({
  visible,
  onClose,
  onApplyBudget,
  initialCategory,
  initialTitle,
}: AiBudgetGeneratorModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();

  const isPro = Boolean(user?.isPro);
  const userProvince = user?.province || 'Zaragoza';

  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>(
    initialCategory || 'reforma_bano',
  );
  const [budgetTitle, setBudgetTitle] = useState<string>(
    initialTitle || 'Presupuesto de Obra',
  );
  const [items, setItems] = useState<BudgetItemModel[]>([]);
  const [vatRate, setVatRate] = useState<10 | 21 | 0>(10);
  const [estimatedDays, setEstimatedDays] = useState<number>(7);
  const [validityDays, setValidityDays] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [benchmarkingId, setBenchmarkingId] = useState<string | null>(null);
  const [showProModal, setShowProModal] = useState<boolean>(false);
  const [tradeTip, setTradeTip] = useState<string>('');
  const [marketProvince, setMarketProvince] = useState<string>(userProvince);

  // Load template items
  const loadTemplate = useCallback(
    async (templateKey: string) => {
      if (templateKey === 'custom') {
        setSelectedTemplateKey('custom');
        setItems([
          {
            id: String(Date.now()),
            title: 'Partida inicial de trabajo',
            unit: 'pa',
            quantity: 1,
            unitPrice: 150,
            laborPercent: 65,
            materialPercent: 35,
            subtotal: 150,
          },
        ]);
        setEstimatedDays(3);
        setTradeTip('Introduce los conceptos de tu obra y consulta el precio de mercado con IA.');
        return;
      }

      try {
        setLoading(true);
        setSelectedTemplateKey(templateKey);

        if (isPro) {
          const res = await proToolsApi.getBudgetTemplate({
            templateKey,
            province: userProvince,
          });

          if (res.template) {
            setBudgetTitle(res.template.title);
            setEstimatedDays(res.template.estimatedDays || 7);
            setTradeTip(res.template.tradeTip || '');
            if (res.province) setMarketProvince(res.province);

            const mapped: BudgetItemModel[] = res.template.items.map((it, idx) => {
              const qty = it.defaultQuantity || it.quantity || 1;
              const price = it.averagePrice || it.unitPrice || 50;
              return {
                id: `${templateKey}-${idx}-${Date.now()}`,
                title: it.title,
                description: it.description,
                unit: (it.unit as BudgetUnit) || 'ud',
                quantity: qty,
                unitPrice: price,
                laborPercent: it.laborPercent || 65,
                materialPercent: it.materialPercent || 35,
                subtotal: Math.round(qty * price * 100) / 100,
              };
            });
            setItems(mapped);
          }
        } else {
          // Placeholder template for non-pro preview
          setBudgetTitle('Presupuesto de Reforma');
          setItems([
            {
              id: 'sample-1',
              title: 'Trabajos preparatorios y protección',
              unit: 'pa',
              quantity: 1,
              unitPrice: 180,
              subtotal: 180,
            },
            {
              id: 'sample-2',
              title: 'Partida principal de ejecución',
              unit: 'm²',
              quantity: 20,
              unitPrice: 32,
              subtotal: 640,
            },
          ]);
        }
      } catch (err: any) {
        if (err?.status === 403 || err?.message?.includes('suscripción')) {
          setShowProModal(true);
        } else {
          console.warn('Error loading budget template:', err);
        }
      } finally {
        setLoading(false);
      }
    },
    [isPro, userProvince],
  );

  useEffect(() => {
    if (visible) {
      loadTemplate(initialCategory || 'reforma_bano');
    }
  }, [visible, initialCategory, loadTemplate]);

  // AI Price Scraping for all items
  const handleAiScrapeAll = async () => {
    if (!isPro) {
      setShowProModal(true);
      return;
    }

    try {
      setIsAiLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      const updated = await Promise.all(
        items.map(async (item) => {
          try {
            const bench = await proToolsApi.benchmarkItem({
              itemTitle: item.title,
              unit: item.unit,
              province: marketProvince,
              quantity: item.quantity,
            });
            const unitPrice = bench.averagePrice;
            return {
              ...item,
              unitPrice,
              laborPercent: bench.laborPercent,
              materialPercent: bench.materialPercent,
              subtotal: Math.round(unitPrice * item.quantity * 100) / 100,
            };
          } catch {
            return item;
          }
        }),
      );

      setItems(updated);
      toast.success(
        '¡Precios Actualizados!',
        `Se han calibrado las partidas con las tarifas oficiales de ${marketProvince}.`,
      );
    } catch {
      toast.error('Error', 'No se pudieron sincronizar los precios con el motor de IA.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Benchmark single item
  const handleAiBenchmarkItem = async (index: number) => {
    if (!isPro) {
      setShowProModal(true);
      return;
    }

    const target = items[index];
    if (!target) return;

    try {
      setBenchmarkingId(target.id);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

      const bench = await proToolsApi.benchmarkItem({
        itemTitle: target.title,
        unit: target.unit,
        province: marketProvince,
        quantity: target.quantity,
      });

      const updatedItems = [...items];
      updatedItems[index] = {
        ...target,
        unit: bench.unit,
        unitPrice: bench.averagePrice,
        laborPercent: bench.laborPercent,
        materialPercent: bench.materialPercent,
        subtotal: Math.round(bench.averagePrice * target.quantity * 100) / 100,
      };

      setItems(updatedItems);
      toast.success(
        'Precio IA Aplicado',
        `${bench.averagePrice.toFixed(2)} €/${bench.unit} (${bench.marketSource.slice(0, 30)}...)`,
      );
    } catch {
      toast.error('Error', 'No se pudo obtener el benchmarking para esta partida.');
    } finally {
      setBenchmarkingId(null);
    }
  };

  // Item field changes
  const updateItemField = (
    index: number,
    field: keyof BudgetItemModel,
    value: any,
  ) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'unitPrice') {
      const q = typeof value === 'number' ? value : parseFloat(value) || 0;
      const p =
        field === 'unitPrice'
          ? typeof value === 'number'
            ? value
            : parseFloat(value) || 0
          : current.unitPrice;
      const effectiveQty = field === 'quantity' ? q : current.quantity;
      current.subtotal = Math.round(effectiveQty * p * 100) / 100;
    }

    updated[index] = current;
    setItems(updated);
  };

  const handleAddItem = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        title: 'Nueva unidad de obra',
        unit: 'ud',
        quantity: 1,
        unitPrice: 50,
        subtotal: 50,
      },
    ]);
  };

  const handleDeleteItem = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Totals calculations
  const totals = useMemo(() => {
    const base = items.reduce((acc, it) => acc + (it.subtotal || 0), 0);
    const labor = items.reduce((acc, it) => {
      const ratio = (it.laborPercent ?? 65) / 100;
      return acc + (it.subtotal || 0) * ratio;
    }, 0);
    const material = base - labor;
    const vat = Math.round(((base * vatRate) / 100) * 100) / 100;
    const total = Math.round((base + vat) * 100) / 100;

    return {
      base: Math.round(base * 100) / 100,
      labor: Math.round(labor * 100) / 100,
      material: Math.round(material * 100) / 100,
      vat,
      total,
    };
  }, [items, vatRate]);

  // Generate plain-text formal quote
  const generateFormalText = useCallback(() => {
    const lines = [
      `========================================`,
      `📄 ${budgetTitle.toUpperCase()}`,
      `Provincia: ${marketProvince} | Validez: ${validityDays} días`,
      `Plazo estimado de ejecución: ${estimatedDays} días`,
      `========================================\n`,
      `DESGLOSE DE PARTIDAS:`,
    ];

    items.forEach((it, idx) => {
      lines.push(
        `${idx + 1}. ${it.title}\n   ${it.quantity} ${it.unit} x ${it.unitPrice.toFixed(2)} €/${it.unit} = ${it.subtotal.toFixed(2)} €`,
      );
    });

    lines.push(
      `\n----------------------------------------`,
      `Mano de Obra estimada: ${totals.labor.toFixed(2)} €`,
      `Materiales estimados: ${totals.material.toFixed(2)} €`,
      `Base Imponible: ${totals.base.toFixed(2)} €`,
      `IVA (${vatRate}%): ${totals.vat.toFixed(2)} €`,
      `TOTAL PRESUPUESTO: ${totals.total.toFixed(2)} € (IVA incl.)`,
      `----------------------------------------`,
      `Condiciones de pago: 40% a la firma, 40% a mitad de obra y 20% al remate y conformidad.`,
      `Generado con Yewi Pro AI Budget Engine`,
    );

    return lines.join('\n');
  }, [budgetTitle, marketProvince, validityDays, estimatedDays, items, totals, vatRate]);

  // Copy or share formal quote
  const handleShareQuote = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const text = generateFormalText();
      await Share.share({
        title: budgetTitle,
        message: text,
      });
    } catch {
      // dismissed
    }
  };

  // Save budget locally
  const handleSaveBudget = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const payload = {
        title: budgetTitle,
        items,
        vatRate,
        estimatedDays,
        total: totals.total,
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(`@yewi_budget_${Date.now()}`, JSON.stringify(payload));
      toast.success('Borrador Guardado', 'El presupuesto se ha almacenado en tu dispositivo.');
    } catch {
      toast.error('Error', 'No se pudo guardar el borrador.');
    }
  };

  // Apply to proposal
  const handleApply = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (onApplyBudget) {
      onApplyBudget(totals.total, generateFormalText(), estimatedDays);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* HEADER */}
        <View
          style={[
            styles.header,
            {
              borderBottomColor: colors.borderSubtle,
              paddingTop: Math.max(insets.top + 8, 16),
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={styles.badgePro}>
              <Ionicons name="sparkles" size={13} color="#000000" />
              <Text style={styles.badgeProText}>PRO IA</Text>
            </View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Presupuestos</Text>
          </View>

          <ThemedTouchable onPress={onClose} haptic="light" style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </ThemedTouchable>
        </View>

        {/* PRO PAYWALL BANNER IF NOT SUBSCRIBED */}
        {!isPro && (
          <View
            style={[
              styles.paywallBanner,
              {
                backgroundColor: isDark ? '#1E293B' : '#FEF3C7',
                borderColor: isDark ? '#334155' : '#FDE68A',
              },
            ]}
          >
            <View style={{ flex: 1, marginRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Ionicons name="lock-closed" size={15} color="#D97706" />
                <Text style={[styles.paywallTitle, { color: isDark ? '#FDE047' : '#92400E' }]}>
                  Herramienta Exclusiva Yewi Pro
                </Text>
              </View>
              <Text style={[styles.paywallSub, { color: isDark ? '#CBD5E1' : '#78350F' }]}>
                Scraping de precios con IA y plantillas por 15,99 €/mes sin comisiones.
              </Text>
            </View>
            <ThemedTouchable
              onPress={() => setShowProModal(true)}
              haptic="medium"
              style={styles.paywallBtn}
            >
              <Text style={styles.paywallBtnText}>Activar</Text>
            </ThemedTouchable>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: Math.max(insets.bottom + 24, 32),
            gap: 16,
          }}
        >
          {/* TITLE INPUT */}
          <View style={{ marginTop: 12 }}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Proyecto</Text>
            <TextInput
              value={budgetTitle}
              onChangeText={setBudgetTitle}
              placeholder="Ej: Reforma de Baño Principal"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.titleInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                  color: colors.textPrimary,
                },
              ]}
            />
          </View>

          {/* TEMPLATE PICKER */}
          <View>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Plantillas</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {TEMPLATE_PILLS.map((pill) => {
                const isSelected = selectedTemplateKey === pill.key;
                return (
                  <ThemedTouchable
                    key={pill.key}
                    onPress={() => loadTemplate(pill.key)}
                    haptic="selection"
                    style={[
                      styles.templatePill,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : isDark
                            ? 'rgba(255,255,255,0.06)'
                            : '#F1F5F9',
                        borderColor: isSelected ? colors.primary : colors.borderSubtle,
                      },
                    ]}
                  >
                    <Ionicons
                      name={pill.icon as any}
                      size={15}
                      color={isSelected ? '#FFFFFF' : colors.textPrimary}
                    />
                    <Text
                      style={[
                        styles.templatePillText,
                        { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                      ]}
                    >
                      {pill.label}
                    </Text>
                  </ThemedTouchable>
                );
              })}
            </ScrollView>
          </View>

          {/* AI BENCHMARK ACTION BAR */}
          <View
            style={[
              styles.benchmarkBar,
              {
                backgroundColor: isDark ? '#0F172A' : '#EFF6FF',
                borderColor: isDark ? '#1E293B' : '#BFDBFE',
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="location-outline" size={15} color="#0284C7" />
                <Text style={[styles.benchmarkProvince, { color: colors.textPrimary }]}>
                  {marketProvince}
                </Text>
                <View style={styles.badgeLive}>
                  <Text style={styles.badgeLiveText}>2026</Text>
                </View>
              </View>
              <Text style={[styles.benchmarkDesc, { color: colors.textSecondary }]}>
                Precios de referencia oficiales ajustados por gremio
              </Text>
            </View>

            <ThemedTouchable
              onPress={handleAiScrapeAll}
              disabled={isAiLoading || loading}
              haptic="medium"
              style={[styles.aiScrapeBtn, { backgroundColor: isPro ? '#0284C7' : '#64748B' }]}
            >
              {isAiLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                  <Text style={styles.aiScrapeBtnText}>Precios IA</Text>
                </>
              )}
            </ThemedTouchable>
          </View>

          {tradeTip ? (
            <View style={[styles.tipCard, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
              <Ionicons name="information-circle-outline" size={16} color="#0284C7" />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>{tradeTip}</Text>
            </View>
          ) : null}

          {/* LINE ITEMS */}
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                Partidas ({items.length})
              </Text>
              <ThemedTouchable onPress={handleAddItem} haptic="light" style={styles.addBtn}>
                <Ionicons name="add" size={15} color={colors.primary} />
                <Text style={[styles.addBtnText, { color: colors.primary }]}>Añadir</Text>
              </ThemedTouchable>
            </View>

            {loading ? (
              <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              items.map((item, index) => {
                const isBenchmarkingThis = benchmarkingId === item.id;
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.itemCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.borderSubtle,
                      },
                    ]}
                  >
                    {/* Top Row: Concept & Delete */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <TextInput
                        value={item.title}
                        onChangeText={(txt) => updateItemField(index, 'title', txt)}
                        placeholder="Descripción de la partida"
                        placeholderTextColor={colors.textMuted}
                        style={[styles.itemTitleInput, { color: colors.textPrimary }]}
                      />
                      <ThemedTouchable
                        onPress={() => handleDeleteItem(index)}
                        haptic="light"
                        style={styles.deleteBtn}
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </ThemedTouchable>
                    </View>

                    {/* Middle Row: Quantity, Unit, Price, AI Button */}
                    <View style={styles.itemInputsRow}>
                      <View style={{ flex: 1.1 }}>
                        <Text style={[styles.miniLabel, { color: colors.textMuted }]}>Cantidad</Text>
                        <TextInput
                          value={String(item.quantity)}
                          onChangeText={(txt) => updateItemField(index, 'quantity', txt)}
                          keyboardType="numeric"
                          style={[
                            styles.miniInput,
                            {
                              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                              borderColor: colors.borderSubtle,
                              color: colors.textPrimary,
                            },
                          ]}
                        />
                      </View>

                      <View style={{ flex: 1.1 }}>
                        <Text style={[styles.miniLabel, { color: colors.textMuted }]}>Unidad</Text>
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                          {UNIT_OPTIONS.slice(0, 3).map((u) => (
                            <ThemedTouchable
                              key={u}
                              onPress={() => updateItemField(index, 'unit', u)}
                              haptic="selection"
                              style={[
                                styles.unitChip,
                                {
                                  backgroundColor:
                                    item.unit === u
                                      ? colors.primary
                                      : isDark
                                        ? 'rgba(255,255,255,0.04)'
                                        : '#F1F5F9',
                                },
                              ]}
                            >
                              <Text
                                style={{
                                  fontSize: 11,
                                  fontFamily: 'PlusJakartaSans-Bold',
                                  color: item.unit === u ? '#FFFFFF' : colors.textPrimary,
                                }}
                              >
                                {u}
                              </Text>
                            </ThemedTouchable>
                          ))}
                        </View>
                      </View>

                      <View style={{ flex: 1.3 }}>
                        <Text style={[styles.miniLabel, { color: colors.textMuted }]}>Precio (€)</Text>
                        <TextInput
                          value={String(item.unitPrice)}
                          onChangeText={(txt) => updateItemField(index, 'unitPrice', txt)}
                          keyboardType="numeric"
                          style={[
                            styles.miniInput,
                            {
                              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                              borderColor: colors.borderSubtle,
                              color: colors.textPrimary,
                            },
                          ]}
                        />
                      </View>

                      <ThemedTouchable
                        onPress={() => handleAiBenchmarkItem(index)}
                        disabled={isBenchmarkingThis}
                        haptic="medium"
                        style={[
                          styles.singleAiBtn,
                          { backgroundColor: isDark ? 'rgba(2,132,199,0.15)' : '#E0F2FE' },
                        ]}
                      >
                        {isBenchmarkingThis ? (
                          <ActivityIndicator size="small" color="#0284C7" />
                        ) : (
                          <>
                            <Ionicons name="sparkles" size={13} color="#0284C7" />
                            <Text style={styles.singleAiText}>IA</Text>
                          </>
                        )}
                      </ThemedTouchable>
                    </View>

                    {/* Bottom Row: Breakdown & Subtotal */}
                    <View style={styles.itemFooterRow}>
                      <Text style={[styles.ratioText, { color: colors.textMuted }]}>
                        MO: {item.laborPercent ?? 65}% · Mat: {item.materialPercent ?? 35}%
                      </Text>
                      <Text style={[styles.subtotalText, { color: colors.textPrimary }]}>
                        {item.subtotal.toFixed(2)} €
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* FISCAL & TOTALS CARD */}
          <View
            style={[
              styles.totalsCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Mano de obra:</Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                {totals.labor.toFixed(2)} €
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Materiales:</Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                {totals.material.toFixed(2)} €
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Base imponible:</Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                {totals.base.toFixed(2)} €
              </Text>
            </View>

            {/* VAT SELECTOR */}
            <View style={[styles.summaryRow, { alignItems: 'center' }]}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Tipo de IVA:</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[10, 21, 0].map((rate) => (
                  <ThemedTouchable
                    key={rate}
                    onPress={() => setVatRate(rate as any)}
                    haptic="selection"
                    style={[
                      styles.vatPill,
                      {
                        backgroundColor:
                          vatRate === rate
                            ? colors.primary
                            : isDark
                              ? 'rgba(255,255,255,0.05)'
                              : '#F1F5F9',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.vatText,
                        { color: vatRate === rate ? '#FFFFFF' : colors.textPrimary },
                      ]}
                    >
                      {rate}%
                    </Text>
                  </ThemedTouchable>
                ))}
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>TOTAL:</Text>
              <Text style={[styles.totalPrice, { color: colors.primary }]}>
                {totals.total.toFixed(2)} €
              </Text>
            </View>
          </View>

          {/* ACTION BUTTONS */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <ThemedTouchable
              onPress={handleShareQuote}
              haptic="medium"
              style={[
                styles.actionBtnSecondary,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <Ionicons name="share-outline" size={17} color={colors.textPrimary} />
              <Text style={[styles.actionBtnSecText, { color: colors.textPrimary }]}>Copiar</Text>
            </ThemedTouchable>

            <ThemedTouchable
              onPress={handleSaveBudget}
              haptic="medium"
              style={[
                styles.actionBtnSecondary,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <Ionicons name="bookmark-outline" size={17} color={colors.textPrimary} />
              <Text style={[styles.actionBtnSecText, { color: colors.textPrimary }]}>Guardar</Text>
            </ThemedTouchable>

            {onApplyBudget && (
              <ThemedTouchable
                onPress={handleApply}
                haptic="medium"
                style={[styles.actionBtnPrimary, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
                <Text style={styles.actionBtnPriText}>Aplicar</Text>
              </ThemedTouchable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <YewiProModal
        visible={showProModal}
        onClose={() => setShowProModal(false)}
        onSubscriptionUpdated={() => {
          setShowProModal(false);
          loadTemplate(selectedTemplateKey);
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    letterSpacing: -0.3,
  },
  badgePro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FDE047',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeProText: {
    fontSize: 10.5,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    color: '#000000',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
  },
  paywallBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  paywallTitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  paywallSub: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans-Regular',
    marginTop: 1,
  },
  paywallBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  paywallBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  titleInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 14.5,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  templatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  templatePillText: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  benchmarkBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  benchmarkProvince: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  badgeLive: {
    backgroundColor: '#0284C720',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeLiveText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#0284C7',
  },
  benchmarkDesc: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Regular',
    marginTop: 2,
  },
  aiScrapeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  aiScrapeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
  },
  tipText: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans-Regular',
    flex: 1,
    lineHeight: 16,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  addBtnText: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  itemCard: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  itemTitleInput: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans-SemiBold',
    paddingVertical: 2,
  },
  deleteBtn: {
    padding: 4,
  },
  itemInputsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  miniLabel: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans-Medium',
    marginBottom: 3,
  },
  miniInput: {
    height: 36,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
  },
  unitChip: {
    height: 36,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singleAiBtn: {
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  singleAiText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#0284C7',
  },
  itemFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  ratioText: {
    fontSize: 10.5,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  subtotalText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },
  totalsCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  summaryValue: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  vatPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vatText: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingTop: 2,
  },
  totalLabel: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },
  totalPrice: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },
  actionBtnSecondary: {
    flex: 1,
    height: 46,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnSecText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  actionBtnPrimary: {
    flex: 1.4,
    height: 46,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnPriText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
  },
});
