# Reglas de Base de Datos y Prisma ORM

## 1. Schema (`apps/backend/prisma/schema.prisma`)
- El esquema de Prisma es la fuente única de verdad para la estructura de la base de datos PostgreSQL.
- Todo cambio en el esquema debe ser coherente con los tipos en TypeScript y los DTOs de NestJS.
- Mantener las relaciones y restricciones de integridad referencial (`@relation`, `onDelete: Cascade` o `SetNull` según corresponda).

## 2. Sincronización y Migraciones
- Para desarrollo y sincronización de base de datos: `pnpm prisma db push` desde `apps/backend`.
- Tras modificar el esquema, verificar la generación correcta de `@prisma/client`.

## 3. Consultas y Transacciones
- Usar `this.prisma.<model>.<method>` con tipado estricto.
- **Operaciones Críticas (Billetera / Pagos / Desbloqueo de Leads)**:
  - Deben ejecutarse dentro de transacciones atómicas `this.prisma.$transaction(async (tx) => { ... })`.
  - Asegurar consistencia y evitar condiciones de carrera (*race conditions*) en saldos y balances.
- **Prohibido**: Consultas en bucles (`N+1`). Usar `include` y `select` para cargar relaciones en una sola consulta.

## 4. Estado de Suscripción Pro
- El estado persistido de suscripción debe derivar de webhooks de Stripe con firma validada y conservar la evidencia necesaria para verificar `ACTIVE` o `TRIALING`.
- Los eventos `payment_failed` y `canceled` deben dejar el acceso Pro revocado de forma transaccional y no permitir que flags derivados o datos locales lo reactiven.
