---
name: code-review
description: Detección rigurosa y priorizada de problemas reales, bugs funcionales, regresiones y riesgos antes de integrar cambios de código.
---

# SKILL: CODE REVIEW

## PROPÓSITO

Detectar problemas reales antes de integrar cambios.

No utilizar el code review para imponer preferencias personales.

---

# PRIORIDADES

## P0 — CRÍTICO

* vulnerabilidad
* pérdida o corrupción de datos
* caída del sistema
* acceso no autorizado

## P1 — ALTO

* bug funcional
* comportamiento incorrecto
* regresión probable

## P2 — MEDIO

* deuda técnica relevante
* diseño que dificulta mantenimiento inmediato
* inconsistencia importante

## P3 — BAJO

* mejora menor
* legibilidad
* simplificación no crítica

---

# PROCESO

## 1. Comprender el objetivo

Antes de revisar:

* qué intentaba resolver el cambio
* qué comportamiento debía modificarse
* qué archivos fueron afectados

---

## 2. Revisar corrección

Buscar:

* condiciones incorrectas
* errores de flujo
* estados no manejados
* errores de tipos
* contratos rotos

---

## 3. Revisar regresiones

Buscar:

* consumidores afectados
* cambios incompatibles
* efectos secundarios

---

## 4. Revisar complejidad

Buscar:

* duplicación
* responsabilidades mezcladas
* abstracciones innecesarias
* dependencias nuevas injustificadas

---

# REGLA

No reportes como bug:

* preferencias personales
* diferencias estilísticas sin impacto
* alternativas equivalentes

Distingue:

* **BUG**: Comportamiento incorrecto.
* **RISK**: Problema potencial bajo una condición identificable.
* **DEBT**: Coste técnico concreto introducido.
* **STYLE**: Preferencia de implementación.

---

# SALIDA

Cada observación debe incluir:

* prioridad (P0, P1, P2, P3)
* ubicación exacta (`archivo:línea`)
* problema concreto
* impacto medible
* condición necesaria para que ocurra

No generes observaciones vagas.

---

# FINALIZACIÓN

El review termina cuando:

* los cambios críticos han sido evaluados
* los contratos afectados han sido revisados
* no quedan observaciones relevantes sin reportar
