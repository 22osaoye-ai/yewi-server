# Detección de UI Inventada (Alucinaciones de Diseño)

Un agente de IA que genera UI sin este freno tiende a "rellenar" con lo que le parece
razonable en vez de verificar qué existe. Esta checklist ayuda a detectarlo con evidencia,
no por intuición.

## 1. Colores
- ¿Todos los colores usados (fondo, texto, bordes, estados) provienen de los design
  tokens/paleta definida, o hay valores hex/rgb sueltos que no están en la paleta?
- ¿Los estados (hover, active, disabled, error, éxito, advertencia) usan los colores
  semánticos ya definidos para esos estados, o el agente inventó un tono nuevo "parecido"?
- Un color "casi igual" pero no exacto al token existente (p. ej. `#2563EB` en vez del
  `--color-primary` definido como `#2563EB` o similar) suele ser señal de que se escribió
  a mano en vez de reutilizar el token — verifica si referencia la variable/token o si
  hardcodeó un valor.

## 2. Tipografía
- ¿Las fuentes, tamaños, pesos y alturas de línea usados corresponden a la escala
  tipográfica definida, o aparecen tamaños "sueltos" (p. ej. `font-size: 15px` cuando la
  escala solo define 14/16/18/24)?
- ¿Se usa la familia tipográfica del sistema, o el agente introdujo una fuente distinta
  (incluida una fuente del sistema por defecto del navegador cuando el proyecto define
  una propia)?

## 3. Espaciado y layout
- ¿Los márgenes/paddings siguen la escala de espaciado definida (p. ej. múltiplos de 4u/8u)
  o hay valores arbitrarios?
- ¿Los breakpoints de responsive coinciden con los definidos en el sistema, o el agente
  inventó uno nuevo para "que quede bien" en su prueba?

## 4. Componentes
- ¿Cada elemento interactivo (botón, input, modal, tarjeta, tabla, navegación) usa el
  componente compartido existente, o el agente escribió un botón/input desde cero con
  HTML y estilos propios que "se parece" al oficial pero no lo es?
  Señal de alerta clásica: un botón nuevo que casi replica visualmente al componente
  `Button` existente pero no lo importa — esto es exactamente el tipo de invención que
  esta skill busca atajar, porque diverge silenciosamente con el tiempo (el original se
  actualiza, la copia no).
- ¿Las variantes usadas (tamaño, color, estado) del componente son variantes que el
  componente realmente soporta, o el agente le pasó props/clases que no existen en su
  definición?
- ¿Iconos usados vienen del set de iconos del proyecto, o se introdujo un icono de otra
  librería/estilo que no combina?

## 5. Copy y microcopy
- ¿Textos de botones, mensajes de error/éxito y estados vacíos siguen el tono y
  convenciones ya usadas en el resto del producto, o el agente inventó una redacción
  distinta para casos ya cubiertos en otro lado (p. ej. otro texto para "no se pudo
  guardar" que ya existe en otra pantalla)?

## 6. Patrones de interacción
- ¿El flujo (cómo se abre un modal, cómo se confirma una acción destructiva, cómo se
  muestra un error de validación) sigue el patrón ya usado en el resto del producto, o el
  agente inventó una forma nueva para ese mismo problema ya resuelto en otro lugar?

## Cómo verificar (no asumir)
1. Para cada elemento de UI relevante, busca el componente/token equivalente en el
   sistema de diseño real (carpeta de componentes, archivo de tokens, Storybook).
2. Si lo encuentras y el código no lo usa (lo reimplementa a mano), es una ruptura de
   sistema — cita ambos: el componente/token que debería usarse y el código que lo evita.
3. Si no encuentras un equivalente tras buscar, no asumas que "seguro no existe" ni que
   "seguro está bien inventarlo" — repórtalo como "No encontré un componente/token
   equivalente; verificar si existe en [ubicación no revisada] antes de aceptar esto como
   elemento nuevo legítimo".
