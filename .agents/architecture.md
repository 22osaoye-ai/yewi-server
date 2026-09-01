# Reglas Arquitectónicas del Monorepo Yewi

## 1. Estructura General del Workspace
- **apps/backend**: NestJS (v11), Prisma ORM (v7), PostgreSQL con PostGIS, Redis, Socket.io, Passport/Clerk.
- **apps/app**: Expo React Native, Expo Router (v53), TypeScript, Zustand, Tailwind/NativeWind, Clerk Auth.

## 2. Flujo y Capas de Responsabilidad

### Backend (NestJS)
```text
Client Request → Guard / Pipe (Validación DTO) → Controller → Service (Lógica de Negocio) → PrismaService (Persistencia / DB)
```
- **Controllers**: Manejan exclusivamente la recepción de peticiones HTTP, validación de DTOs y delegación al servicio correspondiente. No contienen lógica de negocio ni consultas a Prisma.
- **Services**: Contienen toda la lógica de negocio, validaciones de dominio, transacciones y llamadas directas a `PrismaService`.
- **Persistencia**: Prisma ORM proporciona la abstracción directa y type-safe sobre PostgreSQL. No crear capas de repositorio intermedias manuales innecesarias.

### Frontend (Expo / React Native)
```text
UI Screen (app/) → UI Component (components/) → Store (Zustand) / Service (services/) → API Backend
```
- **Screens (`apps/app/app/`)**: Enrutamiento declarativo con Expo Router, coordinación de vistas y navegación.
- **Components (`apps/app/components/`)**: Componentes de UI reutilizables y presentacionales.
- **State (`apps/app/store/`)**: Zustand para estado global de autenticación, sesión y preferencias.
- **Services (`apps/app/services/`)**: Clientes de comunicación HTTP contra la API de NestJS (`authApi.ts`, `authService.ts`).

## 3. Límites entre Módulos y Dependencias
- Los módulos del backend deben ser autónomos y comunicarse mediante inyección de dependencias (`ModuleA` importa `ModuleB` o `PrismaModule`).
- Nunca acoplar el frontend a tipos o esquemas internos del ORM del backend; la comunicación se realiza mediante DTOs e interfaces de dominio compartidas.
- No introducir nuevas capas arquitectónicas (CQRS, Hexagonal, Clean Architecture abstracta) a menos que sea explícitamente solicitado.

## 4. Autoridad de Suscripción Pro
- El acceso Pro debe depender de un webhook de Stripe cuya firma haya sido validada y de una suscripción Stripe verificable en estado `ACTIVE` o `TRIALING`.
- Ningún rol, flag local, OTP maestro, email, claim no verificado o payload del cliente puede sustituir esa verificación.
- `payment_failed` y `canceled` revocan el acceso Pro de forma efectiva en backend; el frontend solo refleja ese resultado.
