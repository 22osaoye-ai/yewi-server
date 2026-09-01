# Reglas Frontend (React Native / Expo)

## 1. Componentes y Estructura
- No extraer un componente si solo se utiliza una vez y su extracción no mejora significativamente la legibilidad o modularidad.
- Mantener las pantallas organizadas bajo `apps/app/app/` siguiendo la estructura de Expo Router.
- Respetar `SafeAreaInsets` y `KeyboardAvoidingView` en formularios para evitar solapamientos con el teclado o el notch del dispositivo.

## 2. Gestión de Estado (Zustand vs Local)
- **Estado Global (`apps/app/store/`)**: Exclusivo para datos de sesión, usuario autenticado, tokens, temas y preferencias globales.
- **Estado Local (`useState`)**: Todo estado de navegación interna, pasos de formularios (stepper), visibilidad de modales y valores temporales de inputs debe ser estrictamente local.
- **Prohibido**: No usar `useEffect` para calcular lógica que puede derivarse directamente del estado o de las props.

## 3. Navegación y Expo Router
- Usar `router.push()`, `router.replace()` o `router.back()` según corresponda al flujo de navegación.
- Mantener la proyección y protección de rutas mediante `useAuthStore` y `ProtectedRoute`.
- Una vez completado el onboarding o perfil, utilizar `router.replace('/(tabs)')` para evitar que el botón atrás regrese a pantallas completadas.

## 4. Rendimiento y UX Móvil
- Reutilizar componentes base optimizados: `ThemedTouchable` (con soporte háptico `expo-haptics`), `AuthInput`, `CustomAlert`.
- Evitar re-renders masivos memorizando callbacks complejos solo cuando exista un problema medible de rendimiento.

## 5. Pro y Estado de Stripe
- El cliente no puede conceder ni inferir autorización Pro mediante roles, flags locales, OTP maestro, emails o payloads; solo debe reflejar la decisión del backend.
- No mostrar beneficios profesionales como disponibles sin una respuesta del backend basada en webhook Stripe firmado y suscripción verificable `ACTIVE` o `TRIALING`.
- Ante `payment_failed` o `canceled`, retirar inmediatamente la disponibilidad de Pro según el estado recibido del backend; no confiar en caché local persistente.

## 6. Estándar de Diseño y Pantallas de Detalle
- **Pantallas de Detalle Dedicadas**: Las vistas de detalle (solicitudes, leads, pedidos, perfiles, vouchers) deben implementarse como pantallas de navegación completas en Expo Router (`apps/app/app/request-detail.tsx`, `apps/app/app/detail.tsx`, etc.), **nunca como modales incrustados** en listas o templates.
- **Superficies y Adaptación de Tema**:
  - Prohibido el uso de bloques o fondos pastel chillones o saturados en tarjetas (`REQUEST_CARD_THEMES.bg`).
  - Las tarjetas deben usar estrictamente las superficies limpias del tema (`colors.surface`, `colors.border`, `isDark ? '#161922' : '#FFFFFF'`).
  - Tipografía oficial estricta: `Satoshi-Black` para títulos e importes, `Satoshi-Bold` para etiquetas, `Satoshi-Regular` / `Satoshi-Medium` para textos y metadatos.
  - Cero datos inventados o placeholders falsos (p. ej. "12€ créditos", tokens falsos o textos ficticios).

