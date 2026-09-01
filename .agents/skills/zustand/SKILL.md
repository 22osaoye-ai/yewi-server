---
name: zustand
description: Gestión de estado global con Zustand, diseño de stores cohesivos, selectores atómicos y persistencia controlada.
---

# SKILL: ZUSTAND

## PROPÓSITO

Gestionar estado global únicamente cuando sea necesario, manteniendo stores limpios, desacoplados y eficientes en renderizado.

---

# ANTES DE CREAR ESTADO

Determinar la naturaleza del estado:

* **Local**: Exclusivo de un componente o pantalla → usar `useState`.
* **Compartido entre componentes padre/hijo**: Pasado por props directas.
* **Global**: Autenticación, sesión, datos de usuario, estado realtime, tema de la app → usar `Zustand`.
* **Derivado**: Calculable a partir de otro estado → derivar en memoria sin guardarlo como nuevo estado.
* **Remoto**: Datos del servidor → consumir mediante `services/` y almacenar solo si se requiere caché o sesión.

No almacenar globalmente:

* estado exclusivo de un componente (ej. si un modal está abierto o cerrado)
* valores que pueden derivarse directamente
* copias redundantes de datos remotos

---

# STORES

Cada store debe representar un dominio cohesivo (`useAuthStore`, `useRealtimeStore`, etc.).

No crear:

* `UserStore`
* `UserActionsStore`
* `UserStateStore`
* `UserHelperStore`

si una única estructura cohesiva es suficiente.

---

# SELECTORES ATÓMICOS

Consumir únicamente las propiedades o acciones necesarias en cada componente utilizando selectores:

```tsx
// Correcto (solo re-renderiza cuando cambia user):
const user = useAuthStore((state) => state.user);

// Incorrecto (re-renderiza ante cualquier cambio en el store):
const { user, login, logout, isRefreshing, updateProfile } = useAuthStore();
```

Evitar suscripciones amplias a todo el objeto cuando solo se necesita una pequeña parte del store.

---

# ACCIONES

Las acciones deben representar operaciones claras e intencionales sobre el estado:

* `login(credentials)`
* `logout()`
* `updateUser(userData)`

Evitar:

* setters genéricos globales (`setState(...)`) expuestos sin control
* mutaciones arbitrarias directas sin pasar por acciones
* duplicar la misma lógica de transformación en múltiples componentes en vez de centralizarla en el store

---

# PERSISTENCIA (`AsyncStorage` / `SecureStore`)

Persistir únicamente datos estrictamente necesarios entre sesiones:

* tokens de autenticación
* preferencias de usuario guardadas
* caché ligero de arranque

No persistir:

* estado temporal de navegación o UI
* datos volátiles fácilmente recuperables
* información sensible en texto plano (usar `SecureStore` para tokens/secretos)

---

# FINALIZACIÓN

Verificar:

* [ ] Estado correctamente clasificado (global vs local).
* [ ] Store con responsabilidad clara y única.
* [ ] Componentes consumiendo estado mediante selectores atómicos.
* [ ] Acciones descriptivas y centralizadas.
* [ ] Persistencia justificada y segura.
