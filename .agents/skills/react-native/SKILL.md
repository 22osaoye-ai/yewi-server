---
name: react-native
description: Desarrollo de interfaces móviles en React Native, optimización de renderizado, manejo de estado y componentes UI premium y accesibles.
---

# SKILL: REACT NATIVE

## PROPÓSITO

Implementar interfaces y comportamiento móvil manteniendo alto rendimiento, simplicidad visual, soporte para temas (Dark / Light) y consistencia con los estándares de diseño de Yewi.

---

# COMPONENTES

Antes de crear un componente nuevo:

* comprobar reutilización real en el proyecto
* comprobar si mejora la legibilidad
* comprobar si representa una responsabilidad clara

No extraer componentes únicamente para reducir el tamaño visual de un archivo.

---

# ESTADO

Clasificar el estado rigurosamente:

1. **Local (`useState`)**: Estado de formularios, pasos de stepper, acordeones, modales locales.
2. **Compartido entre componentes**: Pasado por props directas.
3. **Global (`Zustand`)**: Sesión de usuario, tokens, tema, estado de conectividad en tiempo real.
4. **Remoto**: Datos del backend obtenidos a través de la capa `services/`.

No usar estado global para estado efímero o local.

No duplicar estado derivable en variables de estado adicionales.

---

# RENDERIZADO Y RENDIMIENTO

Revisar:

* renders innecesarios en listas (`FlatList`, `keyExtractor` estable, `renderItem` memoizado si es pesado)
* creación de objetos o funciones excesivamente costosas dentro del render
* efectos que modifican estado provocando bucles infinitos

No aplicar memoización (`useMemo`, `useCallback`) automáticamente a todo.

Utilizar memoización cuando exista un problema medible de rendimiento o para callbacks pasados a listas largas.

---

# EFECTOS (`useEffect`)

No utilizar `useEffect` para:

* valores derivados (calcular directamente en el cuerpo del componente)
* transformaciones simples de props
* lógica que puede ejecutarse directamente en manejadores de eventos (`onPress`, `onChange`)

Cada efecto debe representar una sincronización con un sistema externo al ciclo de render (suscripción a eventos, temporizadores, APIs nativas).

---

# ESTÁNDAR VISUAL Y UI

* **Tipografía**: Emplear siempre las variantes de fuente oficiales del proyecto (`Satoshi-Black`, `Satoshi-Bold`, `Satoshi-Regular`, `Satoshi-Medium`).
* **Temas**: Respetar `useAppTheme()` y adaptar fondos (`colors.surface`, `colors.background`), textos (`colors.textPrimary`, `colors.textSecondary`) y bordes (`colors.border`) a modo claro y oscuro.
* **Prohibido**: Fondos pastel chillones o saturados fijos que rompan la estética premium de la app.
* **Pantallas de Detalle**: Las vistas de detalle deben ser rutas de navegación dedicadas en Expo Router (`/request-detail`, `/detail`), nunca modales embebidos.

---

# FINALIZACIÓN

Verificar:

* [ ] Estado en la ubicación y ámbito correcto.
* [ ] Navegación fluida y sin pantallas colgadas.
* [ ] Listas funcionales con scroll suave.
* [ ] Efectos estrictamente necesarios y limpios.
* [ ] Estética impecable tanto en modo claro como en modo oscuro.
