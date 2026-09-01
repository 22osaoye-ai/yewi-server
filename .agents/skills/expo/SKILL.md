---
name: expo
description: Configuración del entorno Expo, Expo Router, plugins, APIs nativas compatibles y dependencias multiplataforma iOS/Android.
---

# SKILL: EXPO

## PROPÓSITO

Trabajar con Expo utilizando primero las capacidades compatibles con el proyecto existente y gestionando Expo Router de forma robusta.

---

# PROTOCOLO

Antes de añadir una librería:

1. comprobar si el ecosistema Expo ya proporciona un módulo oficial (`expo-*`)
2. comprobar compatibilidad con la versión del SDK instalado en `apps/app/package.json`
3. comprobar soporte en iOS y Android
4. evaluar si requiere cambios en `app.json` o configuración nativa

No asumir compatibilidad con librerías nativas de React Native sin verificar soporte en Expo Managed Workflow.

---

# NAVEGACIÓN CON EXPO ROUTER

* Estructura basada en ficheros bajo `apps/app/app/`.
* Pantallas agrupadas por carpetas y layouts (`_layout.tsx`, `(tabs)`, `auth`).
* Proteger rutas auténticadas verificando `inAppRoute` y estado de sesión en `_layout.tsx`.
* Utilizar `useRouter()` (`router.push()`, `router.replace()`, `router.back()`) de forma semántica.

---

# CONFIGURACIÓN (`app.json`)

Antes de modificar:

* app configuration
* plugins (`expo-camera`, `expo-location`, `expo-notifications`, etc.)
* permisos en `ios.infoPlist` o `android.permissions`
* esquema de URLs y deep linking (`scheme`)

evaluar qué plataformas se ven afectadas.

No modificar configuración global para resolver un problema local sin justificarlo.

---

# DEPENDENCIAS

Preferir paquetes oficiales de Expo (`npx expo install <paquete>`) para garantizar versiones alineadas con el SDK.

No instalar paquetes que requieran configuraciones nativas incompatibles o dependencias duplicadas.

---

# FINALIZACIÓN

Verificar:

* [ ] Compatibilidad estricta con el SDK de Expo instalado.
* [ ] Configuración de `app.json` y `_layout.tsx` sin conflictos.
* [ ] Correcto enrutamiento de Expo Router en todas las rutas afectadas.
* [ ] Sin dependencias nativas rotas ni alertas de versión.
