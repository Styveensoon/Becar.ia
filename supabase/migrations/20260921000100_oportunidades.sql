create table public.fuentes (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  url_base   text not null,
  confiable  boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.oportunidades (
  id           uuid primary key default gen_random_uuid(),
  titulo       text not null,
  descripcion  text,
  categoria    text not null check (categoria in ('beca', 'movilidad', 'concurso', 'certificacion', 'evento')),
  institucion  text,
  fecha_limite date,
  monto        text,
  requisitos   text,
  url_fuente   text not null,
  fuente_id    uuid references public.fuentes (id),
  estado       text not null default 'pendiente_validar'
               check (estado in ('pendiente_validar', 'publicado', 'rechazado')),
  created_at   timestamptz not null default now()
);

create index oportunidades_estado_idx on public.oportunidades (estado, fecha_limite);

create table public.guardadas (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  oportunidad_id uuid not null references public.oportunidades (id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (user_id, oportunidad_id)
);

alter table public.fuentes enable row level security;
alter table public.oportunidades enable row level security;
alter table public.guardadas enable row level security;

-- fuentes: sin policies. Solo el equipo (service role / dashboard) la lee y escribe.

-- Usuarios finales solo ven lo publicado. La validación y el pipeline usan service role.
create policy "oportunidades_select_publicado" on public.oportunidades
  for select to authenticated using (estado = 'publicado');

create policy "guardadas_select_own" on public.guardadas
  for select to authenticated using (user_id = (select auth.uid()));
create policy "guardadas_insert_own" on public.guardadas
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "guardadas_delete_own" on public.guardadas
  for delete to authenticated using (user_id = (select auth.uid()));
