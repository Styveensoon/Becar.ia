# Login / Signup — Blueprint

Referencia: `becaria_design_system.md`. Este documento no repite tokens, solo dice dónde y cómo
usarlos.

## Estructura común a ambas pantallas
- `KeyboardAvoidingView` + `ScrollView` (evita que el teclado tape los campos, sobre todo en Signup)
- Header: botón atrás (ícono `arrow-back` de Ionicons, ghost, 24px), top-left, respeta safe-area-top
- Padding horizontal de pantalla: `20`

---

## LOGIN

### 1. Encabezado (margin-top `24` tras el header)
- Título, estilo `display`: "Bienvenido de vuelta"
- Subtítulo, estilo `body`, color `text-muted`, margin-top `4`, margin-bottom `32`:
  "Inicia sesión para seguir encontrando oportunidades"

### 2. Campos (gap vertical `16` entre inputs)
- **Correo electrónico**: label arriba (`caption`, `text-muted`) "Correo electrónico". Input spec
  del design system §7. `placeholder`: "tucorreo@ejemplo.com". `keyboardType="email-address"`,
  `autoCapitalize="none"`
- **Contraseña**: label "Contraseña". Input con `secureTextEntry`, ícono ojo (`eye`/`eye-off` de
  Ionicons) dentro del input, alineado a la derecha, padding `12` desde el borde, toggle visibilidad
- Link "¿Olvidaste tu contraseña?": alineado a la derecha, margin-top `8`, `caption`, `primary-text`

### 3. Acción
- Botón primario ancho completo, alto `52`, margin-top `24`: **"Iniciar sesión"**. Disabled
  (estilo disabled del design system) mientras algún campo esté vacío. Durante el submit, el
  texto se reemplaza por un spinner, no agregar texto "Cargando..."
- Si falla el login: banner de error arriba del botón, fondo `danger` al 10% de opacidad,
  `radius-sm`, padding `12`, ícono alert + texto `danger` "Correo o contraseña incorrectos". Se
  oculta apenas el usuario vuelve a escribir en cualquier input

### 4. Divider
- Margin vertical `24`: línea horizontal — "o" (`text-muted`) — línea horizontal

### 5. OAuth
- Botón ancho completo, alto `52`, `radius-md`, fondo `bg`, borde `1.5px solid border` (no
  `primary`, este botón no es la acción principal): ícono "G" de Google (18px) + texto "Continuar
  con Google", color `secondary`

### 6. Footer
- Centrado, margin-top `24`, margin-bottom `20` (o safe-area-bottom): "¿No tienes cuenta? " en
  `text-muted` + "Crear cuenta" en `primary-text` Medium → navega a Signup

---

## SIGNUP

### 1. Encabezado
- Título `display`: "Crea tu cuenta"
- Subtítulo `body` `text-muted`: "Encuentra becas hechas para ti en minutos"

### 2. Campos (gap vertical `16`)
- **Correo electrónico**: igual que en Login
- **Contraseña**: igual que en Login + texto de ayuda debajo, `caption` `text-muted`: "Mínimo 8
  caracteres"
- **Confirmar contraseña**: mismo estilo, `secureTextEntry`. Error inline (`caption` `danger`) si
  no coincide con el campo anterior, se muestra solo después de que el usuario sale del campo
- **Mote / Apodo**: label "¿Cómo quieres que te llamen?". Input normal, sin ícono. Texto de ayuda
  debajo, `caption` `text-muted` itálica: "Así te van a ver otros usuarios, no uses tu nombre
  completo"
- **Rango de edad**: label "¿Cuál es tu rango de edad?". Selector de 3 chips en fila (no input de
  texto, no date picker): "13-15" · "16-17" · "18+". Estilo "chip selector" del design system §7.
  Selección única
- **Nivel educativo**: label "¿En qué nivel estás?". Selector de chips en fila (mismo estilo que
  edad): "Secundaria" · "Prepa" · "Universidad". Si no entran en una fila en pantallas angostas,
  hacer wrap a 2 filas, no scroll horizontal

### 3. Checkbox de términos
- Margin-top `24`. Fila: checkbox custom (`radius-sm` 4px, sin marcar = borde `1.5px solid border`;
  marcado = fondo `primary`, ícono check blanco) + texto que envuelve: "Acepto los " + "Términos y
  Condiciones" (`primary-text`, subrayado) + " y el " + "Aviso de Privacidad" (`primary-text`,
  subrayado). Ambos links abren su pantalla/URL correspondiente, no son solo decorativos
- El botón de "Crear cuenta" permanece disabled mientras este checkbox no esté marcado

### 4. Acción
- Botón primario ancho completo, alto `52`, margin-top `20`: **"Crear cuenta"**. Disabled hasta
  que: todos los campos requeridos tengan valor válido + contraseñas coincidan + checkbox marcado

### 5. OAuth + Footer
- Igual que Login (divider, botón de Google), footer: "¿Ya tienes cuenta? " + "Iniciar sesión"
  (`primary-text` Medium) → navega a Login

## Validación (mensajes inline, `caption` `danger` debajo del campo correspondiente)
- Correo: formato inválido → "Ingresa un correo válido"
- Contraseña: menos de 8 caracteres → "La contraseña necesita al menos 8 caracteres"
- Confirmar contraseña: no coincide → "Las contraseñas no coinciden"
- Mote: vacío al intentar enviar → "Elige un apodo"
