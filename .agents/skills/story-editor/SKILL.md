---
name: story-editor
description: Arquitectura y directrices de implementación para el editor 2D de historias y estados en Yewi (capas, manipulación gestual Reanimated 4, filtros no destructivos y serialización JSON).
---

# SKILL: STORY EDITOR (YEWI 2D CANVAS ENGINE)

## PROPÓSITO Y PRINCIPIOS
El editor de estados/historias de Yewi está diseñado con un modelo arquitectónico de **Lienzo 2D centrado exclusivamente en Foto + Texto**.
Bajo ninguna circunstancia se añadirán opciones de música, audio, vídeo ni elementos ficticios.

---

## 1. SISTEMA DE ENTIDADES Y CAPAS (LAYER SYSTEM)
Cada elemento sobre el lienzo se modela como una entidad desacoplada:

```ts
export type EditorElementType = 'image' | 'text' | 'path';

export interface EditorElement {
  id: string;
  type: EditorElementType;
  x: number; // Coordenada normalizada 0..1 (relativa a pantalla)
  y: number; // Coordenada normalizada 0..1
  scale: number; // Factor de zoom/escala (default 1)
  rotation: number; // Ángulo de rotación en grados (0..360)
  opacity?: number;
  zIndex?: number;
}
```

Para elementos de texto (`TextElement`):
```ts
export interface TextLayerElement extends EditorElement {
  type: 'text';
  text: string;
  fontFamily: string;
  color: string;
  bgStyle: 'badge' | 'solid' | 'transparent';
  align?: 'left' | 'center' | 'right';
}
```

---

## 2. MANIPULACIÓN GESTUAL MULTITÁCTIL (REANIMATED 4 + GESTURE HANDLER)
Toda interacción táctil se procesa mediante gestos simultáneos que operan en el UI thread usando `SharedValue`:

1. **1 Dedo (Pan)**: Desplaza el elemento libremente por el canvas (`translateX`, `translateY`).
2. **2 Dedos (Pinch)**: Escala el elemento proporcionalmente (`scale.value * e.scale`).
3. **2 Dedos (Rotation)**: Rota el elemento en tiempo real (`rotationAngle.value + (e.rotation * 180) / Math.PI`).
4. **Gesto Compuesto**:
   ```ts
   const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture, rotateGesture);
   ```
5. **Normalización**: Al finalizar el gesto (`onEnd`), convertir las coordenadas de pantalla a valores relativos normalizados (0..1) para que el estado se renderice idéntico en cualquier tamaño o densidad de pantalla.

---

## 3. PROCESAMIENTO DE IMAGEN NO DESTRUCTIVO (FILTROS)
* **Regla Inquebrantable**: Los filtros nunca deben sobreescribir ni recortar la foto física en disco de forma destructiva.
* Se almacenan como identificadores de preset (`normal`, `vivid`, `warm`, `cool`, `bw`, `vintage`, `drama`).
* El motor visual aplica la atmósfera y viñeta en tiempo real mediante capas sobre el canvas (`overlayColor`, gradientes SVG de viñeta).

---

## 4. ESTRUCTURA DE LA INTERFAZ (UI PREMIUM)
* **TopBar**:
  - `Volver (←)`: Regresa a la selección de fotos.
  - `Deshacer (↶)` / `Rehacer (↷)`: Historial de acciones y trazos.
  - `Menú (⋯)`: Opciones auxiliares (voltear horizontal, restablecer original).
* **Bottom Toolbar**:
  - `Texto (Aa)`: Abre o edita el texto sobre la imagen.
  - `Filtros (✨)`: Despliega el carrusel horizontal de presets no destructivos.
  - `Pincel (🖌)`: Activa el modo de dibujo vectorial SVG a mano alzada.
  - `Girar (⟳)`: Rota la imagen 90° al instante.
  - `Caption Bar`: Campo de texto para comentario general y botón verde WhatsApp de publicación (`#10B981`).

---

## 5. REGLAS DE PUBLICACIÓN Y VISOR (STATUS VIEWER)
* Los metadatos del estado se serializan en un payload JSON estructurado dentro del campo `caption`:
  ```json
  {
    "userCaption": "...",
    "filter": "vivid",
    "overlay": { "text": "...", "x": 0.5, "y": 0.4, "scale": 1.2, "rotation": 0, "fontFamily": "Satoshi-Bold", "color": "#FFF", "bgStyle": "badge" },
    "paths": [{ "d": "M...", "color": "#FFF" }]
  }
  ```
* El visor [StatusViewerModal.tsx](file:///c:/Users/kali/Documents/Yewi/apps/app/components/chat/StatusViewerModal.tsx) debe interpretar este payload y renderizar cada capa con absoluta fidelidad y sin violar las reglas de hooks de React (todos los `useMemo` y hooks deben declararse antes de cualquier retorno condicional).
