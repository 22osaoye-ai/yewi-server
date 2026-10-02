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

## 6. Regla Obligatoria del Modelo de Negocio (Custodia Escrow & 15% Comisión)
- Yewi monetiza las transacciones del marketplace mediante una comisión del **15%** sobre el importe del presupuesto en cada trabajo finalizado.
- El 100% del importe del presupuesto aceptado por el cliente se custodia de forma segura en **Escrow** (`EscrowStatus.HELD`).
- El dinero se libera automáticamente al profesional (`85%` neto) y a Yewi (`15%` comisión) únicamente cuando el cliente aprueba formalmente la finalización del servicio (`approveDelivery`).
- Los profesionales no requieren suscripciones de pago mensual ni paquetes de créditos para ver solicitudes o enviar ofertas a clientes. El modelo es 100% a éxito por trabajo completado.

## 7. Concisión Estricta en Textos y UI (Zero-Overflow)
- **Títulos y Botones Ultra-Cortos**: Máximo 1 o 2 palabras (ejemplo: "Proyecto", "Obra", "Solicitud", "Buscar", "Mensajes").
- **Prohibido Texto Verboso**: Queda terminantemente prohibido usar frases o etiquetas compuestas que desborden contenedores, botones, modales o píldoras.

## 8. Homogeneidad Estricta de Iconos en Header y TabBar
- **Iconos de Header**: Todos los iconos dentro de la cabecera de una pantalla deben tener obligatoriamente el mismo tamaño (ej. 22px). Queda prohibido mezclar tamaños heterogéneos (ej. 18px con 24px) en la misma barra superior.
- **Iconos de TabBar**: Todos los iconos de la barra inferior deben mantener estrictamente idénticas dimensiones (22px).

## 9. Preservación Inmutable de Tarjetas Oficiales (ProjectCard & ProfessionalCard)
- Queda terminantemente prohibido sustituir, rediseñar o reemplazar el diseño de `ProjectCard` (para gigs/servicios) y `ProfessionalCard` (para profesionales/autónomos).
- No inventar componentes de tarjeta alternativos (como `PosterCard`). Toda vista por categorías, carrusel o cuadrícula debe estructurarse reutilizando de manera estricta `ProjectCard` y `ProfessionalCard`.

## 10. Cumplimiento Mandatorio de Agentes y Skills
- Prohibido escribir o modificar código sin consultar primero el marco SSD (`AGENT_SSD.md`), `SKILL_ROUTER.md` y las skills especializadas del proyecto.

