# Servidor de correo (SMTP) para Supabase

Sin SMTP propio, Supabase solo manda correos a miembros del equipo del proyecto y con un límite
muy bajo. Con SMTP propio funcionan para cualquiera: verificación de registro y código de
recuperación de contraseña. También es necesario para Play Store.

## Opción gratis sin dominio: Brevo (300 correos/día)

1. Crear cuenta en https://www.brevo.com.
2. **Senders, Domains & Dedicated IPs → Senders → Add a sender**: nombre `Becar.ia`, correo del
   proyecto (p. ej. un Gmail creado para Becar.ia). Confirmar el correo que llega a ese buzón.
3. **SMTP & API → SMTP → Generate a new SMTP key**. Copiarla (solo se muestra una vez).
   Anotar también el **Login** que aparece en esa pantalla.

## Configurarlo en Supabase

Supabase → **Project Settings → Authentication → SMTP Settings → Enable Custom SMTP**:

| Campo | Valor |
|---|---|
| Sender email | el correo verificado en Brevo |
| Sender name | `Becar.ia` |
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | el **Login** de la pantalla SMTP de Brevo |
| Password | la **SMTP key** |
| Minimum interval | 60 segundos (coincide con la espera de "Reenviar código" en la app) |

Guardar.

## Después

- **Authentication → Rate Limits**: con SMTP propio se puede subir "Emails sent per hour"
  (p. ej. 60). Dejarlo bajo protege contra abuso.
- **Authentication → Emails → Templates → Reset Password**: pegar la plantilla de
  `md/correo-recuperacion.md` (código de 6 dígitos).
- Probar: crear una cuenta con un correo real y pedir un código de recuperación.

## Nota sobre spam

Enviar "desde" un Gmail a través de Brevo puede caer en spam (Gmail no autoriza a Brevo a enviar
en su nombre). Para pruebas del equipo basta con avisar que revisen spam. Para producción, lo
ideal es un dominio propio verificado en Brevo (registros SPF/DKIM).
