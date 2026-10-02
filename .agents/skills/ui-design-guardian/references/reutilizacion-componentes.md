# Reutilización de Componentes

## El orden correcto de decisión (en este orden, sin saltarse pasos)

1. **¿Ya existe un componente que hace exactamente esto?** Úsalo tal cual.
2. **¿Ya existe un componente que hace casi esto?** Extiéndelo con las props/variantes
   que ya soporta, o propone añadirle una variante nueva si el sistema lo permite —
   en vez de crear un componente paralelo.
3. **¿Se puede componer con componentes existentes?** Combina 2-3 componentes ya
   existentes en vez de escribir uno monolítico nuevo que reimplemente partes de cada
   uno.
4. **Solo si nada de lo anterior aplica**: proponer un componente nuevo — y hacerlo
   explícito ("esto es nuevo porque...") en vez de mezclarlo silenciosamente como si
   fuera parte del sistema existente.

## Señales de que se está duplicando en vez de reutilizar
- Un componente nuevo con casi el mismo markup/estilos que uno existente, pero con un
  nombre distinto (`PrimaryButton` nuevo cuando ya existe `Button` con variante
  `primary`).
- Lógica de formulario, validación o manejo de estado reimplementada desde cero cuando ya
  hay un patrón/hook compartido para eso en el proyecto.
- Un modal, tooltip, dropdown o cualquier "primitiva" de UI con su propia implementación
  de accesibilidad (focus trap, ARIA) en vez de usar el componente base compartido que ya
  lo resuelve — además de duplicar código, es fácil que la versión nueva sea menos
  accesible que la original.
- Nombres de archivo/componente muy similares a uno existente (`Card2`, `CardNew`,
  `CardCustom`) — casi siempre señal de que debió ser una variante del original.

## Cuándo SÍ está justificado crear algo nuevo
- La necesidad es genuinamente distinta (no una variante visual, sino un patrón de
  interacción distinto que ningún componente existente cubre).
- Se documenta como una adición intencional al sistema (no como un parche silencioso),
  idealmente siguiendo la misma convención de nomenclatura, tokens y accesibilidad que el
  resto del sistema.
- Si vas a proponerlo, dilo así de explícito en el informe o en la respuesta: qué
  necesidad cubre, por qué nada existente la cubre, y qué tokens/convenciones sigue para
  encajar con el resto.

## Al auditar un PR o cambio
Para cada elemento de UI nuevo en el cambio, responde: ¿en qué paso del orden de decisión
de arriba debería haber estado, y en cuál está realmente? Esa brecha es el hallazgo.
