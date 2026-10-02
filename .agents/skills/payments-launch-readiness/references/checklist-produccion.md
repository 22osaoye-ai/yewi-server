# Checklist de Preparación para Producción / Lanzamiento

Esta lista distingue entre lo que de verdad bloquea un lanzamiento y lo que es deseable
pero puede esperar a después. No todo ítem aplica a todo proyecto (una API interna no
necesita lo mismo que un e-commerce público) — adapta antes de reportar.

## 1. Funcionalidad y calidad
- ¿Los flujos críticos (los que un usuario real necesita para completar su objetivo
  principal, incluido pagar si aplica) funcionan de punta a punta, probados de verdad y
  no solo revisados a simple vista?
- ¿Hay una suite de tests automatizados mínima sobre esos flujos críticos, o el único
  "test" es que alguien lo probó manualmente una vez?
- ¿Se probó en los navegadores/dispositivos objetivo reales, no solo en el entorno de
  desarrollo?

## 2. Infraestructura y despliegue
- ¿Entornos de desarrollo, staging y producción están claramente separados (bases de
  datos, claves, dominios distintos)?
- ¿El despliegue a producción es reproducible (CI/CD, script, o al menos un proceso
  documentado), no un paso manual que solo una persona sabe hacer?
- ¿Existe un plan de rollback si el despliegue falla o introduce un bug grave?
- ¿Hay backups automáticos de la base de datos, y — esto es lo que casi nadie prueba — se
  ha verificado alguna vez que un backup realmente puede restaurarse?
- ¿El proyecto escala razonablemente para el tráfico esperado en el lanzamiento
  (considera un pico realista, no solo tráfico promedio)? Si no se ha probado con carga,
  dilo como "no verificado" en vez de asumir que aguanta.

## 3. Observabilidad y respuesta a incidentes
- ¿Hay monitoreo básico (uptime, tasa de errores, latencia) con alertas a alguien real, no
  solo logs que nadie mira?
- ¿Hay una forma de saber rápido si algo se rompió después del lanzamiento (dashboard,
  alertas), sin depender de que un usuario se queje primero?
- ¿Existe al menos un plan mínimo de "¿qué hacemos si se cae en producción?" (quién
  responde, cómo se hace rollback, dónde se comunica el estado)?

## 4. Seguridad mínima antes de exponerse al público
(Complementa, no reemplaza, la revisión de seguridad completa si ya se hizo por
separado.)
- ¿HTTPS forzado en todo el dominio público?
- ¿No hay endpoints de debug/admin expuestos sin autenticación?
- ¿Rate limiting básico en endpoints públicos sensibles (login, formularios, pagos)?
- ¿Se sabe qué hacer si se detecta una brecha (a quién avisar, cómo rotar credenciales)?

## 5. Legal y confianza del usuario
- ¿Existen Términos de Servicio y Política de Privacidad accesibles, y reflejan lo que el
  producto realmente hace con los datos (no una plantilla genérica sin revisar)?
- Si se manejan datos personales de usuarios en la UE/UK o de menores, o el mercado
  objetivo tiene una ley de protección de datos específica: ¿hay al menos una base mínima
  de cumplimiento (consentimiento, forma de eliminar datos, aviso de cookies si aplica)?
  Si el detalle regulatorio importa para este lanzamiento específico, verifícalo con
  búsqueda en vez de asumir — cambia por país y por tipo de dato.
- Si hay pagos: ver `pagos-cumplimiento.md` para los requisitos específicos.

## 6. Operación del negocio, no solo del software
- ¿Hay forma de dar soporte a un usuario con un problema (canal de contacto real, no un
  buzón que nadie revisa)?
- ¿El equipo sabe qué métrica de negocio va a mirar en los primeros días (activaciones,
  errores de pago, abandono) para saber si el lanzamiento va bien?
- ¿Hay un plan simple para el "día después" (quién está disponible si algo falla el fin
  de semana del lanzamiento)?

## Cómo decidir Go / No-Go
- **No-Go** si falta algo de la sección 2-4 que pueda causar pérdida de datos, caída
  total, o exposición de datos/pagos sin protección.
- **Go con condiciones** si faltan cosas deseables (secciones 5-6 parciales, observabilidad
  básica pero no completa) que se pueden resolver en los primeros días sin gran riesgo.
- **Go** solo si los bloqueantes reales están resueltos — no exijas perfección, exige
  ausencia de riesgos que cuesten dinero, datos o confianza de forma irreversible.
