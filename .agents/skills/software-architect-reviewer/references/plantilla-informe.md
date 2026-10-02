# Plantilla del Informe de Auditoría

Adapta las secciones a lo que realmente se revisó — no incluyas una sección de un dominio
que no se auditó; en su lugar acláralo en "Alcance".

```markdown
# Auditoría técnica — [nombre del proyecto/módulo]

## Alcance
Qué se revisó, qué no, y con qué nivel de acceso (código completo / parcial / solo
diseño).

## Resumen ejecutivo
3-5 líneas: ¿listo para producción? Top 3 riesgos. Recomendación general.

## Hallazgos por dominio

### Seguridad
| Severidad | Hallazgo | Evidencia (archivo/fragmento) | Recomendación |
|---|---|---|---|

### Autenticación y autorización
| Severidad | Hallazgo | Evidencia | Recomendación |
|---|---|---|---|

### Rendimiento y eficiencia
| Severidad | Hallazgo | Evidencia | Recomendación |
|---|---|---|---|

### Estabilidad y mantenibilidad a largo plazo
| Severidad | Hallazgo | Evidencia | Recomendación |
|---|---|---|---|

### Integridad de datos / posibles alucinaciones de agentes de IA
| Estado (Confirmado/Sospechoso) | Hallazgo | Evidencia | Qué debería ser en su lugar |
|---|---|---|---|

### Coordinación de agentes y contexto (si aplica)
Mecanismos evaluados (estado externo, handoffs, verificación, cross-check, alcance
acotado, checkpoints) y en cuáles falla el diseño actual.

## Lo que está bien hecho
Para no perder de vista qué no tocar / qué seguir haciendo igual.

## Plan de acción priorizado
1. [Crítico] ...
2. [Alto] ...
3. [Medio] ...

## No verificado / requiere más contexto
Todo lo que no pudiste confirmar con la evidencia disponible, y qué se necesitaría para
verificarlo (acceso, ejecución, documentación adicional).
```
