-- Borrar cuenta desde la app (requisito de Play Store). Borra al usuario de auth.users;
-- profiles y guardadas caen en cascada.
create function public.delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

-- Postgres da EXECUTE a public por defecto: solo usuarios con sesión pueden llamarla.
revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;

-- Las funciones de trigger no deben ser invocables vía /rpc.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

-- Límites de longitud en campos libres del perfil (el usuario puede hacer UPDATE directo).
alter table public.profiles
  add constraint profiles_mote_len_chk check (mote is null or char_length(mote) between 1 and 30),
  add constraint profiles_institucion_len_chk check (institucion is null or char_length(institucion) <= 120),
  add constraint profiles_avatar_chk check (avatar_id is null or avatar_id ~ '^avatar-([1-9]|1[0-2])$'),
  add constraint profiles_intereses_chk check (
    intereses <@ array[
      'ciencia-tecnologia', 'artes-humanidades', 'negocios-emprendimiento', 'salud-bienestar',
      'idiomas-comunicacion', 'deportes-voluntariado-ambiente'
    ]
  );
