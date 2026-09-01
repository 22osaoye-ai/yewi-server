---
name: technical-debt
description: Prevención transversal de deuda técnica innecesaria, duplicación, sobreingeniería y contratos inconsistentes manteniendo el principio de cambio mínimo.
---

# SKILL: TECHNICAL DEBT PREVENTION

## PROPÓSITO

Resolver tareas sin introducir deuda técnica innecesaria.

La prevención de deuda técnica debe equilibrarse con el principio de cambio mínimo.

No se debe crear una arquitectura compleja para evitar una deuda hipotética.

---

# DEFINICIÓN OPERATIVA

Existe deuda técnica cuando una decisión actual introduce un coste futuro previsible y evitable.

Ejemplos:

* duplicación estructural de lógica
* responsabilidades mezcladas
* contratos inconsistentes
* dependencias innecesarias
* acoplamiento evitable
* código temporal convertido en permanente
* soluciones que rompen convenciones existentes
* APIs difíciles de evolucionar
* complejidad accidental

No considerar automáticamente deuda técnica:

* código simple
* soluciones directas
* una implementación pequeña
* duplicación mínima aislada
* decisiones correctas para el alcance actual

---

# CUÁNDO ACTIVAR

Activar cuando:

* se implemente una nueva funcionalidad
* se modifiquen contratos
* se introduzcan dependencias
* se creen nuevos módulos
* se duplique lógica existente
* se modifique arquitectura
* se realice un refactor
* se introduzca estado global
* se cambie persistencia o modelo de datos

---

# CUÁNDO NO ACTIVAR COMO PROCESO COMPLETO

No conviertas una corrección pequeña en una auditoría arquitectónica.

Para cambios locales pequeños:

1. comprueba duplicación
2. comprueba acoplamiento
3. comprueba consistencia
4. continúa

---

# PROTOCOLO

## PASO 1 — INSPECCIONAR

Antes de implementar:

* busca lógica similar
* identifica convenciones existentes
* identifica contratos relacionados
* busca mecanismos reutilizables

No copies código antes de comprobar si ya existe una solución adecuada.

---

## PASO 2 — EVALUAR LA DECISIÓN

Para cada cambio relevante pregunta:

### Responsabilidad

¿La responsabilidad pertenece realmente a este módulo?

### Duplicación

¿Estoy duplicando lógica existente?

### Acoplamiento

¿Este cambio crea una dependencia innecesaria?

### Contrato

¿Mantiene consistencia con las interfaces existentes?

### Evolución

¿La solución bloquea una evolución razonablemente previsible?

### Complejidad

¿La solución añade más complejidad de la que elimina?

---

# MATRIZ DE DECISIÓN

## Reutilizar código existente cuando:

* ya resuelve el problema
* pertenece al mismo dominio
* no fuerza un acoplamiento incorrecto

## Extraer una abstracción cuando:

* existe duplicación significativa
* existen múltiples casos reales
* la responsabilidad es independiente
* la abstracción simplifica el sistema

## NO extraer una abstracción cuando:

* solo existe una implementación
* solo existe un caso de uso
* la abstracción está basada en una posibilidad futura
* añade más conceptos que claridad

---

# DETECCIÓN DE DEUDA

Antes de finalizar, revisa:

## Duplicación

* ¿He copiado lógica?
* ¿Existe una abstracción ya disponible?
* ¿La duplicación es accidental o intencional?

## Responsabilidades

* ¿La unidad modificada hace algo que no le corresponde?
* ¿He mezclado UI, lógica de negocio y acceso a datos?

## Dependencias

* ¿He añadido una dependencia?
* ¿Podía resolverse con capacidades existentes?
* ¿La dependencia está justificada?

## Estado

* ¿He introducido estado global?
* ¿Ese estado realmente necesita ser compartido?

## Contratos

* ¿La API sigue siendo coherente?
* ¿Los nombres representan correctamente el dominio?

## Temporalidad

* ¿Existe código marcado mentalmente como temporal?
* ¿Se está introduciendo un workaround sin control?

Si existe un workaround necesario, debe ser:

* localizado
* explícito
* justificado
* fácil de eliminar

---

# DEUDA TÉCNICA VS SOBREINGENIERÍA

No intentes eliminar toda posible deuda futura.

Evita este razonamiento:

> "Puede que algún día existan 20 implementaciones, por eso crearé una Factory, Strategy y AbstractProvider."

Una necesidad futura hipotética no justifica complejidad actual.

La mejor prevención de deuda técnica es:

> **No introducir complejidad antes de que exista una necesidad concreta.**

---

# REGLA DE DOS DECISIONES

Cuando existan dos soluciones correctas, prefiere:

1. la que respete mejor el sistema existente
2. la que tenga menor coste de mantenimiento
3. la que introduzca menos conceptos
4. la que tenga menor acoplamiento innecesario
5. la que pueda modificarse fácilmente después

---

# CHECKLIST FINAL

Antes de terminar:

* [ ] No existe duplicación significativa accidental.
* [ ] Cada responsabilidad está en el lugar correcto.
* [ ] No se han añadido dependencias innecesarias.
* [ ] No existen abstracciones especulativas.
* [ ] Los contratos son consistentes.
* [ ] No se ha introducido estado global innecesario.
* [ ] No existe código temporal oculto.
* [ ] La solución es fácil de comprender.
* [ ] La complejidad introducida está justificada.

---

# CRITERIO DE FINALIZACIÓN

La skill termina cuando el cambio:

* resuelve el problema
* no introduce complejidad accidental
* respeta las responsabilidades existentes
* no crea deuda técnica evitable

No realices un refactor adicional salvo que sea necesario para evitar una deuda inmediata y concreta.
