# Directrices de Gobernanza y Desarrollo del Proyecto Yewi

Este proyecto opera bajo el marco de especificación operativa (SSD) y directrices estrictas definidas en `.agents/`:

### Marco de Comportamiento y Protocolos
- **[Agent SSD — Protocolo Operativo (.agents/AGENT_SSD.md)](file:///home/john/Escritorio/yewi/.agents/AGENT_SSD.md)**: Cómo debe pensar, investigar, decidir, ejecutar y detenerse cualquier agente.
- **[Skill Router (.agents/SKILL_ROUTER.md)](file:///home/john/Escritorio/yewi/.agents/SKILL_ROUTER.md)**: Matriz de activación y selección mínima de skills por tipo de tarea.
- **[Contexto del Proyecto (.agents/PROJECT_CONTEXT.md)](file:///home/john/Escritorio/yewi/.agents/PROJECT_CONTEXT.md)**: Qué es el proyecto, stack tecnológico, módulos y qué está prohibido tocar.
- **[Principios Core (.agents/core.md)](file:///home/john/Escritorio/yewi/.agents/core.md)**: Principios de ingeniería senior, cero datos inventados y negocio Pro.
- **[Protocolo de Tareas (.agents/task-protocol.md)](file:///home/john/Escritorio/yewi/.agents/task-protocol.md)**: Flujo de 6 fases para ejecución de tareas.

### Paquete de Skills Operativas (`.agents/skills/`)
- **[Technical Debt Prevention](file:///home/john/Escritorio/yewi/.agents/skills/technical-debt/SKILL.md)**: Prevención transversal de deuda técnica y sobreingeniería.
- **[Code Review](file:///home/john/Escritorio/yewi/.agents/skills/code-review/SKILL.md)**: Detección priorizada de bugs y regresiones (P0 a P3).
- **[Testing](file:///home/john/Escritorio/yewi/.agents/skills/testing/SKILL.md)**: Pruebas deterministas de comportamiento y protección de regresiones.
- **[Debugging](file:///home/john/Escritorio/yewi/.agents/skills/debugging/SKILL.md)**: Aislamiento de causa raíz y corrección mínima sin parches superficiales.
- **[Feature Development](file:///home/john/Escritorio/yewi/.agents/skills/feature-development/SKILL.md)**: Construcción de funcionalidades por capas sin romper contratos.
- **[NestJS](file:///home/john/Escritorio/yewi/.agents/skills/nestjs/SKILL.md)**: Modularidad backend, controllers ligeros, services cohesivos y DTOs.
- **[Prisma](file:///home/john/Escritorio/yewi/.agents/skills/prisma/SKILL.md)**: Modelado relacional, consultas eficientes y migraciones seguras.
- **[React Native](file:///home/john/Escritorio/yewi/.agents/skills/react-native/SKILL.md)**: Componentes móviles, renderizado, temas y estándar de diseño Yewi.
- **[Expo](file:///home/john/Escritorio/yewi/.agents/skills/expo/SKILL.md)**: Expo Router, plugins, APIs nativas y compatibilidad.
- **[Zustand](file:///home/john/Escritorio/yewi/.agents/skills/zustand/SKILL.md)**: Estado global desacoplado, selectores atómicos y persistencia controlada.
- **[NestJS Microservices Architect](file:///home/john/Escritorio/yewi/.agents/skills/nestjs-microservice-architect/SKILL.md)**: Arquitectura distribuida, evaluación de microservicios y protocolos de comunicación (Kafka/RabbitMQ/Redis/gRPC).

### Arquitectura y Reglas del Stack
- **[Arquitectura Monorepo (.agents/architecture.md)](file:///home/john/Escritorio/yewi/.agents/architecture.md)**: Límites de capas y comunicación Frontend/Backend.
- **[Backend NestJS (.agents/backend-nestjs.md)](file:///home/john/Escritorio/yewi/.agents/backend-nestjs.md)**: Reglas para controllers, DTOs, services y validaciones.
- **[Frontend React Native (.agents/frontend-react-native.md)](file:///home/john/Escritorio/yewi/.agents/frontend-react-native.md)**: Reglas para Expo, Expo Router, pantallas y Zustand.
- **[Base de Datos Prisma (.agents/database-prisma.md)](file:///home/john/Escritorio/yewi/.agents/database-prisma.md)**: Reglas para modelos, migraciones y consultas.

---

## Reglas Inquebrantables
1. **Comportamiento Senior**: Simplicidad, claridad, mantenibilidad y cambios mínimos.
2. **Cero Datos Inventados**: Prohibido inventar mocks, placeholders o tokens ficticios.
3. **Cambio Mínimo**: No tocar archivos ni código fuera del alcance estricto de la tarea.
4. **Ciclo Operativo**: ¿Qué debo hacer? → ¿Qué puedo tocar? → ¿Cómo debo decidir? → ¿Cuándo debo parar?

