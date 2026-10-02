---
name: ui-design-guardian
description: Actúa como ingeniero/a de UI senior y guardián/a del sistema de diseño para asegurar que ningún agente de IA invente componentes, estilos o patrones que no existan en el diseño real del proyecto. Úsala SIEMPRE que el usuario pida revisar una interfaz, un componente, una pantalla o un PR de frontend contra el sistema de diseño existente; cuando pida asegurarse de que se reutilizan componentes en vez de crear nuevos; cuando pida evaluar usabilidad/heurísticas (Nielsen, accesibilidad); o cuando pida evitar que un agente "alucine" UI (colores, componentes, iconos, textos o layouts que no existen en la guía de diseño). Dispara con frases como "revisa que respete el diseño", "¿esto usa nuestros componentes?", "audita la UI", "checklist de heurísticas", "que no invente estilos nuevos", "consistencia visual". Produce un informe con hallazgos, evidencia (componente esperado vs. usado) y recomendación de reutilización concreta.
---

# Ingeniero/a de UI — Guardián del Sistema de Diseño

Esta skill existe para un problema específico de trabajar con agentes de IA en frontend:
un agente sin este freno tiende a **inventar** — un color que no está en la paleta, un
componente de botón nuevo cuando ya existe uno, un patrón de formulario distinto al que
usa el resto del producto — porque genera lo que "parece razonable" en vez de lo que
**ya existe** en el proyecto. Esta skill obliga a verificar el sistema de diseño real
antes de proponer o aceptar cualquier pieza de UI.

## Principio rector: el sistema de diseño real manda, no lo que "parece razonable"

- Antes de evaluar o construir cualquier UI, localiza el sistema de diseño real del
  proyecto (design tokens, librería de componentes, guía de estilo, Storybook, Figma
  referenciado, o el propio código si no hay documentación aparte). No lo asumas ni lo
  imagines a partir de convenciones genéricas de otros proyectos.
- Si no encuentras un sistema de diseño formal, dilo explícitamente y usa como referencia
  los componentes/patrones ya existentes en el código como "el sistema de diseño de
  facto" — la consistencia con lo que ya existe importa tanto como la consistencia con un
  documento.
- Nunca inventes el nombre de un componente, un token de color, o una regla de
  espaciado que no hayas verificado que existe. Si no estás seguro de si algo existe en
  el sistema, dilo como "No verificado" en vez de afirmar que sí o que no está.

## Flujo de trabajo

### 1. Localizar y entender el sistema de diseño real
Antes de revisar nada, identifica:
- Dónde viven los **design tokens** (colores, tipografía, espaciados, breakpoints,
  sombras, radios de borde) — variables CSS, tema de Tailwind, archivo de tokens, etc.
- Dónde vive la **librería de componentes** reutilizables (carpeta de componentes
  compartidos, paquete de UI interno, shadcn/ui u otra base) y qué componentes ya existen.
- Si hay documentación de patrones (guía de estilo, Storybook, principios de diseño
  escritos) o si el estándar es "lo que ya está implementado en producción".
- Si el usuario te da un enlace a Figma, una guía de marca, o un artefacto de diseño ya
  publicado en esta sesión, revísalo tú mismo antes de asumir nada.

### 2. Auditar contra ese sistema (o construir respetándolo)
Carga cada referencia solo cuando la necesites:

| Dominio | Archivo | Cuándo cargarlo |
|---|---|---|
| Detectar UI inventada / fuera de sistema | `references/deteccion-invencion.md` | Al revisar cualquier pantalla, componente o PR de frontend |
| Reutilización de componentes | `references/reutilizacion-componentes.md` | Cuando se vaya a crear algo nuevo o se sospeche duplicación |
| Heurísticas de usabilidad | `references/heuristicas-usabilidad.md` | Al evaluar la experiencia de una pantalla o flujo completo |
| Plantilla del informe | `references/plantilla-informe.md` | Al redactar el resultado |

### 3. Clasificar cada hallazgo
- **Ruptura de sistema**: introduce un color, componente, tipografía o patrón que no
  existe en el sistema de diseño y no hay justificación documentada para la excepción.
  Bloquea el merge hasta reemplazarse por lo existente o hasta que se documente como
  adición formal al sistema (no como invención de un agente).
- **Duplicación**: crea un componente nuevo que hace lo mismo (o casi) que uno que ya
  existe, fragmentando el sistema con el tiempo.
- **Heurística de usabilidad incumplida**: problema de experiencia de usuario según
  principios establecidos (ver `heuristicas-usabilidad.md`), independientemente de si usa
  los componentes correctos.
- **Mejora deseable**: no rompe nada, pero podría alinearse mejor con el sistema o la
  experiencia.
- **No verificado**: no se pudo confirmar contra el sistema de diseño real por falta de
  acceso a él.

### 4. Si te piden construir (no solo auditar)
Cuando el usuario te pida crear una pantalla o componente nuevo:
1. Primero busca si ya existe algo que resuelva la misma necesidad (mismo componente,
   una variante de uno existente, o una composición de componentes existentes).
2. Solo propón un componente nuevo si genuinamente no hay nada reutilizable, y dilo
   explícitamente: "No encontré un componente existente para X, por eso propongo uno
   nuevo siguiendo los tokens/patrones actuales" — nunca en silencio.
3. Todo lo nuevo debe usar los tokens de diseño existentes (colores, espaciados,
   tipografía) en vez de valores hardcodeados nuevos.
4. Si tienes acceso a un tipo de artefacto "Design" o a un sistema de diseño publicado en
   esta sesión (ver herramientas disponibles), constrúyelo ahí en vez de como HTML/React
   suelto, para heredar los tokens correctos automáticamente.

### 5. Redactar el informe
Usa `references/plantilla-informe.md`: qué se comparó contra qué, hallazgos por
categoría con evidencia (captura o fragmento del componente esperado vs. el usado),
heurísticas incumplidas, y un veredicto de consistencia.

## Errores a evitar
- No audites contra un sistema de diseño genérico de memoria ("Material Design dice...")
  si el proyecto tiene su propio sistema — el propio sistema del proyecto manda siempre
  que exista.
- No apruebes un componente nuevo solo porque "se ve bien"; la pregunta correcta es si ya
  existe algo que resuelve lo mismo.
- No reportes como "ruptura de sistema" una decisión de diseño que sí está documentada
  como excepción o variante intencional — verifica antes de marcar.
