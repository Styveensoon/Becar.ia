# PROGRESS.md — Estado del proyecto Becar.ia

Última actualización: 2026-09-21. Complementa a `CLAUDE.md` (fuente de verdad del producto y del diseño) y `AGENTS.md` (reglas de tooling de Expo). Aquí va lo que **no** está en esos archivos: qué se hizo, decisiones, trampas y pendientes.

Repo: https://github.com/Styveensoon/Becar.ia (rama `main`).

---

## 1. Qué está hecho

- **Landing** (`src/app/(public)/landing.tsx`): carrusel de 4 ilustraciones con parallax, flotación, autoavance de 4 s, panel blanco fijo con marca, dots, leyenda animada, botón "Quiero unirme" y link "Iniciar sesión".
- **Login / Signup / Verificar correo** (`src/app/(public)/`): correo + contraseña, Google OAuth, recuperación de contraseña, chips de rango de edad y nivel educativo, checkbox de términos.
- **Ruteo por sesión** (`src/app/_layout.tsx`): `Stack.Protected` con `guard={!session}` para `(public)` y `guard={!!session}` para `(app)`. `terminos` y `privacidad` quedan fuera de los guards (accesibles siempre). `src/app/index.tsx` redirige a `/home` o `/landing`.
- **Home** (`(app)/home.tsx`): solo un placeholder con botón de cerrar sesión.
- **Términos y Privacidad**: pantallas con texto **placeholder** (`LegalScreen`), no es texto legal real.
- **Supabase Auth** conectado en código (`src/lib/supabase.ts`, `auth.tsx`, `authActions.ts`).
- **README** en el repo: solo describe qué es y cómo está hecha; **sin** instrucciones de instalar/configurar (la app irá a Play Store).

## 2. Qué NO está hecho

- Home real (destacadas + sugerencias), Buscador, Guardadas (+ calendario), Perfil (avatar, intereses, borrar cuenta).
- Tab navigator (hoy `(app)` solo tiene `home`).
- Pipeline semanal de oportunidades (Edge Function + IA + validación humana) y motor de sugerencias.
- Borrado de cuenta desde la app y desde un link web (requisito de Play Store).
- **Onboarding para usuarios de Google**: entran sin pasar por Signup, así que `mote`, `rango_edad` y `nivel_educativo` quedan `null`. Falta una pantalla que los pida.
- Texto legal real de Términos y Aviso de Privacidad.
- Capturas de pantalla en el README.

## 3. Configuración externa pendiente (no vive en el repo)

El código asume esto, pero hay que hacerlo en el panel de Supabase / Google:

1. Llenar `.env` con `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` (hoy tiene valores placeholder; `.env` está en `.gitignore`, `.env.example` sí se sube). `app.config.ts` los lee en `extra`; `src/lib/supabase.ts` lanza error si faltan.
2. Tabla `profiles` con **RLS** + un **trigger** en `auth.users` que cree la fila leyendo `raw_user_meta_data` (`mote`, `rango_edad`, `nivel_educativo`). El signup manda esos datos como `options.data` y **espera** ese trigger; sin él, el perfil no se crea.
3. Activar "Confirm email" en Auth.
4. Habilitar el proveedor Google.
5. Agregar `becaria://login` a las Redirect URLs.

**Nunca se verificó el flujo de auth contra un Supabase real**: solo pasaron `tsc`, `lint` y `expo export`.

## 4. Decisiones y convenciones que conviene recordar

- **Estructura**: rutas en `src/app/`, componentes reutilizables en `src/components/` (uno por archivo, nombre = archivo), constantes en `src/constants/`, lógica en `src/lib/`. Alias `@/*` → `./src/*`.
- **Config**: `app.config.ts` reemplazó a `app.json` (se borraron `App.tsx`, `index.ts`, `app.json`); `package.json` `main` = `expo-router/entry`.
- **`.npmrc` con `legacy-peer-deps=true`**: existe porque `react-dom 19.3` choca con `react 19.2.3` y rompía `npm uninstall` / `expo install`. No borrarlo sin resolver eso.
- **Tokens de diseño** en `src/constants/theme.ts` (colores, fuentes, tipografía, spacing, radius, `cardShadow`). Usarlos siempre, no hex sueltos.
- **Reglas de diseño que se respetan**: plano, una sola sombra, sin gradientes en botones/cards, texto sobre `primary` en navy (`secondary`), `primary-text` para texto naranja, rojo solo para urgencia de fecha.
- **Sesión**: SecureStore con adaptador por **chunks** (1800 caracteres, clave `${key}.count`) porque SecureStore limita el tamaño por valor.
- **Google OAuth**: `expo-web-browser` + PKCE con `exchangeCodeForSession`; el código se saca con `Linking.parse(result.url).queryParams?.code`.
- **Commits**: terminan con la línea `Co-Authored-By` que indique el sistema.

## 5. Trampas (lo que más costó)

### Lint / TypeScript
- **React Compiler** prohíbe `sharedValue.value = x` dentro de handlers ("This value cannot be modified"). Usar `.set(x)` / `.get()`.
- `mixBlendMode` **no existe en `ImageStyle`** (TS2353): ponerlo en una `View`/`Animated.View` que envuelva la imagen, nunca en el `Image`.

### Metro / entorno
- Errores tipo *"Unable to resolve react-native-reanimated"* o *"./ReanimatedModule"* **no eran del código**: era un servidor Metro viejo en el puerto 8081. Solución: matar el proceso (`taskkill /PID …`), `npx expo start --clear`, recargar Expo Go. `expo export` compilaba bien.
- El proyecto vive en **OneDrive**, que puede interferir con Metro/`node_modules`. Si reaparecen errores raros de resolución, mover el proyecto fuera de OneDrive.
- No hay `gh` CLI instalado.

### Herramientas de edición
- Si `Write` falla con "File has been modified since read" tras editar con scripts, volver a hacer `Read` antes de `Write`.

### Git
- Rama local renombrada `master` → `main`. El remoto tenía un commit con solo README, así que se hizo merge con `--allow-unrelated-histories` (sin force push). Historial actual: `Initial commit` → merge → README.
- `img/` está **sin trackear a propósito** (originales de las ilustraciones). Las que usa la app son copias recortadas en `assets/landing/slide-1..4.jpg`.
- `LICENSE` es el **MIT de Expo** que trajo el plantilla ("650 Industries"). Hay que decidir la licencia real del proyecto.

## 6. La Landing: cómo está armada (frágil, leer antes de tocar)

El usuario iteró **muchísimo** el layout (acomodar imagen, panel, espacios). Los números actuales son fruto de ese ajuste; no "limpiarlos" sin pedirlo.

### Geometría determinista (`src/constants/landingLayout.ts`)
La ilustración manda dónde empieza el panel blanco:
- `ASPECT = 1.037` (ancho:alto de las imágenes).
- `WIDTH_FACTOR = 1.22`: la imagen puede exceder el ancho de pantalla; solo se recorta margen vacío lateral. El cohete de la slide 3 llega al 89.4% del ancho, es lo más justo; con 1.3 se cortaba.
- `RAISE = -0.03`: imagen ligeramente por debajo del borde superior (los bordes se difuminan con el tinte).
- `GROUND = 0.929`: el suelo del personaje está al 92.9% del alto de la imagen en las 4 slides.
- `GROUND_HIDDEN = -24`, `PANEL_OVERLAP = 20`, `MIN_PANEL_HEIGHT = 300` (en pantallas cortas la imagen se reduce para dejar sitio al panel).
- Medidas del dibujo por slide (x / y en % de la imagen): s1 12.5–87.3 / 13.0–92.9; s2 17.9–87.3 / 9.0–92.9; s3 17.9–89.4 / 13.4–92.9; s4 12.6–88.1 / 14.7–92.9. Si el usuario cambia las ilustraciones, **hay que volver a medir** estos valores.

### Fundir la imagen con el fondo
- Las ilustraciones tienen fondo crema; cada slide tiene un tinte pastel (`landingSlides.ts`: `#FFE7D6`, `#FFF0C7`, `#DCEAF7`, `#DCF1E3`).
- Se usa `mixBlendMode: 'multiply'` en una `Animated.View` + `isolation: 'isolate'` en el slide para que el multiply solo afecte a ese tinte.
- El multiply deja un rectángulo un poco más oscuro, así que se superponen 3 `LinearGradient` (tinte → `${tint}00`) en top/izq/der (`FADE = 28`) para esconder el borde. Es un degradado de **enmascaramiento**, no de decoración: no rompe la regla de "sin gradientes de profundidad".

### Panel blanco (`landing.tsx`)
- El panel es **fijo** (no se anima); solo se animan los elementos de adentro con `boing(delay)`: `FadeInUp.delay(d).springify().damping(13).stiffness(130)`. El usuario pidió explícitamente un efecto **tranquilo**; una versión con `ZoomIn` y damping 7 le pareció "muy exagerada".
- Delays: 150 marca, 250 dots, 350 leyendas, 450 botón, 550 link.
- Los botones están centrados verticalmente en el espacio restante (`options: flex 1, justifyContent center, paddingBottom 40`). Valores afinados por el usuario: `paddingTop 36`, leyendas `marginTop 48` y alto 60 (dos líneas de `h1`).
- Los dots y la leyenda comparten `scrollX` (SharedValue) con el carrusel.

### Animaciones en general
- Reanimated 4 + `react-native-worklets`. Botones y chips: spring de escala + `expo-haptics`. Inputs: borde animado en foco + shake en error.

## 7. Cosas que el usuario valora (para futuras pantallas)

- Quiere **personalidad y movimiento** (le pareció "plana y meh" la primera versión), pero **sin excesos** y dentro del design system.
- Pide ajustes de espaciado muy finos y directos ("un poco más", "el doble"); conviene aplicarlos de inmediato y decir qué valor cambió.
- Escribe en español informal; responder en español.
- Prefirió ir **con calma, una cosa a la vez**, sin lanzar muchos subagentes.
- Nunca verifiqué visualmente en dispositivo: siempre depende de que el usuario mire Expo Go y reporte.

## 8. Antes de dar algo por terminado

`npx expo lint` y `npx tsc --noEmit` (ver `AGENTS.md`). Para dependencias nuevas: `npx expo install`.

## 9. Sugerencia de siguiente paso

1. Terminar la config externa de Supabase (sección 3) y probar signup/login reales.
2. Tab navigator con las 4 secciones y Home real.
3. Onboarding para usuarios de Google.
4. Borrar cuenta (app + link web) antes de cualquier publicación.
