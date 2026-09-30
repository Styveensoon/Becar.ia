// Validación en código de lo que entrega el modelo. No confía en el modelo: revisa esquema,
// dominio, fechas y que la fuente exista y contenga la frase citada. Sin dependencias de Deno.
import {
  CARRERAS,
  CATEGORIAS,
  DOMINIOS_NO_FUENTE,
  MODALIDADES,
  NIVELES_BD,
  TEMAS,
} from './busqueda.ts';

export type Candidata = {
  titulo: string;
  descripcion: string;
  categoria: (typeof CATEGORIAS)[number];
  institucion: string;
  url_fuente: string;
  cita_fecha_limite: string;
  fecha_inicio_inscripcion: string | null;
  fecha_limite: string;
  fecha_evento_inicio: string | null;
  fecha_evento_fin: string | null;
  fecha_resultados: string | null;
  monto: string | null;
  requisitos: string;
  niveles: string[];
  carreras: string[];
  dirigido_a: string;
  edad_minima: number | null;
  edad_maxima: number | null;
  modalidad: (typeof MODALIDADES)[number];
  ubicacion: string;
  costo_inscripcion: string | null;
  temas: string[];
};

// Mismo criterio que la columna `busqueda` de la BD y el buscador de la app.
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function dominio(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

function esDominioNoFuente(host: string): boolean {
  return DOMINIOS_NO_FUENTE.some((d) => host === d || host.endsWith(`.${d}`));
}

function fechaValida(f: string | null): f is string {
  if (!f || !/^\d{4}-\d{2}-\d{2}$/.test(f)) return false;
  const [y, m, d] = f.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function diasEntre(desde: string, hasta: string): number {
  return Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000);
}

const subset = (xs: string[], permitidos: readonly string[]) => xs.every((x) => permitidos.includes(x));

// Reglas que no requieren red. Devuelve el motivo de rechazo, o null si pasa.
export function revisarEstructura(c: Candidata, hoy: string): string | null {
  if (!c.titulo || c.titulo.length < 3 || c.titulo.length > 200) return 'título vacío o fuera de rango';
  if (!CATEGORIAS.includes(c.categoria)) return `categoría inválida: ${c.categoria}`;
  if (!MODALIDADES.includes(c.modalidad)) return `modalidad inválida: ${c.modalidad}`;

  let url: URL;
  try {
    url = new URL(c.url_fuente);
  } catch {
    return 'url_fuente no es una URL';
  }
  if (url.protocol !== 'https:') return 'url_fuente no es https';
  const host = dominio(c.url_fuente);
  if (!host) return 'url_fuente sin dominio';
  if (esDominioNoFuente(host)) return `fuente no oficial (${host})`;

  if (!fechaValida(c.fecha_limite)) return `fecha_limite inválida: ${c.fecha_limite}`;
  const dias = diasEntre(hoy, c.fecha_limite);
  if (dias < 1) return `ya cerró o cierra hoy (${c.fecha_limite})`;
  if (dias > 400) return `fecha_limite demasiado lejana (${c.fecha_limite})`;
  for (const [nombre, f] of [
    ['fecha_inicio_inscripcion', c.fecha_inicio_inscripcion],
    ['fecha_evento_inicio', c.fecha_evento_inicio],
    ['fecha_evento_fin', c.fecha_evento_fin],
    ['fecha_resultados', c.fecha_resultados],
  ] as const) {
    if (f !== null && !fechaValida(f)) return `${nombre} inválida: ${f}`;
  }
  if (c.fecha_inicio_inscripcion && c.fecha_inicio_inscripcion > c.fecha_limite) {
    return 'la inscripción abre después de cerrar';
  }
  if (c.fecha_evento_inicio && c.fecha_evento_fin && c.fecha_evento_inicio > c.fecha_evento_fin) {
    return 'el evento termina antes de empezar';
  }

  if (!c.niveles.length || !subset(c.niveles, NIVELES_BD)) return 'niveles vacíos o inválidos';
  if (!subset(c.carreras, CARRERAS)) return 'carreras inválidas';
  if (!subset(c.temas, TEMAS)) return 'temas inválidos';
  for (const e of [c.edad_minima, c.edad_maxima]) {
    if (e !== null && (!Number.isInteger(e) || e < 10 || e > 99)) return `edad fuera de rango: ${e}`;
  }
  if (c.edad_minima !== null && c.edad_maxima !== null && c.edad_minima > c.edad_maxima) {
    return 'edad mínima mayor que la máxima';
  }
  if (!c.cita_fecha_limite || c.cita_fecha_limite.trim().length < 12) return 'sin cita de la fecha límite';
  // Si la frase "literal" no contiene la fecha declarada, la fecha probablemente es inventada.
  if (!citaMencionaFecha(c.cita_fecha_limite, c.fecha_limite)) {
    return `la cita no menciona la fecha límite declarada (${c.fecha_limite})`;
  }
  return null;
}

const MESES = [
  ['enero', 'january', 'ene', 'jan'],
  ['febrero', 'february', 'feb'],
  ['marzo', 'march', 'mar'],
  ['abril', 'april', 'abr', 'apr'],
  ['mayo', 'may'],
  ['junio', 'june', 'jun'],
  ['julio', 'july', 'jul'],
  ['agosto', 'august', 'ago', 'aug'],
  ['septiembre', 'setiembre', 'september', 'sep', 'sept'],
  ['octubre', 'october', 'oct'],
  ['noviembre', 'november', 'nov'],
  ['diciembre', 'december', 'dic', 'dec'],
];

// ¿La frase citada menciona de verdad la fecha límite declarada? (día + mes, en texto o número)
export function citaMencionaFecha(cita: string, fecha: string): boolean {
  const [y, m, d] = fecha.split('-').map(Number);
  const t = ` ${normalizar(cita)} `;
  const tieneDia = new RegExp(`(^|\\D)0?${d}(\\D|$)`).test(t);
  const tieneMesTexto = MESES[m - 1].some((n) => t.includes(` ${n} `));
  const numerica = [
    `${d}/${m}/${y}`,
    `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`,
    `${d}-${m}-${y}`,
    `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`,
    fecha,
  ].some((f) => cita.includes(f));
  return numerica || (tieneDia && tieneMesTexto);
}

// Texto visible aproximado de un HTML (sin scripts, estilos ni etiquetas).
export function textoDeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

// ¿La frase citada aparece literalmente (ignorando acentos, mayúsculas y espacios) en la fuente?
export function citaEnFuente(cita: string, textoFuente: string): boolean {
  const c = normalizar(cita);
  return c.length >= 12 && normalizar(textoFuente).includes(c);
}

// Clave para detectar duplicados (junto con la URL). Conserva el año: la edición del año
// siguiente es otra convocatoria. Solo se compara contra convocatorias vigentes.
export function claveTitulo(titulo: string): string {
  return normalizar(titulo);
}
