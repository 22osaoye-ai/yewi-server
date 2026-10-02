# Checklist de Autenticación y Autorización

Trata autenticación ("¿quién eres?") y autorización ("¿qué puedes hacer?") como dos
problemas distintos — un proyecto puede tener una bien resuelta y la otra no.

## Autenticación
- ¿Cómo se emiten y validan las sesiones/tokens (JWT, cookies de sesión, OAuth)? Localiza
  el código exacto que verifica el token en cada request.
- Si usa JWT: ¿se valida la firma y el algoritmo esperado (rechaza `alg: none`)? ¿tiene
  expiración razonable? ¿hay forma de revocar tokens antes de su expiración si es
  necesario (logout real, blacklist, rotación)?
- ¿Hay expiración e invalidación de sesión tras inactividad o cambio de contraseña?
- ¿El login está protegido contra fuerza bruta (rate limiting, bloqueo temporal, CAPTCHA
  si aplica) y contra enumeración de usuarios (mensajes de error que no revelan si el
  usuario existe)?
- ¿Hay soporte u opción de MFA para cuentas sensibles/admin?
- Si delega en un proveedor externo (Auth0, Cognito, Firebase Auth, OAuth de terceros):
  ¿se valida correctamente el token/callback del lado del servidor, no solo en el cliente?

## Autorización
- ¿Cada endpoint/acción sensible verifica permisos en el **backend**, no solo se oculta
  en la UI? Esto es el error más común y más grave: busca endpoints que confían en que
  "el frontend no muestra el botón".
- ¿Existe un modelo de permisos claro (roles, ABAC, RBAC) aplicado de forma consistente,
  o cada endpoint reinventa su propia lógica de permisos?
- **IDOR (Insecure Direct Object Reference)**: cuando un endpoint recibe un ID
  (`/api/orders/123`), ¿verifica que el recurso pertenece al usuario autenticado, o
  cualquiera autenticado puede acceder a cualquier ID cambiando el número?
- ¿Los endpoints de administración verifican rol de admin en cada request, no solo al
  cargar el panel?
- En APIs multi-tenant: ¿hay aislamiento real de datos entre tenants a nivel de query
  (no solo a nivel de UI)?
- ¿Principio de menor privilegio aplicado también a nivel de infraestructura (credenciales
  de base de datos, service accounts, permisos de cloud) y no solo a nivel de aplicación?

## Cómo verificar (no asumir)
1. Identifica 2-3 endpoints sensibles representativos (crear/borrar recurso, ver datos de
   otro usuario, acción de admin).
2. Sigue el código desde la ruta hasta la verificación de auth/autorización real.
3. Si no encuentras la verificación, es un hallazgo — no asumas que "seguro está en un
   middleware que no vi"; si sospechas que existe pero no lo localizaste, dilo como "No
   verificado" en vez de darlo por bueno o por malo.

Cada hallazgo debe incluir: el endpoint/acción concreta, qué falta exactamente, y el
impacto (qué podría hacer un atacante autenticado con permisos mínimos o sin ellos).
