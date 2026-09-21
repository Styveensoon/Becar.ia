import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from './supabase';

export type RangoEdad = '13-15' | '16-17' | '18+';
export type NivelEducativo = 'secundaria' | 'prepa' | 'universidad';

export type SignUpInput = {
  email: string;
  password: string;
  mote: string;
  rangoEdad: RangoEdad;
  nivelEducativo: NivelEducativo;
};

export type AuthResult = { ok: true } | { ok: false; message: string };

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (!error) return { ok: true };
  if (error.message.toLowerCase().includes('email not confirmed')) {
    return { ok: false, message: 'Confirma tu correo antes de iniciar sesión' };
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
    options: {
      emailRedirectTo: Linking.createURL('login'),
      data: {
        mote: input.mote.trim(),
        rango_edad: input.rangoEdad,
        nivel_educativo: input.nivelEducativo,
      },
    },
  });
  if (error) {
    return { ok: false, message: 'No pudimos crear tu cuenta. Intenta de nuevo' };
  }
  return { ok: true, needsVerification: data.session === null };
}

export async function signInWithGoogle(): Promise<AuthResult> {
  const redirectTo = Linking.createURL('login');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data.url) {
    return { ok: false, message: 'No pudimos iniciar con Google' };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') {
    return { ok: false, message: '' };
  }

  const code = Linking.parse(result.url).queryParams?.code;
  if (typeof code !== 'string') {
    return { ok: false, message: 'No pudimos iniciar con Google' };
  }
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return { ok: false, message: 'No pudimos iniciar con Google' };
  }
  return { ok: true };
}

export async function sendPasswordReset(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: Linking.createURL('login'),
  });
  if (error) return { ok: false, message: 'No pudimos enviar el correo' };
  return { ok: true };
}
