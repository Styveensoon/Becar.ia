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

Becar.ia es una app móvil (pensada para Android y Play Store) que reúne en un solo lugar becas, movilidades
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

## 🚀 Cómo correrlo

### 1. Requisitos

- Node.js (LTS)
- La app **Expo Go** en tu teléfono (misma versión de SDK que el proyecto), o un emulador de Android

### 2. Instalar

```bash
git clone https://github.com/Styveensoon/Becar.ia.git
cd Becar.ia
npm install
```

> El repo incluye un `.npmrc` con `legacy-peer-deps=true` porque hay un conflicto de peers entre `react` y
> `react-dom` que hace fallar `npx expo install` sin esa opción.

### 3. Variables de entorno

Copia el ejemplo y pon las claves de tu proyecto de Supabase:

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

El `.env` está en `.gitignore`: **nunca** se sube al repo ni se escribe una clave en el código.

### 4. Arrancar

```bash
npx expo start --clear
```

Escanea el QR con Expo Go, o pulsa `a` para abrir el emulador de Android.

## 🔐 Configurar Supabase

En el panel de tu proyecto de Supabase:

1. **Authentication → Providers → Email:** activa **Confirm email** (la cuenta no se considera activa hasta verificar).
2. **Authentication → Providers → Google:** actívalo con tus credenciales de OAuth.
3. **Authentication → URL Configuration → Redirect URLs:** agrega `becaria://login`.
4. Crea la tabla `profiles` con RLS y el trigger que la llena al registrarse (referencia abajo).

<details>
<summary><b>SQL de referencia para <code>profiles</code></b></summary>

```sql
create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  mote            text,
  rango_edad      text check (rango_edad in ('13-15', '16-17', '18+')),
  nivel_educativo text check (nivel_educativo in ('secundaria', 'prepa', 'universidad')),
  avatar_id       text,
  intereses       text[] not null default '{}',
  created_at      timestamptz not null default now()
);

-- RLS desde que se crea la tabla
alter table public.profiles enable row level security;

create policy "Cada quien lee su perfil"
  on public.profiles for select using (auth.uid() = id);

create policy "Cada quien edita su perfil"
  on public.profiles for update using (auth.uid() = id);

-- El registro manda mote, rango_edad y nivel_educativo como metadata.
-- Quien entra con Google no los trae: quedan en null hasta completar su perfil.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, mote, rango_edad, nivel_educativo)
  values (
    new.id,
    new.raw_user_meta_data ->> 'mote',
    new.raw_user_meta_data ->> 'rango_edad',
    new.raw_user_meta_data ->> 'nivel_educativo'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

Es un punto de partida, no el esquema final.

</details>

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

## 🧪 Comandos útiles

```bash
npx expo start --clear     # servidor de desarrollo con caché limpia
npx expo lint              # lint
npx tsc --noEmit           # typecheck
npx expo-doctor            # diagnóstico de dependencias
```

Antes de dar una tarea por terminada se corren lint y typecheck.

## 🤝 Contribuir

- Componentes reutilizables en `src/components/`, uno por archivo y con el nombre del archivo igual al del
  componente.
- Props tipadas con TypeScript, sin `any` salvo con un comentario que lo justifique.
- Dependencias nuevas con `npx expo install <paquete>` para resolver versiones compatibles con el SDK.

---

<div align="center">

Hecho con 🧡 para que ninguna beca se quede sin aplicar.

</div>
