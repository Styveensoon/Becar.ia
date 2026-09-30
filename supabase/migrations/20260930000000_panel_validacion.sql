-- Panel de validación: cuentas del equipo que revisan lo que encuentra el pipeline y deciden
-- qué se publica. Solo ven esa sección de la app.

create table public.equipo (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  rol        text not null default 'validador' check (rol in ('validador')),
  created_at timestamptz not null default now()
);

alter table public.equipo enable row level security;

-- Cada quien puede saber si ES del equipo (la app decide qué mostrar); nadie ve la lista completa.
create policy "equipo_select_own" on public.equipo
  for select to authenticated using (user_id = (select auth.uid()));
-- Sin insert/update/delete: las altas y bajas se hacen desde el dashboard (service role).

create function public.es_validador()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.equipo where user_id = auth.uid() and rol = 'validador')
$$;

revoke execute on function public.es_validador() from public, anon;
grant execute on function public.es_validador() to authenticated;

-- Trazabilidad de cada decisión y fecha de publicación (alimenta los avisos de "nuevas para ti").
alter table public.oportunidades
  add column validado_por   uuid references auth.users (id) on delete set null,
  add column validado_at    timestamptz,
  add column motivo_rechazo text,
  add column publicado_at   timestamptz;

update public.oportunidades
   set publicado_at = coalesce(verificado_at, created_at)
 where estado = 'publicado';

create index oportunidades_publicado_at_idx on public.oportunidades (publicado_at) where estado = 'publicado';

-- Los validadores leen todo (pendiente, publicado, rechazado); el resto sigue viendo solo lo publicado.
create policy "oportunidades_select_validador" on public.oportunidades
  for select to authenticated using ((select public.es_validador()));

-- Única vía para cambiar el estado desde la app: nadie tiene UPDATE directo sobre oportunidades.
create function public.validar_oportunidad(p_id uuid, p_decision text, p_motivo text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.es_validador() then
    raise exception 'solo el equipo de validación puede publicar o rechazar';
  end if;
  if p_decision not in ('publicado', 'rechazado') then
    raise exception 'decisión inválida: %', p_decision;
  end if;
  if p_decision = 'rechazado' and coalesce(btrim(p_motivo), '') = '' then
    raise exception 'rechazar requiere un motivo';
  end if;

  update public.oportunidades
     set estado         = p_decision,
         validado_por   = auth.uid(),
         validado_at    = now(),
         verificado_at  = case when p_decision = 'publicado' then now() else verificado_at end,
         publicado_at   = case when p_decision = 'publicado' then coalesce(publicado_at, now()) else publicado_at end,
         motivo_rechazo = case when p_decision = 'rechazado' then left(btrim(p_motivo), 500) else null end
   where id = p_id;

  if not found then
    raise exception 'la oportunidad no existe';
  end if;
end;
$$;

revoke execute on function public.validar_oportunidad(uuid, text, text) from public, anon;
grant execute on function public.validar_oportunidad(uuid, text, text) to authenticated;

-- Los usuarios finales no deben poder escribir en oportunidades por ninguna vía directa.
revoke insert, update, delete on public.oportunidades from anon, authenticated;
