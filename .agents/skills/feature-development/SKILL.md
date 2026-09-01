---
name: feature-development
description: Implementación de nuevas capacidades y flujos respetando contratos, límites de módulos, validaciones y arquitectura monorepo.
---

# SKILL: FEATURE DEVELOPMENT

## PROPÓSITO

Construir nuevas funcionalidades de forma correcta, modular y consistente con las convenciones arquitectónicas del proyecto, sin introducir complejidad innecesaria.

---

# CUÁNDO ACTIVAR

Activar cuando:

* se solicite una nueva capacidad funcional o de negocio
* se deba crear un nuevo endpoint, pantalla, servicio o flujo completo
* se extiendan contratos existentes para soportar nuevos casos de uso

---

# CUÁNDO NO ACTIVAR

No activar para:

* resolución de bugs existentes (usar `debugging`)
* refactorización sin cambios de funcionalidad (usar `technical-debt` + `code-review`)
* modificaciones puramente cosméticas de texto o color

---

# PROTOCOLO

## 1. Comprender el Alcance y Convenciones

Antes de escribir código:

* define claramente qué debe hacer la funcionalidad y qué queda fuera del alcance
* inspecciona funcionalidades similares ya implementadas en el proyecto para seguir sus patrones
* identifica las capas afectadas (Frontend, Backend, Base de Datos)

---

## 2. Definir Contratos y Validaciones

* define los tipos y DTOs de entrada y salida con validación estricta (`class-validator` en backend, TypeScript interfaces en frontend)
* asegura que no existan campos inventados o inconsistentes con el dominio
* respeta los mecanismos de autorización y roles vigentes

---

## 3. Implementación Cohesiva por Capas

* **Backend**: controller ligero → service con la lógica de negocio → persistencia en base de datos.
* **Frontend**: API service tipado → pantalla/componente visual adaptativo → estado local o store si aplica.
* **Consistencia**: Asegurar que las respuestas del backend y los hooks del frontend manejen estados de carga, éxito y error de forma homogénea.

---

## 4. Casos Límite y Manejo de Errores

* valida entradas vacías, tipos erróneos o límites numéricos
* maneja errores con códigos HTTP semánticos (`NotFoundException`, `ForbiddenException`, `BadRequestException`)
* no dejes promesas sin capturar ni estados colgados en la UI

---

# ANTI-PATRONES A EVITAR

* **Crear módulos duplicados**: Crear `UserExtraService` cuando la función pertenece a `UsersService`.
* **Mocks y placeholders permanentes**: Dejar strings fijos o datos falsos en vez de conectar con el modelo real.
* **Lógica cruzada**: Colocar lógica de base de datos en controllers o lógica de backend en componentes de React Native.
* **Sobre-ingeniería especulativa**: Crear factories o capas de abstracción para casos de uso que no existen.

---

# CHECKLIST DE FINALIZACIÓN

* [ ] La funcionalidad cumple el requerimiento del usuario de principio a fin.
* [ ] Las entradas están estrictamente validadas con DTOs / tipos.
* [ ] Se han respetado los límites de capas y la arquitectura monorepo.
* [ ] No se han introducido mocks ni datos inventados.
* [ ] Se ha verificado la compilación y funcionamiento del flujo completo.
