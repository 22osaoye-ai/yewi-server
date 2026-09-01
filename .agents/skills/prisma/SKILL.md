---
name: prisma
description: Directrices para modificación del schema de Prisma, transacciones atómicas, consultas eficientes y migraciones de base de datos seguras.
---

# SKILL: PRISMA

## PROPÓSITO

Modificar persistencia y acceso a datos de forma correcta, eficiente y coherente con el modelo relacional.

---

# ANTES DE MODIFICAR EL SCHEMA

Inspeccionar:

* modelos relacionados en `apps/backend/prisma/schema.prisma`
* relaciones existentes (`@relation`)
* índices (`@@index`) y claves únicas (`@unique`, `@@unique`)
* constraints y cascades (`onDelete`)
* migraciones previas
* consultas afectadas

No modificar el schema únicamente para acomodar una implementación temporal.

---

# CAMBIOS DE MODELO

Antes de añadir un campo o relación:

* determinar si representa un concepto real del dominio
* revisar impacto en datos existentes
* revisar `nullable` vs `required` (campos obligatorios en tablas con datos requieren default o migración en dos fases)
* revisar cardinalidad (1:1, 1:N, N:M)
* revisar constraints y nombres de columnas

---

# CONSULTAS

Seleccionar únicamente los datos necesarios (`select`, `include` acotados).

Evitar:

* cargar relaciones innecesarias profundamente anidadas
* múltiples consultas secuenciales evitables (problema N+1)
* lógica de filtrado o agregación innecesariamente trasladada a memoria cuando la base de datos puede resolverla

No optimizar consultas sin evidencia cuando no existe un problema real.

---

# TRANSACCIONES

Utilizar transacciones interactivas (`this.prisma.$transaction(async (tx) => { ... })`) cuando múltiples operaciones deban ser atómicas para preservar la consistencia.

No envolver automáticamente todas las operaciones en transacciones si son lecturas simples o escrituras atómicas únicas.

---

# MIGRACIONES

Una modificación de schema debe considerar:

* compatibilidad con datos existentes
* migración necesaria (`prisma migrate dev` / `prisma db push`)
* impacto en producción
* datos obligatorios nuevos

---

# FINALIZACIÓN

Verificar:

* [ ] Schema válido (`npx prisma validate`).
* [ ] Relaciones y claves foráneas correctas.
* [ ] Consultas compatibles y tipadas con `@prisma/client`.
* [ ] Constraints apropiados.
* [ ] Impacto de migración evaluado y documentado.
