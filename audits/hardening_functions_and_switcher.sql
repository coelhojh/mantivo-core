begin;

-- 1) HARDEN get_my_tenant_id(): remover row_security off (desnecessário e perigoso)
create or replace function public.get_my_tenant_id()
returns uuid
language sql
stable
security definer
set search_path to 'public','pg_temp'
as $function$
  select
    coalesce(
      (select p.active_tenant_id
         from public.profiles p
        where p.id = auth.uid()
        limit 1),
      (select tm.tenant_id
         from public.tenant_members tm
        where tm.user_id = auth.uid()
        order by tm.created_at asc, tm.tenant_id asc
        limit 1)
    );
$function$;

-- 2) HARDEN is_super_admin(): fix search_path (mantém lógica atual)
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path to 'public','pg_temp'
as $function$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'super_admin'
  );
$function$;

-- 3) HARDEN get_my_account_id(): fix search_path (se ainda existir por legado)
create or replace function public.get_my_account_id()
returns uuid
language sql
stable
security definer
set search_path to 'public','pg_temp'
as $function$
  select account_id from public.profiles where id = auth.uid() limit 1;
$function$;

-- 4) HARDEN handle_new_user(): NÃO aceitar account_id vindo do client
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.profiles (id, email, name, company_name, account_id)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'company',
    new.id
  )
  on conflict (id) do nothing;

  return new;
end;
$function$;

-- 5) Criar RPC set_active_tenant() (se ainda não existir)
create or replace function public.set_active_tenant(p_tenant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_allowed boolean;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if public.is_super_admin() then
    v_allowed := true;
  else
    v_allowed := exists (
      select 1
      from public.tenant_members tm
      where tm.user_id = v_uid
        and tm.tenant_id = p_tenant_id
    );
  end if;

  if not v_allowed then
    raise exception 'Not allowed to switch to this tenant';
  end if;

  update public.profiles
     set active_tenant_id = p_tenant_id
   where id = v_uid;

  if not found then
    raise exception 'Profile not found for user %', v_uid;
  end if;
end;
$$;

commit;
