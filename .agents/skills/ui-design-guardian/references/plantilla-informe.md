# Plantilla del Informe — Consistencia de Diseño y Usabilidad

```markdown
# Auditoría UI — [pantalla/componente/PR revisado]

## Alcance
Qué se comparó contra qué (sistema de diseño real localizado en X, o "de facto" a partir
del código existente si no hay documento formal). Qué no se pudo revisar.

## Resumen ejecutivo
3-5 líneas: ¿el cambio es consistente con el sistema? Top hallazgos.

## Rupturas de sistema de diseño
| Elemento | Se usó | Debería usar | Evidencia |
|---|---|---|---|

## Duplicación de componentes
| Componente nuevo | Componente existente equivalente | Recomendación |
|---|---|---|

## Heurísticas de usabilidad incumplidas
| Heurística | Pantalla/estado | Qué pasa hoy | Qué debería pasar |
|---|---|---|---|

## Accesibilidad
| Elemento | Problema | Recomendación |
|---|---|---|

## Lo que ya está bien resuelto

## No verificado
Qué no se pudo confirmar contra el sistema de diseño real (por falta de acceso a
Storybook/Figma/tokens) y qué se necesitaría para verificarlo.
```
