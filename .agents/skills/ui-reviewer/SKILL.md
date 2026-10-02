---
name: ui-reviewer
description: Auditoría rigurosa de calidad visual, haptics, accesibilidad, respeto de tokens y conformidad de diseño en interfaces móviles React Native de Yewi.
---

# SKILL: UI REVIEWER (YEWI MOBILE)

## PROPÓSITO
Evaluar y auditar componentes y pantallas móviles en React Native y Expo para asegurar que cumplan con los estándares de diseño de Yewi: interfaz viva, respuesta háptica precisa, cero datos inventados y fidelidad absoluta a las especificaciones del usuario.

---

## 1. AUDITORÍA DE ALCANCE Y FIDELIDAD
* **Cero Elementos Inventados**: Prohibido agregar botones o controles ficticios (ej. música, audio, collages) no solicitados expresamente por el usuario.
* **Simplicidad y Foco**: Menos es más. Si una pantalla es para Foto + Texto, la barra debe ofrecer únicamente Foto y Texto.
* **Eliminación de Redundancias**: Si ya existe una acción directa visible en cabecera o barra, no duplicar botones redundantes ("Ver todas") que ensucien el layout.

---

## 2. RESPUESTA HÁPTICA (`expo-haptics`)
Toda acción relevante debe proporcionar retroalimentación táctil:
* **Selección / Toque simple**: `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`.
* **Publicación / Envío / Confirmación**: `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)`.
* **Deshacer / Eliminar**: `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)`.

---

## 3. ESTABILIDAD DE RENDER Y REGLAS DE HOOKS
* **Incondicionalidad de Hooks**: Ningún hook (`useMemo`, `useCallback`, `useEffect`, `useRef`, `useState`) puede ejecutarse después de un `if (...) return null;` o dentro de bucles/condiciones.
* **Safe Areas**: Toda barra superior e inferior debe calcular márgenes seguros dinámicos mediante `useSafeAreaInsets()`.
* **Accesibilidad**: Todos los componentes interactivos deben incluir `accessibilityRole="button"` y `accessibilityLabel` descriptivo en español.
