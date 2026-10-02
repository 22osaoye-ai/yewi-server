# Cumplimiento y Seguridad de Pagos

## 1. Nunca tocar datos de tarjeta directamente
- ¿El backend propio recibe o almacena en algún momento el número de tarjeta completo,
  CVV, o fecha de expiración? La respuesta correcta casi siempre es que NO debería —
  debe usarse tokenización del lado del cliente (Stripe Elements/Checkout, PayPal SDK,
  etc.) para que el dato sensible viaje directo del navegador del usuario a la pasarela,
  y el backend solo maneje tokens/IDs.
- Si el proyecto maneja datos de tarjeta directamente en algún punto (formularios propios
  sin tokenización), márcalo como bloqueante: implica alcance de cumplimiento PCI DSS
  mucho más exigente (SAQ D en vez de SAQ A), que la mayoría de proyectos no está
  preparado para asumir.
- ¿Se loggean alguna vez datos de tarjeta, tokens completos, o respuestas crudas de la
  pasarela que puedan contener información sensible?

## 2. Alcance de PCI DSS
- Confirma qué "Self-Assessment Questionnaire" (SAQ) le corresponde al proyecto según
  cómo integra la pasarela (esto depende del método de integración exacto — si no estás
  seguro de los requisitos vigentes, búscalo en vez de asumir, porque cambian por
  versión).
- ¿La integración usa un método que mantiene al proyecto fuera del alcance completo de
  PCI (iframes/redirects alojados por la pasarela) o dentro de un alcance más amplio?

## 3. Antifraude y validación
- ¿Hay alguna capa de detección de fraude (la que ofrece la propia pasarela como Radar de
  Stripe, o reglas propias) o el proyecto acepta cualquier intento de pago sin filtro?
- ¿3D Secure / SCA (Strong Customer Authentication) está habilitado donde la regulación
  lo exige (p. ej. pagos en la UE bajo PSD2)? Esto es fácil de pasar por alto y puede
  causar que pagos legítimos se rechacen en producción si no está bien configurado.
- ¿Hay límites o alertas ante patrones anómalos (muchos intentos fallidos seguidos desde
  la misma fuente, montos inusualmente altos)?

## 4. Claves y entornos
- ¿Las claves de API de la pasarela están claramente separadas entre test y producción, y
  es imposible confundirlas (nombres de variable claros, no la misma clave hardcodeada en
  varios lados)?
- ¿Las claves secretas (no las públicas/publishable) viven solo en el backend, nunca
  expuestas al frontend?
- ¿Hay rotación de claves posible sin downtime si una se compromete?

## 5. Facturación y obligaciones fiscales
- Si el proyecto emite facturas: ¿cumple el formato/datos mínimos exigidos en el
  mercado donde opera (esto varía mucho por país — verifica con búsqueda si el usuario
  especifica el mercado y el detalle importa)?
- ¿Se calculan y aplican impuestos (IVA, sales tax, etc.) correctamente según la
  jurisdicción del comprador, no una tasa fija asumida para todos?
- ¿Hay retención de registros de transacciones por el tiempo mínimo legal requerido?

## Cómo reportar
Todo lo relacionado con manejo directo de datos de tarjeta sin tokenización es
automáticamente "Bloqueante de lanzamiento" en el informe final, no solo "Alto" — el
riesgo legal y de seguridad es desproporcionado comparado con el esfuerzo de arreglarlo
(usar el SDK de la pasarela en vez de un formulario propio).
