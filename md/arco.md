# Derechos ARCO: cómo los atendemos

ARCO = **A**cceso, **R**ectificación, **C**ancelación y **O**posición (más la revocación del
consentimiento). La ley (LFPDPPP) nos obliga a responder en **20 días hábiles** y, si procede,
hacerlo efectivo en **15 días hábiles** más. Es gratis para la persona.

## 1. Lo que la persona hace sola en la app (no llega al equipo)

| Derecho | Dónde | Qué pasa |
|---|---|---|
| Acceso | Perfil → Mis datos | Ve todo lo que guardamos y se comparte una copia (JSON) |
| Rectificación | Perfil → Editar perfil | Corrige apodo, nivel, edad (solo hacia arriba), intereses, avatar, institución |
| Cancelación | Perfil → Eliminar cuenta | Se borra la cuenta y todo en cascada, al instante |
| Oposición | Perfil → Mis datos | Apaga los avisos de convocatorias nuevas; las notificaciones en general, desde el teléfono |

Casi todas las solicitudes se resuelven aquí. Si alguien escribe pidiendo algo de esta tabla,
basta con responderle dónde hacerlo (plantilla A abajo) y registrar la solicitud como atendida.

## 2. Lo que llega por correo (becar.ia.mx@gmail.com)

**Quién atiende:** la persona del equipo que revise el correo esa semana. Revisar el buzón al menos
dos veces por semana.

### Paso 1: verificar identidad
No pedimos nombre real, así que **la identidad la acredita el correo de la cuenta**:
- El correo **debe venir de la misma dirección** registrada en la app. Si viene de otra, responder
  con la plantilla B y no hacer nada más.
- **Madre, padre o tutor** de una persona menor: debe indicar el correo de la cuenta del menor y
  enviar un documento que acredite la relación (acta de nacimiento o documento de tutela). Nunca
  pedir más de lo necesario y borrar el documento al cerrar la solicitud.

Buscar la cuenta (Supabase → SQL Editor):
```sql
select id, email, created_at, email_confirmed_at from auth.users where email = 'correo@ejemplo.com';
```

### Paso 2: registrar la solicitud (el plazo se calcula solo)
```sql
insert into solicitudes_arco (correo_solicitante, user_id, derecho, descripcion, via_tutor)
values ('correo@ejemplo.com', '<id de la cuenta o null>', 'acceso', 'Pide copia de sus datos', false)
returning id, vence_respuesta;
```
`derecho`: `acceso` · `rectificacion` · `cancelacion` · `oposicion` · `revocacion`.

Pendientes y fechas límite (revisar cada semana):
```sql
select recibida_el, vence_respuesta, derecho, correo_solicitante, estado
from solicitudes_arco where estado in ('recibida', 'en_proceso') order by vence_respuesta;
```

### Paso 3: atender según el derecho

**Acceso** — exportar todo lo de la cuenta y mandarlo en la respuesta:
```sql
select json_build_object(
  'cuenta',    (select json_build_object('correo', email, 'creada', created_at, 'confirmada', email_confirmed_at) from auth.users where id = '<id>'),
  'perfil',    (select row_to_json(p) from profiles p where id = '<id>'),
  'favoritos', (select coalesce(json_agg(json_build_object('titulo', o.titulo, 'guardada', g.created_at)), '[]'::json)
                from guardadas g join oportunidades o on o.id = g.oportunidad_id where g.user_id = '<id>')
) as datos;
```

**Rectificación** — corregir el campo pedido, por ejemplo:
```sql
update profiles set mote = 'NuevoApodo' where id = '<id>';
```
El rango de edad solo puede subir: un trigger lo impide para todos, incluido el SQL Editor. Si
alguien se registró como adulto por error y en realidad es menor, **no** se baja el rango: se
cancela la cuenta y se registra de nuevo, con el permiso del tutor que pide el registro. Si el error
fue al revés (menor que ya es adulto), la persona lo sube sola en Editar perfil.

**Cancelación** — borrar la cuenta completa: Supabase → **Authentication → Users** → buscar el
correo → **Delete user**. El perfil, los favoritos y todo lo demás se borran en cascada.

**Oposición / revocación** — como todo el tratamiento es necesario para dar el servicio, la forma de
dejar de tratar los datos es cancelar la cuenta. Explicarlo (plantilla C) y ofrecer la cancelación.

### Paso 4: responder y cerrar
Responder **desde becar.ia.mx@gmail.com al mismo hilo**, y luego:
```sql
update solicitudes_arco set estado = 'atendida', respondida_el = current_date, notas = 'Se envió copia de datos'
where id = '<id de la solicitud>';
```
Usar `improcedente` solo con motivo escrito en `notas` (p. ej. no se pudo acreditar la identidad).

## Plantillas de respuesta

**A. Se resuelve en la app**
> Hola. Recibimos tu solicitud. Puedes hacerlo tú mismo al instante desde la app: *[Perfil → Mis
> datos / Editar perfil / Eliminar cuenta]*. Si algo no funciona, respóndenos a este correo y lo
> hacemos por ti. — Equipo Becar.ia

**B. El correo no coincide con la cuenta**
> Hola. Para proteger tu cuenta, solo podemos atender solicitudes enviadas desde el correo con el
> que te registraste en Becar.ia. Escríbenos desde esa dirección y con gusto te ayudamos.
> — Equipo Becar.ia

**C. Oposición o revocación**
> Hola. Usamos tus datos solo para darte el servicio (tu cuenta, sugerencias y recordatorios); no
> hacemos publicidad ni los compartimos. Si ya no quieres que los tratemos, la forma es eliminar tu
> cuenta: desde la app en Perfil → Eliminar cuenta, o respóndenos «Sí, eliminen mi cuenta» y lo
> hacemos en máximo 15 días hábiles. — Equipo Becar.ia

**D. Entrega de datos (acceso)**
> Hola. Adjuntamos todos los datos que Becar.ia tiene asociados a tu cuenta. No guardamos tu nombre
> real, fecha de nacimiento, fotos ni ubicación. Si algo está mal, dinos qué y lo corregimos.
> — Equipo Becar.ia
