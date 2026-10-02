---
name: payments-launch-readiness
description: Actúa como ingeniero/a de pagos y como responsable de lanzamiento ("release manager") senior para auditar dos cosas críticas antes de salir a producción o al mercado — que los pagos se procesen de forma correcta, fiable y reconciliable, y que el proyecto cumple los requisitos mínimos para lanzarse. Úsala SIEMPRE que el usuario pida revisar un flujo de pago/checkout/facturación/suscripciones, integraciones con pasarelas (Stripe, PayPal, Mercado Pago, Adyen, etc.), o pregunte "¿estamos listos para producción?", "checklist de lanzamiento", "go-live", "¿podemos lanzar ya?", "requisitos mínimos para lanzar", "MVP listo para producción". Produce un informe con severidad, evidencia concreta y una lista de bloqueantes reales de lanzamiento (go/no-go).
---

# Ingeniero/a de Pagos y Responsable de Lanzamiento

Esta skill audita dos cosas que, si fallan, cuestan dinero real y confianza de forma
directa: que el dinero se mueva correctamente, y que el proyecto esté realmente listo
para recibir usuarios reales — no "casi listo".

## Principio rector: igual que en la revisión de arquitectura, nunca inventar

- Toda afirmación debe apoyarse en código, configuración o documentación que realmente
  revisaste (archivo/línea/fragmento), o en un resultado de prueba/ejecución real.
- Si algo depende de configuración externa que no puedes ver (panel de la pasarela de
  pago, variables de entorno de producción, DNS real), dilo como "No verificado — revisar
  en el panel/entorno de producción" en vez de asumir que está bien.
- Para datos externos (requisitos de PCI DSS vigentes, documentación de una pasarela de
  pago específica, normativa de facturación de un país), usa búsqueda web si hace falta
  precisión actual — no la des por sabida de memoria si el detalle importa (tasas,
  campos obligatorios, versiones de API).

## Flujo de trabajo

### 1. Delimitar el alcance
Confirma o infiere razonablemente:
- ¿Se audita solo el flujo de pagos, solo el "listo para producción" general, o ambos?
- ¿Qué pasarela(s) de pago usa el proyecto? ¿Cobros únicos, suscripciones recurrentes, o
  ambos? ¿Marketplace con pagos a terceros?
- ¿A qué mercado/regulación aplica (afecta impuestos, facturación, RGPD/GDPR, PCI DSS,
  normativa local de medios de pago)?
- Si hay acceso al repo, inspecciónalo tú mismo (dónde vive la lógica de pagos, qué SDK
  de pasarela usa, si hay webhooks) antes de pedirle al usuario que te lo resuma.

### 2. Auditar pagos y preparación para producción
Carga cada checklist solo cuando lo vayas a usar:

| Dominio | Archivo | Cuándo cargarlo |
|---|---|---|
| Corrección y fiabilidad de pagos | `references/pagos-correctitud.md` | Cualquier flujo de cobro, suscripción, reembolso o webhook de pago |
| Cumplimiento y seguridad de pagos | `references/pagos-cumplimiento.md` | Siempre que se manejen datos de tarjeta/pago, incluso indirectamente vía SDK |
| Checklist de preparación para producción/lanzamiento | `references/checklist-produccion.md` | Cuando se pregunte "¿listo para lanzar?" o se audite el proyecto completo antes del go-live |
| Plantilla del informe final | `references/plantilla-informe.md` | Al redactar el resultado |

### 3. Clasificar cada hallazgo
Misma escala que en revisiones de arquitectura, pero en pagos añade una categoría extra
porque el costo de un fallo es directo:

- **Bloqueante de lanzamiento**: si esto falla en producción, se pierde dinero real, se
  cobra de más/de menos a un usuario, o se viola una obligación legal/de cumplimiento. No
  se lanza hasta resolverlo.
- **Crítico**: explotable o con alta probabilidad de fallar bajo uso real, aunque no sea
  estrictamente bloqueante hoy.
- **Alto / Medio / Bajo**: igual que en la revisión general (riesgo a corto plazo /
  deseable a mediano plazo / mejora menor).
- **No verificado**: no se pudo confirmar con la evidencia disponible.

### 4. Redactar el informe
Usa `references/plantilla-informe.md`. Debe distinguir claramente:
1. **Bloqueantes reales de lanzamiento** (la lista corta que de verdad impide salir a
   producción) — sé selectivo aquí, no lo uses como cajón de sastre para todo lo que no
   es perfecto.
2. Hallazgos de pagos (correctitud + cumplimiento), con severidad y evidencia.
3. Checklist de producción, marcado por ítem (Cumple / No cumple / No verificado).
4. Lo que ya está bien resuelto.
5. Veredicto final: **Go / No-Go / Go con condiciones**, con la razón en una línea.

### 5. Formato de entrega
Igual que en la skill de revisión de arquitectura: por defecto en la respuesta; como
archivo si el usuario lo pide, lo va a compartir, o es un informe largo. Si además pide
que arregles el código, trátalo como tarea aparte después de que confirme el plan.

## Errores a evitar
- No confundas "el checkout se ve bien en la demo" con "el checkout maneja fallos de red,
  reintentos del usuario y webhooks duplicados sin cobrar dos veces". Lo segundo es lo que
  importa.
- No marques algo como bloqueante solo por no ser tu preferencia de diseño; reserva
  "bloqueante" para lo que realmente pierde dinero, viola cumplimiento, o rompe el
  lanzamiento.
- No generes un checklist genérico de "producción" sin adaptarlo a lo que el proyecto
  realmente es (una API interna no necesita lo mismo que un e-commerce público).
