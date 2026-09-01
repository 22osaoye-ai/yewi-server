# SKILL ROUTER

## PROPÓSITO

Seleccionar únicamente las skills necesarias para ejecutar correctamente una tarea.

Las skills son procedimientos especializados.

No deben cargarse todas automáticamente.

Cada skill activada debe aportar una capacidad necesaria para resolver la tarea.

---

# PROTOCOLO DE SELECCIÓN

Antes de comenzar una tarea:

1. Identifica el tipo de tarea.
2. Identifica las tecnologías afectadas.
3. Identifica los riesgos.
4. Selecciona las skills mínimas necesarias.
5. Ejecuta la tarea siguiendo el SSD y las skills activadas.

---

# MATRIZ DE ACTIVACIÓN

## Bug o error

Activar:

* `debugging`
* `testing` si existen pruebas relevantes
* skill específica del stack afectado

Ejemplos:

NestJS:
`debugging` + `nestjs`

React Native:
`debugging` + `react-native`

Prisma:
`debugging` + `prisma`

---

## Nueva funcionalidad

Activar:

* `feature-development`
* `technical-debt`
* `testing`
* skills específicas del stack

Ejemplo:

Nueva autenticación:
`feature-development` + `technical-debt` + `testing` + `nestjs` + `prisma`

---

## Refactorización

Activar:

* `technical-debt`
* `testing`
* `code-review`
* skills del stack afectado

---

## Code Review

Activar:

* `code-review`
* `technical-debt`

Activar `security` cuando existan:
* autenticación
* autorización
* credenciales
* datos sensibles
* endpoints públicos

---

## Base de datos

Activar:

* `prisma`
* `technical-debt`
* `testing` si cambia comportamiento

---

## Nueva pantalla o componente móvil

Activar:

* `feature-development`
* `technical-debt`
* `react-native`
* `expo` si afecta a configuración o capacidades Expo
* `zustand` si modifica estado global

---

## Microservicios y Arquitectura Distribuida

Activar `nestjs-microservice-architect` cuando la tarea implique:

* crear un nuevo microservicio
* extraer un módulo del monolito
* diseñar comunicación entre servicios
* introducir Kafka/NATS/RabbitMQ/Redis/gRPC/TCP
* crear eventos de dominio distribuidos
* diseñar request-response entre servicios
* migrar un bounded context a un servicio independiente
* implementar arquitectura híbrida HTTP + microservices
* introducir service discovery
* implementar resiliencia distribuida
* diseñar contratos de eventos
* implementar consumers/producers
* diseñar deployment independiente

NO activar automáticamente para:

* crear un módulo NestJS
* crear un controller
* crear un service
* añadir un endpoint HTTP
* añadir Prisma
* crear un CRUD
* refactorizar un módulo aislado

En esos casos utilizar las skills normales de NestJS, Prisma, testing y technical-debt.

### REGLA DE ESCALACIÓN DE MICROSERVICIOS

Si el agente detecta que una tarea podría beneficiarse de un microservicio:

NO crearlo inmediatamente.

Primero ejecutar:

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

Solo si la decisión es `CREATE` comenzar la implementación.

---

# PRINCIPIO DE MÍNIMA ACTIVACIÓN

No actives una skill solo porque esté disponible.

Ejemplo incorrecto:
Nueva función en un servicio NestJS:
`debugging` + `performance` + `architecture` + `prisma` + `security` + `testing` + `code-review` + `technical-debt`
*(Esto introduce ruido inútil).*

Ejemplo correcto:
`feature-development` + `technical-debt` + `nestjs`
*(Añadir `testing` solo si existe infraestructura de pruebas o la modificación lo requiere).*

---

# RESOLUCIÓN DE CONFLICTOS

Cuando existan reglas contradictorias, aplica este orden:

1. Requisitos explícitos del usuario.
2. Restricciones explícitas del proyecto.
3. `AGENT_SSD.md`.
4. Arquitectura del proyecto.
5. Workflow de la tarea.
6. Skills activadas.
7. Convenciones del stack.
8. Preferencias del agente.

Nunca permitas que una preferencia técnica contradiga una restricción superior.

---

# REGLA FINAL

Una skill no es una excusa para añadir complejidad.

Las skills existen para mejorar el proceso de decisión, no para generar más código.
