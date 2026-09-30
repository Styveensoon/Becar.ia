// Regenera supabase/functions/bienvenida/plantilla.ts desde el HTML del correo de bienvenida.
import { readFileSync, writeFileSync } from 'node:fs';

const raiz = new URL('../', import.meta.url);
const html = readFileSync(new URL('supabase/templates/bienvenida.html', raiz), 'utf8');
const salida =
  '// Generado desde supabase/templates/bienvenida.html (fuente de verdad del diseño).\n' +
  '// Si cambias el HTML, regenera este archivo: node scripts/generar-plantilla-bienvenida.mjs\n' +
  "export const ASUNTO = '¡Bienvenido a Becar.ia, {{mote}}! 🎓';\n" +
  `export const HTML = ${JSON.stringify(html)};\n`;
writeFileSync(new URL('supabase/functions/bienvenida/plantilla.ts', raiz), salida);
console.log('plantilla.ts regenerada');
