---
name: testing
description: Verificación de comportamiento crítico, casos límite y pruebas de regresión deterministas sin tests redundantes o sobrecargados.
---

# SKILL: TESTING

## PROPÓSITO

Verificar comportamiento relevante sin crear una cantidad innecesaria de tests.

---

# PRINCIPIO

No escribas tests para aumentar métricas.

Escribe tests para reducir incertidumbre.

---

# IDENTIFICAR QUÉ PROBAR

Prioridad:

1. comportamiento de negocio
2. bugs corregidos
3. casos límite relevantes
4. contratos públicos
5. integración crítica

No priorizar:

* getters triviales
* implementaciones internas irrelevantes
* detalles privados que pueden cambiar sin afectar comportamiento

---

# TEST DE REGRESIÓN

Cuando se corrige un bug:

Si es razonable y existe infraestructura:

1. crea o actualiza un test que reproduzca el bug
2. verifica que fallaría antes de la corrección
3. verifica el comportamiento correcto después

---

# REGLAS

Los tests deben:

* ser deterministas
* tener una razón clara para existir
* probar comportamiento
* evitar depender de detalles internos
* evitar duplicación innecesaria

No:

* mocks innecesarios
* snapshots gigantes sin valor
* tests idénticos con nombres diferentes
* tests que solo verifican que un mock fue llamado sin verificar comportamiento relevante

---

# FINALIZACIÓN

La verificación es suficiente cuando:

* el flujo modificado está cubierto según el riesgo
* los bugs corregidos tienen protección contra regresión cuando sea apropiado
* no se han creado tests redundantes
