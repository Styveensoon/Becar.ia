-- Pipeline semanal de convocatorias (CLAUDE.md, Parte 1 → Pipeline de datos).
-- Flujo: cron lunes → Edge Function `pipeline-convocatorias` (accion=enviar) manda un lote a la
-- API de Claude (Batches, búsqueda web) → cron cada hora (accion=procesar) recoge resultados,
-- los valida en código contra la fuente y los inserta como 'pendiente_validar'.
-- Nada llega a la app sin que una persona del equipo lo publique.

-- 1. Evidencia por convocatoria detectada
alter table public.oportunidades
  add column origen               text not null default 'manual' check (origen in ('manual', 'pipeline')),
  -- Frase textual de la fuente oficial que contiene la fecha límite (la da el modelo).
  add column evidencia_cita       text,
  -- true si el pipeline descargó la fuente y encontró esa frase literal en ella.
  add column evidencia_verificada boolean not null default false,
  -- Notas de la validación automática (qué se revisó, qué falló) para quien valida a mano.
  add column notas_validacion     text,
  add column pipeline_run_id      uuid;

-- 2. Corridas del pipeline (una por lote enviado a la API)
create table public.pipeline_runs (
  id            uuid primary key default gen_random_uuid(),
  batch_id      text unique,
  -- Continuación de otra corrida cuando el modelo pausó a media búsqueda (pause_turn).
  parent_id     uuid references public.pipeline_runs (id),
  estado        text not null default 'enviado'
                check (estado in ('enviado', 'procesado', 'error')),
  -- Parámetros de cada solicitud del lote (custom_id → nivel/grupo/mensajes) para continuar.
  solicitudes   jsonb not null default '{}'::jsonb,
  -- Conteos: recibidas, insertadas, duplicadas, rechazadas (con motivos), costo en tokens.
  resumen       jsonb,
  error         text,
  created_at    timestamptz not null default now(),
  procesado_at  timestamptz
);

-- Solo el pipeline (service role) y el equipo desde el dashboard: sin policies = nadie más.
alter table public.pipeline_runs enable row level security;

alter table public.oportunidades
  add constraint oportunidades_pipeline_run_fk
  foreign key (pipeline_run_id) references public.pipeline_runs (id) on delete set null;

-- 3. Programación con pg_cron + pg_net. La URL del proyecto y el secreto compartido viven en
-- Supabase Vault (nunca en el código ni en esta migración): ver md/pipeline.md para crearlos.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create or replace function public.pipeline_invocar(accion text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  url    text := (select decrypted_secret from vault.decrypted_secrets where name = 'pipeline_project_url');
  secret text := (select decrypted_secret from vault.decrypted_secrets where name = 'pipeline_secret');
begin
  if url is null or secret is null then
    raise warning 'pipeline: faltan pipeline_project_url o pipeline_secret en Vault';
    return;
  end if;
  perform net.http_post(
    url     := url || '/functions/v1/pipeline-convocatorias',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-pipeline-secret', secret),
    body    := jsonb_build_object('accion', accion),
    timeout_milliseconds := 10000
  );
end;
$$;

revoke execute on function public.pipeline_invocar(text) from public, anon, authenticated;

-- Lunes 9:00 hora del centro de México (15:00 UTC): se envía el lote semanal.
select cron.schedule('pipeline-enviar', '0 15 * * 1', $$ select public.pipeline_invocar('enviar') $$);
-- Cada hora al minuto 20: recoge lotes terminados (la API tarda de minutos a 24 h).
select cron.schedule('pipeline-procesar', '20 * * * *', $$ select public.pipeline_invocar('procesar') $$);
