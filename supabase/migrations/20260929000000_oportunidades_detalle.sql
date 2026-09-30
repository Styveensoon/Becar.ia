-- Detalle de oportunidades: fechas clave, a quién va dirigida y temas para el Home.
-- Todos los arreglos usan catálogos cerrados (checks) para que el pipeline no invente valores.

alter table public.oportunidades
  -- Fechas: fecha_limite (ya existente) = cierre de inscripción.
  add column fecha_inicio_inscripcion date,
  add column fecha_evento_inicio      date,
  add column fecha_evento_fin         date,
  add column fecha_resultados         date,

  -- A quién va dirigida.
  add column niveles     text[] not null default '{}',
  add column carreras    text[] not null default '{}',
  add column dirigido_a  text,
  add column edad_minima smallint,
  add column edad_maxima smallint,

  -- Dónde y cómo.
  add column modalidad         text,
  add column ubicacion         text,
  add column costo_inscripcion text,

  -- Temas de la cuadrícula del Home (src/constants/temas.ts).
  add column temas text[] not null default '{}',

  -- Última vez que alguien del equipo validó contra la fuente.
  add column verificado_at timestamptz,
  add column updated_at    timestamptz not null default now();

alter table public.oportunidades
  add constraint oportunidades_niveles_chk
    check (niveles <@ array['secundaria', 'prepa', 'universidad', 'posgrado']),
  add constraint oportunidades_carreras_chk
    check (carreras <@ array[
      'todas', 'ingenieria-tecnologia', 'ciencias-exactas-naturales', 'ciencias-salud',
      'ciencias-sociales', 'economico-administrativas', 'artes-humanidades', 'educacion'
    ]),
  add constraint oportunidades_temas_chk
    check (temas <@ array[
      'iot', 'ia', 'robotica', 'programacion', 'negocios', 'arte-diseno', 'salud', 'idiomas',
      'medio-ambiente'
    ]),
  add constraint oportunidades_modalidad_chk
    check (modalidad in ('presencial', 'en_linea', 'hibrida')),
  add constraint oportunidades_edad_chk
    check (
      (edad_minima is null or edad_minima between 10 and 99)
      and (edad_maxima is null or edad_maxima between 10 and 99)
      and (edad_minima is null or edad_maxima is null or edad_minima <= edad_maxima)
    ),
  add constraint oportunidades_fechas_chk
    check (
      (fecha_inicio_inscripcion is null or fecha_limite is null or fecha_inicio_inscripcion <= fecha_limite)
      and (fecha_evento_inicio is null or fecha_evento_fin is null or fecha_evento_inicio <= fecha_evento_fin)
    ),
  -- La app abre este enlace con Linking: solo https, nunca javascript:/intent:/http.
  add constraint oportunidades_url_https_chk check (url_fuente ~ '^https://'),
  add constraint oportunidades_titulo_len_chk check (char_length(titulo) between 3 and 200);

create index oportunidades_temas_idx on public.oportunidades using gin (temas);

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger oportunidades_touch_updated_at
  before update on public.oportunidades
  for each row execute function public.touch_updated_at();
