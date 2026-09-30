-- Evidencia del consentimiento (LFPDPPP): qué versión de Términos/Aviso aceptó, cuándo, y si
-- una persona de 13-17 declaró tener la autorización de su madre, padre o tutor.
alter table public.profiles
  add column terminos_version      text,
  add column terminos_aceptados_at timestamptz,
  add column consentimiento_tutor  boolean not null default false;

-- El usuario solo puede editar los campos de su perfil, nunca la evidencia de consentimiento
-- (ni id/created_at). RLS dice QUÉ filas; estos grants dicen QUÉ columnas.
revoke update on public.profiles from authenticated, anon;
grant update (mote, rango_edad, nivel_educativo, avatar_id, color, intereses, institucion)
  on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta          jsonb := new.raw_user_meta_data;
  rango         text  := nullif(meta ->> 'rango_edad', '');
  version       text  := nullif(meta ->> 'terminos_version', '');
  tutor         boolean := coalesce((meta ->> 'consentimiento_tutor')::boolean, false);
begin
  -- Defensa en profundidad: la app no deja enviar el registro de un menor sin el permiso,
  -- pero la BD tampoco lo acepta si alguien llama a la API directamente.
  if rango in ('13-15', '16-17') and not tutor then
    raise exception 'consentimiento_tutor requerido para menores de edad';
  end if;

  insert into public.profiles (
    id, mote, rango_edad, nivel_educativo, terminos_version, terminos_aceptados_at, consentimiento_tutor
  )
  values (
    new.id,
    nullif(meta ->> 'mote', ''),
    rango,
    nullif(meta ->> 'nivel_educativo', ''),
    version,
    case when version is not null then now() end,
    tutor and rango in ('13-15', '16-17')
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
