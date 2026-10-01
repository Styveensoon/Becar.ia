# Becar.ia: contexto completo del proyecto

Documento pensado para dárselo a un asistente (Claude en el chat, sin acceso al repo) y que entienda
qué es la app, cómo funciona, qué está hecho y qué falta. Estado al **30 de septiembre de 2026**
(rama `becaria-v1`, versión 1.0.0).

---

## 1. Qué es

**Becar.ia** es una app móvil para Android (se publicará en Play Store) que reúne en un solo lugar
**becas, movilidades internacionales, concursos, certificaciones y eventos** para estudiantes de
**secundaria, prepa (bachillerato) y universidad** en México.

**Problema que resuelve:** a los estudiantes se les pasan las convocatorias por enterarse tarde.
La app las junta, las sugiere según sus intereses y nivel, y les avisa antes de que cierren.

**Quién la hace:** un equipo de estudiantes de la Universidad Tecnológica de Puebla (UTP), como
proyecto académico. Trabajan con Scrum; el roadmap vive en un Excel, no en el repo.
Contacto oficial: `becar.ia.mx@gmail.com`. Repo: https://github.com/Styveensoon/Becar.ia

**Audiencia:** mixta, **13-17 y 18+** (declarado así en Play Console). Por eso hay reglas estrictas
de datos para menores (sección 7).

---

## 2. Stack técnico

| Capa | Tecnología |
|---|---|
| App | React Native 0.86 · Expo SDK 57 · Expo Router (rutas por archivos) · TypeScript strict |
| Animación | React Native Reanimated 4 + Worklets · `expo-haptics` · `expo-linear-gradient` |
| UI | Fuente Poppins (4 pesos) · Ionicons (`@expo/vector-icons`) |
| Backend | Supabase: Auth, Postgres con RLS, Edge Functions (Deno), pg_cron, pg_net, Vault |
| IA | API de Claude (Opus 5.5) con búsqueda web, vía Batches, para encontrar convocatorias |
| Notificaciones | `expo-notifications`, **solo locales** (sin servidor de push) |
| Almacenamiento local | `expo-secure-store` (cifrado) y AsyncStorage (solo datos públicos) |
| Builds | EAS Build (perfiles development / preview / production `.aab`) |
| Web pública | GitHub Pages desde la carpeta `docs/` (privacidad, términos, eliminar cuenta) |

ID de la app: `mx.becaria.app`. Claves de Supabase por variables de entorno (`.env` +
`app.config.ts`), nunca en el código.

---

## 3. Navegación (qué pantallas existen)

```
Al abrir: se revisa la sesión de Supabase.
  ├── Sin sesión → Landing
  │     ├── "Quiero unirme"            → Registro → Código por correo → Onboarding → Inicio
  │     └── "¿Ya tienes cuenta?"       → Login → Inicio
  │                                        └── "¿Olvidaste tu contraseña?" → Recuperar (código)
  │
  └── Con sesión
        ├── Cuenta del equipo de validación → SOLO el Panel de validación
        ├── Estudiante sin personalizar     → SOLO Onboarding (avatar → intereses)
        └── Estudiante personalizado        → Barra de 5 pestañas:
              Favoritos · Calendario · [Inicio] · Avisos · Perfil
              (Inicio va al centro y es con la que abre la app)

Accesibles siempre, con o sin sesión: Términos, Aviso de Privacidad, Recuperar contraseña.
```

El ruteo usa `Stack.Protected` de Expo Router: según el estado (sesión, rol, onboarding) solo
"existen" ciertas pantallas.

---

## 4. Funciones, pantalla por pantalla

### Landing (sin sesión)
- Carrusel de 4 ilustraciones 2D con parallax, flotación y autoavance cada 4 s; cada slide tiene
  un tinte pastel y una leyenda animada.
- Panel blanco fijo abajo con marca, puntitos del carrusel, botón **"Quiero unirme"** y link
  **"¿Ya tienes cuenta? Iniciar sesión"**.
- Su geometría está afinada a mano (muchas iteraciones); no conviene "limpiar" los números.

### Registro
- Correo, contraseña + confirmación, **apodo ("mote")** con la ayuda "no uses tu nombre completo".
- Chips de **rango de edad** (13-15 / 16-17 / 18+) y **nivel educativo** (Secundaria / Prepa /
  Universidad).
- Checkbox obligatorio de Términos y Aviso de Privacidad.
- Si es **menor (13-17)**, aparece un segundo checkbox obligatorio: *"Mi madre, padre o tutor conoce
  y autoriza que use Becar.ia…"*. La base de datos rechaza el registro de un menor sin él.
- Al crear la cuenta llega un **código de 8 dígitos** por correo (no un enlace) que se escribe en la
  app. Al validarlo se abre sesión y pasa al onboarding. Reenviar código tiene espera de 60 s.
- Al confirmar, se manda automáticamente un **correo de bienvenida** (Edge Function `bienvenida`).

### Login y recuperación de contraseña
- Correo + contraseña (con mostrar/ocultar). Errores en un banner.
- Si la cuenta no está confirmada, la app manda un código nuevo y lo pide ahí mismo.
- Recuperar contraseña: correo → código de 8 dígitos → contraseña nueva dos veces → entra.
  La app nunca revela si un correo tiene cuenta.
- **El inicio con Google se quitó** (CLAUDE.md aún lo menciona, pero el código ya no lo tiene).

### Onboarding (solo una vez, justo después de registrarse)
1. **Elige tu estilo:** 12 avatares (hoy son íconos placeholder; faltan las ilustraciones reales) y
   6 colores de perfil en un abanico animado. Vista previa en vivo.
2. **¿Qué te interesa?:** mínimo 2 de 6 intereses (Ciencias y Tecnología, Artes y Humanidades,
   Negocios y Emprendimiento, Salud y Bienestar, Idiomas y Comunicación, Deportes/Voluntariado/Medio
   Ambiente) + institución opcional. Botón "Empezar a explorar".
- Sin "Atrás" ni "Saltar": avatar e intereses alimentan las sugerencias.

### Inicio (Home)
- Saludo con el apodo y el avatar (toca → Perfil). Título "¿Qué quieres encontrar hoy?".
- **Buscador** + **botón de dado** 🎲 que abre una convocatoria al azar (sin repetir la anterior).
- **Explora por tema:** cuadrícula 3×3 con 9 temas (IoT, IA, Robótica, Programación, Negocios,
  Arte y diseño, Salud, Idiomas, Medio ambiente). Cada uno abre resultados filtrados.
- **"Para ti, {apodo}":** carrusel horizontal de hasta 8 sugerencias, cada una con el motivo
  ("Te interesa Programación", "Cierra pronto", "Para universidad").
- **"Última llamada":** lo que cierra en los próximos 7 días y para lo que la persona sí califica.
  Si no hay nada: "Semana tranquila 😮‍💨".
- Jalar hacia abajo para actualizar. Banner si no hay conexión.

### Resultados de búsqueda
- Búsqueda **local e instantánea** sobre el catálogo del teléfono: ignora acentos y mayúsculas,
  quita palabras vacías ("de", "en"…), aguanta plurales y prefijos ("prog" → Programación,
  "becas" → categoría Beca). Todas las palabras deben coincidir.
- Busca en título, descripción, institución, a quién va dirigida y ubicación, además de tema y
  categoría.

### Detalle de una convocatoria
- Categoría, institución, badge de fecha límite, corazón para guardar.
- Tarjetas: **Fechas importantes** (inicio de inscripción, cierre, evento, resultados),
  **¿Para quién es?** (niveles, carreras, edades, modalidad, ubicación), **Beneficio y costo**,
  **Requisitos**.
- Botón para abrir la **convocatoria oficial** (solo abre `https`). Nota: "Verifica siempre los
  detalles en la convocatoria oficial antes de aplicar".

### Favoritos
- Lista de lo guardado con el corazón (más reciente primero). Se ven sin conexión.
- Guardar/quitar es optimista (cambia al instante y se revierte si falla); necesita internet.
- La **primera vez que guardas algo** la app pide permiso de notificaciones (en contexto, no al abrir).

### Calendario
- Calendario mensual con **puntos de color** en los días en que cierra algún favorito; al tocar un
  día se listan los cierres.

### Avisos (notificaciones)
- Tarjeta para activar recordatorios si no hay permiso (si el sistema ya lo bloqueó, manda a Ajustes).
- Secciones: **Nuevas para ti ✨** (publicadas en las últimas 2 semanas de tus temas), **Próximos**
  (recordatorios programados) y **Recientes** (historial de 2 semanas).

### Perfil
- Tarjeta tipo credencial con avatar, color, apodo, nivel.
- Opciones: Editar perfil · Mis datos y privacidad · Aviso de Privacidad · Términos y Condiciones ·
  Cerrar sesión · **Eliminar cuenta**.
- **Editar perfil:** apodo, color, avatar, rango de edad (**solo puede subir**: 13-15 → 16-17 → 18+),
  nivel, intereses, institución.
- **Mis datos:** muestra todo lo que se guarda de la persona, permite compartirse una copia en JSON,
  interruptor para apagar los avisos de convocatorias nuevas y un correo prellenado para otras
  solicitudes de privacidad (derechos ARCO).
- **Eliminar cuenta:** modal que explica qué se borra; borra la cuenta y todo en cascada al
  instante. También existe una página web pública para pedirlo (requisito de Play Store).

### Panel de validación (solo cuentas del equipo)
- Las cuentas en la tabla `equipo` **solo** ven este panel (no ven la app de estudiantes).
- Bandejas **Pendientes** (primero lo que tiene evidencia verificada y lo que cierra antes) e
  **Historial**.
- Al revisar una convocatoria se ven sus datos, la fuente, si la fecha quedó "comprobada en la
  fuente" o hay que "revisarla a mano", y un **checklist de 5 puntos** que hay que marcar para
  poder publicar (fuente oficial, fecha límite, demás fechas, niveles/edades/requisitos, beneficio
  y costo). Para rechazar se elige un motivo (Ya cerró, Fuente no oficial, Fecha incorrecta,
  Datos no coinciden, Duplicada, No aplica en México).
- La única forma de cambiar el estado es la función `validar_oportunidad` en la BD.

---

## 5. Cómo funciona por dentro

### De dónde salen las convocatorias (pipeline semanal)
```
Lunes 9:00 (CDMX)  pg_cron → Edge Function "pipeline-convocatorias" (enviar)
                   └─ 9 búsquedas (3 niveles × 3 grupos: becas · concursos/olimpiadas/eventos ·
                      movilidad/veranos/certificaciones) en UN lote a la API de Claude
                      (Batches = asíncrono y 50% más barato), con búsqueda web y lectura de páginas.
Cada hora (:20)    pg_cron → misma función (procesar)
                   └─ Si el lote terminó: valida cada hallazgo en código y lo inserta como
                      'pendiente_validar' con su evidencia.
Equipo             Revisa en el Panel de validación y publica o rechaza.
App                Solo ve lo 'publicado'.
```

**Lo que se le exige al modelo:** solo convocatorias abiertas (o que abren en ≤45 días) y accesibles
desde México; la fuente debe ser la página/PDF **oficial** (agregadores, prensa y redes bloqueados);
copiar **literal** la frase con la fecha límite; `null` en lo que la fuente no diga, nunca inventar;
para menores solo instituciones reconocidas y sin cobros dudosos; salida con esquema estricto.

**Lo que el código verifica (no le cree al modelo):** rechaza fuentes no oficiales, URLs sin https,
fechas imposibles o ya cerradas, valores fuera de catálogo, etc.; rechaza si la cita no menciona la
fecha; descarga la página y busca la cita literal → `evidencia_verificada = true/false`; deduplica.
La BD vuelve a validar todo con `check`s.

Costo estimado: ~4-8 USD por semana. Para activarlo faltan la llave de la API de Claude y un secreto
compartido (pasos en `md/pipeline.md`).

### Motor de sugerencias (en el teléfono)
- Primero filtra: **nunca** sugiere algo para lo que no da la edad o el nivel de la persona.
- Puntaje: +3 si coincide el nivel, +2 por cada tema que coincide con sus intereses (cada interés
  mapea a temas; p. ej. "Ciencias y Tecnología" → IoT, IA, Robótica, Programación), +1 si cierra en
  ≤14 días. Se ordena por puntaje y luego por fecha de cierre.

### Catálogo local y modo sin conexión
- Al abrir, la app muestra lo guardado en el teléfono y luego descarga el catálogo de convocatorias
  **publicadas y vigentes** (hasta 1000). Se vuelve a actualizar al regresar a la app si pasaron
  más de 10 minutos.
- Home, buscador, temas, dado, sugerencias y "Última llamada" funcionan **sin internet**.
- Lo que ya cerró se filtra también en el teléfono.
- Caché pública (catálogo) en AsyncStorage; caché personal (perfil, favoritos, preferencias) en
  almacenamiento **cifrado**. Al cerrar sesión o borrar la cuenta se borra lo personal y se cancelan
  los recordatorios.

### Notificaciones (sin servidor)
- **Recordatorios de cierre:** por cada favorito se programan avisos locales **7, 3 y 1 días antes**
  a las 10:00 ("📅 Faltan 7 días", "⏳ Faltan 3 días", "⏰ Cierra mañana"). Funcionan con la app
  cerrada; al tocarlos se abre el detalle.
- **Novedades:** al actualizar el catálogo, si se publicó algo nuevo de tus temas y para tu nivel,
  avisa ("✨ Nueva beca para ti · Porque te interesa IA"). Si son más de 2, un solo aviso resumen.
- Dos canales en Android ("Fechas límite" y "Convocatorias nuevas para ti") para apagar uno sin el otro.
- En Expo Go para Android las notificaciones no funcionan; ahí se muestra un aviso dentro de la app.

### Badge de fecha límite
Verde (`success`) si faltan más de 7 días · ámbar (`warning`) 3-7 días · rojo (`danger`) menos de 3.

### Sesión y seguridad de la cuenta
- Token en SecureStore, partido en pedazos porque SecureStore limita ~2 KB por valor, con copia en
  memoria para no descifrar en cada consulta.
- Correo verificado obligatorio. Contraseñas solo las maneja Supabase Auth.

---

## 6. Base de datos (Supabase / Postgres)

Todas las tablas tienen **RLS** desde que se crearon.

| Tabla | Para qué | Acceso |
|---|---|---|
| `profiles` | Apodo, rango de edad, nivel, avatar, color, intereses, institución, evidencia de consentimiento (versión legal aceptada, fecha, permiso de tutor) | Solo la fila propia; la evidencia no se puede editar. La crea un trigger al registrarse |
| `oportunidades` | Convocatorias: título, descripción, categoría, institución, fechas (inscripción, límite, evento, resultados), monto, requisitos, niveles, carreras, edades, modalidad, ubicación, costo, temas, URL fuente, estado, evidencia | Estudiantes: solo `publicado`. Validadores: todo. Nadie escribe directo |
| `guardadas` | Favoritos (usuario ↔ oportunidad) | Solo las propias |
| `fuentes` | Fuentes de convocatorias | Solo equipo |
| `equipo` | Quién es validador | Cada quien sabe si lo es; nadie ve la lista |
| `pipeline_runs` | Registro de cada corrida del pipeline (insertadas, rechazadas, tokens, errores) | Solo equipo |
| `solicitudes_arco` | Solicitudes de privacidad que llegan por correo, con fecha límite de respuesta calculada sola (20 días hábiles) | Solo equipo |

Funciones/triggers importantes: `handle_new_user` (crea el perfil y guarda el consentimiento),
`delete_account` (borra la cuenta en cascada), `profiles_rango_edad_guard` (la edad solo sube),
`validar_oportunidad` (publicar/rechazar), `pipeline_invocar` (cron), `bienvenida_al_confirmar`
(correo de bienvenida), búsqueda sin acentos con `unaccent`.

Categorías: `beca` · `movilidad` · `concurso` · `certificacion` · `evento`.
Estados: `pendiente_validar` · `publicado` · `rechazado`.

---

## 7. Reglas de datos, privacidad y legal (no negociables)

- Nunca se pide **nombre real** (solo apodo) ni **fecha de nacimiento** (solo rango de edad).
- Avatar de un set predefinido; **nunca fotos**.
- Sin anuncios ni SDKs de publicidad; sin analytics ni crash reporting; no se recolecta ubicación,
  contactos ni identificadores de publicidad.
- Ninguna clave en el código fuente.
- Borrar cuenta desde la app **y** desde una página web pública.
- Aviso de Privacidad accesible sin iniciar sesión (en la app y en la web).
- **Ley mexicana LFPDPPP:** Términos y Aviso de Privacidad completos (versión `2026-09-30`, una sola
  fuente en `src/constants/legal.ts` que genera también la web). Responsable: el equipo de la UTP.
- **Menores 13-17:** permiso de tutor obligatorio y guardado como evidencia.
- **Derechos ARCO:** Acceso (Mis datos), Rectificación (Editar perfil), Cancelación (Eliminar
  cuenta), Oposición (apagar avisos). Lo demás por correo, con procedimiento y plantillas de
  respuesta para el equipo (`md/arco.md`).

Páginas públicas:
- Inicio: https://styveensoon.github.io/Becar.ia/
- Privacidad: https://styveensoon.github.io/Becar.ia/privacidad.html
- Términos: https://styveensoon.github.io/Becar.ia/terminos.html
- Eliminar cuenta: https://styveensoon.github.io/Becar.ia/eliminar-cuenta.html

---

## 8. Sistema de diseño (resumen)

Estilo **flat minimalista con una sola sombra suave** (nada de claymorphism/neumorphism ni
gradientes en botones o tarjetas). Lo juvenil lo ponen el color y las ilustraciones 2D.

| Token | Color | Uso |
|---|---|---|
| `primary` | `#FF7A33` | Solo fondos (botones, tab activo). Nunca texto |
| `primary-text` | `#C24A0F` | Naranja para texto y links (contraste AA) |
| `primary-tint` | `#FFE7D6` | Chips, fondos suaves |
| `secondary` | `#2B2D42` | Texto principal; también texto sobre botones naranjas (nunca blanco) |
| `accent` | `#FFC145` | Highlights puntuales |
| `success` / `warning` / `danger` | `#4CAF6D` / `#F2A93C` / `#E5484D` | Urgencia de fecha (el rojo solo para eso) |

- Tipografía: Poppins (Regular, Medium, SemiBold, Bold). Íconos: Ionicons.
- Espaciado base 4 px; márgenes de pantalla 20; radios 8/12/16/20/full.
- 6 colores de perfil (naranja, amarillo, verde, azul, rosa, morado) solo para el fondo del avatar.
- Animaciones con personalidad pero tranquilas: entradas escalonadas, springs suaves, háptica en
  botones y chips, shake en errores.

---

## 9. Estructura del código

```
src/app/            Rutas (Expo Router)
  (public)/         landing, login, signup, verificar-correo
  (app)/(tabs)/     guardadas, calendario, home, notificaciones, perfil
  (app)/            onboarding-avatar, onboarding-intereses, resultados, oportunidad/[id],
                    editar-perfil, mis-datos, validacion, revisar/[id]
  terminos, privacidad, recuperar   (sin sesión también)
src/components/     ~45 componentes reutilizables (Button, Input, Chip, OpportunityCard,
                    MonthCalendar, DeleteAccountModal, ...), uno por archivo
src/constants/      theme (tokens), temas, personalizacion, legal, landing
src/lib/            auth, profile, catalogo, guardadas, oportunidades (búsqueda), sugerencias,
                    recordatorios, novedades, cache, almacenSeguro, validacion, fechas
supabase/migrations 11 migraciones SQL
supabase/functions  pipeline-convocatorias (busqueda, validacion, index) y bienvenida
supabase/templates  Plantillas HTML de correos (confirmación, recuperación, bienvenida)
docs/               Web pública legal (GitHub Pages)
scripts/            Generadores de la web legal y de plantillas de correo
md/                 Documentación del equipo (este archivo, pipeline, ARCO, Play Store, SMTP...)
```

Convenciones: TypeScript sin `any` injustificado; un componente por archivo; tokens del tema en vez
de colores sueltos; antes de terminar una tarea se corre `npx expo lint` y `npx tsc --noEmit`.

---

## 10. Estado: qué está hecho y qué falta

**Hecho (v1):**
- Todas las pantallas de la sección 4, con modo sin conexión.
- Registro/recuperación con código, correo de bienvenida, consentimiento de tutor.
- Favoritos, calendario, recordatorios 7/3/1 días y avisos de novedades.
- Sugerencias personalizadas, búsqueda local, temas, dado.
- Panel de validación para el equipo.
- Pipeline semanal con Claude desplegado y con sus cron jobs.
- Cumplimiento legal completo (LFPDPPP, ARCO, Play Store) y web pública.
- Respuestas del formulario de Play Console listas (`md/play-store.md`).

**Pendiente:**
- **Activar el pipeline:** cargar la llave de la API de Claude y el secreto compartido.
- **SMTP propio** en Supabase (el de fábrica tiene límites muy bajos) para que los códigos lleguen
  a cualquiera.
- **Ilustraciones reales** de los 12 avatares (hoy son íconos) y de los 9 temas (hoy son íconos
  sobre fondo pastel).
- Build de producción (`.aab`), capturas de pantalla, ícono 512×512 y gráfico destacado 1024×500
  para la ficha de Play Store.
- Borrar cuentas de prueba que no se usen antes de publicar.
- Decidir la licencia real del repo (hoy trae el MIT de la plantilla de Expo).
- Actualizar `CLAUDE.md` (todavía menciona login con Google y 4 pestañas) y `md/PROGRESS.md`
  (se quedó en el 21 de septiembre).

---

## 11. Cosas útiles al ayudar en este proyecto

- El equipo escribe en español informal; responder en español.
- Prefieren ir con calma, una cosa a la vez, con cambios visuales concretos ("un poco más",
  "el doble") aplicados directo.
- Quieren personalidad y movimiento, pero sin exagerar y dentro del sistema de diseño.
- El proyecto vive en OneDrive, lo que a veces da errores raros con Metro (solución:
  `npx expo start --clear` o matar el Metro viejo del puerto 8081).
- Nada de la app debe mostrar convocatorias no publicadas, ni pedir datos que no estén en la
  sección 7.
