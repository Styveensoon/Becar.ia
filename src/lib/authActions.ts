import { LEGAL_VERSION } from '@/constants/legal';

import { supabase } from './supabase';

// Dígitos del código que manda Supabase por correo. Debe coincidir con
// Authentication → Providers → Email → Email OTP Length del proyecto (hoy: 8).
export const LONGITUD_CODIGO = 8;

export type RangoEdad = '13-15' | '16-17' | '18+';
export type NivelEducativo = 'secundaria' | 'prepa' | 'universidad';

export type SignUpInput = {
  email: string;
  password: string;
  mote: string;
  rangoEdad: RangoEdad;
  nivelEducativo: NivelEducativo;
  // Solo aplica a 13-17; el formulario no deja enviar sin él.
  consentimientoTutor: boolean;
};

export type AuthResult = { ok: true } | { ok: false; message: string; sinConfirmar?: boolean };

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (!error) return { ok: true };
  if (error.message.toLowerCase().includes('email not confirmed')) {
    return { ok: false, message: 'Confirma tu correo antes de iniciar sesión', sinConfirmar: true };
  }
  return { ok: false, message: 'Correo o contraseña incorrectos' };
}

// mote, rango_edad y nivel_educativo viajan como metadata; un trigger en la BD
// crea la fila de `profiles` (con la cuenta sin verificar aún no hay sesión para insertar).
export async function signUpWithEmail(
  input: SignUpInput,
): Promise<{ ok: true; needsVerification: boolean } | { ok: false; message: string }> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    // Sin emailRedirectTo: la cuenta se confirma con un código por correo dentro de la app
    // (plantilla "Confirm signup" con {{ .Token }}, ver md/correo-recuperacion.md).
    options: {
      data: {
        mote: input.mote.trim(),
        rango_edad: input.rangoEdad,
        nivel_educativo: input.nivelEducativo,
        // Evidencia del consentimiento: la BD registra versión y fecha (trigger handle_new_user).
        terminos_version: LEGAL_VERSION,
        consentimiento_tutor: input.consentimientoTutor,
      },
    },
  });
  if (error) {
    return { ok: false, message: 'No pudimos crear tu cuenta. Intenta de nuevo' };
  }
  return { ok: true, needsVerification: data.session === null };
}

// Confirmar el registro con el código del correo. Un código válido abre la sesión y el guard
// de la app lleva directo al onboarding.
export async function verificarCodigoRegistro(email: string, codigo: string): Promise<AuthResult> {
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: codigo,
    type: 'email',
  });
  if (!error) return { ok: true };
  if (error.status === 429) return { ok: false, message: 'Demasiados intentos. Espera un momento' };
  return { ok: false, message: 'El código no es válido o ya venció. Revísalo o pide uno nuevo' };
}

export async function reenviarCodigoRegistro(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim().toLowerCase() });
  if (!error) return { ok: true };
  if (error.status === 429) {
    return { ok: false, message: 'Pediste varios códigos seguidos. Espera un minuto e inténtalo otra vez' };
  }
  return { ok: false, message: 'No pudimos reenviar el código. Revisa tu conexión' };
}

// Recuperación con código por correo (sin enlaces ni URLs de redirección que configurar).
// La plantilla "Reset Password" de Supabase debe mostrar {{ .Token }} (ver md/correo-recuperacion.md).
// La respuesta es la misma exista o no la cuenta, para no revelar qué correos están registrados.
export async function enviarCodigoRecuperacion(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
  if (!error) return { ok: true };
  if (error.status === 429) {
    return { ok: false, message: 'Pediste varios códigos seguidos. Espera un minuto e inténtalo otra vez' };
  }
  // 400: el correo no puede recibir mensajes (dominio inexistente o mal escrito).
  if (error.status === 400) return { ok: false, message: 'Revisa que tu correo esté bien escrito' };
  return { ok: false, message: 'No pudimos enviar el código. Revisa tu conexión' };
}

// Un código válido abre una sesión de recuperación: con ella se puede cambiar la contraseña.
export async function verificarCodigoRecuperacion(email: string, codigo: string): Promise<AuthResult> {
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: codigo,
    type: 'recovery',
  });
  if (!error) return { ok: true };
  if (error.status === 429) return { ok: false, message: 'Demasiados intentos. Espera un momento' };
  return { ok: false, message: 'El código no es válido o ya venció. Revísalo o pide uno nuevo' };
}

export async function cambiarContrasena(password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({ password });
  if (!error) return { ok: true };
  if (error.message.toLowerCase().includes('different')) {
    return { ok: false, message: 'La nueva contraseña debe ser distinta de la anterior' };
  }
  return { ok: false, message: 'No pudimos cambiar tu contraseña. Inténtalo otra vez' };
}
