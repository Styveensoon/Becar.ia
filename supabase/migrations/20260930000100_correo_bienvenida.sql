-- Correo de bienvenida: se manda una sola vez, cuando la cuenta pasa de "sin confirmar" a
-- "confirmada" (código de registro). La Edge Function `bienvenida` hace el envío.

alter table public.profiles add column bienvenida_enviada_at timestamptz;

create function public.bienvenida_al_confirmar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  url    text := (select decrypted_secret from vault.decrypted_secrets where name = 'pipeline_project_url');
  secret text := (select decrypted_secret from vault.decrypted_secrets where name = 'pipeline_secret');
begin
  -- Sin Vault configurado no se bloquea la confirmación: simplemente no hay correo.
  if url is not null and secret is not null then
    perform net.http_post(
      url     := url || '/functions/v1/bienvenida',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-pipeline-secret', secret),
      body    := jsonb_build_object('user_id', new.id),
      timeout_milliseconds := 10000
    );
  end if;
  return new;
end;
$$;

revoke execute on function public.bienvenida_al_confirmar() from public, anon, authenticated;

create trigger bienvenida_al_confirmar
  after update of email_confirmed_at on auth.users
  for each row
  when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function public.bienvenida_al_confirmar();
