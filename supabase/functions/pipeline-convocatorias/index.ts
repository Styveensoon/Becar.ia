// Pipeline semanal de convocatorias. Lo invoca pg_cron (migración 20260929000500):
//   accion = 'enviar'   → lunes: arma 9 búsquedas (3 niveles × 3 grupos) y las manda como un
//                         lote a la API de Claude (Batches: asíncrono, 50% más barato, sin
//                         límite de tiempo de la Edge Function).
//   accion = 'procesar' → cada hora: si el lote terminó, valida cada hallazgo en código y lo
//                         inserta como 'pendiente_validar'. Una persona lo publica después.
// Secretos (supabase secrets set): ANTHROPIC_API_KEY, PIPELINE_SECRET.
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase.
import Anthropic from 'npm:@anthropic-ai/sdk@0.129.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

import {
  GRUPOS,
  HERRAMIENTA_REGISTRO,
  HERRAMIENTAS,
  mensajeUsuario,
  MODELO,
  NIVELES,
  SISTEMA,
  type Grupo,
  type Nivel,
} from './busqueda.ts';
import {
  citaEnFuente,
  claveTitulo,
  revisarEstructura,
  textoDeHtml,
  type Candidata,
} from './validacion.ts';

const anthropic = new Anthropic(); // lee ANTHROPIC_API_KEY
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

// Margen dentro del límite de tiempo de la Edge Function: lo que no alcance se retoma en la
// siguiente hora (el procesamiento es idempotente gracias a la deduplicación).
const PRESUPUESTO_MS = 110_000;
const MAX_CONTINUACIONES = 2;

type Solicitud = { nivel: Nivel; grupo: Grupo; profundidad: number; messages: Anthropic.MessageParam[] };

function hoyMexico(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date());
}

function parametros(messages: Anthropic.MessageParam[]): Anthropic.MessageCreateParamsNonStreaming {
  return {
    model: MODELO,
    max_tokens: 32000,
    thinking: { type: 'adaptive' },
    // Investigación minuciosa: la exactitud pesa más que el costo aquí.
    output_config: { effort: 'high' },
    // Prompt de sistema idéntico en todas las solicitudes y semanas → se cachea.
    system: [{ type: 'text', text: SISTEMA, cache_control: { type: 'ephemeral' } }],
    tools: HERRAMIENTAS,
    messages,
  };
}

async function crearLote(solicitudes: Record<string, Solicitud>, parentId: string | null) {
  const lote = await anthropic.messages.batches.create({
    requests: Object.entries(solicitudes).map(([custom_id, s]) => ({ custom_id, params: parametros(s.messages) })),
  });
  const { error } = await db
    .from('pipeline_runs')
    .insert({ batch_id: lote.id, parent_id: parentId, solicitudes });
  if (error) throw error;
  return lote.id;
}

async function enviar() {
  const hoy = hoyMexico();
  // Lo ya conocido (vigente) va en el mensaje para que el modelo no lo repita.
  const { data: conocidas, error } = await db
    .from('oportunidades')
    .select('url_fuente')
    .in('estado', ['publicado', 'pendiente_validar'])
    .or(`fecha_limite.is.null,fecha_limite.gte.${hoy}`)
    .limit(300);
  if (error) throw error;
  const urls = [...new Set((conocidas ?? []).map((o) => o.url_fuente as string))];

  const solicitudes: Record<string, Solicitud> = {};
  for (const nivel of Object.keys(NIVELES) as Nivel[]) {
    for (const grupo of Object.keys(GRUPOS) as Grupo[]) {
      solicitudes[`${nivel}-${grupo}`] = {
        nivel,
        grupo,
        profundidad: 0,
        messages: [{ role: 'user', content: mensajeUsuario(nivel, grupo, hoy, urls) }],
      };
    }
  }
  const batchId = await crearLote(solicitudes, null);
  return { batchId, solicitudes: Object.keys(solicitudes).length };
}

type Resumen = {
  recibidas: number;
  insertadas: number;
  verificadas: number;
  duplicadas: number;
  rechazadas: { titulo: string; motivo: string }[];
  sin_registro: string[];
  errores: string[];
  continuaciones: number;
  notas_modelo: Record<string, string>;
  tokens: { entrada: number; salida: number; cache_lectura: number };
};

// Descarga la fuente y busca la cita literal. Distingue "fuente no existe" (rechazo) de
// "no se pudo comprobar" (se inserta marcada para revisión manual).
async function revisarFuente(
  c: Candidata,
): Promise<{ rechazo: string | null; verificada: boolean; nota: string }> {
  let res: Response;
  try {
    res = await fetch(c.url_fuente, {
      redirect: 'follow',
      signal: AbortSignal.timeout(12_000),
      headers: {
        'User-Agent': 'BecariaBot/1.0 (proyecto academico sin fines de lucro; verificacion de convocatorias)',
        'Accept-Language': 'es-MX,es;q=0.9',
      },
    });
  } catch {
    return { rechazo: null, verificada: false, nota: 'No se pudo abrir la fuente (red o tiempo de espera): verificar a mano.' };
  }
  if (res.status === 404 || res.status === 410) {
    return { rechazo: `la fuente no existe (HTTP ${res.status})`, verificada: false, nota: '' };
  }
  if (!res.ok) {
    return { rechazo: null, verificada: false, nota: `La fuente respondió HTTP ${res.status} (posible bloqueo a bots): verificar a mano.` };
  }
  if (!res.url.startsWith('https://')) {
    return { rechazo: 'la fuente redirige a una URL sin https', verificada: false, nota: '' };
  }
  const tipo = res.headers.get('content-type') ?? '';
  if (tipo.includes('pdf')) {
    await res.body?.cancel();
    return { rechazo: null, verificada: false, nota: 'La fuente es un PDF: la cita no se comprueba automáticamente, verificar a mano.' };
  }
  const html = (await res.text()).slice(0, 3_000_000);
  if (citaEnFuente(c.cita_fecha_limite, textoDeHtml(html))) {
    return { rechazo: null, verificada: true, nota: 'Cita de la fecha límite encontrada literalmente en la fuente.' };
  }
  return {
    rechazo: null,
    verificada: false,
    nota: 'La cita NO aparece en el HTML de la fuente (la página puede cargarse con JavaScript o la cita estar mal): verificar con cuidado.',
  };
}

async function fuenteId(url: string, institucion: string): Promise<string | null> {
  const origen = new URL(url).origin;
  const { data } = await db.from('fuentes').select('id').eq('url_base', origen).limit(1).maybeSingle();
  if (data) return data.id as string;
  const { data: nueva } = await db
    .from('fuentes')
    .insert({ nombre: institucion.slice(0, 120), url_base: origen, confiable: false })
    .select('id')
    .single();
  return (nueva?.id as string) ?? null;
}

async function procesarRun(run: { id: string; batch_id: string; solicitudes: Record<string, Solicitud> }, inicio: number) {
  const lote = await anthropic.messages.batches.retrieve(run.batch_id);
  if (lote.processing_status !== 'ended') return { run: run.id, estado: lote.processing_status };

  const hoy = hoyMexico();
  const resumen: Resumen = {
    recibidas: 0,
    insertadas: 0,
    verificadas: 0,
    duplicadas: 0,
    rechazadas: [],
    sin_registro: [],
    errores: [],
    continuaciones: 0,
    notas_modelo: {},
    tokens: { entrada: 0, salida: 0, cache_lectura: 0 },
  };
  const candidatas: Candidata[] = [];
  const continuar: Record<string, Solicitud> = {};

  for await (const r of await anthropic.messages.batches.results(run.batch_id)) {
    const solicitud = run.solicitudes[r.custom_id];
    if (r.result.type !== 'succeeded') {
      resumen.errores.push(`${r.custom_id}: ${r.result.type}`);
      continue;
    }
    const msg = r.result.message;
    resumen.tokens.entrada += msg.usage.input_tokens;
    resumen.tokens.salida += msg.usage.output_tokens;
    resumen.tokens.cache_lectura += msg.usage.cache_read_input_tokens ?? 0;

    if (msg.stop_reason === 'refusal') {
      resumen.errores.push(`${r.custom_id}: el modelo declinó (${msg.stop_details?.category ?? 'sin categoría'})`);
      continue;
    }
    const registro = msg.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === HERRAMIENTA_REGISTRO.name,
    );
    if (registro) {
      const input = registro.input as { convocatorias: Candidata[]; notas: string };
      resumen.notas_modelo[r.custom_id] = input.notas;
      candidatas.push(...input.convocatorias);
      continue;
    }
    // El bucle de búsqueda del servidor se pausó (pause_turn): se reanuda en otro lote
    // reenviando el turno del asistente tal cual (sin agregar "continúa").
    if (msg.stop_reason === 'pause_turn' && solicitud && solicitud.profundidad < MAX_CONTINUACIONES) {
      continuar[r.custom_id] = {
        ...solicitud,
        profundidad: solicitud.profundidad + 1,
        messages: [
          ...solicitud.messages,
          // Los bloques de la respuesta se reenvían sin cambios (incluidos los de thinking).
          { role: 'assistant', content: msg.content },
        ],
      };
      continue;
    }
    resumen.sin_registro.push(`${r.custom_id}: terminó (${msg.stop_reason}) sin registrar convocatorias`);
  }

  // Deduplicación contra lo vigente en la BD y dentro del mismo lote.
  const { data: vigentes } = await db
    .from('oportunidades')
    .select('titulo')
    .or(`fecha_limite.is.null,fecha_limite.gte.${hoy}`);
  const titulos = new Set((vigentes ?? []).map((o) => claveTitulo(o.titulo as string)));

  resumen.recibidas = candidatas.length;
  let completo = true;
  for (const c of candidatas) {
    if (Date.now() - inicio > PRESUPUESTO_MS) {
      completo = false; // se retoma en la siguiente hora
      break;
    }
    const motivo = revisarEstructura(c, hoy);
    if (motivo) {
      resumen.rechazadas.push({ titulo: c.titulo, motivo });
      continue;
    }
    // Por título, no por URL: una misma página puede publicar varias convocatorias (p. ej. sedes).
    if (titulos.has(claveTitulo(c.titulo))) {
      resumen.duplicadas++;
      continue;
    }
    const fuente = await revisarFuente(c);
    if (fuente.rechazo) {
      resumen.rechazadas.push({ titulo: c.titulo, motivo: fuente.rechazo });
      continue;
    }

    const { error } = await db.from('oportunidades').insert({
      titulo: c.titulo,
      descripcion: c.descripcion,
      categoria: c.categoria,
      institucion: c.institucion,
      url_fuente: c.url_fuente,
      fuente_id: await fuenteId(c.url_fuente, c.institucion),
      estado: 'pendiente_validar',
      origen: 'pipeline',
      pipeline_run_id: run.id,
      evidencia_cita: c.cita_fecha_limite,
      evidencia_verificada: fuente.verificada,
      notas_validacion: fuente.nota,
      fecha_inicio_inscripcion: c.fecha_inicio_inscripcion,
      fecha_limite: c.fecha_limite,
      fecha_evento_inicio: c.fecha_evento_inicio,
      fecha_evento_fin: c.fecha_evento_fin,
      fecha_resultados: c.fecha_resultados,
      monto: c.monto,
      requisitos: c.requisitos,
      niveles: c.niveles,
      carreras: c.carreras,
      dirigido_a: c.dirigido_a,
      edad_minima: c.edad_minima,
      edad_maxima: c.edad_maxima,
      modalidad: c.modalidad === 'no_especificada' ? null : c.modalidad,
      ubicacion: c.ubicacion,
      costo_inscripcion: c.costo_inscripcion,
      temas: c.temas,
    });
    if (error) {
      resumen.rechazadas.push({ titulo: c.titulo, motivo: `la BD la rechazó: ${error.message}` });
      continue;
    }
    titulos.add(claveTitulo(c.titulo));
    resumen.insertadas++;
    if (fuente.verificada) resumen.verificadas++;
  }

  if (!completo) return { run: run.id, estado: 'parcial', resumen };

  if (Object.keys(continuar).length) {
    resumen.continuaciones = Object.keys(continuar).length;
    await crearLote(continuar, run.id);
  }
  await db
    .from('pipeline_runs')
    .update({ estado: 'procesado', resumen, procesado_at: new Date().toISOString() })
    .eq('id', run.id);
  return { run: run.id, estado: 'procesado', resumen };
}

async function procesar() {
  const inicio = Date.now();
  const { data: runs, error } = await db
    .from('pipeline_runs')
    .select('id, batch_id, solicitudes, created_at')
    .eq('estado', 'enviado')
    .order('created_at')
    .limit(3);
  if (error) throw error;

  const salida = [];
  for (const run of runs ?? []) {
    try {
      salida.push(await procesarRun(run, inicio));
    } catch (e) {
      // Un lote que falla no bloquea a los demás; queda registrado para revisarlo.
      const mensaje = e instanceof Error ? e.message : String(e);
      await db.from('pipeline_runs').update({ estado: 'error', error: mensaje }).eq('id', run.id);
      salida.push({ run: run.id, estado: 'error', error: mensaje });
    }
    if (Date.now() - inicio > PRESUPUESTO_MS) break;
  }
  return salida;
}

// Comparación en tiempo constante para no filtrar el secreto por temporización.
function mismoSecreto(a: string | null, b: string | undefined): boolean {
  if (!a || !b) return false;
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  if (!mismoSecreto(req.headers.get('x-pipeline-secret'), Deno.env.get('PIPELINE_SECRET'))) {
    return new Response('Unauthorized', { status: 401 });
  }
  const { accion } = await req.json().catch(() => ({ accion: null }));
  try {
    const resultado =
      accion === 'enviar' ? await enviar() : accion === 'procesar' ? await procesar() : null;
    if (resultado === null) return Response.json({ error: 'accion debe ser enviar o procesar' }, { status: 400 });
    return Response.json({ ok: true, resultado });
  } catch (e) {
    // Errores de la API de Claude o de la BD: se reportan sin exponer secretos.
    const mensaje = e instanceof Anthropic.APIError ? `Anthropic ${e.status}: ${e.message}` : String(e);
    console.error('[pipeline]', mensaje);
    return Response.json({ ok: false, error: mensaje }, { status: 500 });
  }
});
