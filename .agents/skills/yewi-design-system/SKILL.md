---
name: yewi-design-system
description: Sistema oficial de diseño UI/UX de Yewi Pro. Define la arquitectura multicapa (NativeWind + @expo/ui + Reanimated + Skia + Lucide + FlashList), la jerarquía de responsabilidades de agentes, los tokens oscuros de alta gama (#0B0F0F, acento turquesa #24D5C4), componentes base y directrices anti-caos.
---

# SISTEMA DE DISEÑO YEWI PRO — DARK LUXURY & HIGH-DENSITY UI

## 1. Filosofía y Dirección Estética

Yewi Pro opera bajo un lenguaje visual **Dark-First, High-Precision & Technical Luxury**:
- **Superficies oscuras calibradas**: Fondos profundos sin negros planos lavados (`#0B0F0F`, `#121818`, `#171E1E`).
- **Acento Distintivo Turquesa/Cian**: `#24D5C4` (y su brillo difuso `rgba(36, 213, 196, 0.15)`).
- **Contención y Elegancia**: Bordes translúcidos de baja opacidad (`border-white/10`), radios amplios (`rounded-3xl` / `24-28px`), sombras contenidas y tarjetas compactas de alta densidad informacional.
- **Zero-Overflow**: Textos, títulos y píldoras ultra-concisos (máximo 1 o 2 palabras). Áreas táctiles mínimas 44×44px y homogeneidad estricta de iconos de cabecera a 22px.

---

## 2. Matriz de Responsabilidades del Stack Móvil

Para evitar la fragmentación visual o que múltiples librerías compitan entre sí, todo agente debe ceñirse a esta división estricta:

| Herramienta | Responsabilidad Única | Prohibiciones |
| :--- | :--- | :--- |
| **`@expo/ui`** | **Primitivas Nativas**: DatePicker, Switch, Slider, Picker, Menús contextuales, SegmentedControl y BottomSheet nativo básico. | ❌ NO usarlo para diseñar tarjetas completas o pantallas enteras. |
| **`NativeWind v5 / Tailwind v4`** | **Visual Styling & Utility Layout**: Espaciado, flexbox, clases de borde, redondeos y layout responsive. | ❌ NO meter estilos ad-hoc con colores hexadecimales arbitrarios. |
| **`Design System (src/design-system/)`** | **Identidad de Producto**: Design Tokens autoritativos, Primitivas de marca (`Surface`, `AppCard`, `AppButton`, `MetricCard`) y Patrones (`PriceComparison`, `QuoteSummary`). | ❌ Prohibido saltarse el Design System para inventar componentes únicos en pantallas. |
| **`react-native-reanimated`** | **Físicas y Cinemática**: Resortes (springs), transiciones numéricas escalonadas (850€ → 920€ → 1.020€), shared transitions, gestures continuos y micro-hápticos. | ❌ NO usar Reanimated para componentes estáticos sin interacción. |
| **`@shopify/react-native-skia`** | **Gráficos Custom y Efectos Vectoriales**: Gráficos de evolución de precios de materiales, sparklines, indicadores de margen y curvas de costes. | ❌ NO meter librerías de gráficos monolíticas externas. |
| **`lucide-react-native`** | **Iconografía Monoline**: `Package`, `Receipt`, `ChartNoAxesCombined`, `Search`, `Settings`, `Bell`, `Building2`, `Hammer`, `House`, `Calculator`, `Wallet`, `CircleDollarSign`. | ❌ Prohibido mezclar familias de iconos aleatorias en la misma vista. |
| **`@shopify/flash-list`** | **Colecciones de Gran Volumen**: Catálogo de productos, históricos de precios, listas de cotizaciones y partidas de presupuestos densas. | ❌ No forzarlo en listas fijas o listas triviales de 3 elementos donde `View` o `FlatList` es suficiente. |

---

## 3. Design Tokens Autoritativos

Cualquier componente o vista debe consumir estos tokens desde `@/design-system/tokens/`:

### 3.1 Colores (`colors.ts`)
```typescript
export const colors = {
  // Fondos y Superficies
  background: '#0B0F0F',
  surface: '#121818',
  surfaceElevated: '#171E1E',
  surfaceHighlight: '#1E2626',
  
  // Bordes y Divisores
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderMedium: 'rgba(255, 255, 255, 0.14)',
  borderFocus: '#24D5C4',
  
  // Tipografía
  textPrimary: '#F5F7F7',
  textSecondary: '#8F9B9B',
  textMuted: '#626D6D',
  
  // Acento de Marca (Turquesa Eléctrico)
  accent: '#24D5C4',
  accentSoft: 'rgba(36, 213, 196, 0.12)',
  accentGlow: 'rgba(36, 213, 196, 0.25)',
  
  // Estados Semánticos
  success: '#39D98A',
  successSoft: 'rgba(57, 217, 138, 0.12)',
  warning: '#E5B94E',
  warningSoft: 'rgba(229, 185, 78, 0.12)',
  danger: '#FF6B6B',
  dangerSoft: 'rgba(255, 107, 107, 0.12)',
  info: '#4FA3FF',
  infoSoft: 'rgba(79, 163, 255, 0.12)',
};
```

### 3.2 Radios (`radius.ts`)
```typescript
export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  '2xl': 26,
  '3xl': 32,
  full: 9999,
};
```

### 3.3 Tipografía
- **Familia Oficial**: `PlusJakartaSans-Regular`, `PlusJakartaSans-Medium`, `PlusJakartaSans-SemiBold`, `PlusJakartaSans-Bold`, `PlusJakartaSans-ExtraBold`.
- Prohibido Satoshi u otras fuentes no contempladas en las directrices.

---

## 4. Arquitectura de Archivos en `apps/app/src/design-system/` (o `@/design-system/`)

```text
design-system/
├── tokens/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   ├── radius.ts
│   ├── shadows.ts
│   └── motion.ts
├── primitives/
│   ├── Box.tsx
│   ├── Text.tsx
│   ├── Icon.tsx
│   └── Surface.tsx
├── components/
│   ├── AppButton.tsx
│   ├── AppCard.tsx
│   ├── MetricCard.tsx
│   ├── SearchInput.tsx
│   ├── PriceBadge.tsx
│   ├── SupplierBadge.tsx
│   ├── QuoteLine.tsx
│   ├── StatusBadge.tsx
│   └── Avatar.tsx
└── patterns/
    ├── DashboardHeader.tsx
    ├── BottomNavigation.tsx
    ├── PriceComparison.tsx
    ├── QuoteSummary.tsx
    └── SupplierComparison.tsx
```

---

## 5. Reglas de Implementación para Agentes

1. **Dark-First Inmutable**: El diseño se concibe y calibra para la experiencia oscura de alto rendimiento.
2. **Reutilización Estricta**: No crear un componente nuevo de tarjeta si existe `AppCard` o `MetricCard`.
3. **Animaciones con Intención**: Los cambios de números en métricas usan transiciones fluidas Reanimated. Las entradas en dashboards son escalonadas (staggered).
4. **Respeto a las Directrices Core**:
   - `ProjectCard` y `ProfessionalCard` no se modifican en el core de catálogo público.
   - En el entorno Pro de herramientas, presupuestos y dashboards se utilizan las primitivas y componentes del Design System Yewi Pro.
5. **Zero-Overflow**: Todo botón, pill, badge o tab debe tener un label de 1 o 2 palabras máximo.
