begin;

drop function if exists public.whoami();
drop function if exists public.whoami(jsonb);

create function public.whoami(payload jsonb default '{}'::jsonb)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'uid', auth.uid(),
    'role', auth.role(),
    'current_user', current_user,
    'claims', current_setting('request.jwt.claims', true),
    'payload', payload
  );
$$;

grant execute on function public.whoami(jsonb) to anon, authenticated;

commit;
