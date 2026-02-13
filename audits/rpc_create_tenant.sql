begin;

create or replace function public.create_tenant(p_name text)
returns public.tenants
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.tenants;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.tenants(name)
  values (p_name)
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.create_tenant(text) from public;
grant execute on function public.create_tenant(text) to authenticated;

commit;
