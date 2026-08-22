Frontend checklist — heuristics, rendimiento y accesibilidad

Prioritarios (implementar antes del release):

1) Imagenes y caching
- Usar CachedImage para avatares y recursos remotos.
- Añadir placeholder y onError fallback.
- Verificar tamaño/resizeMode y dimensiones explícitas.

2) Listas virtualizadas
- Reemplazar mapeos largos por FlatList/SectionList.
- Configurar initialNumToRender, getItemLayout y removeClippedSubviews.

3) Fuentes y carga
- No bloquear arranque por fonts; usar fallback y swap cuando estén listas.

4) Estados y skeletons
- Mostrar Skeleton en place de listas o tarjetas mientras react-query carga.

5) Socket
- Habilitar reconexión/backoff y exponer estado de conexión en UI.

6) Accesibilidad
- Añadir accessibilityLabel/Role, hitSlop y comprobar contraste.

Validación manual
- Probar en iOS device, Android device y Web. Verificar TTI, tiempos de carga imagen y experiencia de scroll.
- Criterios de aceptación: avatar load < 800ms en dev-network, no freezes en scroll con 50 items, accesibilidad básica (VoiceOver/Narrator) para botones principales.
