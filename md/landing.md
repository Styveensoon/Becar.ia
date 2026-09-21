# Landing — Blueprint

Referencia: `becaria_design_system.md`. Este documento no repite tokens, solo dice dónde y cómo
usarlos. Si algo no está aquí, se decide en el design system, no se improvisa.

## Comportamiento de ruta
- Si ya existe sesión válida de Supabase al abrir la app, saltar Landing y entrar directo a Home.
- Landing solo se muestra a usuarios sin sesión.

## Estructura (de arriba hacia abajo)

### 1. Carrusel de imágenes
- Altura: 62% del alto de pantalla, ancho completo, `resizeMode: cover`
- Contenido bajo la status bar (edge-to-edge), sin padding superior
- Implementación: `FlatList` horizontal con `pagingEnabled`, sin librería extra. Auto-avance cada
  4s (`setInterval` + `scrollToIndex`), se pausa si el usuario arrastra manualmente y retoma tras
  3s de inactividad
- 4 slides (imágenes las provee Steve, animación 2D per design system §9)
- `accessibilityLabel` de cada slide = su leyenda, para lectores de pantalla

### 2. Overlay de texto sobre cada imagen
- Degradado inferior cubriendo el 35% inferior de la imagen: `transparent` → `secondary` al 70%
  de opacidad (`expo-linear-gradient`)
- Leyenda: estilo `h1`, color blanco, máx. 2 líneas, alineada a la izquierda, padding horizontal
  `20`, posicionada `16` por encima del indicador de puntos
- Leyendas de las 4 slides:
  1. "Encuentra becas y oportunidades hechas para ti"
  2. "Sugerencias pensadas para ti"
  3. "No vuelvas a llegar tarde a una convocatoria"
  4. "Impulsa tu futuro académico"

### 3. Indicador de puntos (dots)
- Fuera de la imagen, en el área blanca debajo del carrusel (siempre legible, no depende del
  contraste de cada foto)
- Centrado horizontal, margin-top `16`
- Punto activo: `radius-full`, 8x8, color `primary`. Inactivos: 8x8, `secondary-tint`. Gap `8`

### 4. Área de CTA (fija abajo, `bg` blanco, respeta safe-area-bottom)
- Padding `20` en los 4 lados
- Botón primario, ancho completo, alto `52`: **"Quiero unirme"** → navega a Signup. Estilo botón
  primario del design system (fondo `primary`, texto `secondary`)
- Link secundario, margin-top `12`, centrado, sin fondo: **"¿Ya tienes cuenta? Iniciar sesión"**,
  donde "Iniciar sesión" va en `primary-text` con peso Medium, el resto en `text-muted` → navega
  a Login

## Por qué "Quiero unirme" es el botón primario y no "Iniciar sesión"
El landing es la puerta de entrada para usuarios nuevos, ahí es donde más conviene empujar el
registro. Un usuario que vuelve normalmente ya tiene sesión guardada y ni ve este landing (ver
"Comportamiento de ruta" arriba).

## Accesibilidad
- Ambos botones cumplen mínimo de 44x44pt de área táctil (52 de alto ya lo cubre)
- Texto de leyendas con `accessibilityRole="image"` y label descriptivo
