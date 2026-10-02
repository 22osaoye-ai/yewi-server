# Detección de Datos y Resultados Inventados (Alucinaciones de Agentes)

Cuando parte del código, la documentación, los tests o los datos de un proyecto fueron
generados por un agente de IA, hay un riesgo específico: contenido que *parece* correcto
y coherente pero que en realidad fue inventado. Esta sección da un método para detectarlo.

## Dónde suelen aparecer las alucinaciones

1. **APIs y librerías inexistentes**: llamadas a métodos, parámetros o paquetes que no
   existen en la versión real de la librería usada. Verifica contra la documentación
   oficial o el propio código fuente de la dependencia instalada (`node_modules`,
   `site-packages`, etc.) — no asumas que compila porque "suena plausible".
2. **Configuración inventada**: variables de entorno, flags de configuración o campos de
   API que el código lee pero que ningún otro archivo del proyecto (ni la doc del
   servicio externo) realmente define o espera.
3. **Comentarios y documentación desincronizados**: docstrings/comentarios que describen
   un comportamiento distinto al que el código realmente implementa (a menudo porque se
   generaron en un paso separado y no se revisaron contra el código final).
4. **Tests que no prueban nada**: tests que hacen `assert True`, mockean tanto que no
   ejercitan la lógica real, o que fueron escritos para pasar en vez de para verificar
   comportamiento. Un test suite "verde" no es evidencia de calidad si los tests están
   vacíos de contenido.
5. **Métricas y benchmarks sin fuente**: números de rendimiento, cobertura de tests,
   "reducción de X%", o resultados de benchmark citados en README/docs/PRs sin un comando,
   log o reporte que los respalde en el repo.
6. **Datos de ejemplo/seed inventados presentados como reales**: nombres, IDs, URLs o
   credenciales de ejemplo que parecen reales (dominios reales, IDs con formato de
   producción) mezclados con datos genuinos, lo que puede confundir a futuros
   desarrolladores sobre qué es de verdad.
7. **Referencias a decisiones o requisitos que no están documentados en ningún lado**:
   comentarios tipo "por requisito del cliente X" o "así lo pidió seguridad" sin ticket,
   ADR (Architecture Decision Record) o documento que lo respalde — puede ser una
   justificación fabricada para una decisión arbitraria.

## Cómo verificar

- **Cruza cada afirmación fuerte con una fuente primaria**: el propio código, la
  documentación oficial de la librería (búscala si hace falta, no la recuerdes de
  memoria), o un comando que puedas ejecutar tú mismo (`npm ls`, `pip show`, correr el
  test, correr el build).
- **Ejecuta lo que puedas**: si tienes entorno de ejecución disponible, corre el build,
  el linter y los tests en vez de asumir que pasan por cómo se ve el código.
- **Distingue "no lo pude verificar" de "está mal"**: si no tienes acceso a ejecutar algo
  o a un servicio externo, repórtalo como "No verificado — requiere ejecución/acceso
  externo" en vez de darlo por válido o inválido.
- **Sospecha más de contenido "demasiado perfecto" o genérico**: docs y comentarios que
  suenan a plantilla, con lenguaje muy pulido pero vago sobre detalles específicos del
  proyecto, son más propensos a haber sido generados sin verificación real.

## Al reportar

Para cada alucinación sospechada o confirmada: cita el archivo/línea, explica qué se
esperaría en su lugar (con fuente), y clasifica como "Confirmado" (lo verificaste contra
una fuente primaria) o "Sospechoso" (patrón típico de alucinación, pero no lo verificaste
del todo — dilo así en vez de afirmarlo como hecho).
