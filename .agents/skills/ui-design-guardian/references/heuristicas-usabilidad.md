# Heurísticas de Usabilidad

Basado en las 10 heurísticas de usabilidad de Jakob Nielsen, con accesibilidad como
extensión obligatoria (no opcional) de cada una. Evalúa la pantalla/flujo real, no en
abstracto — cada hallazgo debe apuntar a una pantalla, estado o interacción concreta.

## 1. Visibilidad del estado del sistema
¿El usuario siempre sabe qué está pasando? Carga, guardado, error, progreso de un
proceso de varios pasos. Ausencia de feedback tras una acción (clic sin respuesta visual)
es un incumplimiento común.

## 2. Correspondencia entre el sistema y el mundo real
¿El lenguaje, iconos y flujo usan términos y conceptos familiares para el usuario real
del producto, en vez de jerga interna o técnica?

## 3. Control y libertad del usuario
¿Hay forma de deshacer o cancelar una acción, especialmente las destructivas? ¿Salir de
un flujo (modal, wizard) sin perder todo el progreso sin aviso?

## 4. Consistencia y estándares
¿El mismo tipo de acción se presenta siempre igual en todo el producto (mismo lugar,
mismo estilo, mismo texto para conceptos equivalentes)? Esto conecta directo con
`deteccion-invencion.md` — inconsistencia de UI casi siempre viola esta heurística.

## 5. Prevención de errores
¿El diseño evita que el usuario cometa errores comunes (confirmaciones antes de acciones
irreversibles, validación en el momento antes de enviar, restricciones de formato claras
antes de que falle el envío) en vez de solo mostrar el error después?

## 6. Reconocer antes que recordar
¿La información y opciones necesarias están visibles cuando se necesitan, en vez de
exigir que el usuario recuerde algo de una pantalla anterior?

## 7. Flexibilidad y eficiencia de uso
¿Hay atajos o formas más rápidas para usuarios frecuentes/expertos, sin complicar la
experiencia para usuarios nuevos?

## 8. Diseño estético y minimalista
¿Cada elemento en pantalla tiene un propósito claro, o hay ruido visual/información
irrelevante que compite por la atención con lo importante?

## 9. Ayudar a reconocer, diagnosticar y recuperarse de errores
¿Los mensajes de error son claros, en lenguaje humano (no un código de error crudo), y
dicen qué hacer para resolverlo — no solo que "algo salió mal"?

## 10. Ayuda y documentación
Si la tarea lo amerita, ¿hay ayuda contextual accesible sin sacar al usuario del flujo?
(No todo producto la necesita — solo marca esto si la ausencia realmente perjudica al
usuario en una tarea compleja.)

## Accesibilidad (extensión obligatoria, no un ítem aparte)
Para cada heurística de arriba, considera también:
- **Navegación por teclado**: ¿todo elemento interactivo es alcanzable y operable sin
  mouse, en un orden de tabulación lógico?
- **Lectores de pantalla**: ¿elementos interactivos tienen texto accesible (labels, `alt`,
  `aria-label` donde el texto visible no basta)? ¿estados (error, cargando, seleccionado)
  se anuncian, no solo se muestran visualmente?
- **Contraste**: ¿texto y elementos interactivos cumplen contraste mínimo legible (no
  solo "se ve bien" en la pantalla del desarrollador)?
- **No depender solo del color**: ¿los estados (error, éxito, requerido) se comunican
  también con texto/ícono, no solo con un cambio de color?
- **Tamaño de objetivo táctil**: ¿elementos interactivos en móvil tienen tamaño suficiente
  para tocarse con precisión?

## Cómo reportar
Para cada incumplimiento: qué heurística, en qué pantalla/estado concreto, qué pasa hoy,
y qué debería pasar en su lugar — evita heurísticas genéricas sin ejemplo concreto de la
pantalla real.
