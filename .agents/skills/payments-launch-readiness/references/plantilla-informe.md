# Plantilla del Informe — Pagos y Preparación para Producción

```markdown
# Auditoría de pagos y preparación para lanzamiento — [nombre del proyecto]

## Alcance
Qué se revisó (pagos / producción / ambos), con qué nivel de acceso, y qué quedó fuera.

## Veredicto
**Go / No-Go / Go con condiciones** — una línea explicando por qué.

## Bloqueantes de lanzamiento
Lista corta y concreta de lo que de verdad impide salir a producción hoy. Si no hay
ninguno, dilo explícitamente en vez de omitir la sección.

| # | Bloqueante | Evidencia | Qué falta para resolverlo |
|---|---|---|---|

## Pagos — corrección y fiabilidad
| Severidad | Hallazgo | Evidencia | Recomendación |
|---|---|---|---|

## Pagos — cumplimiento y seguridad
| Severidad | Hallazgo | Evidencia | Recomendación |
|---|---|---|---|

## Checklist de preparación para producción
| Ítem | Estado (Cumple/No cumple/No verificado) | Nota |
|---|---|---|

## Lo que ya está bien resuelto

## No verificado / requiere más contexto
Qué no se pudo confirmar (acceso a producción, panel de la pasarela, entorno de carga) y
qué haría falta para verificarlo.
```
