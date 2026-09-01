---
name: nestjs
description: Patrones de desarrollo backend en NestJS, diseño de módulos, controllers, services cohesivos, DTOs y manejo de errores.
---

# SKILL: NESTJS

## PROPÓSITO

Implementar funcionalidades backend utilizando NestJS respetando modularidad, responsabilidades y convenciones existentes.

---

# INSPECCIÓN

Antes de modificar:

* localizar el módulo afectado
* revisar controller
* revisar service
* revisar DTOs
* revisar entidades o modelos relacionados
* revisar guards, interceptors o middleware relevantes
* revisar dependencias del módulo

No crees un módulo nuevo antes de comprobar si la responsabilidad pertenece a uno existente.

---

# CONTROLLERS

Los controllers deben:

* recibir la petición
* aplicar el transporte HTTP y decoradores de Swagger/Rutas
* delegar en la capa correspondiente (Service)
* devolver la respuesta

No colocar lógica de negocio compleja en controllers.

No mover toda lógica a múltiples servicios artificiales.

---

# SERVICES

Los services deben contener responsabilidades coherentes.

No:

* crear un servicio por cada pequeña función
* dividir una responsabilidad cohesiva sin necesidad
* introducir capas vacías

Un servicio puede tener varias funciones relacionadas con su responsabilidad.

---

# DTOs

Crear DTOs cuando exista:

* contrato de entrada (`CreateDto`, `FilterDto`)
* contrato de actualización (`UpdateDto`)
* contrato público claramente definido

Utilizar decoradores de `class-validator` y `class-transformer` (`@IsString()`, `@IsOptional()`, `@Type()`, etc.).

No crear DTOs redundantes para transformaciones internas triviales.

---

# DEPENDENCIAS

Antes de inyectar una nueva dependencia:

* comprobar si ya existe una capacidad equivalente
* comprobar si la responsabilidad pertenece realmente al servicio actual
* registrar el módulo importado en el `@Module({ imports: [...] })` correspondiente

---

# ERRORES

Utilizar mecanismos consistentes con NestJS (`HttpException`, `NotFoundException`, `ForbiddenException`, `BadRequestException`, `ConflictException`).

No:

* capturar excepciones solo para relanzarlas sin aportar contexto
* ocultar errores inesperados
* devolver errores internos sensibles al cliente

---

# REGLA DE MÓDULOS

Un módulo representa una capacidad o dominio del sistema.

No crear:

* `AuthUserService`
* `AuthUserHelper`
* `AuthUserManager`
* `AuthUserProcessor`

si la responsabilidad puede vivir coherentemente en una estructura existente.

---

# FINALIZACIÓN

Antes de terminar:

* [ ] Imports correctos y sin dependencias circulares.
* [ ] Providers disponibles y exportados si otros módulos los consumen.
* [ ] Módulos correctamente conectados en `AppModule`.
* [ ] DTOs coherentes con validación completa.
* [ ] Contratos preservados y endpoints documentados.
* [ ] Errores relevantes gestionados adecuadamente.
