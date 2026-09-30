# Correos con código de 8 dígitos (registro y recuperación)

La app **no usa enlaces** en los correos: confirma la cuenta y recupera la contraseña con un
**código de 8 dígitos** que se escribe en la app. Así no hace falta configurar Redirect URLs, ni
tener dominio, ni que el enlace abra la app (antes, el enlace de verificación del registro
terminaba en `localhost:3000`, una página de error).

Por defecto, Supabase manda **enlaces**. Hay que cambiar **dos plantillas** para que muestren el
**código** (`{{ .Token }}`). Es copiar y pegar, una sola vez.

## Plantilla 1: "Confirm signup" (registro)

Supabase → **Authentication** → **Emails** → **Templates** → **Confirm signup**

**Subject:**

```
Tu código para confirmar Becar.ia: {{ .Token }}
```

**Body** (HTML):

```html
<div style="font-family: Arial, sans-serif; max-width: 420px; margin: 0 auto; color: #2B2D42;">
  <h2 style="margin-bottom: 4px;">¡Bienvenido a Becar.ia! 🎓</h2>
  <p style="color: #8A8B99; margin-top: 0;">Escribe este código en la app para confirmar tu cuenta:</p>
  <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; text-align: center;
              background: #FFE7D6; border-radius: 12px; padding: 20px 0; margin: 24px 0;">
    {{ .Token }}
  </div>
  <p style="color: #8A8B99; font-size: 13px;">
    El código vence en 1 hora. Si no creaste una cuenta, ignora este correo.
  </p>
  <p style="color: #8A8B99; font-size: 13px;">Becar.ia · proyecto académico hecho en Puebla</p>
</div>
```

## Plantilla 2: "Reset Password" (recuperar contraseña)

Supabase → **Authentication** → **Emails** → **Templates** → **Reset Password**

**Subject:**

```
Tu código para Becar.ia: {{ .Token }}
```

**Body** (HTML):

```html
<div style="font-family: Arial, sans-serif; max-width: 420px; margin: 0 auto; color: #2B2D42;">
  <h2 style="margin-bottom: 4px;">¿Olvidaste tu contraseña?</h2>
  <p style="color: #8A8B99; margin-top: 0;">No pasa nada. Escribe este código en la app de Becar.ia:</p>
  <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; text-align: center;
              background: #FFE7D6; border-radius: 12px; padding: 20px 0; margin: 24px 0;">
    {{ .Token }}
  </div>
  <p style="color: #8A8B99; font-size: 13px;">
    El código vence en 1 hora y solo funciona una vez.<br />
    Si no pediste cambiar tu contraseña, ignora este correo: tu cuenta sigue segura.
  </p>
  <p style="color: #8A8B99; font-size: 13px;">Becar.ia · proyecto académico hecho en Puebla</p>
</div>
```

Guardar las dos. Listo: no hay nada más que configurar.

## Revisar (opcional)

En **Authentication → Providers → Email**:
- **Email OTP Length**: 8 (así está el proyecto; la app usa `LONGITUD_CODIGO` en `src/lib/authActions.ts` y deben coincidir).
- **Email OTP Expiration**: 3600 segundos (1 hora), que es lo que dice el correo.

## Importante antes de publicar: servidor de correo (SMTP)

El servidor de correo que trae Supabase de fábrica es solo para pruebas: tiene un límite muy bajo
de correos por hora y puede no entregar a direcciones fuera del equipo del proyecto. Afecta
**tanto la verificación del registro como este código**.

Antes de la Play Store, configurar un SMTP propio en **Project Settings → Authentication → SMTP
Settings**. Hay opciones gratuitas que no requieren dominio propio (por ejemplo, Brevo permite
verificar un solo remitente con un Gmail). Con dominio propio, Resend o similares.

## Cómo probarlo

Con un **correo real** (los `@becaria.test` de `credentials.md` no pueden recibir correos:
Supabase los rechaza).

**Registro:** «Quiero unirme» → llenar el formulario → «Crear cuenta» → llega el código → escribirlo
→ entra directo al onboarding. Si alguien cierra la app sin confirmar, al iniciar sesión la app le
manda un código nuevo y se lo pide ahí mismo.

**Recuperar contraseña:**

1. Login → «¿Olvidaste tu contraseña?» → escribir el correo → «Enviar código».
2. Copiar el código del correo (se puede pegar completo en las casillas).
3. Escribir la contraseña nueva dos veces → «Guardar contraseña» → entra a la app.

## Seguridad

- El código es de un solo uso, vence en 1 hora y Supabase limita los intentos y los envíos.
- La app no revela si un correo tiene cuenta: siempre dice «si hay una cuenta con ese correo…».
- Reenviar el código tiene una espera de 60 segundos en la app.
- Validar el código abre una sesión de recuperación; con ella solo se pide la contraseña nueva.
