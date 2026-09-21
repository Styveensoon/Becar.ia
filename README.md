<div align="center">

# Becar.ia

**Becas, movilidades, concursos y certificaciones para estudiantes. Sin que se te pase ninguna fecha límite.**

![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Postgres-3ECF8E?logo=supabase&logoColor=white)
![Estado](https://img.shields.io/badge/estado-en%20desarrollo-FF7A33)

</div>

---

## 🎯 ¿Qué es?

Becar.ia es una app móvil para Android, que estará disponible en Play Store, y reúne en un solo lugar becas, movilidades
internacionales, concursos, certificaciones y otras oportunidades para estudiantes de **secundaria, prepa y
universidad**.

El problema que resuelve es simple: a muchos estudiantes se les pasan las convocatorias por enterarse tarde.
Becar.ia las junta, las sugiere según tus intereses y te muestra cuánto tiempo queda para aplicar.

## ✨ Lo que ya está hecho

- **Landing** con carrusel de ilustraciones (parallax, autoavance y leyendas animadas) y panel con acceso rápido.
- **Registro** con correo y contraseña, apodo (nunca nombre real), rango de edad, nivel educativo y aceptación de
  términos y aviso de privacidad.
- **Inicio de sesión** con correo o con **Google**, recuperación de contraseña y verificación de correo.
- **Sesión persistente y segura**: el token vive en `expo-secure-store`, no en almacenamiento plano.
- **Ruteo por sesión**: con sesión activa se salta directo a Home; sin ella, se muestra la Landing.
- **Sistema de diseño** propio (colores, tipografía, espaciado, radios y sombra) en `src/constants/theme.ts`.
- Animaciones con **Reanimated** y retroalimentación háptica en botones y selectores.

## 🗺️ Lo que sigue

| Pantalla / módulo | Estado |
|---|---|
| Home (destacadas + sugerencias) | ⏳ pendiente |
| Buscador con filtro por categoría | ⏳ pendiente |
| Guardadas + vista de calendario | ⏳ pendiente |
| Perfil (avatar, intereses, cerrar sesión, borrar cuenta) | ⏳ pendiente |
| Pipeline semanal de oportunidades (Edge Function + IA) | ⏳ pendiente |
| Motor de sugerencias | ⏳ pendiente |
| Borrar cuenta desde un link web (requisito de Play Store) | ⏳ pendiente |

## 🧰 Stack

- **App:** React Native 0.86 · Expo SDK 57 · Expo Router · TypeScript (strict)
- **Backend:** Supabase (Auth, Postgres con RLS y Edge Functions)
- **UI y movimiento:** React Native Reanimated · Expo Linear Gradient · Ionicons · Poppins
- **Calidad:** ESLint (`eslint-config-expo`) y `tsc --noEmit`

## ⚙️ Cómo funciona

**Navegación.** Al abrir la app se revisa la sesión antes de decidir la pantalla inicial: con sesión válida se
entra directo a Home; sin sesión, a la Landing (que lleva a registro o inicio de sesión). Ya dentro, la app se
organiza en cuatro secciones: **Home**, **Buscador**, **Guardadas** y **Perfil**.

**De dónde salen las oportunidades.** Una función programada busca cada semana convocatorias con ayuda de una API
de IA con búsqueda web, y la respuesta llega en un formato fijo (título, categoría, institución, fecha límite,
monto, requisitos y URL de la fuente), nunca como texto libre sin respaldo. Todo entra como *pendiente de validar*:
una persona del equipo lo revisa **campo por campo contra la fuente citada** y lo publica o lo rechaza. Los
usuarios solo ven lo publicado.

**Sugerencias.** Cada oportunidad publicada recibe un puntaje según los intereses y el nivel educativo del
usuario, comparados con su categoría, institución y requisitos. Las de mayor puntaje alimentan la sección de
sugerencias de Home.

**Fechas límite.** Cada tarjeta muestra cuánto falta para aplicar con un color: verde si queda tiempo, ámbar si
faltan de 3 a 7 días y rojo si vence en menos de 3.

## 📁 Estructura

```
src/
├── app/                    Rutas (Expo Router)
│   ├── (public)/           Sin sesión: landing, login, signup, verificar-correo
│   ├── (app)/              Con sesión: home
│   ├── terminos.tsx        Accesibles con o sin sesión
│   └── privacidad.tsx
├── components/             Componentes reutilizables (Button, Input, Chip, Checkbox…)
├── constants/              Tema, slides y geometría de la Landing
└── lib/                    Cliente de Supabase, sesión y acciones de auth
md/                         Blueprints de pantallas
```

## 🎨 Diseño

Línea **flat minimalista con sombra suave de elevación**: formas redondeadas, color sólido y una sola sombra por
tarjeta. Lo juvenil lo aportan el color y las ilustraciones 2D, no el chrome de la UI.

| Token | Color | Uso |
|---|---|---|
| `primary` | `#FF7A33` | Solo fondos y rellenos (botones, tab activo) |
| `primary-text` | `#C24A0F` | Naranja para texto y links (contraste AA) |
| `secondary` | `#2B2D42` | Texto principal y estructura |
| `accent` | `#FFC145` | Highlights puntuales |

Tipografía: **Poppins** (400, 500, 600 y 700). Íconos: **Ionicons**.

## 🛡️ Reglas de datos y seguridad

La audiencia es mixta (13-17 y 18+), así que estas reglas no son opcionales:

- **RLS** activado en cada tabla desde que se crea.
- Nunca se guarda fecha de nacimiento: solo un **rango de edad** autodeclarado.
- Nunca se pide nombre real: se usa un **mote**.
- El avatar es una selección de un set predefinido, nunca una foto subida.
- Ninguna clave va en el código fuente: todo por variables de entorno.
- Sin SDKs de publicidad con targeting personalizado a menores de 18.
- Se puede **borrar la cuenta y sus datos** desde la app y desde un link web.
- El Aviso de Privacidad es accesible sin iniciar sesión.

## 🧱 Convenciones de código

- Componentes reutilizables en `src/components/`, uno por archivo y con el nombre del archivo igual al del
  componente.
- Props tipadas con TypeScript, sin `any` salvo con un comentario que lo justifique.
- Antes de dar una tarea por terminada se corren lint y typecheck.

---

<div align="center">

Hecho con 🧡 para que ninguna beca se quede sin aplicar.

</div>
