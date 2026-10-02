# Corrección y Fiabilidad de Pagos

El objetivo de esta checklist es una pregunta simple pero exigente: **¿puede este sistema
cobrar de más, cobrar de menos, cobrar dos veces, o perder el registro de un cobro?**
Casi todos los bugs graves de pagos vienen de no manejar duplicados, fallos de red a
mitad de una operación, o desincronización entre lo que dice el proveedor de pago y lo
que dice la base de datos propia.

## 1. Idempotencia
- ¿Cada operación de cobro/creación de cargo usa una clave de idempotencia (idempotency
  key) al llamar a la pasarela, para que un reintento de red no genere un cobro
  duplicado? Busca cómo se genera esa clave: debe ser estable por intento de compra
  (mismo pedido = misma clave), no aleatoria en cada llamada.
- Si el usuario hace doble clic en "pagar" o reintenta tras un timeout, ¿el backend lo
  detecta y evita procesar el pago dos veces?
- ¿Los webhooks de la pasarela se procesan de forma idempotente? Las pasarelas pueden
  reenviar el mismo evento más de una vez — si el handler no verifica si ya procesó ese
  `event_id`, puede aplicar el efecto (activar suscripción, marcar pedido pagado, enviar
  producto) dos veces.

## 2. Webhooks como fuente de verdad
- ¿El estado "pagado" de un pedido se confirma vía webhook/callback del proveedor, o solo
  vía la respuesta síncrona al frontend? Confiar solo en la respuesta del cliente es
  frágil (el usuario puede cerrar la pestaña justo después de pagar, antes de que el
  frontend avise al backend).
- ¿Se verifica la firma/autenticidad de cada webhook entrante (no solo se confía en el
  payload porque "vino de la URL correcta")? Un webhook sin verificación de firma es un
  endpoint que cualquiera puede llamar para simular un pago exitoso.
- ¿Hay manejo explícito para webhooks que llegan fuera de orden o repetidos?
- ¿Qué pasa si el webhook nunca llega (falla de red, la pasarela tiene un incidente)? ¿hay
  reconciliación periódica (polling de estado, job que compara contra la pasarela) o el
  pedido queda "pendiente" para siempre?

## 3. Manejo de fallos y estados intermedios
- ¿Existe un estado explícito para "pago en proceso / incierto" distinto de "pagado" y
  "fallido"? Si una llamada a la pasarela falla por timeout, el pago pudo haberse
  procesado igual del lado del proveedor — tratarlo como "fallido" sin verificar puede
  llevar a cobrar de nuevo.
- ¿Los reintentos automáticos (si existen) verifican primero el estado real antes de
  reintentar el cobro?
- ¿Hay logs/auditoría suficiente para reconstruir qué pasó con un pago específico ante un
  reclamo (sin tener que adivinar)?

## 4. Dinero: precisión y consistencia
- ¿Los montos se manejan en unidades enteras (centavos) o con un tipo decimal preciso, en
  vez de `float`? Usar `float` para dinero es una fuente clásica de errores de redondeo.
- ¿La moneda se maneja explícitamente en cada monto (no se asume una moneda fija si el
  proyecto opera en varios países)?
- ¿El monto que se cobra realmente en la pasarela coincide exactamente con el monto
  calculado en el backend (no se confía en un monto que viene del frontend/cliente sin
  recalcularlo en el servidor)? Un monto editable desde el cliente sin validación en
  servidor es una vulnerabilidad seria, no solo un bug.
- Si hay impuestos, descuentos o conversión de moneda: ¿el cálculo es consistente entre lo
  que se le muestra al usuario, lo que se cobra, y lo que se factura?

## 5. Reembolsos y cancelaciones
- ¿Hay un flujo real de reembolso (parcial y total) y queda reflejado tanto en la
  pasarela como en el estado interno del pedido?
- ¿Cancelar una suscripción detiene realmente los cobros futuros (no solo cambia un flag
  en la UI)?
- ¿Reembolsos duplicados están protegidos igual que los cobros duplicados?

## 6. Suscripciones y cobros recurrentes (si aplica)
- ¿Qué pasa cuando falla un cobro recurrente (tarjeta vencida, fondos insuficientes)? ¿hay
  reintentos con backoff, notificación al usuario, y un período de gracia antes de
  cancelar el acceso?
- ¿Cambios de plan (upgrade/downgrade) prorratean correctamente sin cobrar de más o
  regalar el resto del período sin querer?
- ¿La cancelación por el usuario y la cancelación por fallo de pago dejan registros
  distintos y auditable (para soporte y para métricas)?

## Cómo verificar
Identifica el flujo de pago principal y síguelo end-to-end en el código: creación del
intento de pago → confirmación (webhook o síncrona) → actualización de estado interno →
qué pasa si cada paso falla. Para cada punto de fallo posible, verifica si hay manejo
explícito o si el sistema simplemente asume que "no va a fallar".
