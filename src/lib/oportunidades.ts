import { temas, type Tema } from '@/constants/temas';
import { diasRestantes, toDateKey } from '@/lib/fechas';
import { supabase } from '@/lib/supabase';

export type Categoria = 'beca' | 'movilidad' | 'concurso' | 'certificacion' | 'evento';

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  beca: 'Beca',
  movilidad: 'Movilidad',
  concurso: 'Concurso',
  certificacion: 'Certificación',
  evento: 'Evento',
};

export type Oportunidad = {
  id: string;
  titulo: string;
  descripcion: string | null;
  categoria: Categoria;
  institucion: string | null;
  url_fuente: string;
  fecha_inicio_inscripcion: string | null;
  fecha_limite: string | null;
  fecha_evento_inicio: string | null;
  fecha_evento_fin: string | null;
  fecha_resultados: string | null;
  monto: string | null;
  requisitos: string | null;
  niveles: string[];
  carreras: string[];
  dirigido_a: string | null;
  edad_minima: number | null;
  edad_maxima: number | null;
  modalidad: 'presencial' | 'en_linea' | 'hibrida' | null;
  ubicacion: string | null;
  costo_inscripcion: string | null;
  temas: Tema['id'][];
  publicado_at: string | null;
};

// Lo que muestra una tarjeta de lista (favoritos guarda solo esto).
export const CAMPOS_LISTA = 'id, titulo, categoria, institucion, fecha_limite, temas';
export type OportunidadResumen = Pick<
  Oportunidad,
  'id' | 'titulo' | 'categoria' | 'institucion' | 'fecha_limite' | 'temas'
>;

// Columnas del catálogo local: todo lo que ve un estudiante (nada de evidencia ni notas internas).
const CAMPOS_CATALOGO =
  'id, titulo, descripcion, categoria, institucion, url_fuente, fecha_inicio_inscripcion, fecha_limite, ' +
  'fecha_evento_inicio, fecha_evento_fin, fecha_resultados, monto, requisitos, niveles, carreras, dirigido_a, ' +
  'edad_minima, edad_maxima, modalidad, ubicacion, costo_inscripcion, temas, publicado_at';

export function resumen(o: OportunidadResumen): OportunidadResumen {
  return {
    id: o.id,
    titulo: o.titulo,
    categoria: o.categoria,
    institucion: o.institucion,
    fecha_limite: o.fecha_limite,
    temas: o.temas,
  };
}

// Vigente = sin fecha límite o que no ha cerrado. Se revisa también en el teléfono porque el
// catálogo guardado puede tener días.
export function esVigente(o: Pick<Oportunidad, 'fecha_limite'>): boolean {
  return !o.fecha_limite || diasRestantes(o.fecha_limite) >= 0;
}

// Descarga el catálogo de convocatorias publicadas y vigentes (lo usa CatalogoProvider).
export async function descargarCatalogo(): Promise<Oportunidad[]> {
  const { data, error } = await supabase
    .from('oportunidades')
    .select(CAMPOS_CATALOGO)
    // RLS ya lo garantiza para estudiantes; el filtro explícito documenta la regla.
    .eq('estado', 'publicado')
    .or(`fecha_limite.is.null,fecha_limite.gte.${toDateKey(new Date())}`)
    .order('fecha_limite', { ascending: true, nullsFirst: false })
    .limit(1000)
    .returns<Oportunidad[]>();
  if (error) throw error;
  return data ?? [];
}

// Para lo que no está en el catálogo (p. ej. un favorito que ya cerró).
export async function obtenerOportunidad(id: string): Promise<Oportunidad | null> {
  const { data, error } = await supabase
    .from('oportunidades')
    .select(CAMPOS_CATALOGO)
    .eq('id', id)
    .eq('estado', 'publicado')
    .maybeSingle<Oportunidad>();
  if (error) throw error;
  return data;
}

// Sin acentos ni mayúsculas, solo letras, números y espacios.
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const TEMAS_NORM = temas.map((t) => ({ id: t.id, label: normalizar(t.label) }));
const CATEGORIAS_NORM = (Object.keys(CATEGORIA_LABEL) as Categoria[]).map((c) => ({
  id: c,
  label: normalizar(CATEGORIA_LABEL[c]),
}));

// Palabras que no aportan a la búsqueda ("becas en alemania" = "becas alemania").
const VACIAS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'en', 'y', 'a', 'para', 'con', 'por', 'un', 'una']);

// "prog" → programacion; "becas" → beca. Prefijo en ambos sentidos para aguantar plurales.
function coincide(palabra: string, etiqueta: string): boolean {
  return etiqueta
    .split(' ')
    .some((w) => w.length >= 2 && (w.startsWith(palabra) || (w.length >= 4 && palabra.startsWith(w))));
}

// Texto buscable de una oportunidad, normalizado una sola vez por objeto.
const textoCache = new WeakMap<Oportunidad, string>();
function textoBuscable(o: Oportunidad): string {
  let t = textoCache.get(o);
  if (t === undefined) {
    t = normalizar([o.titulo, o.descripcion, o.institucion, o.dirigido_a, o.ubicacion].filter(Boolean).join(' '));
    textoCache.set(o, t);
  }
  return t;
}

// Cada palabra tiene que aparecer (AND entre palabras). Una palabra coincide si está en el
// texto de la oportunidad, o si nombra uno de sus temas ("programacion") o su categoría ("becas").
function coincidePalabra(o: Oportunidad, palabra: string): boolean {
  if (textoBuscable(o).includes(palabra)) return true;
  if (TEMAS_NORM.some((t) => o.temas.includes(t.id) && coincide(palabra, t.label))) return true;
  return palabra.length >= 3 && CATEGORIAS_NORM.some((c) => c.id === o.categoria && coincide(palabra, c.label));
}

// Búsqueda local sobre el catálogo: funciona igual con o sin conexión.
export function buscarEn(items: Oportunidad[], filtro: { texto?: string; tema?: Tema['id'] }): Oportunidad[] {
  const palabras = normalizar(filtro.texto ?? '')
    .split(' ')
    .filter((p) => p && !VACIAS.has(p))
    .slice(0, 6);
  return items.filter(
    (o) =>
      esVigente(o) &&
      (!filtro.tema || o.temas.includes(filtro.tema)) &&
      palabras.every((p) => coincidePalabra(o, p)),
  );
}
