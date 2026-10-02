# Coordinación de Agentes y Prevención de Pérdida de Contexto

Usa esta guía cuando el proyecto involucra varios agentes de IA (subagentes, pipelines de
IA, orquestación tipo "agente planificador + agentes ejecutores") y el usuario quiere
evitar que un agente "pierda el hilo" de lo que se hizo antes o alucine sobre el estado
del sistema.

## Diagnóstico: señales de pérdida de contexto

- Un agente repite trabajo ya hecho por otro paso/agente anterior.
- Un agente "olvida" restricciones o decisiones acordadas en pasos previos (p. ej.
  vuelve a proponer una librería que ya se descartó).
- Un agente afirma el estado del sistema (qué archivos existen, qué pasó en el paso
  anterior) sin haberlo verificado, en vez de leer el estado real.
- Los resúmenes/handoffs entre agentes son vagos ("se hizo la parte de backend") en vez de
  concretos (qué archivos, qué decisiones, qué queda pendiente).
- No hay forma de auditar después qué hizo cada agente y por qué.

## Mecanismos recomendados (en orden de impacto)

### 1. Estado externo verificable, no memoria conversacional
El contexto compartido entre agentes no debería vivir solo en el historial de mensajes.
Recomienda (o verifica que exista) un artefacto persistente y legible por cualquier
agente en cualquier momento:
- Un archivo de estado del proyecto (p. ej. `PROGRESS.md`, `STATE.json`, un board de
  tareas) que se actualiza en cada paso con: qué se hizo, qué decisiones se tomaron y por
  qué, qué queda pendiente, qué está bloqueado.
- Decisiones de arquitectura relevantes documentadas como ADRs breves (decisión,
  contexto, alternativas descartadas) en vez de solo mencionadas de pasada en un chat.

### 2. Handoffs explícitos entre agentes
Cuando un agente termina su parte y otro continúa, el handoff debe incluir, como mínimo:
- Qué se le pidió hacer y qué hizo realmente (pueden diferir).
- Archivos/módulos tocados, con ruta exacta.
- Supuestos que tomó que el siguiente agente debería validar en vez de dar por ciertos.
- Qué quedó explícitamente fuera de alcance o sin resolver.

Evita handoffs tipo "todo listo, sigue tú" sin ese detalle — es la causa más común de que
el siguiente agente reconstruya (mal) contexto por su cuenta.

### 3. Verificación en vez de confianza ciega
Cada agente que retoma trabajo debería verificar el estado real (leer el código/archivo
actual) antes de actuar sobre lo que "cree" que se hizo, especialmente si pasó tiempo o
pasos intermedios desde que se generó ese contexto. Esto es la misma disciplina de
`integridad-datos-alucinaciones.md` aplicada a la coordinación: no asumir, verificar.

### 4. Chequeos de coherencia entre agentes (cross-check)
Para decisiones de alto impacto (esquema de datos, contrato de API, decisiones de
seguridad), que un segundo agente o el propio usuario valide el resultado del primero
antes de continuar, en vez de encadenar pasos sin revisión.

### 5. Alcance acotado por agente/paso
Agentes con una tarea acotada y bien definida pierden menos contexto que agentes con un
mandato amplio y abierto ("mejora el proyecto"). Si el diseño actual tiene agentes con
alcance muy amplio, recomienda dividir en pasos con entrada/salida clara.

### 6. Checkpoints recuperables
Si el pipeline es largo, debe poder retomarse desde un checkpoint (el `STATE.json` /
board de tareas del punto 1) sin tener que rehacer desde cero ni depender de que el
historial de conversación completo siga disponible.

## Qué entregar

- Si te piden **auditar** un pipeline de agentes existente: identifica en cuál de estos
  6 mecanismos falla o falta, con ejemplos concretos de dónde en el flujo se perdería
  contexto, y qué agregar.
- Si te piden **diseñar** la coordinación desde cero: propone un flujo concreto (qué
  agente hace qué, qué formato tiene el estado compartido, cómo son los handoffs) usando
  estos 6 mecanismos como base, adaptado a la escala real del proyecto — no todo proyecto
  necesita los 6 con máximo rigor.
