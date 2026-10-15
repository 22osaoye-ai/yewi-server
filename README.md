# 🛠️ Yewi — Plataforma de Servicios y Profesionales para el Hogar

Ecosistema monorepo de **Yewi**, el marketplace de servicios para el hogar y profesionales de confianza en España (reformas, electricidad, fontanería, pintura, climatización, etc.).

---

## 🏗️ Arquitectura del Monorepo

Gestionado con **pnpm workspaces**:

```text
yewi/
├── apps/
│   ├── backend/        # API REST y WebSocket (NestJS 11 + Prisma ORM 7 + PostgreSQL + Redis)
│   └── app/            # App Móvil Multiplataforma (Expo SDK 54 + React Native 0.86)
├── .agents/            # Protocolos de Gobernanza, SSD, Skills y Arquitectura
├── design-system/      # Tokens y especificaciones de diseño
└── package.json        # Configuración de workspaces y scripts raíz
```

---

## 🛡️ ZONAS CRÍTICAS E INMUTABLES (LO QUE NUNCA SE DEBE VOLVER A TOCAR)

Esta sección documenta componentes y patrones que **ya funcionan correctamente y que bajo ninguna circunstancia deben alterarse**, ya que cualquier modificación rompe el despliegue en producción o el inicio de sesión de los usuarios.

### 1. Autenticación Google OAuth & Sincronización Clerk (`apps/app`)
* **`startSSOFlow` en `apps/app/app/auth/login.tsx`**:
  - **DEBE** utilizar `redirectUrl: AuthSession.makeRedirectUri({ path: 'sso-callback' })`. NO forzar `{ scheme: 'yewiapp' }` de manera rígida porque rompe la compatibilidad en Expo Go (donde el esquema del emulador es `exp://`). `makeRedirectUri` resuelve automáticamente tanto Expo Go como builds nativas de producción.
  - **DEBE** extraer el session ID considerando todas las posibles respuestas de Clerk:
    ```typescript
    const sessionId = res.createdSessionId ?? res.signIn?.createdSessionId ?? res.signUp?.createdSessionId;
    ```
  - **DEBE** navegar de forma inmediata (`router.replace('/(tabs)')`) tras `setActive`, sin esperar eventos asíncronos adicionales.
  - Si ocurre el error `session_already_exists` o `already signed`, **DEBE** sincronizar al usuario con `useAuthStore` y navegar a `/(tabs)` en lugar de terminar silenciosamente.
* **Guarda de sincronización en `apps/app/components/auth/ClerkAuthSync.tsx`**:
  - **PROHIBIDO** abortar la sincronización si `useAuthStore.getState().isAuthenticated` es `false`.
  - La comprobación `now - moduleLastSyncTime < 30000` solo debe ejecutarse cuando el usuario **ya esté autenticado** en el store global. Si no está autenticado, **siempre debe proceder a sincronizar**.
  - `getToken()` debe contar con un timeout protector (`Promise.race`) para evitar bloqueos indefinidos ante red lenta.
* **Pantalla de callback `apps/app/app/sso-callback.tsx`**:
  - Si `isSignedIn` es `true`, **DEBE** navegar a `/(tabs)`. Prohibido dejar la pantalla colgada en un `ActivityIndicator` infinito.

### 2. Dependencias Circulares e Inyección en NestJS (`apps/backend`)
* **Módulos `OrdersModule`, `PaymentsModule`, `WalletModule` y `LeadsModule`**:
  - Al existir dependencias circulares entre estos módulos (órdenes que procesan pagos y pagos que materializan o reembolsan órdenes):
    1. **Ambos módulos** deben usar `forwardRef()` en sus imports:
       ```typescript
       @Module({
         imports: [forwardRef(() => PaymentsModule)],
       })
       ```
    2. **Los servicios correspondientes** deben inyectar la dependencia con `@Inject(forwardRef(() => ...))`:
       ```typescript
       constructor(
         @Inject(forwardRef(() => PaymentsService))
         private readonly paymentsService: PaymentsService,
       ) {}
       ```
  - Omitir `forwardRef` en cualquiera de los dos lados provoca la excepción crítica **`UndefinedModuleException`** que impide el arranque del backend en Render / producción.

### 3. Esquema de Base de Datos y Enums Oficiales de Prisma (`schema.prisma`)
* **`OrderStatus`**:
  - Los únicos valores válidos del enum son: `PENDING_REQUIREMENTS`, `IN_PROGRESS`, `DELIVERED`, `REVISION_REQUESTED`, `COMPLETED`, `CANCELLED`, `DISPUTED`.
  - **PROHIBIDO** inventar estados como `IN_DELIVERY`. El trabajo en revisión se modela con `DELIVERED` y `REVISION_REQUESTED`.
* **`TransactionType`**:
  - Los valores válidos son: `CREDIT_PURCHASE`, `LEAD_UNLOCK`, `LEAD_REFUND`, `ORDER_PAYMENT`, `ESCROW_RELEASE`, `PLATFORM_FEE`, `PAYOUT_WITHDRAWAL`, `ORDER_REFUND`, `DEPOSIT`.
  - Si se utiliza un tipo de transacción en el código, **debe existir previamente en el `schema.prisma` y en el tipo enum de PostgreSQL**.
* **Relaciones reales en modelos**:
  - `Order` **NO** tiene una relación directa `ledgerTransactions`. Las transacciones contables en `LedgerTransaction` se asocian al pedido mediante el campo `referenceId: order.id`. Prohibido consultar `{ ledgerTransactions: { some: ... } }` dentro de `prisma.order`.

### 4. Modelo de Negocio e Integridad Transaccional
* **Custodia Escrow al 100% y Comisión del 15%**:
  - Al crearse un pedido desde presupuesto o gig, el estado de custodia inicial es estrictamente `EscrowStatus.HELD`.
  - La comisión de plataforma es del **15%** (`platformFee = round(price * 0.15)`) y el **85%** restante son los ingresos garantizados del profesional (`proEarnings`).
  - La liberación de fondos (`RELEASED_TO_PRO`) o reembolsos (`ORDER_REFUND`) debe ejecutarse exclusivamente en transacciones atómicas `prisma.$transaction`.

---

## 🚀 Comandos de Desarrollo

```bash
# Instalar dependencias en todo el monorepo
$ pnpm install

# Levantar backend en desarrollo (NestJS watch mode)
$ pnpm dev:backend

# Levantar app móvil (Expo Metro bundler)
$ pnpm dev:app

# Compilar backend para producción (Prisma generate + Nest build)
$ pnpm build

# Ejecutar tests del backend
$ pnpm test:backend
```

---

## 🔒 Reglas de Contribución para Agentes y Desarrolladores

1. **Cero Datos Ficticios**: Prohibido introducir mocks, tokens `pi_mock_...` o datos ficticios en flujos de producción.
2. **Cambio Mínimo y Quirúrgico**: Modificar únicamente los archivos estrictamente relacionados con el problema o tarea actual.
3. **Validación Pre-Push**: Todo cambio antes de hacer `git push` debe compilar limpiamente con `pnpm build` y pasar la suite de tests con `pnpm test:backend`.
