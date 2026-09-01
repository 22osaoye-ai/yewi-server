# Protocolo de Ejecución de Tareas (Task Protocol)

Todo trabajo debe ejecutarse siguiendo estrictamente las 6 etapas del protocolo:

---

### A. Comprender
- ¿Qué existe actualmente en el código?
- ¿Cuál es el flujo de datos y ejecución actual?
- ¿Qué requiere exactamente el usuario?

### B. Delimitar
- ¿Cuáles son los archivos estrictamente afectados?
- ¿Qué partes del sistema **NO** deben modificarse?
- Evitar cualquier cambio fuera de alcance (*scope creep*).

### C. Resolver (Diseño del cambio mínimo)
- ¿Cuál es la solución más pequeña, directa y correcta?
- ¿Tiene efectos secundarios en otros módulos o pantallas?
- ¿Requiere tocar backend, frontend o ambos?

### D. Implementar
- Escribir código idiomático, limpio y tipado.
- Seguir las convenciones del stack (NestJS / React Native).
- Cero código defensivo innecesario, cero datos inventados.

### E. Verificar
- Ejecutar las pruebas y verificaciones disponibles que sean pertinentes al alcance:
  - Frontend: verificación de tipos (`npx tsc --noEmit`) y pruebas de componentes, navegación o integración afectadas.
  - Backend: compilación (`nest build`), verificación de tipos y pruebas unitarias, de integración o de endpoints afectadas.
  - Cambios que crucen backend y frontend: verificar ambos lados y el flujo completo afectado.
- Para integraciones externas (incluidas Stripe y Clerk), verificar configuración, autenticación/autorización, manejo de errores, webhooks y contratos sin realizar operaciones destructivas ni depender de servicios reales cuando no exista un entorno seguro habilitado.
- Para cualquier cambio relacionado con Pro o pagos, verificar explícitamente que la activación requiere un webhook de Stripe firmado y una suscripción Stripe comprobable en `ACTIVE` o `TRIALING`. Intentar y documentar bypass mediante roles, flags locales, OTP maestro, emails y payloads manipulados; ninguno debe conceder acceso.
- Verificar la revocación efectiva ante `payment_failed` y `canceled`, incluyendo que no sobreviva acceso por caché o estado local.
- Ejecutar una comprobación de seguridad pertinente al cambio: control de acceso, validación de entrada, exposición de datos, gestión de secretos y regresiones de permisos.
- Nunca imprimir, registrar, pegar o incluir secretos, tokens, credenciales, datos personales sensibles ni respuestas que los contengan. No inventar resultados, evidencias, datos de prueba ni disponibilidad de servicios.
- Si una prueba o verificación disponible no puede ejecutarse, dejar constancia explícita de cuál, por qué no fue posible y qué riesgo o cobertura queda pendiente. No sustituirla por una afirmación de éxito.
- Antes de confirmar cualquier cambio al usuario, reportar obligatoriamente:
  1. **Pruebas de funcionamiento ejecutadas** y su resultado.
  2. **Pruebas de seguridad ejecutadas** y su resultado.
  3. **Alcance verificado**, incluyendo archivos, módulos, flujos o integraciones revisados.
  4. **Bloqueos, pruebas omitidas y cobertura pendiente**, con su motivo.
- En cambios de Pro/pagos, el reporte debe incluir pruebas de activación con webhook firmado y estado Stripe `ACTIVE`/`TRIALING`, pruebas de revocación para `payment_failed`/`canceled` e intentos de bypass, usando únicamente evidencias sanitizadas y sin secretos.
- Los agentes deben presentar pruebas funcionales y de seguridad antes de confirmar cambios; no basta con afirmar que fueron realizadas.
- No declarar la tarea completada si no se ejecutaron las pruebas disponibles aplicables o si no se explicó claramente por qué no pudieron ejecutarse.

### F. Detenerse
- Una vez verificado el objetivo, **parar inmediatamente**.
- No continuar refactorizando ni añadiendo funciones especulativas.
- Responder de forma concisa y técnica (Diagnóstico, Plan, Implementación, Verificación y Bloqueos), incluyendo siempre el reporte obligatorio de la etapa E.
