---
name: image-editor
description: Directrices de procesamiento, rotación, filtros no destructivos y manipulación de imágenes para historias en React Native y Expo.
---

# SKILL: IMAGE EDITOR (YEWI MOBILE)

## PROPÓSITO
Proporcionar un estándar técnico de manipulación de fotografías para el marketplace Yewi, garantizando rendimiento a 60/120fps, cero recortes destructivos involuntarios y fidelidad visual en dispositivos iOS y Android.

---

## 1. DIMENSIONES NATURALES (SIN AUTO-RECORTES FORZADOS)
* **Regla Central**: Al cargar una foto seleccionada por el profesional, debe visualizarse con su dimensión natural completa usando `contentFit="contain"`.
* **Prohibido**: Forzar recortes cuadrados automáticos (`allowsEditing: true` en el selector de fotos) que corten partes de la reforma o trabajo del profesional.

---

## 2. FILTROS NO DESTRUCTIVOS
* El procesamiento visual en vivo debe ser no destructivo.
* No recomprimir ni escribir archivos temporales en disco por cada cambio de filtro.
* Implementar capas de color ambiental (`overlayColor`) y máscaras vectoriales SVG (viñetas radiales) directamente en el lienzo.
* Guardar el ID del filtro en el payload del estado para que el visor lo renderice de forma instantánea y sin latencia.

---

## 3. TRANSFORMACIONES GEOMÉTRICAS (ROTACIÓN Y FLIP)
* Para rotaciones de 90° o volteos horizontales, utilizar `expo-image-manipulator` (`manipulateAsync`) con compresión de alta calidad (`SaveFormat.JPEG`, calidad `0.9`).
* Mantener siempre una referencia a `originalMediaUri` para permitir que el usuario pueda restablecer la fotografía original en cualquier momento.

---

## 4. RENDIMIENTO DE RENDERIZADO
* Utilizar `expo-image` en lugar de `<Image>` nativo estándar para beneficiarse de la decodificación en segundo plano y caché en memoria/disco.
* Evitar redimensionamientos de bitmap en el hilo principal durante gestos de zoom o rotación del usuario.
