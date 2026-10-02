import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Share,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { YewiProModal } from '@/components/subscription/YewiProModal';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuthStore } from '@/store/useAuthStore';
import { useBudgetStore } from '@/store/useBudgetStore';
import { toast } from '@/store/useToastStore';
import {
  proToolsApi,
  BudgetItemModel,
  BudgetUnit,
} from '@/services/proToolsApi';
import { exportBudgetPdf } from '@/services/budgetPdfService';


const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PAD = 16;
const GRID_GAP = 12;
const CARD_GRID_WIDTH = Math.floor((SCREEN_WIDTH - (HORIZONTAL_PAD * 2) - GRID_GAP) / 2);

export interface TemplateGalleryItem {
  key: string;
  title: string;
  category: string;
  shortDesc: string;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor: string;
  estimatedDays: number;
  itemCount: number;
  referencePrice: number;
  isCustom?: boolean;
}

const TEMPLATE_GALLERY: TemplateGalleryItem[] = [
  {
    key: 'custom',
    title: 'En blanco',
    category: 'Personalizado',
    shortDesc: 'Desde cero partida a partida',
    icon: 'add',
    accentColor: '#0284C7',
    estimatedDays: 3,
    itemCount: 1,
    referencePrice: 150,
    isCustom: true,
  },
  {
    key: 'reforma_bano',
    title: 'Baño',
    category: 'Reformas',
    shortDesc: 'Fontanería, plato resina y alicatado',
    icon: 'water-outline',
    accentColor: '#0284C7',
    estimatedDays: 7,
    itemCount: 6,
    referencePrice: 3450,
  },
  {
    key: 'reforma_cocina',
    title: 'Cocina',
    category: 'Reformas',
    shortDesc: 'Alicatado, fontanería y encimera',
    icon: 'restaurant-outline',
    accentColor: '#EA580C',
    estimatedDays: 10,
    itemCount: 6,
    referencePrice: 4800,
  },
  {
    key: 'pintura',
    title: 'Pintura',
    category: 'Acabados',
    shortDesc: 'Lijado, imprimación y 2 manos',
    icon: 'color-palette-outline',
    accentColor: '#7C3AED',
    estimatedDays: 4,
    itemCount: 4,
    referencePrice: 850,
  },
  {
    key: 'climatizacion',
    title: 'Climatización',
    category: 'Instalaciones',
    shortDesc: 'Conductos y splits frío/calor',
    icon: 'snow-outline',
    accentColor: '#0F766E',
    estimatedDays: 2,
    itemCount: 4,
    referencePrice: 1200,
  },
  {
    key: 'electricidad',
    title: 'Electricidad',
    category: 'Instalaciones',
    shortDesc: 'Cuadro general, cableado y boletín',
    icon: 'flash-outline',
    accentColor: '#D97706',
    estimatedDays: 5,
    itemCount: 5,
    referencePrice: 950,
  },
  {
    key: 'fontaneria',
    title: 'Fontanería',
    category: 'Instalaciones',
    shortDesc: 'Tuberías multicapa y desagües',
    icon: 'construct-outline',
    accentColor: '#4338CA',
    estimatedDays: 4,
    itemCount: 4,
    referencePrice: 1100,
  },
  {
    key: 'reforma_integral',
    title: 'Reforma Integral',
    category: 'Reformas',
    shortDesc: 'Vivienda 80 m² completa',
    icon: 'home-outline',
    accentColor: '#16A34A',
    estimatedDays: 45,
    itemCount: 8,
    referencePrice: 18500,
  },
];

const CATEGORY_TABS = ['Todos', 'Reformas', 'Instalaciones', 'Acabados', 'Personalizado'];
const UNIT_OPTIONS: BudgetUnit[] = ['m²', 'ud', 'ml', 'h', 'pa'];

/**
 * Miniature Word/PowerPoint styled template preview thumbnail
 */
function DocumentPaperPreview({
  template,
  isDark,
  isSelected,
}: {
  template: TemplateGalleryItem;
  isDark: boolean;
  isSelected?: boolean;
}) {
  const paperBg = isDark ? '#1E293B' : '#FFFFFF';
  const borderColor = isSelected
    ? template.accentColor
    : isDark
      ? 'rgba(255, 255, 255, 0.12)'
      : 'rgba(0, 0, 0, 0.08)';

  if (template.isCustom) {
    return (
      <View
        style={[
          styles.paperSheet,
          {
            backgroundColor: paperBg,
            borderColor,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
      >
        <View style={[styles.blankPaperInner, { borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
          <View
            style={[
              styles.blankPlusCircle,
              { backgroundColor: isDark ? 'rgba(2,132,199,0.18)' : '#E0F2FE' },
            ]}
          >
            <Ionicons name="add" size={22} color="#0284C7" />
          </View>
          <Text style={[styles.blankPaperLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            En blanco
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.paperSheet,
        {
          backgroundColor: paperBg,
          borderColor,
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
    >
      {/* Top Accent Bar */}
      <View style={[styles.paperTopStrip, { backgroundColor: template.accentColor }]} />

      {/* Miniature Document Header */}
      <View style={styles.paperHeaderRow}>
        <View
          style={[
            styles.paperIconBadge,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' },
          ]}
        >
          <Ionicons name={template.icon} size={12} color={template.accentColor} />
        </View>
        <View style={styles.paperHeaderLines}>
          <View
            style={[
              styles.dummyLineDark,
              { backgroundColor: isDark ? '#94A3B8' : '#334155', width: '80%' },
            ]}
          />
          <View
            style={[
              styles.dummyLineLight,
              { backgroundColor: isDark ? '#475569' : '#CBD5E1', width: '50%' },
            ]}
          />
        </View>
      </View>

      {/* Simulated table rows mimicking a formal quotation document */}
      <View style={styles.paperBodyRows}>
        {[75, 60, 85].map((widthPct, idx) => (
          <View key={idx} style={styles.dummyTableRow}>
            <View
              style={[
                styles.dummyLineLight,
                { backgroundColor: isDark ? '#334155' : '#E2E8F0', width: `${widthPct}%` },
              ]}
            />
            <View
              style={[
                styles.dummyPriceDot,
                { backgroundColor: isDark ? '#475569' : '#CBD5E1' },
              ]}
            />
          </View>
        ))}
      </View>

      {/* Miniature Footer Total Bar */}
      <View style={styles.paperFooter}>
        <View
          style={[
            styles.paperTotalHighlight,
            { backgroundColor: `${template.accentColor}25` },
          ]}
        >
          <Text style={[styles.paperTotalText, { color: template.accentColor }]}>
            ~{template.referencePrice} €
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function BudgetGeneratorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    category?: string;
    title?: string;
    requestId?: string;
  }>();

  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();
  const { setAppliedBudget } = useBudgetStore();

  const isPro = Boolean(user?.isPro);
  const userProvince = user?.province || 'Zaragoza';

  // Active view: 'gallery' (Word/PowerPoint style) or 'editor'
  const [activeView, setActiveView] = useState<'gallery' | 'editor'>('gallery');
  const [galleryCategory, setGalleryCategory] = useState<string>('Todos');

  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>(
    params.category || 'reforma_bano',
  );
  const [budgetTitle, setBudgetTitle] = useState<string>(
    params.title || 'Presupuesto de Obra',
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
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const isExportingRef = useRef<boolean>(false);


  // Load a template into the editor
  const handleSelectTemplate = useCallback(
    async (templateKey: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setSelectedTemplateKey(templateKey);

      if (templateKey === 'custom') {
        setBudgetTitle(params.title || 'Presupuesto Personalizado');
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
        setTradeTip('Introduce los conceptos de tu obra y calcula el precio de mercado con IA.');
        setActiveView('editor');
        return;
      }

      try {
        setLoading(true);

        if (isPro) {
          const res = await proToolsApi.getBudgetTemplate({
            templateKey,
            province: userProvince,
          });

          if (res.template) {
            setBudgetTitle(params.title || res.template.title);
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
          // Non-pro fallback preview
          setBudgetTitle('Presupuesto de Obra');
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

        setActiveView('editor');
      } catch (err: any) {
        if (err?.status === 403 || err?.message?.includes('suscripción')) {
          setShowProModal(true);
        } else {
          toast.error('Error', 'No se pudo cargar la plantilla seleccionada.');
        }
      } finally {
        setLoading(false);
      }
    },
    [isPro, userProvince, params.title],
  );

  // If initial category is passed in params, auto-open editor
  useEffect(() => {
    if (params.category) {
      const match = TEMPLATE_GALLERY.find(
        (t) =>
          t.key === params.category ||
          t.title.toLowerCase().includes(params.category!.toLowerCase()),
      );
      if (match) {
        handleSelectTemplate(match.key);
      }
    }
  }, [params.category, handleSelectTemplate]);

  // AI Scrape all items
  const handleAiScrapeAll = async () => {
    if (!isPro) {
      setShowProModal(true);
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setIsAiLoading(true);

      const updated = await Promise.all(
        items.map(async (item) => {
          try {
            const bench = await proToolsApi.benchmarkItem({
              itemTitle: item.title,
              province: marketProvince,
              unit: item.unit,
            });
            return {
              ...item,
              unitPrice: bench.averagePrice,
              laborPercent: bench.laborPercent,
              materialPercent: bench.materialPercent,
              subtotal: Math.round(bench.averagePrice * item.quantity * 100) / 100,
            };
          } catch {
            return item;
          }
        }),
      );

      setItems(updated);
      toast.success(
        'Precios Actualizados',
        `Calibrados para ${marketProvince} según base 2026.`,
      );
    } catch {
      toast.error('Error', 'No se pudieron consultar los precios de mercado.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Scrape single item
  const handleAiBenchmarkItem = async (index: number) => {
    if (!isPro) {
      setShowProModal(true);
      return;
    }

    const target = items[index];
    if (!target) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setBenchmarkingId(target.id);

      const bench = await proToolsApi.benchmarkItem({
        itemTitle: target.title,
        province: marketProvince,
        unit: target.unit,
      });

      const updatedItems = [...items];
      updatedItems[index] = {
        ...target,
        unitPrice: bench.averagePrice,
        laborPercent: bench.laborPercent,
        materialPercent: bench.materialPercent,
        subtotal: Math.round(bench.averagePrice * target.quantity * 100) / 100,
      };

      setItems(updatedItems);
      toast.success(
        'Precio IA Aplicado',
        `${bench.averagePrice.toFixed(2)} €/${bench.unit}`,
      );
    } catch {
      toast.error('Error', 'No se pudo obtener el benchmarking para esta partida.');
    } finally {
      setBenchmarkingId(null);
    }
  };

  // Field change on an item
  const updateItemField = (
    index: number,
    field: keyof BudgetItemModel,
    value: any,
  ) => {
    const updated = [...items];
    const prev = updated[index];
    if (!prev) return;

    const current = { ...prev, [field]: value };

    if (field === 'quantity' || field === 'unitPrice') {
      const q =
        typeof current.quantity === 'number'
          ? current.quantity
          : parseFloat(String(current.quantity).replace(',', '.')) || 0;
      const p =
        typeof current.unitPrice === 'number'
          ? current.unitPrice
          : parseFloat(String(current.unitPrice).replace(',', '.')) || 0;
      current.subtotal = Math.round(q * p * 100) / 100;
    }

    updated[index] = current;
    setItems(updated);
  };

  // Cycle unit for an item
  const cycleUnit = (index: number) => {
    Haptics.selectionAsync().catch(() => {});
    const currentUnit = items[index]?.unit || 'ud';
    const curIdx = UNIT_OPTIONS.indexOf(currentUnit);
    const nextUnit = UNIT_OPTIONS[(curIdx + 1) % UNIT_OPTIONS.length];
    updateItemField(index, 'unit', nextUnit);
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
        laborPercent: 65,
        materialPercent: 35,
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
    const base = items.reduce((acc, it) => {
      const s =
        typeof it.subtotal === 'number'
          ? it.subtotal
          : parseFloat(String(it.subtotal).replace(',', '.')) || 0;
      return acc + s;
    }, 0);
    const labor = items.reduce((acc, it) => {
      const s =
        typeof it.subtotal === 'number'
          ? it.subtotal
          : parseFloat(String(it.subtotal).replace(',', '.')) || 0;
      const ratio = (it.laborPercent ?? 65) / 100;
      return acc + s * ratio;
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
      const p =
        typeof it.unitPrice === 'number'
          ? it.unitPrice
          : parseFloat(String(it.unitPrice).replace(',', '.')) || 0;
      const s =
        typeof it.subtotal === 'number'
          ? it.subtotal
          : parseFloat(String(it.subtotal).replace(',', '.')) || 0;
      lines.push(
        `${idx + 1}. ${it.title}\n   ${it.quantity} ${it.unit} x ${p.toFixed(2)} €/${it.unit} = ${s.toFixed(2)} €`,
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

  const handleExportPdf = async () => {
    if (isExportingRef.current || isExportingPdf) return;
    isExportingRef.current = true;
    setIsExportingPdf(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
      const proName = fullName || user?.professionalProfile?.businessName || 'Profesional Certificado';
      const proBusiness = user?.professionalProfile?.businessName || (fullName ? `${fullName} Reformas` : 'Servicios Profesionales');

      const sanitizedItems = items.map((it) => {
        const q =
          typeof it.quantity === 'number'
            ? it.quantity
            : parseFloat(String(it.quantity).replace(',', '.')) || 0;
        const p =
          typeof it.unitPrice === 'number'
            ? it.unitPrice
            : parseFloat(String(it.unitPrice).replace(',', '.')) || 0;
        const s =
          typeof it.subtotal === 'number'
            ? it.subtotal
            : Math.round(q * p * 100) / 100;
        return {
          ...it,
          quantity: q,
          unitPrice: p,
          subtotal: s,
        };
      });

      await exportBudgetPdf({
        title: budgetTitle || 'Presupuesto de Obra',
        items: sanitizedItems,
        province: marketProvince,
        validityDays: Number(validityDays) || 30,
        estimatedDays: Number(estimatedDays) || 7,
        vatRate: Number(vatRate) || 10,
        laborTotal: Number(totals.labor) || 0,
        materialTotal: Number(totals.material) || 0,
        baseTotal: Number(totals.base) || 0,
        vatTotal: Number(totals.vat) || 0,
        grandTotal: Number(totals.total) || 0,
        tradeTip: tradeTip || undefined,
        professionalName: proName,
        professionalBusiness: proBusiness,
        professionalPhone: user?.phoneNumber,
        professionalEmail: user?.email,
      });

      toast.success('PDF Generado', 'Documento listo para compartir o imprimir.');
    } catch (err: any) {
      toast.error('Error al exportar', err?.message || 'No se pudo generar el PDF.');
    } finally {
      setIsExportingPdf(false);
      setTimeout(() => {
        isExportingRef.current = false;
      }, 800);
    }
  };



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
      toast.success('Borrador Guardado', 'Presupuesto almacenado localmente.');
    } catch {
      toast.error('Error', 'No se pudo guardar el borrador.');
    }
  };

  // Apply to proposal in request-detail
  const handleApplyToProposal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setAppliedBudget({
      requestId: params.requestId,
      totalPrice: totals.total,
      breakdownText: generateFormalText(),
      estimatedDays,
      timestamp: Date.now(),
    });
    toast.success('Presupuesto Aplicado', 'Se ha transferido a tu oferta.');
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile' as any);
    }
  };

  // Filtered gallery items
  const filteredGallery = useMemo(() => {
    if (galleryCategory === 'Todos') return TEMPLATE_GALLERY;
    return TEMPLATE_GALLERY.filter((t) => t.category === galleryCategory);
  }, [galleryCategory]);

  const handleHeaderBack = () => {
    if (activeView === 'editor') {
      setActiveView('gallery');
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile' as any);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* =========================================================================
          BULLETPROOF SCREEN HEADER (Zero-Overflow Guarantee)
          Fixed 3-column layout: 40px Left - flex:1 Center - 40px Right
          Uniform 22px Icons per Rule 7
          ========================================================================= */}
      <View
        style={[
          styles.screenHeader,
          {
            paddingTop: insets.top + 6,
            borderBottomColor: colors.borderSubtle,
            backgroundColor: colors.surface,
          },
        ]}
      >
        {/* Left: Back Button */}
        <ThemedTouchable
          onPress={handleHeaderBack}
          haptic="light"
          style={styles.headerIconButton}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </ThemedTouchable>

        {/* Center: Title (Concise, single word per Rule 5, centered) */}
        <View style={styles.headerTitleContainer}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.headerTitleText, { color: colors.textPrimary }]}
          >
            {activeView === 'gallery' ? 'Plantillas' : 'Presupuesto'}
          </Text>
        </View>

        {/* Right: Uniform Action Button (40x40 with 22px icon) */}
        {activeView === 'editor' ? (
          <ThemedTouchable
            onPress={() => setActiveView('gallery')}
            haptic="selection"
            style={styles.headerIconButton}
          >
            <Ionicons name="documents-outline" size={22} color={colors.primary} />
          </ThemedTouchable>
        ) : (
          <ThemedTouchable
            onPress={() => handleSelectTemplate('custom')}
            haptic="medium"
            style={[
              styles.headerIconButton,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' },
            ]}
          >
            <Ionicons name="add" size={22} color={colors.textPrimary} />
          </ThemedTouchable>
        )}
      </View>

      {/* COMPACT PAYWALL BANNER FOR NON-PRO USERS */}
      {!isPro && (
        <ThemedTouchable
          onPress={() => setShowProModal(true)}
          haptic="medium"
          style={[
            styles.paywallBanner,
            {
              backgroundColor: isDark ? '#1E293B' : '#FEF3C7',
              borderColor: isDark ? '#334155' : '#FDE68A',
            },
          ]}
        >
          <View style={{ flex: 1, marginRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 }}>
              <Ionicons name="lock-closed" size={13} color="#D97706" />
              <Text style={[styles.paywallTitle, { color: isDark ? '#FDE047' : '#92400E' }]}>
                Yewi Pro · 15,99 €/mes
              </Text>
            </View>
            <Text
              numberOfLines={2}
              style={[styles.paywallDesc, { color: isDark ? '#CBD5E1' : '#78350F' }]}
            >
              Plantillas y motor de precios IA con base de costes española.
            </Text>
          </View>
          <View style={styles.upgradeBtn}>
            <Text style={styles.upgradeBtnText}>Activar</Text>
          </View>
        </ThemedTouchable>
      )}

      {/* =========================================================================
          VIEW 1: WORD / POWERPOINT TEMPLATE GALLERY
          ========================================================================= */}
      {activeView === 'gallery' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: HORIZONTAL_PAD,
            paddingTop: 14,
            paddingBottom: insets.bottom + 32,
          }}
        >
          {/* Header Banner */}
          <View style={styles.galleryHero}>
            <Text style={[styles.galleryHeroTitle, { color: colors.textPrimary }]}>
              Nuevo Presupuesto
            </Text>
            <Text style={[styles.galleryHeroDesc, { color: colors.textSecondary }]}>
              Elige una plantilla o inicia un documento en blanco.
            </Text>
          </View>

          {/* Category Filter Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galleryTabsRow}
          >
            {CATEGORY_TABS.map((cat) => {
              const isSelected = galleryCategory === cat;
              return (
                <ThemedTouchable
                  key={cat}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setGalleryCategory(cat);
                  }}
                  haptic="selection"
                  style={[
                    styles.galleryTabChip,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : isDark
                          ? 'rgba(255,255,255,0.06)'
                          : '#F1F5F9',
                      borderColor: isSelected
                        ? colors.primary
                        : colors.borderSubtle,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.galleryTabChipText,
                      { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                    ]}
                  >
                    {cat}
                  </Text>
                </ThemedTouchable>
              );
            })}
          </ScrollView>

          {/* 2-Column Grid with exact math width */}
          <View style={styles.galleryGrid}>
            {filteredGallery.map((tpl) => {
              const isSelected = selectedTemplateKey === tpl.key;
              return (
                <ThemedTouchable
                  key={tpl.key}
                  onPress={() => handleSelectTemplate(tpl.key)}
                  haptic="medium"
                  activeOpacity={0.9}
                  style={styles.galleryCardContainer}
                >
                  {/* Miniature Paper Document Preview */}
                  <DocumentPaperPreview
                    template={tpl}
                    isDark={isDark}
                    isSelected={isSelected}
                  />

                  {/* Card Metadata below sheet */}
                  <View style={styles.galleryCardMeta}>
                    <Text
                      numberOfLines={1}
                      style={[styles.galleryCardTitle, { color: colors.textPrimary }]}
                    >
                      {tpl.title}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[styles.galleryCardDesc, { color: colors.textSecondary }]}
                    >
                      {tpl.shortDesc}
                    </Text>

                    <View style={styles.galleryCardBadges}>
                      <View
                        style={[
                          styles.metaPill,
                          { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' },
                        ]}
                      >
                        <Text style={[styles.metaPillText, { color: colors.textSecondary }]}>
                          {tpl.isCustom ? 'Desde cero' : `${tpl.itemCount} partidas`}
                        </Text>
                      </View>
                      {!tpl.isCustom && (
                        <View
                          style={[
                            styles.metaPill,
                            { backgroundColor: `${tpl.accentColor}18` },
                          ]}
                        >
                          <Text style={[styles.metaPillText, { color: tpl.accentColor, fontFamily: 'PlusJakartaSans-Bold' }]}>
                            ~{tpl.referencePrice} €
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </ThemedTouchable>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        /* =========================================================================
           VIEW 2: BUDGET DOCUMENT EDITOR (Zero-Clipping Guarantee)
           ========================================================================= */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: HORIZONTAL_PAD,
            paddingTop: 14,
            paddingBottom: insets.bottom + 90,
            gap: 14,
          }}
        >
          {/* Document Title Header Card */}
          <View
            style={[
              styles.cardBox,
              { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
            ]}
          >
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              TÍTULO
            </Text>
            <TextInput
              value={budgetTitle}
              onChangeText={setBudgetTitle}
              placeholder="Ej: Reforma de Baño Principal"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.budgetTitleInput,
                {
                  color: colors.textPrimary,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                  borderColor: colors.borderSubtle,
                },
              ]}
            />
          </View>

          {/* AI BENCHMARKING ACTION BAR */}
          <View
            style={[
              styles.benchmarkBar,
              {
                backgroundColor: isDark ? '#0F172A' : '#EFF6FF',
                borderColor: isDark ? '#1E293B' : '#BFDBFE',
              },
            ]}
          >
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="location" size={14} color="#0284C7" />
                <Text style={[styles.benchmarkProvince, { color: colors.textPrimary }]}>
                  {marketProvince}
                </Text>
                <View style={styles.badgeLive}>
                  <Text style={styles.badgeLiveText}>2026</Text>
                </View>
              </View>
              <Text numberOfLines={1} style={[styles.benchmarkDesc, { color: colors.textSecondary }]}>
                Precios ajustados a tu zona
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
                  <Ionicons name="sparkles" size={13} color="#FFFFFF" />
                  <Text style={styles.aiScrapeBtnText}>Precios IA</Text>
                </>
              )}
            </ThemedTouchable>
          </View>

          {/* TRADE TIP IF AVAILABLE */}
          {tradeTip ? (
            <View style={[styles.tipCard, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
              <Ionicons name="information-circle-outline" size={16} color="#0284C7" />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>{tradeTip}</Text>
            </View>
          ) : null}

          {/* PARTIDAS (LINE ITEMS) */}
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                PARTIDAS ({items.length})
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
                    {/* Row 1: Index + Concept Title + Delete */}
                    <View style={styles.itemTitleRow}>
                      <View
                        style={[
                          styles.itemIndexBadge,
                          { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' },
                        ]}
                      >
                        <Text style={[styles.itemIndexText, { color: colors.textSecondary }]}>
                          {index + 1}
                        </Text>
                      </View>

                      <TextInput
                        value={item.title}
                        onChangeText={(txt) => updateItemField(index, 'title', txt)}
                        placeholder="Descripción de la partida..."
                        placeholderTextColor={colors.textMuted}
                        style={[
                          styles.itemTitleInput,
                          {
                            color: colors.textPrimary,
                            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                            borderColor: colors.borderSubtle,
                          },
                        ]}
                      />

                      <ThemedTouchable
                        onPress={() => handleDeleteItem(index)}
                        haptic="light"
                        style={styles.deleteBtn}
                      >
                        <Ionicons name="trash-outline" size={17} color="#EF4444" />
                      </ThemedTouchable>
                    </View>

                    {/* Row 2: Cantidad + Unidad + Precio Unitario (€) + Botón IA */}
                    <View style={styles.itemMeasurementsRow}>
                      {/* Cantidad Input */}
                      <View style={styles.inputColQty}>
                        <Text style={[styles.colLabel, { color: colors.textMuted }]}>
                          CANT.
                        </Text>
                        <TextInput
                          value={String(item.quantity)}
                          onChangeText={(txt) => updateItemField(index, 'quantity', txt)}
                          keyboardType="decimal-pad"
                          selectTextOnFocus
                          style={[
                            styles.measureInput,
                            {
                              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                              borderColor: colors.borderSubtle,
                              color: colors.textPrimary,
                            },
                          ]}
                        />
                      </View>

                      {/* Unidad Selector Chip */}
                      <View style={styles.inputColUnit}>
                        <Text style={[styles.colLabel, { color: colors.textMuted }]}>
                          UNIDAD
                        </Text>
                        <ThemedTouchable
                          onPress={() => cycleUnit(index)}
                          haptic="selection"
                          style={[
                            styles.unitSelectorBtn,
                            {
                              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                              borderColor: colors.borderSubtle,
                            },
                          ]}
                        >
                          <Text style={[styles.unitSelectorText, { color: colors.textPrimary }]}>
                            {item.unit}
                          </Text>
                          <Ionicons name="swap-vertical" size={11} color={colors.textSecondary} />
                        </ThemedTouchable>
                      </View>

                      {/* Precio Unitario (€) Input */}
                      <View style={styles.inputColPrice}>
                        <Text style={[styles.colLabel, { color: colors.textMuted }]}>
                          PRECIO / UD
                        </Text>
                        <View
                          style={[
                            styles.priceInputWrapper,
                            {
                              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                              borderColor: colors.borderSubtle,
                            },
                          ]}
                        >
                          <TextInput
                            value={String(item.unitPrice)}
                            onChangeText={(txt) => updateItemField(index, 'unitPrice', txt)}
                            keyboardType="decimal-pad"
                            selectTextOnFocus
                            style={[
                              styles.priceInput,
                              { color: colors.textPrimary },
                            ]}
                          />
                          <Text style={[styles.priceCurrencySymbol, { color: colors.textSecondary }]}>
                            €
                          </Text>
                        </View>
                      </View>

                      {/* Botón IA Benchmark */}
                      <View style={styles.inputColAi}>
                        <Text style={[styles.colLabel, { color: '#0284C7' }]}>IA</Text>
                        <ThemedTouchable
                          onPress={() => handleAiBenchmarkItem(index)}
                          disabled={isBenchmarkingThis}
                          haptic="medium"
                          style={[
                            styles.singleAiBtn,
                            { backgroundColor: isDark ? 'rgba(2,132,199,0.18)' : '#E0F2FE' },
                          ]}
                        >
                          {isBenchmarkingThis ? (
                            <ActivityIndicator size="small" color="#0284C7" />
                          ) : (
                            <Ionicons name="sparkles" size={15} color="#0284C7" />
                          )}
                        </ThemedTouchable>
                      </View>
                    </View>

                    {/* Row 3: Breakdown + Subtotal */}
                    <View style={styles.itemFooterRow}>
                      <View
                        style={[
                          styles.ratioPill,
                          { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9' },
                        ]}
                      >
                        <Text style={[styles.ratioText, { color: colors.textSecondary }]}>
                          MO: {item.laborPercent ?? 65}% · Mat: {item.materialPercent ?? 35}%
                        </Text>
                      </View>
                      <View style={styles.subtotalGroup}>
                        <Text style={[styles.subtotalLabel, { color: colors.textMuted }]}>
                          Subtotal:
                        </Text>
                        <Text style={[styles.subtotalValue, { color: colors.textPrimary }]}>
                          {item.subtotal.toFixed(2)} €
                        </Text>
                      </View>
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
            <Text style={[styles.sectionLabel, { color: colors.textMuted, marginBottom: 2 }]}>
              RESUMEN FISCAL
            </Text>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Mano de obra:
              </Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                {totals.labor.toFixed(2)} €
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Materiales:
              </Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                {totals.material.toFixed(2)} €
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Base Imponible:
              </Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary, fontFamily: 'PlusJakartaSans-Bold' }]}>
                {totals.base.toFixed(2)} €
              </Text>
            </View>

            {/* IVA Selection Pills */}
            <View style={styles.vatSectionRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>IVA:</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[
                  { rate: 10 as const, label: '10%' },
                  { rate: 21 as const, label: '21%' },
                  { rate: 0 as const, label: '0%' },
                ].map((v) => (
                  <ThemedTouchable
                    key={v.rate}
                    onPress={() => setVatRate(v.rate)}
                    haptic="selection"
                    style={[
                      styles.vatPill,
                      {
                        backgroundColor:
                          vatRate === v.rate
                            ? colors.primary
                            : isDark
                              ? 'rgba(255,255,255,0.06)'
                              : '#F1F5F9',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.vatText,
                        { color: vatRate === v.rate ? '#FFFFFF' : colors.textPrimary },
                      ]}
                    >
                      {v.label}
                    </Text>
                  </ThemedTouchable>
                ))}
              </View>
            </View>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Cuota ({vatRate}%):
              </Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                {totals.vat.toFixed(2)} €
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

            {/* Total Highlight */}
            <View style={styles.totalRow}>
              <View>
                <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>
                  TOTAL
                </Text>
                <Text style={{ fontSize: 10.5, color: colors.textMuted }}>IVA incl.</Text>
              </View>
              <Text style={[styles.totalPrice, { color: colors.primary }]}>
                {totals.total.toFixed(2)} €
              </Text>
            </View>

            {/* Execution and Validity Inputs */}
            <View style={styles.paramsRow}>
              <View style={styles.paramBox}>
                <Text style={[styles.miniLabel, { color: colors.textMuted }]}>PLAZO (DÍAS)</Text>
                <TextInput
                  value={String(estimatedDays)}
                  onChangeText={(val) => setEstimatedDays(parseInt(val, 10) || 1)}
                  keyboardType="numeric"
                  style={[
                    styles.paramInput,
                    {
                      color: colors.textPrimary,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                />
              </View>

              <View style={styles.paramBox}>
                <Text style={[styles.miniLabel, { color: colors.textMuted }]}>VALIDEZ (DÍAS)</Text>
                <TextInput
                  value={String(validityDays)}
                  onChangeText={(val) => setValidityDays(parseInt(val, 10) || 1)}
                  keyboardType="numeric"
                  style={[
                    styles.paramInput,
                    {
                      color: colors.textPrimary,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* STICKY BOTTOM ACTION BAR (ONLY IN EDITOR MODE) */}
      {activeView === 'editor' && (
        <View
          style={[
            styles.bottomStickyBar,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.borderSubtle,
              paddingBottom: Math.max(insets.bottom + 8, 16),
            },
          ]}
        >
          <ThemedTouchable
            onPress={handleShareQuote}
            haptic="medium"
            style={[
              styles.actionBtnSecondary,
              { borderColor: colors.borderSubtle, backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
            ]}
          >
            <Ionicons name="share-outline" size={17} color={colors.textPrimary} />
            <Text style={[styles.actionBtnSecText, { color: colors.textPrimary }]}>Compartir</Text>
          </ThemedTouchable>

          <ThemedTouchable
            onPress={handleSaveBudget}
            haptic="light"
            style={[
              styles.actionBtnSecondary,
              { borderColor: colors.borderSubtle, backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
            ]}
          >
            <Ionicons name="bookmark-outline" size={17} color={colors.textPrimary} />
            <Text style={[styles.actionBtnSecText, { color: colors.textPrimary }]}>Guardar</Text>
          </ThemedTouchable>

          {Boolean(params.requestId) ? (
            <View style={{ flexDirection: 'row', gap: 6, flex: 1.4 }}>
              <ThemedTouchable
                onPress={handleExportPdf}
                disabled={isExportingPdf}
                haptic="medium"
                style={[
                  styles.actionBtnSecondary,
                  { borderColor: colors.borderSubtle, backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                ]}
              >
                {isExportingPdf ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="document-text-outline" size={17} color={colors.textPrimary} />
                    <Text style={[styles.actionBtnSecText, { color: colors.textPrimary }]}>PDF</Text>
                  </>
                )}
              </ThemedTouchable>

              <ThemedTouchable
                onPress={handleApplyToProposal}
                haptic="medium"
                style={[styles.actionBtnPrimary, { backgroundColor: colors.primary, flex: 1 }]}
              >
                <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
                <Text style={styles.actionBtnPriText}>Aplicar</Text>
              </ThemedTouchable>
            </View>
          ) : (
            <ThemedTouchable
              onPress={handleExportPdf}
              disabled={isExportingPdf}
              haptic="medium"
              style={[styles.actionBtnPrimary, { backgroundColor: colors.primary }]}
            >
              {isExportingPdf ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="document-text-outline" size={17} color="#FFFFFF" />
                  <Text style={styles.actionBtnPriText}>PDF</Text>
                </>
              )}
            </ThemedTouchable>
          )}

        </View>
      )}

      {/* Yewi Pro Modal (15,99 €/mes) */}
      <YewiProModal visible={showProModal} onClose={() => setShowProModal(false)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  /* BULLETPROOF SCREEN HEADER */
  screenHeader: {
    height: 54,
    paddingHorizontal: HORIZONTAL_PAD,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    boxSizing: 'content-box',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  headerTitleText: {
    fontSize: 16.5,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -0.3,
    textAlign: 'center',
  },

  /* PAYWALL BANNER */
  paywallBanner: {
    marginHorizontal: HORIZONTAL_PAD,
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paywallTitle: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  paywallDesc: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Regular',
    lineHeight: 14,
    marginTop: 1,
  },
  upgradeBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  upgradeBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Bold',
  },

  /* GALLERY STYLES */
  galleryHero: {
    marginBottom: 14,
  },
  galleryHeroTitle: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  galleryHeroDesc: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-Regular',
    lineHeight: 17,
  },
  galleryTabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14,
  },
  galleryTabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  galleryTabChipText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  galleryCardContainer: {
    width: CARD_GRID_WIDTH,
  },

  /* WORD / POWERPOINT PAPER SHEET */
  paperSheet: {
    width: '100%',
    height: 135,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  paperTopStrip: {
    height: 5,
    width: '100%',
  },
  paperHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  paperIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paperHeaderLines: {
    flex: 1,
    gap: 3,
  },
  dummyLineDark: {
    height: 4,
    borderRadius: 2,
  },
  dummyLineLight: {
    height: 3.5,
    borderRadius: 2,
  },
  dummyPriceDot: {
    width: 12,
    height: 3.5,
    borderRadius: 2,
  },
  paperBodyRows: {
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 6,
  },
  dummyTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paperFooter: {
    position: 'absolute',
    bottom: 6,
    right: 8,
  },
  paperTotalHighlight: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paperTotalText: {
    fontSize: 9.5,
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },
  blankPaperInner: {
    flex: 1,
    margin: 6,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  blankPlusCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blankPaperLabel: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans-Bold',
  },

  galleryCardMeta: {
    marginTop: 6,
    paddingHorizontal: 2,
  },
  galleryCardTitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -0.2,
  },
  galleryCardDesc: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Regular',
    marginTop: 1,
    lineHeight: 14,
  },
  galleryCardBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metaPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaPillText: {
    fontSize: 9.5,
    fontFamily: 'PlusJakartaSans-Medium',
  },

  /* EDITOR STYLES */
  cardBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  sectionLabel: {
    fontSize: 10.5,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  budgetTitleInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  benchmarkBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  benchmarkProvince: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  badgeLive: {
    backgroundColor: '#0284C720',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  badgeLiveText: {
    fontSize: 9.5,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#0284C7',
  },
  benchmarkDesc: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Regular',
    marginTop: 1,
  },
  aiScrapeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  aiScrapeBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
  },
  tipText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Regular',
    flex: 1,
    lineHeight: 15,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  addBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Bold',
  },

  /* PARTIDA ITEM CARD */
  itemCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemIndexBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIndexText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  itemTitleInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  deleteBtn: {
    padding: 4,
  },

  /* MEASUREMENTS ROW */
  itemMeasurementsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  inputColQty: {
    width: 60,
  },
  inputColUnit: {
    width: 58,
  },
  inputColPrice: {
    flex: 1,
    minWidth: 90,
  },
  inputColAi: {
    width: 40,
  },
  colLabel: {
    fontSize: 9,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  measureInput: {
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 6,
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
  },
  unitSelectorBtn: {
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 4,
  },
  unitSelectorText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  priceInputWrapper: {
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  priceInput: {
    flex: 1,
    height: 42,
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'right',
    paddingRight: 3,
  },
  priceCurrencySymbol: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  singleAiBtn: {
    height: 42,
    width: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  itemFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  ratioPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratioText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  subtotalGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  subtotalLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  subtotalValue: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },

  /* TOTALS CARD */
  totalsCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  summaryValue: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  vatSectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  vatPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  vatText: {
    fontSize: 10.5,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  divider: {
    height: 1,
    marginVertical: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 2,
  },
  totalLabel: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    letterSpacing: -0.2,
  },
  totalPrice: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    letterSpacing: -0.5,
  },
  paramsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  paramBox: {
    flex: 1,
  },
  miniLabel: {
    fontSize: 9.5,
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 3,
  },
  paramInput: {
    height: 38,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
  },

  /* BOTTOM STICKY BAR */
  bottomStickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: HORIZONTAL_PAD,
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 8,
  },
  actionBtnSecondary: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  actionBtnSecText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  actionBtnPrimary: {
    flex: 1.4,
    height: 44,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  actionBtnPriText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
  },
});
