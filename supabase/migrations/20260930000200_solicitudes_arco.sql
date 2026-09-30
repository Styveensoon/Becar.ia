-- Registro de solicitudes ARCO que llegan por correo (las de la app son autoservicio y no pasan
-- por aquí). Sirve de evidencia de que se atendieron en plazo (LFPDPPP: 20 días hábiles para
-- responder, 15 más para hacerla efectiva). Solo el equipo, desde el dashboard: RLS sin policies.

-- Suma días hábiles (lunes a viernes). No descuenta días festivos: revisarlos a mano.
create function public.sumar_dias_habiles(desde date, dias int)
returns date
language plpgsql
immutable
set search_path = ''
as $$
declare
  d date := desde;
  n int := 0;
begin
  while n < dias loop
    d := d + 1;
    if extract(isodow from d) < 6 then
      n := n + 1;
    end if;
  end loop;
  return d;
end;
$$;

create table public.solicitudes_arco (
  id                 uuid primary key default gen_random_uuid(),
  recibida_el        date not null default (now() at time zone 'America/Mexico_City')::date,
  correo_solicitante text not null,
  -- Cuenta a la que se refiere (null si el correo no coincide con ninguna).
  user_id            uuid references auth.users (id) on delete set null,
  derecho            text not null check (derecho in ('acceso', 'rectificacion', 'cancelacion', 'oposicion', 'revocacion')),
  descripcion        text not null,
  -- Madre, padre o tutor que pide por una persona menor.
  via_tutor          boolean not null default false,
  estado             text not null default 'recibida'
                     check (estado in ('recibida', 'en_proceso', 'atendida', 'improcedente')),
  vence_respuesta    date generated always as (public.sumar_dias_habiles(recibida_el, 20)) stored,
  respondida_el      date,
  notas              text,
  created_at         timestamptz not null default now()
);

alter table public.solicitudes_arco enable row level security;
revoke all on public.solicitudes_arco from anon, authenticated;
revoke execute on function public.sumar_dias_habiles(date, int) from public, anon, authenticated;
