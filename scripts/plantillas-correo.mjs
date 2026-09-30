// Sube SOLO las plantillas de correo con código (registro y recuperación) a Supabase Auth.
// No toca nada más de la configuración (SMTP, límites, proveedores quedan igual).
//
// Uso (PowerShell, desde la raíz del repo):
//   $env:SUPABASE_ACCESS_TOKEN="sbp_..."; node scripts/plantillas-correo.mjs
// El token se crea en https://supabase.com/dashboard/account/tokens y conviene borrarlo al terminar.
import { readFileSync } from 'node:fs';

const REF = 'itkttzmhtevcrjuhzqvg';
const API = `https://api.supabase.com/v1/projects/${REF}/config/auth`;
const token = process.env.SUPABASE_ACCESS_TOKEN;

if (!token) {
  console.error('Falta SUPABASE_ACCESS_TOKEN (créalo en https://supabase.com/dashboard/account/tokens).');
  process.exit(1);
}

const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
const leer = (f) => readFileSync(new URL(`../supabase/templates/${f}`, import.meta.url), 'utf8');

const cambios = {
  mailer_subjects_confirmation: 'Tu código para confirmar Becar.ia: {{ .Token }}',
  mailer_templates_confirmation_content: leer('confirmacion.html'),
  mailer_subjects_recovery: 'Tu código para Becar.ia: {{ .Token }}',
  mailer_templates_recovery_content: leer('recuperacion.html'),
};

for (const [campo, valor] of Object.entries(cambios)) {
  if (!valor.includes('{{ .Token }}')) throw new Error(`${campo} no incluye {{ .Token }}`);
}

// PATCH con solo estos 4 campos: la API deja intactos los que no se mandan.
const res = await fetch(API, { method: 'PATCH', headers, body: JSON.stringify(cambios) });
if (!res.ok) {
  console.error(`Supabase respondió ${res.status}: ${await res.text()}`);
  process.exit(1);
}

// Verificación: se vuelve a leer la configuración y se revisa cada plantilla.
const actual = await (await fetch(API, { headers })).json();
let ok = true;
for (const campo of Object.keys(cambios)) {
  const bien = String(actual[campo] ?? '').includes('{{ .Token }}');
  ok &&= bien;
  console.log(`${bien ? '✔' : '✘'} ${campo}`);
}
console.log(`SMTP sigue configurado: ${actual.smtp_host ? `sí (${actual.smtp_host})` : 'NO — revisar'}`);
process.exit(ok ? 0 : 1);
