# Guía de Estilo y Sistema de Diseño Yewi (Estilo Dribbble)

> **Inspiración y Enfoque:** Minimalism & Swiss Style, Flat Design de alta precisión y micro-interacciones sutiles (Skill `ui-ux-pro-max`).

---

## 1. Principios Fundamentales de Diseño

### 1.1. Estructura y Jerarquía Espacial
- **Respiro visual (Whitespace generoso):** Los elementos clave de navegación y cabecera nunca están apretados. Separación horizontal mínima de `16px` a `24px` en márgenes.
- **Distribución en 3 zonas (Layout de 3 columnas):**
  1. **Identidad (Izquierda):** Logotipo con personalidad tipográfica distintiva.
  2. **Navegación / Filtros (Centro):** Disparadores con chevrons discretos (`12-14px`) y etiquetas directas.
  3. **Cluster de Acciones (Derecha):** Botón píldora contorneado (*Pill Outline CTA*), accesos rápidos de trazo fino (chat, notificaciones) y avatar con indicador de presencia online.
- **Separación sutil (Hairline Borders):** Sin sombras oscuras pesadas. Los contenedores flotan con un borde tenue de `1px` (`#E5E7EB` en claro, `#24242A` en oscuro) o elevación muy suave (`rgba(0,0,0,0.04)`).

---

## 2. Iconografía (Monoline Icons)

| Propiedad | Especificación | Justificación |
| :--- | :--- | :--- |
| **Estilo** | Monoline / Outline (Ionicons `*-outline` o SVG custom) | Máxima legibilidad, limpieza visual, sin saturar la pantalla con manchas negras |
| **Grosor de trazo** | `1.5px` - `1.8px` | Equilibrio perfecto con el grosor tipográfico |
| **Tamaño estándar** | `18px` a `20px` (acciones) / `12px` a `14px` (chevrons) | Proporción óptica equilibrada con textos de 13-14px |
| **Contenedor táctil** | `40×40px` o `44×44px` circular | Cumplimiento estricto de WCAG 2.2 para áreas táctiles mínimas |
| **Feedback** | Háptica ligera (`light` / `selection`) y opacidad suave al pulsar (`0.75`) | Sensación de respuesta táctil inmediata y precisa |

---

## 3. Microcopy y Redacción ("Preciso y Breve, Cero Fricción")

> **Regla de Oro:** Si un botón o etiqueta puede decirse en 1 o 2 palabras, nunca uses 5. La interfaz no debe explicar lo obvio.

### Ejemplos de Transformación:
- ❌ *"Haga clic aquí para comenzar un nuevo encargo"* → ✅ **"Publicar"** o **"Nuevo encargo"**
- ❌ *"Bandeja de mensajes directos recibidos"* → ✅ **"Mensajes"**
- ❌ *"Explora todas las categorías y oficios"* → ✅ **"Explorar"**
- ❌ *"Gestionar mis solicitudes de servicio"* → ✅ **"Solicitudes"**
- ❌ *"Buscar profesionales y autónomos en tu zona"* → ✅ **"Buscar profesional..."**

---

## 4. Tipografía y Jerarquía

- **Familia principal:** `Satoshi-Black` (títulos y marcas), `Satoshi-Bold` (botones, badges, navegación), `Satoshi-Medium` (etiquetas de soporte).
- **Tracking (Letter Spacing):**
  - Títulos principales (24-30px): `letterSpacing: -0.8` a `-0.5`
  - Navegación y botones (13-15px): `letterSpacing: -0.2` a `-0.3`
  - Subtítulos y microcopy (11-12px): `letterSpacing: -0.1`

---

## 5. Paleta de Color y Superficies

| Token | Modo Claro (Light) | Modo Oscuro (Dark) | Uso Principal |
| :--- | :--- | :--- | :--- |
| `background` | `#FFFFFF` | `#0E1015` | Fondo luminoso y limpio de cabecera y pantalla |
| `surfaceAlt` | `#F8FAFC` / `#F4F4F6` | `#181A20` | Fondos de botones de icono y chips inactivos |
| `borderHairline`| `#E5E7EB` | `#22242A` | Bordes ultrafinos de botones píldora y divisores |
| `textPrimary` | `#0D0C22` / `#18181B` | `#F8FAFC` | Texto principal con contraste nítido y elegante |
| `textSecondary`| `#64748B` / `#71717A` | `#94A3B8` | Etiquetas secundarias y chevrons |
| `brandAccent` | `#C87D20` / `#D98E28` | `#E0942F` | Punto de acento y dot distintivo de marca Yewi |
| `statusOnline` | `#10B981` (Esmeralda) | `#10B981` | Dot indicador de presencia online |
