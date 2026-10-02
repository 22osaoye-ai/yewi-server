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

## Product Sense

Activar `product-sense` cuando la tarea:
* crea una feature nueva de producto;
* modifica una interacción de usuario;
* crea o modifica contenido generado por usuarios;
* añade ratings, reviews, likes, comments, replies, follows, bookings, orders, payments o estados de negocio;
* define nuevos modelos/entidades que representan capacidades de usuario;
* cambia un flujo funcional existente y existe riesgo de dejar capacidades incompletas.

Regla:
* `product-sense` debe ejecutarse ANTES del diseño detallado y antes de implementar una feature nueva.
* Para bugs puramente técnicos sin impacto funcional, no es obligatorio.
* Para refactors internos sin cambio observable de comportamiento, no es obligatorio.

Combinación:
* Feature nueva: `product-sense` + `feature-development` + skills de stack necesarias + `testing`.
* Feature con auth/authz: añadir `security`.
* Feature con Prisma/modelado: añadir `prisma`.
* Feature mobile: añadir `react-native` y `expo` cuando corresponda.

Obligación:
El agente debe distinguir OBSERVED / DOMAIN-CONVENTIONAL / BUSINESS-SPECIFIC / OPTIONAL y no puede convertir una decisión de negocio no documentada en una regla inventada.


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

---

## Sistema de Diseño Yewi Pro (Dark Luxury & Multi-Stack Architecture)

Activar `yewi-design-system` cuando la tarea implique:
* Construir o modificar pantallas de la app móvil (herramientas Pro, presupuestos, comparador de precios, cotizaciones, métricas o dashboards)
* Implementar componentes de interfaz respetando la división de responsabilidades (@expo/ui = primitivas nativas, NativeWind = styling, Design System = identidad, Reanimated = movimiento, Skia = gráficos, Lucide = iconografía, FlashList = listas densas)
* Aplicar los tokens dark-first (#0B0F0F, acento turquesa #24D5C4, bordes translúcidos y radios grandes rounded-3xl)

---

## Diseño Visual y UI Avanzada

Activar `ui-ux-pro-max`, `frontend-design`, `anti-ai-ui` y/o `theme-factory` cuando la tarea implique:
* Diseñar interfaces con dirección estética distintiva y no genérica
* Definir paletas de color, tipografía y jerarquía visual
* Calidad UI/UX, heurísticas, accesibilidad y guías de interacción táctil
* Construir componentes con personalidad de marca

Complementar con:
* `react-native` para implementación en la app móvil
* `canvas-design` o `algorithmic-art` si se requiere generación gráfica o pósters

---

## Movimiento, Físicas Fluidas e Ingeniería de Diseño (Apple & Emil)

Activar `apple-design`, `emil-design-eng`, `animate-expo` y/o `expo-motion` cuando la tarea implique:
* Microinteracciones táctiles, resortes (springs) e inercia física fluida
* Gestos continuos (drag, swipe, sheet) y retroalimentación háptica precisa
* Transiciones espaciales interrumpibles y estados de carga no abruptos
* Detalles invisibles de diseño UI que elevan el producto al estándar premium

Complementar con:
* `find-animation-opportunities` y `review-animations` para auditar cinemática
* `expo-native-ui` y `building-ui` para componentes nativos oficiales

---

## Pruebas de Aplicaciones Web (Playwright)

Activar `webapp-testing` cuando la tarea implique:
* Escribir o ejecutar pruebas de integración o E2E con Playwright en aplicaciones web
* Verificar funcionalidad frontend interactiva en el navegador
* Capturar screenshots o inspeccionar logs de navegador

---

## Integraciones y Model Context Protocol (MCP)

Activar `mcp-builder` cuando la tarea implique:
* Crear o configurar servidores MCP (Python FastMCP o TypeScript SDK)
* Diseñar herramientas (tools) y recursos para interacción con LLMs

Activar `claude-api` cuando se interactúe directamente con APIs de Anthropic o SDKs asociados.

---

## Manipulación de Documentos y Reportes

Activar según el formato requerido:
* `docx`: Creación, edición y formato de documentos Word (.docx, .dotx)
* `pdf`: Extracción, combinación, OCR, rotación o generación de PDFs
* `pptx`: Creación y edición de presentaciones de diapositivas (.pptx, .potx)
* `xlsx`: Creación, limpieza de datos, fórmulas y manipulación de hojas de cálculo (.xlsx, .csv, .tsv)
* `doc-coauthoring`: Estructuración y co-autoría de documentación técnica, propuestas o especificaciones
* `payments-launch-readiness`: Auditoría de pagos, checkout, pasarelas, webhooks, suscripciones, PCI DSS, SCA y checklist de lanzamiento (Go/No-Go)
* `ui-design-guardian`: Guardián del sistema de diseño, prevención de UI inventada/alucinada, reutilización estricta de componentes existentes y heurísticas de usabilidad (Nielsen/accesibilidad)
* `software-architect-reviewer`: Auditoría de arquitectura y seguridad, detección de alucinaciones/mocks inventados, mantenibilidad y checklist production-ready
* `product-sense`: Juicio de producto y completitud funcional, prevención de interpretaciones literales incompletas, análisis de ciclo de vida, actores e invariantes


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
