// Correo de bienvenida al confirmar la cuenta. Lo invoca el trigger bienvenida_al_confirmar
// (migración 20260930000100) vía pg_net con el mismo secreto compartido del pipeline.
// Secretos (supabase secrets set): PIPELINE_SECRET, SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM
// y opcional SMTP_PORT. Las Edge Functions bloquean los puertos 25 y 587: se usa 465 (SSL).
import { createClient } from 'npm:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6.9.16';

import { ASUNTO, HTML } from './plantilla.ts';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

const puerto = Number(Deno.env.get('SMTP_PORT') ?? 465);
const transporte = nodemailer.createTransport({
  host: Deno.env.get('SMTP_HOST'),
  port: puerto,
  secure: puerto === 465,
  auth: { user: Deno.env.get('SMTP_USER'), pass: Deno.env.get('SMTP_PASS') },
});

// El apodo lo escribe el usuario: se escapa antes de meterlo al HTML.
function escapar(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function mismoSecreto(a: string | null, b: string | undefined): boolean {
  if (!a || !b) return false;
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

async function enviarBienvenida(userId: string) {
  const { data: perfil, error } = await db
    .from('profiles')
    .select('mote, bienvenida_enviada_at')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!perfil) return { enviado: false, motivo: 'sin perfil' };
  // Idempotente: un reintento del trigger o una llamada manual no manda el correo dos veces.
  if (perfil.bienvenida_enviada_at) return { enviado: false, motivo: 'ya enviado' };

  const { data: usuario, error: e2 } = await db.auth.admin.getUserById(userId);
  if (e2 || !usuario.user?.email) throw e2 ?? new Error('usuario sin correo');
  if (!usuario.user.email_confirmed_at) return { enviado: false, motivo: 'correo sin confirmar' };

  const mote = escapar(perfil.mote ?? 'estudiante');
  await transporte.sendMail({
    from: Deno.env.get('SMTP_FROM'),
    to: usuario.user.email,
    subject: ASUNTO.replace('{{mote}}', perfil.mote ?? 'estudiante'),
    html: HTML.replaceAll('{{mote}}', mote),
    text:
      `¡Hola, ${perfil.mote ?? 'estudiante'}! Ya eres parte de Becar.ia.\n\n` +
      '1. Te avisamos antes de que cierre: guarda una convocatoria con el ♡ y te recordamos 7, 3 y 1 día antes.\n' +
      '2. Oportunidades hechas para ti: según tu nivel y tus intereses, revisadas contra su fuente oficial.\n' +
      '3. Gratis, sin anuncios y cuidando tus datos.\n\n' +
      'Tu primer paso: abre Becar.ia, entra a «Para ti» y guarda tu primera convocatoria.',
  });

  await db.from('profiles').update({ bienvenida_enviada_at: new Date().toISOString() }).eq('id', userId);
  return { enviado: true };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  if (!mismoSecreto(req.headers.get('x-pipeline-secret'), Deno.env.get('PIPELINE_SECRET'))) {
    return new Response('Unauthorized', { status: 401 });
  }
  const { user_id } = await req.json().catch(() => ({ user_id: null }));
  if (typeof user_id !== 'string') return Response.json({ error: 'falta user_id' }, { status: 400 });
  try {
    return Response.json({ ok: true, ...(await enviarBienvenida(user_id)) });
  } catch (e) {
    // Sin datos del usuario en el log: solo el tipo de fallo.
    console.error('[bienvenida]', e instanceof Error ? e.message : String(e));
    return Response.json({ ok: false }, { status: 500 });
  }
});
