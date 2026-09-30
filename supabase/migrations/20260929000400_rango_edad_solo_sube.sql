-- El rango de edad solo puede avanzar (13-15 → 16-17 → 18+). Evita que una cuenta registrada
-- como adulta (o sin rango) pase a ser de menor sin el consentimiento de tutor del registro.
-- Espejo en la app: rangoPermitido() en src/constants/personalizacion.ts.
create function public.profiles_rango_edad_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  orden constant text[] := array['13-15', '16-17', '18+'];
begin
  if new.rango_edad is not distinct from old.rango_edad then
    return new;
  end if;
  if new.rango_edad is null then
    raise exception 'rango_edad no puede quedar vacío';
  end if;
  if old.rango_edad is null then
    -- Sin rango previo solo puede declararse adulto; un menor debe pasar por el registro con tutor.
    if new.rango_edad <> '18+' and not old.consentimiento_tutor then
      raise exception 'rango_edad de menor requiere consentimiento de tutor';
    end if;
  elsif array_position(orden, new.rango_edad) < array_position(orden, old.rango_edad) then
    raise exception 'rango_edad solo puede avanzar';
  end if;
  return new;
end;
$$;

revoke execute on function public.profiles_rango_edad_guard() from public, anon, authenticated;

create trigger profiles_rango_edad_guard
  before update of rango_edad on public.profiles
  for each row execute function public.profiles_rango_edad_guard();
