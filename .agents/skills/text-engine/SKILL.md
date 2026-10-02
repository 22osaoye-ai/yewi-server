---
name: text-engine
description: Arquitectura y reglas para el motor tipográfico de capas de texto sobre fotos en React Native (fuentes, estilos de fondo, colores, contrastes y posicionamiento normalizado).
---

# SKILL: TEXT ENGINE (YEWI MOBILE)

## PROPÓSITO
Establecer las directrices de renderizado tipográfico dinámico sobre imágenes en la aplicación móvil Yewi, permitiendo textos interactivos, arrastrables, escalables y rotables con máxima legibilidad sobre cualquier fotografía.

---

## 1. PRESETS TIPOGRÁFICOS
El motor debe ofrecer un conjunto selecto de fuentes con soporte multiplataforma:

| ID | Etiqueta | iOS | Android |
| :--- | :--- | :--- | :--- |
| `modern` | **Moderno** | `Satoshi-Bold` | `Satoshi-Bold` |
| `serif` | **Elegante** | `Georgia` | `serif` |
| `mono` | **Máquina** | `Courier` | `monospace` |
| `script` | **Cursiva** | `Snell Roundhand` | `sans-serif` |
| `impact` | **Impacto** | `Impact` | `sans-serif-condensed` |

---

## 2. ESTILOS DE FONDO Y CONTRASTE VISUAL
Para asegurar que el texto sea legible independientemente del fondo de la fotografía, se admiten tres modos:

1. **`badge` (Fondo Oscuro)**:
   - Contenedor con esquinas redondeadas y fondo negro traslúcido (`rgba(0, 0, 0, 0.65)`).
   - Ideal para textos informativos o precios.
2. **`solid` (Fondo Sólido)**:
   - Contenedor con fondo del color primario seleccionado y tipografía en contraste invertido (`#000000` o `#FFFFFF`).
   - Borde blanco nítido (`borderWidth: 1.5, borderColor: '#FFFFFF'`).
3. **`transparent` (Sin Fondo)**:
   - Texto directo sobre la fotografía sin contenedor visual.
   - Requiere sombra proyectada de alto contraste (`textShadowColor: 'rgba(0, 0, 0, 0.85)', textShadowOffset: { width: 0, height: 1.5 }, textShadowRadius: 4`).

---

## 3. TRANSFORMACIONES Y NORMALIZACIÓN
* Las transformaciones interactivas (`translateX`, `translateY`, `scale`, `rotate`) se calculan en el UI thread con Reanimated y Gesture Handler.
* Al confirmarse el gesto o publicarse, las coordenadas deben persistirse como porcentajes normalizados:
  - `x`: `0.0` (extremo izquierdo) a `1.0` (extremo derecho).
  - `y`: `0.0` (extremo superior) a `1.0` (extremo inferior).
  - `scale`: número flotante entre `0.5` y `3.5`.
  - `rotation`: ángulo en grados de `0` a `360`.
* Esto garantiza que el visor [StatusViewerModal.tsx](file:///c:/Users/kali/Documents/Yewi/apps/app/components/chat/StatusViewerModal.tsx) pinte el texto exactamente en el mismo lugar físico de la imagen en cualquier pantalla de móvil o tablet.
