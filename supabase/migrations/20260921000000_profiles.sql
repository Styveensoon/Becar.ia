-- profiles: una fila por usuario, creada por trigger al registrarse.
-- Nunca guarda fecha de nacimiento ni nombre real (ver CLAUDE.md, Parte 2).
create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  mote            text,
  rango_edad      text check (rango_edad in ('13-15', '16-17', '18+')),
  nivel_educativo text check (nivel_educativo in ('secundaria', 'prepa', 'universidad')),
  avatar_id       text,
  color           text check (color in ('orange', 'yellow', 'green', 'blue', 'pink', 'purple')),
  intereses       text[] not null default '{}',
  institucion     text,
  created_at      timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Sin policy de insert: solo el trigger crea filas. El borrado ocurre en cascada
-- al eliminar el usuario de auth.users (borrar cuenta).

-- Lee la metadata que manda el signup. Con Google no hay mote/rango/nivel: quedan null.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, mote, rango_edad, nivel_educativo)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'mote', ''),
    nullif(new.raw_user_meta_data ->> 'rango_edad', ''),
    nullif(new.raw_user_meta_data ->> 'nivel_educativo', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
