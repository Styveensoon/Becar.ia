# Personalización — Blueprint (avatar + color + intereses)

Referencia: `CLAUDE.md` (tokens de diseño y modelo de datos). No repite valores, solo dice
dónde y cómo usarlos.

## Dónde vive en el flujo

```
Signup (correo, contraseña, mote, rango_edad, nivel_educativo)
  → se crea sesión + fila en `profiles` vía trigger
  → Onboarding paso 1/2: Avatar
  → Onboarding paso 2/2: Intereses
  → router.replace a Home (NO push, para que "atrás" no regrese al onboarding)
```

Login (usuarios que vuelven) **no** pasa por aquí, va directo a Home. Este flujo solo ocurre
una vez, justo después de crear la cuenta.

Ambos pasos hacen `UPDATE` sobre la misma fila de `profiles` que ya creó el trigger del signup,
no `INSERT` nueva.

## Estructura común a los 2 pasos

- Sin botón "Atrás" ni "Saltar". Es corto (2 pantallas), y avatar + intereses alimentan el
  motor de sugerencias, no son opcionales.
- Header: barra de progreso de 2 segmentos arriba, centrada, ancho `60%` de pantalla, alto `4`,
  `radius-full`. Segmento completado: `primary`. Pendiente: `secondary-tint`.
- Padding horizontal de pantalla: `20`.

---

## Paso 1/2 — Avatar y color

### Contenido
- Título `display`, margin-top `24`: "Elige tu estilo"
- Subtítulo `body` `text-muted`, margin-top `4`, margin-bottom `32`: "Así te vamos a reconocer
  en la app"

### Preview
- Círculo grande, `120x120`, centrado, margin-bottom `24`: muestra el avatar seleccionado sobre
  el color de perfil seleccionado en vivo, se actualiza al tocar cualquiera de las dos opciones
  de abajo

### Abanico de color (6 opciones)
- Label `caption` `text-muted`, margin-bottom `12`: "Color de tu perfil"
- 6 círculos de `48x48`, `radius-full`, arreglados en semicírculo/arco arriba del centro (no en
  fila recta), como un abanico: rotación progresiva de cada swatch entre `-40°` y `40°`
  respecto al centro, ligera superposición entre ellos (como cartas en mano)
- Entrada animada: aparecen en cascada, spring, delay `40` entre cada uno (mismo lenguaje de
  animación que el resto de la app, sin exagerar)
- Estado sin seleccionar: tamaño base
- Estado seleccionado: scale `1.15`, anillo blanco de `3px` alrededor (no `primary`, el swatch
  ya es color, el anillo blanco es lo que se ve limpio sobre cualquiera de los 6)
- Paleta (tokens nuevos, independientes de los semánticos de status, no reutilizar `success`/
  `info` aquí aunque el hex se parezca):
  - `profile-orange` `#FF7A33`
  - `profile-yellow` `#FFC145`
  - `profile-green` `#6BC28C`
  - `profile-blue` `#5B9BD5`
  - `profile-pink` `#F2789A`
  - `profile-purple` `#9B8AE0`

### Grid de avatares
- 12 opciones, grid de 3 columnas x 4 filas, gap `16` horizontal y vertical, margin-top `24`
  (debajo del abanico de color)
- Cada avatar: círculo `72x72`, `radius-full`, imagen del set predefinido de ilustraciones con
  fondo transparente (mismo estilo 2D flat que el carrusel del Landing, ver `CLAUDE.md` §9)
- Estado sin seleccionar: borde `1.5px solid border`
- Estado seleccionado: borde `3px solid primary`, ligero scale-up (1.05) con spring, sin sombra
  extra
- `accessibilityLabel` por avatar, ej. "Avatar 3 de 12"

### Acción
- Botón primario ancho completo, alto `52`, margin-top `32`: **"Continuar"**. Disabled hasta
  seleccionar avatar y color

---

## Paso 2/2 — Intereses

### Contenido
- Título `display`, margin-top `24`: "¿Qué te interesa?"
- Subtítulo `body` `text-muted`, margin-top `4`, margin-bottom `32`: "Elige al menos 2, así te
  sugerimos mejores oportunidades"

### Chips de interés (selección múltiple)
- Layout de wrap (flexWrap), gap `8` horizontal y vertical, alineados a la izquierda
- Estilo "chip selector" del design system (`CLAUDE.md` §7): sin seleccionar = fondo `bg`,
  borde `1.5px solid border`, texto `text-muted`. Seleccionado = fondo `primary-tint`, borde
  `1.5px solid primary`, texto `primary-text` Medium
- Lista fija de 6 categorías (agrupadas más amplio que antes para caber en 6): "Ciencias y
  Tecnología", "Artes y Humanidades", "Negocios y Emprendimiento", "Salud y Bienestar", "Idiomas
  y Comunicación", "Deportes, Voluntariado y Medio Ambiente"

### Texto de ayuda / validación
- Debajo de los chips, `caption`: mientras hay menos de 2 seleccionados, `text-muted`:
  "Selecciona al menos 2 (llevas X)". Al llegar a 2 o más, cambia a `success`: "Listo, puedes
  continuar"

### Campo opcional: institución
- Margin-top `32`. Label `caption` `text-muted`: "¿En qué institución estudias? (opcional)"
- Input de texto normal (spec de input del design system), placeholder: "Nombre de tu escuela"
- Sin validación, puede quedar vacío. No afecta el estado disabled del botón, ese depende solo
  de los intereses
- Guardar en `profiles.institucion` (nullable). RLS igual que el resto de la tabla, no se
  expone en ninguna vista pública ni se manda a analytics/logs

### Acción
- Botón primario ancho completo, alto `52`, margin-top `32`: **"Empezar a explorar"**. Disabled
  hasta seleccionar mínimo 2 intereses (la institución no bloquea el botón). Al presionar:
  `UPDATE profiles SET avatar_id, intereses, institucion` y `router.replace('/home')`
