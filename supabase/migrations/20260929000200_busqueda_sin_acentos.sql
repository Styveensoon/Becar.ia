-- Búsqueda que ignora acentos y mayúsculas: "programacion" encuentra "Programación".
create extension if not exists unaccent with schema extensions;

-- unaccent() no es IMMUTABLE (depende del diccionario), así que no sirve en una columna generada.
-- Este envoltorio fija el diccionario y sí puede declararse IMMUTABLE.
create function public.f_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, $1)
$$;

revoke execute on function public.f_unaccent(text) from public, anon;

-- Texto normalizado (sin acentos, en minúsculas) de los campos buscables.
alter table public.oportunidades
  add column busqueda text generated always as (
    lower(public.f_unaccent(
      titulo || ' ' || coalesce(descripcion, '') || ' ' || coalesce(institucion, '') || ' ' ||
      coalesce(dirigido_a, '') || ' ' || coalesce(ubicacion, '')
    ))
  ) stored;
