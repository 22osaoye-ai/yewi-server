# Reglas Backend (NestJS)

## 1. Módulos y Organización
- Cada dominio de negocio cuenta con su propio módulo bajo `src/modules/<feature>/` (`users`, `professionals`, `gigs`, `leads`, `orders`, `wallet`, `payments`, etc.).
- No crear un servicio adicional si la responsabilidad pertenece claramente al servicio existente.
- Reutilizar `PrismaService` y `RedisCacheService` inyectados mediante constructores estándar.

## 2. Controllers y DTOs
- Todo endpoint con cuerpo (body) o parámetros debe tener su DTO correspondiente (`class-validator` y `class-transformer`).
- El backend utiliza `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`:
  - Toda propiedad permitida en la petición debe estar explícitamente tipada y decorada con `@IsOptional()`, `@IsString()`, `@IsNumber()`, etc.
- **Sanitización antes de Persistencia**:
  - Nunca pasar un DTO completo directamente a `prisma.<model>.update({ data: dto })` o `.create({ data: dto })`.
  - Mapear y sanitizar explícitamente los campos que correspondan al modelo de base de datos para evitar errores de columnas desconocidas.

## 3. Manejo de Errores
- Utilizar las excepciones HTTP estándar de `@nestjs/common`:
  - `BadRequestException` (400)
  - `UnauthorizedException` (401)
  - `ForbiddenException` (403)
  - `NotFoundException` (404)
  - `ConflictException` (409)
  - `ServiceUnavailableException` (503)
- **Prohibido**: Bloques `try/catch` que capturen errores y devuelvan valores inventados o silencien el fallo.

## 4. Inyección de Dependencias
- No crear interfaces artificiales para clases de servicio que tienen una única implementación en producción.
- Inyectar servicios mediante constructores tipados en TypeScript.

## 5. Autorización Pro y Stripe
- La activación Pro requiere validar la firma del webhook de Stripe y verificar en Stripe la suscripción asociada en estado `ACTIVE` o `TRIALING`.
- Nunca autorizar beneficios Pro basándose únicamente en roles, flags locales, OTP maestro, email, claims no verificados o campos del body/query.
- Procesar `payment_failed` y `canceled` como revocación de acceso; las comprobaciones de autorización deben consultar el estado vigente y no confiar en cachés obsoletas.
- Los tests y verificaciones deben incluir webhooks inválidos/manipulados, payloads de bypass y estados no activos, sin imprimir secretos.
