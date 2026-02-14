begin;

alter table public.profiles enable row level security;

-- Remove policies antigas (pelos nomes que apareceram no seu gate)
drop policy if exists "Team view profiles" on public.profiles;
drop policy if exists "View profiles" on public.profiles;
drop policy if exists "Update profiles" on public.profiles;
drop policy if exists "User edit own profile" on public.profiles;

-- SELECT: o próprio usuário vê o seu; superadmin pode ver todos (útil para suporte)
create policy profiles_select
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_super_admin()
);

-- UPDATE: usuário atualiza o próprio profile; superadmin pode atualizar (suporte)
create policy profiles_update
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or public.is_super_admin()
)
with check (
  id = auth.uid()
  or public.is_super_admin()
);

-- TRAVA: impedir update direto em active_tenant_id (obrigar RPC)
revoke update (active_tenant_id) on public.profiles from authenticated;

commit;
