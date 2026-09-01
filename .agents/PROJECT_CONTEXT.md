# PROJECT CONTEXT — Yewi Ecosystem

Este documento define la identidad, arquitectura técnica, límites y restricciones del proyecto **Yewi**. Todo agente debe consultar y respetar este contexto antes de operar sobre el código.

---

## 1. QUÉ ES YEWI

**Yewi** es una plataforma y marketplace de servicios del hogar y profesionales en España (electricidad, fontanería, pintura, reformas, climatización, etc.).
Conecta a **Clientes** que solicitan servicios con **Profesionales/Empresas** verificados que envían presupuestos, ejecutan pedidos y reciben pagos garantizados bajo custodia escrow.

---

## 2. ARQUITECTURA DEL MONOREPO

El repositorio está gestionado mediante **pnpm workspaces**:

```text
yewi/
├── apps/
│   ├── backend/        # API REST y WebSocket (NestJS 11 + Prisma ORM + PostgreSQL)
│   └── app/            # App Móvil Multiplataforma (Expo SDK 53 + React Native)
├── .agents/            # Gobernanza, SSD, Arquitectura y Protocolos para Agentes
└── package.json        # Configuración raíz de scripts y workspaces
```

---

## 3. STACK TECNOLÓGICO Y CAPAS

### Backend (`apps/backend`)
* **Framework**: NestJS v11 (TypeScript, Express engine).
* **ORM & Base de Datos**: Prisma ORM v7 sobre PostgreSQL con soporte PostGIS para geolocalización.
* **Caché y Mensajería**: Redis (ioredis) para caché de respuestas y throttling.
* **Realtime**: WebSockets con Socket.io (`@nestjs/websockets`, `RealtimeGateway`, `RealtimeService`).
* **Autenticación**: JWT (`@nestjs/jwt`, `Passport`), Argon2 para hash de contraseñas, Google Auth.
* **Pagos & Suscripciones**: Stripe SDK (Suscripciones Yewi Pro, Webhooks con validación criptográfica de firma).
* **Validación**: `class-validator` y `class-transformer` con `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`.

### Frontend (`apps/app`)
* **Framework**: Expo SDK 53 (React Native 0.76+ / New Architecture ready).
* **Enrutamiento**: Expo Router (v4 / v53 basado en carpetas en `apps/app/app/`).
* **Estilos & UI**: TailwindCSS vía NativeWind v4, StyleSheet de React Native, iconos de `@expo/vector-icons`.
* **Estado Global**: Zustand (`useAuthStore`, `useRealtimeStore`).
* **Persistencia Local**: `expo-secure-store` para tokens sensibles (JWT / Refresh), `@react-native-async-storage/async-storage` para cachés.
* **Comunicación HTTP**: Cliente centralizado `apps/app/services/apiClient.ts` con refresco automático de token.

---

## 4. MÓDULOS DEL BACKEND (`apps/backend/src/modules/`)

| Módulo | Responsabilidad Principal |
| :--- | :--- |
| **`auth`** | Registro, login, refresh tokens, Google Auth, verificación de teléfono y OTP. |
| **`users`** | Gestión de perfiles de usuario estándar y preferencias. |
| **`professionals`** | Perfil profesional, verificación KYC, portfolio, radio de servicio y categorías. |
| **`leads`** | Solicitudes de servicio (Service Requests), matching geográfico y presupuestos (Quote Proposals). |
| **`orders`** | Pedidos formalizados, flujo de entrega, revisiones y finalización. |
| **`payments`** | Integración con Stripe, checkout sessions, estado de suscripciones y webhook handler. |
| **`wallet`** | Billetera y transacciones de ledger contable. |
| **`chat`** | Mensajería instantánea entre clientes y profesionales por solicitud/orden. |
| **`notifications`** | Notificaciones in-app y push, contador de no leídas y gestión de borrado. |
| **`reviews`** | Calificaciones y reseñas de servicios completados. |
| **`categories`** | Categorías maestras de servicios (electricidad, fontanería, etc.). |
| **`admin`** | Operaciones de backoffice, aprobación KYC y auditoría. |
| **`health`** | Healthchecks (Terminus) y estado de la base de datos/Redis. |

---

## 5. MODELO DE NEGOCIO Y REGLAS CRÍTICAS (YEWI PRO)

1. **Suscripción Pro Obligatoria para Profesionales**:
   - Los profesionales desbloquean solicitudes de clientes y envían presupuestos mediante su suscripción activa **Yewi Pro**.
2. **Fuente de Verdad en Stripe**:
   - El acceso Pro **únicamente** se otorga y valida tras recibir y verificar la firma de los webhooks de Stripe (`customer.subscription.created`, `customer.subscription.updated`, `invoice.payment_succeeded`) confirmando el estado `ACTIVE` o `TRIALING`.
   - `User.isPro` y `ProfessionalProfile.isPro` son campos derivados. Ningún flag local, rol, email o parámetro enviado por el cliente otorga acceso Pro.
   - Los eventos `payment_failed` y `customer.subscription.deleted` revocan inmediatamente el acceso Pro.
3. **Cero Bypass**:
   - Prohibido reintroducir créditos manuales para desbloquear leads o simular estados de suscripción con mocks.

---

## 6. QUÉ ESTÁ ESTRICTAMENTE PROHIBIDO CAMBIAR SIN AUTORIZACIÓN

1. **No cambiar librerías troncales**:
   - Prohibido sustituir Prisma por TypeORM/Drizzle/Kysely.
   - Prohibido sustituir Zustand por Redux/MobX/Jotai.
   - Prohibido sustituir Expo Router por React Navigation estándar o manual.
   - Prohibido cambiar Express por Fastify en NestJS.
2. **No inventar datos falsos ni simuladores**:
   - Prohibido crear scripts o funciones con datos dummy (`pi_mock_...`, fake tokens).
3. **No refactorizar fuera del alcance**:
   - Prohibido reestructurar módulos o cambiar formatos de respuesta de endpoints no involucrados en la tarea.
4. **No crear capas intermedias vacías**:
   - Prohibido añadir repositorios abstractos, interfaces de implementación única o adaptadores innecesarios.
