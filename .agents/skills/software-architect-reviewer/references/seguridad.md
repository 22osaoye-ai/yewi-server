# Checklist de Seguridad

Para cada punto: busca evidencia concreta en el código (no asumas). Cuando aplique, usa
`grep`/búsqueda de texto sobre el repo para localizar patrones antes de concluir.

## 1. Gestión de secretos
- ¿Hay credenciales, API keys, tokens o contraseñas hardcodeadas en el código o en el
  historial de git? Busca patrones como `api_key`, `secret`, `password =`, `token =`,
  cadenas base64 largas, y archivos `.env` versionados por error.
- ¿Los secretos se cargan desde variables de entorno o un vault, y NO se loggean nunca
  (ni en logs de error, ni en mensajes de excepción)?
- ¿`.env`, `.env.local`, certificados y llaves privadas están en `.gitignore`?

## 2. Validación e inyección
- ¿Toda entrada de usuario (body, query params, headers, uploads) se valida y sanitiza
  antes de usarse? Busca construcción de queries SQL por concatenación de strings en vez
  de parámetros/ORM, uso de `eval`/`exec`/`os.system`/`subprocess` con input no
  sanitizado, y renderizado de HTML sin escapar (riesgo de XSS).
- ¿Hay protección contra SSRF si el backend hace requests salientes con URLs que vienen
  del usuario (whitelisting de dominios/IP, bloqueo de rangos internos)?
- ¿Se validan tipos, tamaños y formatos de archivos subidos, y se almacenan fuera del
  árbol servido públicamente?

## 3. Dependencias y cadena de suministro
- ¿Existe un archivo de lockfile (`package-lock.json`, `poetry.lock`, `requirements.txt`
  con versiones fijas, etc.)? Las versiones sin fijar son un riesgo de reproducibilidad y
  seguridad.
- ¿Hay dependencias claramente obsoletas o sin mantenimiento? Si necesitas confirmar CVEs
  o versiones actuales de una librería específica, usa búsqueda web — no lo infieras de
  memoria, tu conocimiento de versiones puede estar desactualizado.
- ¿El proyecto tiene algún mecanismo de escaneo de dependencias (Dependabot, `npm audit`,
  `pip-audit`, Snyk, etc.) configurado?

## 4. Transporte y configuración
- ¿Se fuerza HTTPS/TLS en producción? ¿Cookies de sesión con `Secure`, `HttpOnly`,
  `SameSite`?
- ¿Cabeceras de seguridad presentes donde aplique (CSP, `X-Content-Type-Options`,
  `X-Frame-Options` o equivalente moderno)?
- ¿CORS configurado de forma restrictiva (no `*` junto con credenciales)?
- ¿Los mensajes de error en producción evitan filtrar stack traces, rutas internas o
  detalles de infraestructura al cliente?

## 5. Datos sensibles
- ¿Datos personales/sensibles (PII, salud, pagos) se cifran en reposo cuando corresponde?
- ¿Contraseñas de usuarios se guardan con hashing fuerte (bcrypt/argon2/scrypt), nunca en
  texto plano ni con MD5/SHA1 solo?
- ¿Hay logs que capturan datos sensibles sin necesidad (contraseñas, tokens, números de
  tarjeta completos)?

## 6. Superficie de ataque general
- ¿Endpoints de administración/debug están protegidos o eliminados en producción
  (`/debug`, `/admin` sin auth, Swagger/OpenAPI expuesto sin protección si es sensible)?
- ¿Rate limiting o protección contra fuerza bruta en endpoints de login/autenticación?
- ¿Hay CI/CD que ejecuta linters de seguridad o SAST antes de mergear a main?

Para cada hallazgo, cita el archivo y fragmento concreto. Si el proyecto es grande y no
pudiste revisar todo, dilo explícitamente y prioriza las áreas de mayor exposición
(endpoints públicos, auth, manejo de pagos/datos sensibles) sobre código interno de bajo
riesgo.
