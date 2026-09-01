---
name: debugging
description: Diagnóstico sistemático de errores, localización de causa raíz, formulación de hipótesis y corrección mínima sin parches superficiales.
---

# SKILL: DEBUGGING

## PROPÓSITO

Identificar la causa raíz real de un fallo y aplicar la corrección mínima y precisa sin ocultar errores ni introducir efectos secundarios.

---

# CUÁNDO ACTIVAR

Activar cuando:

* exista un error en tiempo de ejecución (runtime error)
* un test o build falle
* exista una discrepancia entre el comportamiento esperado y el real
* se detecte una regresión tras un cambio

---

# CUÁNDO NO ACTIVAR

No activar para:

* desarrollo de funcionalidades nuevas desde cero
* cambios cosméticos o estilísticos sin fallo funcional
* optimizaciones preventivas sin bug evidente

---

# PROTOCOLO

## 1. Comprender y Reproducir

Antes de tocar código:

* analiza el mensaje de error exacto y el stack trace completo
* identifica el archivo, función y línea precisa donde se origina la falla
* determina las condiciones de entrada necesarias para reproducir el problema

---

## 2. Aislar la Causa Raíz

* formula una hipótesis verificable sobre por qué ocurre el fallo
* inspecciona el flujo de datos: valores recibidos vs valores esperados
* no confundas el síntoma con la causa raíz (ej. `TypeError: Cannot read properties of undefined` suele indicar un fallo aguas arriba en la obtención o parseo de datos)

---

## 3. Diseñar la Corrección Mínima

* aplica el cambio mínimo necesario en el punto exacto de la causa raíz
* no reescribas código no afectado
* no añadas bloques `try/catch` vacíos o comprobaciones nulas que solo enmascaren el problema

---

## 4. Verificar

* valida que el caso que fallaba ahora funcione correctamente
* ejecuta la suite de tests existente para descartar regresiones
* añade un test o validación determinista si la infraestructura lo permite

---

# ANTI-PATRONES A EVITAR

* **Debugging por adivinanza**: Modificar líneas al azar esperando que compile o pase.
* **Parches superficiales / Swallow errors**: Silenciar excepciones con `catch (e) {}` sin gestionar el flujo.
* **Mocks o datos inventados**: Forzar un valor fijo para salir del paso en vez de resolver la fuente real de datos.
* **Sobre-refactorización**: Aprovechar el bug para cambiar la arquitectura completa del módulo.

---

# CHECKLIST DE FINALIZACIÓN

* [ ] La causa raíz está identificada y explicada con certeza.
* [ ] La corrección ataca la causa real, no solo el síntoma.
* [ ] No se ha alterado código ajeno al fallo.
* [ ] El sistema y los tests compilan y pasan sin regresiones.
