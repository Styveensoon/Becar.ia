// Genera las páginas públicas (GitHub Pages, carpeta docs/) desde src/constants/legal.ts, el mismo
// texto que muestra la app. Así la web y la app nunca se desalinean.
//
// Uso: node --experimental-strip-types scripts/generar-legal-web.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const legal = await import(new URL('../src/constants/legal.ts', import.meta.url));
const { TERMINOS, PRIVACIDAD, LEGAL_FECHA, CORREO_CONTACTO, WEB_BASE } = legal;

const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Párrafos que empiezan con "• " se agrupan en listas, igual que en la app.
function secciones(lista) {
  return lista
    .map((s) => {
      let html = `<section><h2>${esc(s.titulo)}</h2>`;
      let enLista = false;
      for (const p of s.parrafos) {
        if (p.startsWith('• ')) {
          if (!enLista) html += '<ul>';
          enLista = true;
          html += `<li>${esc(p.slice(2))}</li>`;
        } else {
          if (enLista) html += '</ul>';
          enLista = false;
          html += `<p>${esc(p)}</p>`;
        }
      }
      if (enLista) html += '</ul>';
      return `${html}</section>`;
    })
    .join('\n');
}

const estilo = `
:root { --bg:#FFFFFF; --alt:#FAFAFA; --ink:#2B2D42; --muted:#6E7082; --line:#E7E7EC; --brand:#FF7A33; --brand-ink:#C24A0F; --tint:#FFE7D6; }
@media (prefers-color-scheme: dark) { :root { --bg:#17181F; --alt:#1E1F28; --ink:#F1F0F5; --muted:#A4A6B8; --line:#33353F; --brand:#FF7A33; --brand-ink:#FF9A5E; --tint:#3A2A20; color-scheme: dark; } }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--ink); font-family:Poppins, Arial, Helvetica, sans-serif; line-height:1.65; }
header { background:#2B2D42; padding:18px 20px; }
header a { color:#FFFFFF; text-decoration:none; font-weight:700; font-size:20px; }
header a span { color:var(--brand); }
main { max-width:720px; margin:0 auto; padding:32px 20px 64px; }
h1 { font-size:32px; line-height:1.2; margin:0 0 6px; text-wrap:balance; }
.fecha { color:var(--muted); font-size:14px; margin:0 0 28px; }
h2 { font-size:19px; margin:32px 0 8px; }
p, li { font-size:16px; }
ul { padding-left:22px; }
a { color:var(--brand-ink); }
.caja { background:var(--tint); border-radius:16px; padding:18px 20px; margin:20px 0; }
.caja h2 { margin-top:0; }
.correo { font-weight:600; user-select:all; }
nav.enlaces { display:grid; gap:12px; margin-top:24px; }
nav.enlaces a { display:block; padding:16px 18px; border:1px solid var(--line); border-radius:14px; background:var(--alt); text-decoration:none; color:var(--ink); font-weight:600; }
footer { max-width:720px; margin:0 auto; padding:0 20px 40px; color:var(--muted); font-size:13px; }
`;

function pagina(titulo, cuerpo) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)} · Becar.ia</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap">
<style>${estilo}</style>
</head>
<body>
<header><a href="./">Becar<span>.</span>ia</a></header>
<main>
${cuerpo}
</main>
<footer>Becar.ia · proyecto académico sin fines de lucro · Puebla, México · <span class="correo">${esc(CORREO_CONTACTO)}</span></footer>
</body>
</html>
`;
}

const privacidad = pagina(
  'Aviso de Privacidad',
  `<h1>Aviso de Privacidad</h1><p class="fecha">Última actualización: ${esc(LEGAL_FECHA)}</p>
<p>En resumen: pedimos lo mínimo, no usamos tu nombre real, no vendemos ni compartimos tus datos para publicidad, y puedes borrar todo cuando quieras.</p>
${secciones(PRIVACIDAD)}`,
);

const terminos = pagina(
  'Términos y Condiciones',
  `<h1>Términos y Condiciones</h1><p class="fecha">Última actualización: ${esc(LEGAL_FECHA)}</p>
${secciones(TERMINOS)}`,
);

// Página que exige Play Store: cómo pedir el borrado sin tener la app instalada.
const eliminar = pagina(
  'Eliminar tu cuenta',
  `<h1>Eliminar tu cuenta de Becar.ia</h1><p class="fecha">App: Becar.ia · Responsable: equipo de Becar.ia</p>
<div class="caja"><h2>Opción 1: desde la app (al instante)</h2>
<ul><li>Abre Becar.ia e inicia sesión.</li><li>Ve a <strong>Perfil → Eliminar cuenta</strong>.</li><li>Lee lo que se borra, marca «Entiendo que eliminar mi cuenta es permanente» y confirma.</li></ul></div>
<div class="caja"><h2>Opción 2: sin la app (por correo)</h2>
<p>Escribe a <span class="correo">${esc(CORREO_CONTACTO)}</span> <strong>desde el correo con el que te registraste</strong>, con el asunto «Eliminar mi cuenta» y tu apodo en la app. Como no pedimos tu nombre, ese correo es lo que acredita que la cuenta es tuya.</p>
<p>La eliminamos en un máximo de 15 días hábiles y te confirmamos por el mismo medio.</p></div>
<section><h2>Qué se borra</h2><ul>
<li>Tu cuenta de acceso (correo y contraseña).</li>
<li>Tu perfil: apodo, rango de edad, nivel educativo, avatar, color, intereses e institución.</li>
<li>Tus favoritos y el registro de los términos que aceptaste.</li>
<li>Los recordatorios programados en tu teléfono (si la borras desde la app; por correo, se borran al desinstalarla).</li>
</ul></section>
<section><h2>Qué se conserva y por cuánto tiempo</h2><ul>
<li>Tus datos pueden permanecer por un tiempo limitado en copias de seguridad cifradas del proveedor de infraestructura, hasta que estas se renuevan automáticamente.</li>
<li>Si la pides por correo, conservamos solo el registro de tu solicitud (tu correo, la fecha y cómo la atendimos) para acreditar que la atendimos conforme a la ley.</li>
<li>Las convocatorias son información pública y siguen disponibles; no contienen datos tuyos.</li>
</ul></section>
<p>Más detalles en el <a href="privacidad.html">Aviso de Privacidad</a>.</p>`,
);

const inicio = pagina(
  'Legal y privacidad',
  `<h1>Becar.ia</h1><p class="fecha">Becas, concursos y programas para estudiantes, sin que se te pasen las fechas.</p>
<nav class="enlaces">
<a href="privacidad.html">Aviso de Privacidad</a>
<a href="terminos.html">Términos y Condiciones</a>
<a href="eliminar-cuenta.html">Eliminar tu cuenta</a>
</nav>
<p>Contacto: <span class="correo">${esc(CORREO_CONTACTO)}</span></p>`,
);

const docs = new URL('../docs/', import.meta.url);
mkdirSync(docs, { recursive: true });
writeFileSync(new URL('index.html', docs), inicio);
writeFileSync(new URL('privacidad.html', docs), privacidad);
writeFileSync(new URL('terminos.html', docs), terminos);
writeFileSync(new URL('eliminar-cuenta.html', docs), eliminar);
// Sin Jekyll: GitHub Pages sirve los archivos tal cual.
writeFileSync(new URL('.nojekyll', docs), '');
console.log(`Páginas generadas en docs/ → ${WEB_BASE}/`);
