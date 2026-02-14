begin;

drop policy if exists tenants_insert_self on public.tenants;

-- Não valida created_by aqui porque o trigger BEFORE INSERT é quem define.
-- Só garante que há um usuário autenticado (uid presente).
create policy tenants_insert_self
on public.tenants
for insert
to authenticated
with check (auth.uid() is not null);

commit;
