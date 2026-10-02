# Directrices de Gobernanza y Desarrollo del Proyecto Yewi

Este proyecto opera bajo el marco de especificación operativa (SSD) y directrices estrictas definidas en `.agents/`:

### Marco de Comportamiento y Protocolos
- **[Agent SSD — Protocolo Operativo (.agents/AGENT_SSD.md)](file:///c:/Users/kali/Documents/Yewi/.agents/AGENT_SSD.md)**: Cómo debe pensar, investigar, decidir, ejecutar y detenerse cualquier agente.
- **[Skill Router (.agents/SKILL_ROUTER.md)](file:///c:/Users/kali/Documents/Yewi/.agents/SKILL_ROUTER.md)**: Matriz de activación y selección mínima de skills por tipo de tarea.
- **[Contexto del Proyecto (.agents/PROJECT_CONTEXT.md)](file:///c:/Users/kali/Documents/Yewi/.agents/PROJECT_CONTEXT.md)**: Qué es el proyecto, stack tecnológico, módulos y qué está prohibido tocar.
- **[Principios Core (.agents/core.md)](file:///c:/Users/kali/Documents/Yewi/.agents/core.md)**: Principios de ingeniería senior, cero datos inventados y negocio Pro.
- **[Protocolo de Tareas (.agents/task-protocol.md)](file:///c:/Users/kali/Documents/Yewi/.agents/task-protocol.md)**: Flujo de 6 fases para ejecución de tareas.

### Paquete de Skills Operativas (`.agents/skills/`)
- **[Technical Debt Prevention](file:///c:/Users/kali/Documents/Yewi/.agents/skills/technical-debt/SKILL.md)**: Prevención transversal de deuda técnica y sobreingeniería.
- **[Code Review](file:///c:/Users/kali/Documents/Yewi/.agents/skills/code-review/SKILL.md)**: Detección priorizada de bugs y regresiones (P0 a P3).
- **[Testing](file:///c:/Users/kali/Documents/Yewi/.agents/skills/testing/SKILL.md)**: Pruebas deterministas de comportamiento y protección de regresiones.
- **[Debugging](file:///c:/Users/kali/Documents/Yewi/.agents/skills/debugging/SKILL.md)**: Aislamiento de causa raíz y corrección mínima sin parches superficiales.
- **[Feature Development](file:///c:/Users/kali/Documents/Yewi/.agents/skills/feature-development/SKILL.md)**: Construcción de funcionalidades por capas sin romper contratos.
- **[NestJS](file:///c:/Users/kali/Documents/Yewi/.agents/skills/nestjs/SKILL.md)**: Modularidad backend, controllers ligeros, services cohesivos y DTOs.
- **[Prisma](file:///c:/Users/kali/Documents/Yewi/.agents/skills/prisma/SKILL.md)**: Modelado relacional, consultas eficientes y migraciones seguras.
- **[React Native](file:///c:/Users/kali/Documents/Yewi/.agents/skills/react-native/SKILL.md)**: Componentes móviles, renderizado, temas y estándar de diseño Yewi.
- **[Expo](file:///c:/Users/kali/Documents/Yewi/.agents/skills/expo/SKILL.md)**: Expo Router, plugins, APIs nativas y compatibilidad.
- **[Zustand](file:///c:/Users/kali/Documents/Yewi/.agents/skills/zustand/SKILL.md)**: Estado global desacoplado, selectores atómicos y persistencia controlada.
- **[NestJS Microservices Architect](file:///c:/Users/kali/Documents/Yewi/.agents/skills/nestjs-microservice-architect/SKILL.md)**: Arquitectura distribuida, evaluación de microservicios y protocolos de comunicación (Kafka/RabbitMQ/Redis/gRPC).
- **[UI/UX Pro Max](file:///c:/Users/kali/Documents/Yewi/.agents/skills/ui-ux-pro-max/SKILL.md)**: Inteligencia de diseño UI/UX para web y móvil (React Native), paletas, tipografía, accesibilidad, jerarquía y animaciones.
- **[Apple Design](file:///c:/Users/kali/Documents/Yewi/.agents/skills/apple-design/SKILL.md)**: Principios de diseño Apple, físicas fluidas, materiales translúcidos, tipografía óptica y micro-hápticos.
- **[Emil Design Engineering](file:///c:/Users/kali/Documents/Yewi/.agents/skills/emil-design-eng/SKILL.md)**: Filosofía de pulido de interfaces, detalles invisibles, resortes y transiciones de alto impacto táctil.
- **[Animate Expo](file:///c:/Users/kali/Documents/Yewi/.agents/skills/animate-expo/SKILL.md)**: Animaciones en React Native y Expo con Reanimated, Gesture Handler y expo-haptics.
- **[Expo Motion](file:///c:/Users/kali/Documents/Yewi/.agents/skills/expo-motion/SKILL.md)**: Animaciones e interacciones fluidas con Reanimated 4, Gesture Handler, worklets y transiciones en Expo.
- **[Expo Native UI](file:///c:/Users/kali/Documents/Yewi/.agents/skills/expo-native-ui/SKILL.md)**: Directrices oficiales de Expo para componentes de interfaz nativa.
- **[Building UI](file:///c:/Users/kali/Documents/Yewi/.agents/skills/building-ui/SKILL.md)**: Construcción de componentes UI accesibles y de alto rendimiento en React Native.
- **[React Best Practices](file:///c:/Users/kali/Documents/Yewi/.agents/skills/react-best-practices/SKILL.md)**: Buenas prácticas de rendimiento y arquitectura en React y React Native.
- **[UI Designer Senior — Anti-AI UI](file:///c:/Users/kali/Documents/Yewi/.agents/skills/anti-ai-ui/SKILL.md)**: Diseño de interfaces digitales premium, humanas, intencionadas y coherentes, evitando deliberadamente clichés visuales de interfaces generadas por IA.
- **[Frontend Design](file:///c:/Users/kali/Documents/Yewi/.agents/skills/frontend-design/SKILL.md)**: Dirección estética distintiva, composición intencionada y tipografía de producto.
- **[Animation Auditor & Opportunities](file:///c:/Users/kali/Documents/Yewi/.agents/skills/find-animation-opportunities/SKILL.md)**: Localización y auditoría de microinteracciones y mejoras cinéticas.
- **[Story Editor](file:///c:/Users/kali/Documents/Yewi/.agents/skills/story-editor/SKILL.md)**: Arquitectura 2D canvas de historias (capas, manipulación gestual Reanimated 4, filtros no destructivos y serialización).
- **[Image Editor](file:///c:/Users/kali/Documents/Yewi/.agents/skills/image-editor/SKILL.md)**: Procesamiento de imágenes, proporciones naturales, rotaciones y rendimiento visual en Expo.
- **[Text Engine](file:///c:/Users/kali/Documents/Yewi/.agents/skills/text-engine/SKILL.md)**: Motor tipográfico dinámico sobre imágenes (fuentes, fondos badge/solid/transparent, colores y posicionamiento normalizado).
- **[UI Reviewer](file:///c:/Users/kali/Documents/Yewi/.agents/skills/ui-reviewer/SKILL.md)**: Auditoría rigurosa de calidad visual móvil, haptics, safe areas y cumplimiento estricto de especificaciones.
- **[Payments & Launch Readiness](file:///c:/Users/kali/Documents/Yewi/.agents/skills/payments-launch-readiness/SKILL.md)**: Auditoría de pagos, fiabilidad, reconciliación, cumplimiento PCI/SCA y preparación para lanzamiento (Go/No-Go).
- **[UI Design Guardian](file:///c:/Users/kali/Documents/Yewi/.agents/skills/ui-design-guardian/SKILL.md)**: Guardián del sistema de diseño, prevención de UI inventada/alucinada, reutilización estricta de componentes existentes y heurísticas de usabilidad.
- **[Software Architect Reviewer](file:///c:/Users/kali/Documents/Yewi/.agents/skills/software-architect-reviewer/SKILL.md)**: Auditoría técnica y arquitectónica senior, detección de alucinaciones, estabilidad y checklist production-ready.
- **[Product Sense](file:///c:/Users/kali/Documents/Yewi/.agents/skills/product-sense/SKILL.md)**: Juicio de producto y completitud funcional, prevención de implementaciones literales incompletas, análisis de ciclo de vida e invariantes de dominio.
- **[Yewi Design System](file:///c:/Users/kali/Documents/Yewi/.agents/skills/yewi-design-system/SKILL.md)**: Estándar y arquitectura oficial UI/UX Dark Luxury (división de responsabilidades @expo/ui, NativeWind, Reanimated, Skia, Lucide, FlashList y tokens).



### Arquitectura y Reglas del Stack
- **[Arquitectura Monorepo (.agents/architecture.md)](file:///c:/Users/kali/Documents/Yewi/.agents/architecture.md)**: Límites de capas y comunicación Frontend/Backend.
- **[Backend NestJS (.agents/backend-nestjs.md)](file:///c:/Users/kali/Documents/Yewi/.agents/backend-nestjs.md)**: Reglas para controllers, DTOs, services y validaciones.
- **[Frontend React Native (.agents/frontend-react-native.md)](file:///c:/Users/kali/Documents/Yewi/.agents/frontend-react-native.md)**: Reglas para Expo, Expo Router, pantallas y Zustand.
- **[Base de Datos Prisma (.agents/database-prisma.md)](file:///c:/Users/kali/Documents/Yewi/.agents/database-prisma.md)**: Reglas para modelos, migraciones y consultas.

---

## Reglas Inquebrantables
1. **Comportamiento Senior**: Simplicidad, claridad, mantenibilidad y cambios mínimos.
2. **Cero Datos Inventados**: Prohibido inventar mocks, placeholders o tokens ficticios.
3. **Cambio Mínimo**: No tocar archivos ni código fuera del alcance estricto de la tarea.
4. **Ciclo Operativo**: ¿Qué debo hacer? → ¿Qué puedo tocar? → ¿Cómo debo decidir? → ¿Cuándo debo parar?
5. **Concisión Estricta en Textos y UI (Zero-Overflow)**: Títulos, etiquetas de botones, badges y píldoras deben ser ultra-cortos, concisos y directos (máximo 1 o 2 palabras, ej: "Proyecto", "Obra", "Solicitud", "Buscar", "Mensajes"). Terminantemente prohibido usar textos verbosos o largos que puedan desbordarse o romper layouts.
6. **Tipografía y Estándar Editorial Yewi**: Prohibido Satoshi. La tipografía oficial es un sans-serif geométrico moderno (Plus Jakarta Sans / Google Sans) con jerarquía editorial, tarjetas de arco suave con objetos recortados 3D y barra inferior en cápsula flotante.
7. **Homogeneidad Estricta de Iconos (Header y TabBar)**:
   - Todos los iconos de la cabecera (Header) en cualquier pantalla deben tener exactamente el mismo tamaño entre sí (ej. 22px / 20px uniformes). Prohibido mezclar dimensiones distintas en una misma cabecera.
   - Todos los iconos de la barra inferior (TabBar) deben tener exactamente el mismo tamaño entre sí (estrictamente 22px).
8. **Preservación Inmutable de Tarjetas Core (ProjectCard y ProfessionalCard)**:
   - Prohibido modificar, rediseñar o sustituir las tarjetas oficiales del sistema (`ProjectCard` para servicios y `ProfessionalCard` para profesionales). No inventar tarjetas alternativas o temporales. Cualquier carrusel, lookbook o cuadrícula debe reutilizar estas tarjetas oficiales existentes.
9. **Uso Obligatorio de Skills y SSD**:
   - Prohibido escribir una sola línea de código sin haber activado y seguido rigurosamente el protocolo SSD (`AGENT_SSD.md`), `SKILL_ROUTER.md` y las skills del proyecto.
