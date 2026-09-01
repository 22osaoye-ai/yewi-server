---
name: nestjs-microservice-architect
description: Arquitectura de microservicios en NestJS, diseño de comunicación distribuida (Kafka/NATS/RabbitMQ/Redis/gRPC/TCP), contratos de eventos y evaluación de extracción de bounded contexts.
---

# NestJS Microservice Architect

Esta skill guía el diseño, comunicación, resiliencia y eventual extracción de microservicios en NestJS.

---

## 🛑 REGLA DE ESCALACIÓN OBLIGATORIA

Si detectas que una tarea podría beneficiarse de un microservicio, **NO** lo crees inmediatamente.

Primero debes ejecutar y documentar el siguiente análisis:

```text
MICROSERVICE ASSESSMENT

Current architecture:
...

Candidate bounded context:
...

Reason for extraction:
...

Alternative: existing module:
...

Alternative: modular monolith:
...

Alternative: hybrid:
...

Expected benefit:
...

Operational cost:
...

Decision:
CREATE / DO NOT CREATE
```

**Solo si la decisión es `CREATE` comenzar la implementación.**

---

## Cuándo activar esta skill

* Crear un nuevo microservicio
* Extraer un módulo del monolito
* Diseñar comunicación entre servicios
* Introducir Kafka/NATS/RabbitMQ/Redis/gRPC/TCP
* Crear eventos de dominio distribuidos
* Diseñar request-response entre servicios
* Migrar un bounded context a un servicio independiente
* Implementar arquitectura híbrida HTTP + microservices
* Introducir service discovery
* Implementar resiliencia distribuida
* Diseñar contratos de eventos
* Implementar consumers/producers
* Diseñar deployment independiente

## Cuándo NO activar esta skill

* Crear un módulo NestJS estándar
* Crear un controller
* Crear un service
* Añadir un endpoint HTTP
* Añadir Prisma
* Crear un CRUD
* Refactorizar un módulo aislado

*(En esos casos utilizar las skills normales de NestJS, Prisma, testing y technical-debt).*

---

## Principios de Microservicios en NestJS

1. **Autonomía y Desacoplamiento**: Cada microservicio debe poseer su propio almacenamiento o esquema y comunicarse únicamente por contratos y eventos formales.
2. **Contratos Fuertes (DTOs y Event Types)**: Definir DTOs tipados y versionados para payloads de mensajes.
3. **Resiliencia**: Manejo de timeouts, retries exponenciales, dead letter queues (DLQ) y fallback ante fallos de conexión.
4. **Idempotencia**: Todos los consumers de eventos deben manejar duplicados de forma idempotente.
5. **Observabilidad**: Propagación de Trace IDs (`x-correlation-id`) a través del bus de mensajería.
