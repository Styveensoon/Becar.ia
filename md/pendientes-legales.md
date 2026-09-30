# Estado legal de Becar.ia

Versión de Términos y Aviso: `2026-09-30` (`src/constants/legal.ts`, única fuente: la app y la web
salen de ahí).

## Pendiente

1. **Activar GitHub Pages** (una sola vez): GitHub → repo → Settings → Pages → "Deploy from a
   branch" → rama y carpeta `/docs`. Queda en https://styveensoon.github.io/Becar.ia/

Cerrados por decisión del equipo (2026-09-30): revisión profesional externa y rotación de la
contraseña de aplicación de Gmail.

## Resuelto

**Documentos**
- Responsable: el equipo de estudiantes de la Universidad Tecnológica de Puebla que desarrolla
  Becar.ia; domicilio para notificaciones en la UTP (Antiguo Camino a la Resurrección 1002-A, Zona
  Industrial Oriente, C.P. 72300, Puebla). Si la universidad pide otra redacción, cambiarla en
  `legal.ts` y regenerar la web.
- Términos y Condiciones y Aviso de Privacidad completos, accesibles sin sesión en la app y en web.
- Correo de contacto real: becar.ia.mx@gmail.com.
- Página pública de eliminación de cuenta (requisito de Play), generada en `docs/`.

**Consentimiento**
- Aceptación obligatoria en el registro; permiso de tutor obligatorio para 13-17 (la BD rechaza el
  registro de un menor sin él).
- Evidencia guardada: versión aceptada, fecha y permiso del tutor; el usuario no puede alterarla.
- El rango de edad solo sube (app y BD).

**Derechos ARCO** (procedimiento del equipo en `md/arco.md`)
- Acceso: Perfil → Mis datos (ver todo y compartirse una copia).
- Rectificación: Perfil → Editar perfil.
- Cancelación: Perfil → Eliminar cuenta (inmediato, en cascada).
- Oposición: interruptor de avisos de novedades en Mis datos; notificaciones desde el teléfono.
- Por correo: plantilla prellenada desde la app, registro en `solicitudes_arco` con fecha límite de
  20 días hábiles calculada sola, consultas SQL y respuestas tipo en `md/arco.md`.

**Play Store** (respuestas en `md/play-store.md`)
- Formulario de Seguridad de los datos, público objetivo, clasificación y cuenta de revisión
  (`revision.play@becaria.test`, en `credentials.md`).
- Sin anuncios, sin SDKs de publicidad, sin nombre real, sin fecha de nacimiento, sin fotos.
