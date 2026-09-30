// Qué se busca y cómo se le pide al modelo. Sin dependencias de Deno: se puede probar en Node
// (el import de tipos se borra al ejecutar).
import type Anthropic from 'npm:@anthropic-ai/sdk@0.129.0';

export const MODELO = 'claude-opus-5-5';

export const NIVELES = {
  secundaria: 'secundaria (12 a 15 años; escuelas SEP públicas y privadas)',
  prepa: 'bachillerato / preparatoria / educación media superior (15 a 18 años)',
  universidad:
    'universidad: licenciatura, ingeniería o TSU (18+). Incluye también convocatorias para recién egresados o posgrado solo si están abiertas a estudiantes de licenciatura',
} as const;
export type Nivel = keyof typeof NIVELES;

export const GRUPOS = {
  becas: 'becas y apoyos económicos (manutención, transporte, excelencia, colegiatura, conectividad)',
  concursos:
    'concursos, olimpiadas del conocimiento, hackathons, premios de innovación o emprendimiento, ferias de ciencia y eventos formativos',
  movilidad:
    'movilidad e intercambio, veranos de investigación, estancias, y certificaciones o cursos gratuitos con constancia oficial',
} as const;
export type Grupo = keyof typeof GRUPOS;

export const CATEGORIAS = ['beca', 'movilidad', 'concurso', 'certificacion', 'evento'] as const;
export const NIVELES_BD = ['secundaria', 'prepa', 'universidad', 'posgrado'] as const;
export const CARRERAS = [
  'todas',
  'ingenieria-tecnologia',
  'ciencias-exactas-naturales',
  'ciencias-salud',
  'ciencias-sociales',
  'economico-administrativas',
  'artes-humanidades',
  'educacion',
] as const;
export const TEMAS = [
  'iot',
  'ia',
  'robotica',
  'programacion',
  'negocios',
  'arte-diseno',
  'salud',
  'idiomas',
  'medio-ambiente',
] as const;
export const MODALIDADES = ['presencial', 'en_linea', 'hibrida', 'no_especificada'] as const;

// Agregadores y redes: copian (a veces mal) convocatorias ajenas. Bloqueados en las
// herramientas del modelo y rechazados como fuente en la validación.
export const DOMINIOS_AGREGADORES = [
  'becasmexico.org',
  'becasmexico.com.mx',
  'mextudia.com',
  'buscadordebecas.com',
  'becaseducativas.com',
  'becasparalatinos.com',
  'mexicogob.com',
  'convocatoriasmexico.com',
  'tusbuenasnoticias.com',
  'cursotecaplus.com',
  'daadscholarship.com',
  'scholarshipsinstitute.com',
  'scholarshipregion.com',
  'globalsouthopportunities.com',
  'coursejoiner.com',
  'internshala.com',
  'facebook.com',
  'instagram.com',
  'x.com',
  'twitter.com',
  'tiktok.com',
  'youtube.com',
  'linkedin.com',
  'studocu.com',
  'scribd.com',
];

// Prensa: útil para DESCUBRIR una convocatoria, nunca como fuente citada (la validación la rechaza).
export const DOMINIOS_PRENSA = [
  'milenio.com',
  'informador.mx',
  'infobae.com',
  'yahoo.com',
  'eluniversal.com.mx',
  'elfinanciero.com.mx',
  'excelsior.com.mx',
  'jornada.com.mx',
  'nmas.com.mx',
  'laqueretanota.com',
  'cronista.com',
];

export const DOMINIOS_NO_FUENTE = [...DOMINIOS_AGREGADORES, ...DOMINIOS_PRENSA];

const nullable = (schema: Record<string, unknown>) => ({ anyOf: [schema, { type: 'null' }] });
const FECHA = { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' };

// Herramienta con la que el modelo entrega sus hallazgos. `strict` garantiza el esquema.
export const HERRAMIENTA_REGISTRO: Anthropic.Tool = {
  name: 'registrar_convocatorias',
  description:
    'Entrega la lista final de convocatorias verificadas. Llámala UNA sola vez, al terminar de investigar, con todas las convocatorias (puede ser una lista vacía).',
  strict: true,
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['convocatorias', 'notas'],
    properties: {
      notas: {
        type: 'string',
        description: 'Breve: qué buscaste, qué descartaste y por qué. Para el equipo que valida.',
      },
      convocatorias: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: [
            'titulo',
            'descripcion',
            'categoria',
            'institucion',
            'url_fuente',
            'cita_fecha_limite',
            'fecha_inicio_inscripcion',
            'fecha_limite',
            'fecha_evento_inicio',
            'fecha_evento_fin',
            'fecha_resultados',
            'monto',
            'requisitos',
            'niveles',
            'carreras',
            'dirigido_a',
            'edad_minima',
            'edad_maxima',
            'modalidad',
            'ubicacion',
            'costo_inscripcion',
            'temas',
          ],
          properties: {
            titulo: { type: 'string', description: 'Nombre oficial de la convocatoria, con año/edición.' },
            descripcion: { type: 'string', description: 'Una o dos frases claras para estudiantes.' },
            categoria: { type: 'string', enum: [...CATEGORIAS] },
            institucion: { type: 'string', description: 'Quién convoca.' },
            url_fuente: {
              type: 'string',
              description: 'URL https de la página oficial o del PDF oficial del convocante que abriste con web_fetch.',
            },
            cita_fecha_limite: {
              type: 'string',
              description:
                'Frase copiada LITERALMENTE de url_fuente (sin cambiar una letra) que contiene la fecha límite de inscripción.',
            },
            fecha_inicio_inscripcion: nullable(FECHA),
            fecha_limite: { ...FECHA, description: 'Cierre de inscripción, YYYY-MM-DD.' },
            fecha_evento_inicio: nullable(FECHA),
            fecha_evento_fin: nullable(FECHA),
            fecha_resultados: nullable(FECHA),
            monto: nullable({ type: 'string', description: 'Beneficio o premio tal como lo dice la fuente.' }),
            requisitos: { type: 'string', description: 'Requisitos principales según la fuente.' },
            niveles: { type: 'array', items: { type: 'string', enum: [...NIVELES_BD] } },
            carreras: { type: 'array', items: { type: 'string', enum: [...CARRERAS] } },
            dirigido_a: { type: 'string', description: 'A quién va dirigida, en una frase.' },
            edad_minima: nullable({ type: 'integer' }),
            edad_maxima: nullable({ type: 'integer' }),
            modalidad: { type: 'string', enum: [...MODALIDADES] },
            ubicacion: { type: 'string', description: 'Estado/ciudad/país, o "México (nacional)", o "En línea".' },
            costo_inscripcion: nullable({ type: 'string' }),
            temas: { type: 'array', items: { type: 'string', enum: [...TEMAS] } },
          },
        },
      },
    },
  },
};

// Estable entre solicitudes y semanas (se cachea): nada de fechas ni datos variables aquí.
export const SISTEMA = `Eres el investigador de convocatorias de Becar.ia, una app académica y gratuita hecha en Puebla, México, que ayuda a estudiantes de secundaria, bachillerato y universidad a no perder fechas de becas, concursos y programas.

Tu trabajo alimenta una base que después revisa una persona, así que la exactitud importa más que la cantidad. Una convocatoria inventada o con una fecha equivocada hace que un estudiante pierda una oportunidad real.

Reglas, sin excepción:
1. Solo convocatorias con inscripción ABIERTA hoy, o que abra en los próximos 45 días, y cuya fecha límite sea posterior a hoy.
2. Deben poder aplicar estudiantes que viven en México: nacionales, del estado de Puebla o de otros estados, o internacionales abiertas a mexicanos.
3. La fuente citada SIEMPRE es la página oficial del convocante o su PDF oficial (dominios .gob.mx, .edu.mx, sitios oficiales de universidades, fundaciones, empresas u organismos). Puedes usar notas de prensa solo para DESCUBRIR una convocatoria; después busca y abre su fuente oficial. Si no encuentras la fuente oficial, no la incluyas.
4. Antes de registrar una convocatoria, abre su url_fuente con web_fetch y copia en cita_fecha_limite la frase exacta de esa página que contiene la fecha límite, letra por letra, sin resumir ni corregir.
5. Todo dato que la fuente no diga explícitamente va en null (o "no_especificada" en modalidad). Nunca supongas montos, fechas, edades ni requisitos.
6. Para secundaria y bachillerato prioriza convocatorias gratuitas de instituciones reconocidas (SEP, gobiernos, universidades, olimpiadas oficiales, SECIHTI, fundaciones serias). Descarta cualquier cosa que pida pagos dudosos o datos excesivos a menores.
7. No repitas convocatorias de la lista de "ya conocidas" que te da el usuario.
8. Entre 0 y 8 convocatorias. Está bien entregar pocas o ninguna si no encuentras fuentes oficiales.

Clasificación:
- categoria: beca | movilidad | concurso | certificacion | evento.
- niveles: los niveles que la fuente acepta (secundaria, prepa, universidad, posgrado).
- carreras: áreas de estudio aceptadas; "todas" si no hay restricción.
- temas (puede ir vacío): iot, ia, robotica, programacion, negocios, arte-diseno, salud, idiomas, medio-ambiente. Solo si el tema es central en la convocatoria.

Cuando termines de investigar, llama UNA vez a registrar_convocatorias con todas las convocatorias y tus notas.`;

export function mensajeUsuario(nivel: Nivel, grupo: Grupo, hoy: string, conocidas: string[]): string {
  const lista = conocidas.length ? conocidas.map((u) => `- ${u}`).join('\n') : '(ninguna)';
  return `Fecha de hoy: ${hoy} (hora del centro de México).

Busca convocatorias de ${GRUPOS[grupo]} para estudiantes de ${NIVELES[nivel]}.

Convocatorias ya conocidas (no las repitas):
${lista}`;
}

export const HERRAMIENTAS: Anthropic.ToolUnion[] = [
  {
    type: 'web_search_20260209',
    name: 'web_search',
    max_uses: 8,
    blocked_domains: DOMINIOS_AGREGADORES,
    user_location: { type: 'approximate', country: 'MX', region: 'Puebla', city: 'Puebla', timezone: 'America/Mexico_City' },
  },
  { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 14, blocked_domains: DOMINIOS_AGREGADORES },
  HERRAMIENTA_REGISTRO,
];
