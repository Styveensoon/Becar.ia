# CLAUDE.md

Este archivo se lee junto con `AGENTS.md` (ese trae las reglas de tooling de Expo/RN/EAS, no
está duplicado aquí). Este archivo es la fuente única de verdad del producto: lógica de la app
y sistema de diseño completo. No necesitas abrir otros `.md` del repo para construir pantallas,
todo lo que hace falta está aquí.

---

# PARTE 1 — Qué es y cómo funciona

## Qué es

Becar.ia: app móvil (React Native + Expo, para Play Store) que reúne becas, movilidades
internacionales, concursos, certificaciones y otras oportunidades para estudiantes de nivel
universitario y medio superior. El problema que resuelve: que no se les pasen las fechas de
convocatorias por enterarse tarde.

Stack: Expo SDK 57, React Native 0.86, TypeScript, Expo Router, Supabase (Auth + Postgres +
Edge Functions).

Audiencia declarada en Play Console: mixta, 13-17 y 18+. Esto trae reglas de datos abajo que
no son opcionales.

## Mapa de navegación

```
Sin sesión:
  Landing → (botón "Quiero unirme") → Signup → Home
          → (link "Iniciar sesión")  → Login  → Home

Con sesión (auto-skip de Landing/Login/Signup):
  Tab Navigator
    ├── Home        (destacadas + sugerencias personalizadas)
    ├── Buscador     (búsqueda + filtro por categoría)
    ├── Guardadas    (oportunidades guardadas + vista de calendario)
    └── Perfil       (editar avatar/intereses/mote, cerrar sesión, borrar cuenta)
```

Regla de ruteo: al abrir la app, verificar sesión de Supabase antes de decidir la pantalla
inicial. Sesión válida → Home directo. Sin sesión → Landing.

## Modelo de datos (Supabase / Postgres)

No es el schema final, es la referencia de campos esperados. Cualquier tabla nueva lleva RLS
desde que se crea (ver Parte 1 → Reglas de datos).

```
profiles
  id              uuid (= auth.users.id)
  mote            text            -- nunca nombre real
  rango_edad      text            -- '13-15' | '16-17' | '18+'
  nivel_educativo text            -- 'secundaria' | 'prepa' | 'universidad'
  avatar_id       text            -- referencia a un set predefinido, no upload de foto
  color           text            -- uno de los 6 tokens profile-* (ver design system §1)
  intereses       text[]
  institucion     text nullable   -- opcional, nombre exacto de la escuela. RLS, nunca en logs/analytics
  created_at      timestamptz

fuentes
  id          uuid
  nombre      text
  url_base    text
  confiable   boolean             -- fuente ya validada por el equipo
  created_at  timestamptz

oportunidades
  id             uuid
  titulo         text
  descripcion    text
  categoria      text             -- 'beca' | 'movilidad' | 'concurso' | 'certificacion' | 'evento'
  institucion    text
  fecha_limite   date
  monto          text nullable
  requisitos     text
  url_fuente     text
  fuente_id      uuid  -> fuentes.id
  estado         text             -- 'pendiente_validar' | 'publicado' | 'rechazado'
  created_at     timestamptz

guardadas
  id               uuid
  user_id          uuid -> profiles.id
  oportunidad_id   uuid -> oportunidades.id
  created_at       timestamptz
```

Reglas de consulta: Home, Buscador y Sugerencias **solo** leen `oportunidades` con
`estado = 'publicado'`. Nunca mostrar `pendiente_validar` ni `rechazado` en UI de usuario final.

## Autenticación

- Supabase Auth: email + contraseña, y OAuth con Google.
- Token de sesión en Expo SecureStore, nunca en AsyncStorage plano.
- Verificación de correo obligatoria antes de considerar la cuenta activa.
- El hash de contraseña lo maneja Supabase Auth solo, nunca se toca a mano.

## Pipeline de datos (oportunidades)

1. Edge Function con cron semanal llama a una API de IA con búsqueda web.
2. El modelo responde en un schema estructurado fijo (título, categoría, institución, fecha
   límite, monto, requisitos, url de la fuente). Nunca texto libre sin URL de respaldo.
3. Se inserta en `oportunidades` con `estado = 'pendiente_validar'`.
4. Alguien del equipo valida contra la fuente citada campo por campo (no contra el resumen del
   modelo) y cambia el estado a `publicado` o `rechazado`.
5. Solo lo `publicado` es visible para usuarios.

## Motor de sugerencias

Score simple sobre `oportunidades` publicadas cruzando `profiles.intereses` y
`profiles.nivel_educativo` contra `categoria` e `institucion`/`requisitos` de la oportunidad.
Las de mayor score alimentan la sección de sugerencias en Home.

## Pantallas: Landing, Login, Signup (resumen operativo)

**Landing**: carrusel de 4 imágenes (62% del alto de pantalla, `FlatList` horizontal con
`pagingEnabled`, autoavance 4s), overlay con degradado inferior y leyenda, dots debajo del
carrusel (no sobre la imagen), botón primario "Quiero unirme" → Signup, link secundario
"¿Ya tienes cuenta? Iniciar sesión" → Login. Solo se muestra sin sesión activa.

**Login**: correo + contraseña (con toggle de mostrar/ocultar), link "¿Olvidaste tu
contraseña?", botón primario "Iniciar sesión" (disabled hasta llenar ambos campos), divider "o",
botón de Google, footer a Signup. Error de credenciales en banner sobre el botón.

**Signup**: correo, contraseña + confirmar contraseña, mote (con ayuda: "no uses tu nombre
completo"), selector de rango de edad (chips: 13-15 / 16-17 / 18+), selector de nivel educativo
(chips: Secundaria / Prepa / Universidad), checkbox de Términos y Aviso de Privacidad
(obligatorio para habilitar el botón), botón primario "Crear cuenta", divider + Google, footer
a Login.

Ambas con `KeyboardAvoidingView` + `ScrollView` para que el teclado no tape los campos.

---

# PARTE 2 — Reglas de datos y seguridad (no negociables)

- Row Level Security (RLS) activado en **cada** tabla desde que se crea. No "después lo
  activamos".
- Nunca guardar fecha de nacimiento exacta. Solo `rango_edad` autodeclarado.
- Nunca pedir nombre real como campo obligatorio, usar `mote`.
- Avatar = selección de un set predefinido, nunca upload de foto de perfil.
- Nunca hardcodear la anon key ni ninguna key de Supabase en código fuente. Van en variables de
  entorno (`app.config.ts` + `.env`, `.env` en `.gitignore`).
- Nada de SDKs de ads con targeting personalizado a menores de 18 (política de Google Ads a
  nivel plataforma, no solo Play).
- La app permite crear cuenta, así que necesita permitir borrar cuenta y datos asociados tanto
  desde dentro de la app como desde un link web (requisito de Play Store, no opcional).
- Aviso de Privacidad accesible sin necesidad de iniciar sesión.

---

# PARTE 3 — Sistema de diseño completo

Línea de diseño: **flat minimalista con sombra suave de elevación** (no claymorphism, no
neumorphism). Formas redondeadas, color sólido, una sola sombra ligera por tarjeta. Lo
"juvenil" lo aportan el color y las ilustraciones 2D, no el chrome de la UI.

## 1. Color

### Marca

| Token | Hex | Uso |
|---|---|---|
| `primary` | `#FF7A33` | SOLO fondos/rellenos: botones, tab activo, ilustraciones. Nunca como color de texto |
| `primary-text` | `#C24A0F` | Naranja para texto/íconos/links (contraste AA 4.9:1 sobre blanco; `primary` puro da 2.6:1, no pasa) |
| `primary-pressed` | `#E85D1F` | Estado presionado/hover del primario |
| `primary-tint` | `#FFE7D6` | Fondos suaves, chips, estados "seleccionado" ligero |
| `secondary` | `#2B2D42` | Texto principal, headers, navbar, botones secundarios (outline), texto sobre `primary` |
| `secondary-tint` | `#E9EAF0` | Fondos secundarios, separadores sutiles |
| `accent` | `#FFC145` | Highlights puntuales: badges "nuevo", favoritos, estrellas. Nunca como fondo grande |

### Semánticos (no mezclar con primary/accent)

| Token | Hex | Uso |
|---|---|---|
| `success` | `#4CAF6D` | Verificado, guardado con éxito, fecha lejana |
| `warning` | `#F2A93C` | Fecha próxima a vencer (7-3 días) |
| `danger` | `#E5484D` | Urgente / vence en menos de 3 días. Único uso permitido del rojo |
| `info` | `#3B82C4` | Mensajes informativos, tooltips |

### Neutrales

| Token | Hex | Uso |
|---|---|---|
| `bg` | `#FFFFFF` | Fondo base |
| `bg-alt` | `#FAFAFA` | Fondo alterno |
| `border` | `#E7E7EC` | Bordes de inputs, separadores, borde sutil de card |
| `text-muted` | `#8A8B99` | Texto secundario, placeholders, metadatos |
| `text` | `#2B2D42` | Texto principal (= `secondary`) |

**Regla de convivencia:** `primary` para fondos de acción. `primary-text` para texto/links en
naranja. `secondary` para estructura y texto. `accent` con moderación. `danger` reservado
estrictamente para urgencia de fecha.

### Colores de perfil (independientes de marca y de semánticos)

Solo para el fondo del avatar en personalización, no usar en ningún otro contexto de la UI.

| Token | Hex |
|---|---|
| `profile-orange` | `#FF7A33` |
| `profile-yellow` | `#FFC145` |
| `profile-green` | `#6BC28C` |
| `profile-blue` | `#5B9BD5` |
| `profile-pink` | `#F2789A` |
| `profile-purple` | `#9B8AE0` |

## 2. Tipografía

Una sola familia para todo (menos peso de bundle en Expo):

- **Familia:** Poppins, vía `@expo-google-fonts/poppins`
- Pesos: Regular (400), Medium (500), SemiBold (600), Bold (700). No cargar más de 4 pesos.

| Estilo | Peso | Tamaño | Uso |
|---|---|---|---|
| `display` | Bold | 28 | Títulos de pantalla |
| `h1` | SemiBold | 22 | Títulos de sección |
| `h2` | SemiBold | 18 | Títulos de card |
| `body` | Regular | 15 | Párrafo, descripciones |
| `body-medium` | Medium | 15 | Énfasis dentro de párrafo |
| `caption` | Regular | 13 | Metadatos, fechas |
| `button` | SemiBold | 15 | Texto de botones |

## 3. Espaciado

Escala base 4px: `4 · 8 · 12 · 16 · 24 · 32 · 48`

- Padding interno de card: `16`
- Separación entre cards en lista: `12`
- Padding de pantalla (márgenes laterales): `20`
- Separación entre secciones: `32`

## 4. Radios

| Token | Valor | Uso |
|---|---|---|
| `radius-sm` | 8 | Inputs pequeños, chips rectangulares |
| `radius-md` | 12 | Botones, inputs |
| `radius-lg` | 16 | Cards |
| `radius-xl` | 20 | Modales, sheets |
| `radius-full` | 999 | Chips/badges píldora, avatar, botón de ícono |

## 5. Sombra (una sola, sin capas)

```js
// React Native — iOS lee shadow*, Android lee elevation, usar ambas
const cardShadow = {
  shadowColor: '#2B2D42',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3, // Android
};
```

Elementos flotantes (FAB, modal): `shadowOpacity: 0.12`, `elevation: 6`. No usar sombra dentro
de una card (evitar sombra-sobre-sombra). No apilar sombras ni usar gradientes para profundidad.

## 6. Bordes

Sombra por encima de borde para separar cards del fondo. Borde de 1px solo cuando:
- Un input necesita marcar su área interactiva: `1.5px solid border`, cambia a
  `1.5px solid primary` en foco.
- Dos superficies del mismo color quedan juntas sin espacio.

## 7. Componentes

**Card de oportunidad**
- Fondo `bg`, `radius-lg`, `cardShadow`, padding `16`
- Chip de categoría arriba-izquierda: fondo `primary-tint`, texto `primary-text`, `radius-full`
- Ícono de guardar (bookmark) arriba-derecha, toca sin abrir la card
- Título `h2`, 2 líneas máx con ellipsis
- Badge de fecha límite: `success` (>7 días) / `warning` (3-7 días) / `danger` (<3 días)

**Botones**
- Primario: fondo `primary`, texto `secondary` (navy, NO blanco, falla contraste), `radius-md`
- Secundario: fondo transparente, borde `1.5px solid secondary`, texto `secondary`
- Texto/ghost: sin fondo ni borde, texto `primary-text`
- Disabled: fondo `secondary-tint`, texto `text-muted`

**Inputs**
- `radius-md`, borde `1.5px solid border`, padding vertical `12` horizontal `16`
- Foco: borde `primary`, sin glow ni sombra extra
- Error: borde `danger`, texto de ayuda `caption` `danger` debajo

**Chips / badges**
- `radius-full`, padding `4` vertical `12` horizontal, `caption` Medium
- Categoría: fondo `primary-tint` / texto `primary-text`
- Urgencia: fondo del semántico al 15% opacidad / texto del semántico sólido
- Selector (edad, nivel educativo): sin seleccionar = fondo `bg`, borde `1.5px solid border`,
  texto `text-muted`. Seleccionado = fondo `primary-tint`, borde `1.5px solid primary`, texto
  `primary-text` Medium

**Tab bar**
- Fondo `bg`, borde superior `1px solid border` (no sombra)
- Ícono + label, activo `primary`, inactivo `text-muted`

## 8. Iconografía

**Ionicons** variante rounded/outline vía `@expo/vector-icons` (ya incluido con Expo, no sumar
otra librería de íconos). Grosor de trazo medio, nunca ultra-fino.

## 9. Ilustración

2D flat, formas redondeadas, sin o con contorno muy sutil. Priorizar sets con naranjas/amarillos
cálidos en su paleta, o recolorear elementos clave a `primary`/`accent`.

Overlay de texto sobre imagen (carrusel): degradado inferior (`transparent` → `secondary` al
70% de opacidad), texto blanco encima. No usar blur sobre toda la imagen, con arte de colores
planos se ve manchado.

## 10. Glassmorphism y alcance de tendencias 2026

`expo-blur` (soportado en Expo Go) solo en superficies flotantes: bottom sheet de filtros,
modales de confirmación. Nunca en cards base ni fondo de pantalla completa.

Fuera de alcance a propósito: 3D interactivo, AR, voice UI. Necesitan dev client custom (no
funcionan en Expo Go managed) y no aportan al objetivo de la app.

## 11. Qué NO hacer

- Sombras multicapa ni bordes biselados (clay/neumorphism)
- Gradientes en botones o cards
- `danger` (rojo) fuera del contexto de urgencia de fecha
- Más de una familia tipográfica
- Blur de imagen completa para overlays de texto
- Texto blanco sobre `primary` (falla contraste WCAG AA)

---

# PARTE 4 — Convenciones de código

- Componentes reutilizables (Button, Card, Input, Chip) en `src/components/`, fuera de
  `src/app/` (que Expo Router reserva para rutas).
- Un componente por archivo, nombre del archivo = nombre del componente.
- Tipar props con TypeScript, nada de `any` sin comentario que lo justifique.
- Correr lint y typecheck antes de dar una tarea por terminada (ver `AGENTS.md` para comandos).

# PARTE 5 — Equipo

Scrum, roadmap y sprints viven en el Excel del proyecto, no en este repo. Si una tarea no está
clara, preguntar antes que asumir alcance.