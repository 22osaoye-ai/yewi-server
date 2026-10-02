# Checklist de Rendimiento, Eficiencia y Estabilidad a Largo Plazo

## Rendimiento y eficiencia
- **Consultas N+1**: ¿hay loops que hacen una query/llamada de red por iteración en vez de
  batch? Es el problema de rendimiento más común en apps con ORM.
- **Índices de base de datos**: ¿las columnas usadas en `WHERE`, `JOIN` y `ORDER BY` de las
  queries más frecuentes tienen índice? ¿hay queries que hacen full table scan sobre tablas
  grandes?
- **Complejidad algorítmica**: en rutas calientes (hot paths) o sobre datasets grandes,
  ¿hay algoritmos O(n²) o peor donde una estructura de datos distinta lo resolvería en
  O(n log n) o O(n)?
- **Caching**: ¿hay cache para datos costosos de calcular/consultar y que cambian poco?
  ¿invalidación de cache correcta (no sirve cache que nunca se invalida ni cache que se
  invalida tan seguido que no sirve de nada)?
- **Recursos**: ¿conexiones a base de datos, archivos, sockets se cierran siempre (incluso
  en el camino de error)? Busca fugas de memoria/handles: listeners que nunca se remueven,
  timers que nunca se limpian, pools de conexión mal configurados.
- **Operaciones bloqueantes**: en runtimes de un solo hilo o basados en eventos (Node.js,
  asyncio), ¿hay operaciones síncronas/bloqueantes (I/O de disco, cálculo pesado) en el
  camino crítico de requests?
- **Payloads y transferencia**: ¿respuestas de API devuelven solo lo necesario o
  sobre-fetchean datos? ¿hay paginación en listados que pueden crecer sin límite?

## Estabilidad y mantenibilidad a largo plazo
- **Manejo de errores**: ¿los errores se capturan y manejan de forma consistente, o hay
  `catch` vacíos / errores silenciados que ocultan fallos reales?
- **Observabilidad**: ¿hay logging estructurado y métricas mínimas para diagnosticar
  problemas en producción sin acceso directo al servidor? ¿health checks?
- **Tests**: ¿existe suite de tests automatizados? ¿cubre los caminos críticos (no solo
  el happy path)? Un proyecto sin tests no es "inestable" por definición, pero sí de alto
  riesgo para cambios futuros — dilo así, sin inventar un porcentaje de cobertura que no
  mediste.
- **Acoplamiento y capas**: ¿la lógica de negocio está mezclada con la capa de
  presentación/infraestructura de forma que dificulta cambiarla o testearla? ¿hay
  dependencias circulares entre módulos?
- **Configuración por entorno**: ¿dev/staging/producción se configuran por variables de
  entorno o config externa, sin valores hardcodeados que obliguen a tocar código para
  desplegar?
- **Migraciones de base de datos**: ¿son versionadas, reversibles y aplicables sin downtime
  cuando el esquema cambia?
- **Puntos únicos de fallo**: ¿hay dependencias externas (servicio de terceros, cola,
  caché) sin timeout, reintento con backoff, o fallback, que puedan tumbar todo el sistema
  si fallan?
- **Deuda técnica visible**: TODOs/FIXMEs viejos, código comentado, "hacks temporales" que
  llevan tiempo ahí — no son graves por sí solos, pero indícalos si se acumulan en zonas
  críticas.

## Cómo priorizar
No todo lo anterior aplica igual a un proyecto pequeño y a uno con tráfico alto. Antes de
marcar algo como Alto/Crítico, considera la escala real del proyecto (si la conoces) y
dilo: "esto es crítico si el tráfico crece 10x" es distinto a "esto ya está causando
timeouts hoy".
