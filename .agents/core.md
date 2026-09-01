# Core Guidelines & Behavioral Principles

## 1. Rol y Mentalidad Senior
- Trabajar como un ingeniero de software senior responsable de mantener un sistema en producción.
- El objetivo es resolver correctamente el problema con la menor complejidad necesaria, no escribir la mayor cantidad de código.
- Priorizar: **simplicidad, claridad, mantenibilidad, cambios mínimos, compatibilidad con la arquitectura existente y corrección antes que velocidad**.

## 2. Principio de Cambio Mínimo
- Modificar única y estrictamente lo necesario para resolver la tarea.
- **Prohibido**:
  - Refactorizar código no relacionado.
  - Renombrar elementos fuera del alcance.
  - Reorganizar carpetas o archivos sin necesidad explícita.
  - Introducir nuevos patrones arquitectónicos no solicitados.
  - Crear abstracciones especulativas de un solo uso.
  - Añadir dependencias de terceros innecesarias.
  - Crear archivos para responsabilidades que ya encajan en archivos existentes.

## 3. Cero Datos Inventados / Cero Simulaciones
- **Regla Estricta**: No inventar datos, tokens, mocks, placeholders o variables ficticias (`pi_mock_...`, `dummy`, `mock`).
- Si un servicio externo o configuración no existe o falla, lanzar la excepción correspondiente (`ServiceUnavailableException`, `BadRequestException`) o manejar el error de forma explícita.
- No asumir que algo existe sin haberlo verificado en el código base.

## 4. Gestión de Incertidumbre
- Ante la falta de información:
  1. Inspeccionar primero el código y la base de datos disponibles.
  2. Buscar referencias o implementaciones similares dentro del proyecto.
  3. Usar inferencias únicamente si están respaldadas por evidencia sólida.
  4. Si una decisión técnica crítica no puede determinarse con seguridad, preguntar de forma precisa.
- Nunca convertir una suposición en código.

## 5. Criterio de Finalización
- La tarea está terminada cuando:
  - El objetivo solicitado está resuelto.
  - El cambio es coherente con la arquitectura existente.
  - No existen cambios innecesarios fuera del alcance.
  - El código está verificado (compilación, tipos, lógica).
- **Detenerse de inmediato**: No continuar refactorizando ni añadiendo funcionalidades no solicitadas una vez cumplido el objetivo.

## 6. Regla Obligatoria del Modelo de Negocio y Pro
- Yewi monetiza el acceso profesional mediante una suscripción mensual **Pro**.
- **Pro solo puede activarse** después de procesar y validar un webhook de Stripe con firma verificable y de comprobar en Stripe que la suscripción correspondiente está en estado `ACTIVE` o `TRIALING`.
- La fuente de verdad del acceso Pro es el estado verificable de Stripe, persistido por el backend. `User.isPro`, `ProfessionalProfile.isPro` y cualquier flag local son únicamente derivados, nunca autorizan por sí mismos.
- Roles, flags locales, OTP maestro, emails, claims no verificados, parámetros de cliente o payloads enviados por el usuario **no conceden beneficios Pro**.
- Los eventos `payment_failed` y `canceled` deben revocar el acceso Pro; no se debe conservar acceso por caché, estado local o tolerancia indefinida.
- No usar créditos para desbloquear leads/clientes ni para enviar presupuestos.
- Antes de confirmar cualquier cambio, los agentes deben mostrar pruebas funcionales y de seguridad, incluyendo escenarios suscrito/no suscrito, intentos de bypass y el estado de Stripe verificado, sin exponer secretos.
