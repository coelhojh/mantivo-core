begin;

drop policy if exists providers_select on public.providers;
drop policy if exists providers_insert on public.providers;
drop policy if exists providers_update on public.providers;
drop policy if exists providers_delete on public.providers;

create policy providers_select
on public.providers
for select
to authenticated
using (
  tenant_id = public.get_my_tenant_id()
);

create policy providers_insert
on public.providers
for insert
to authenticated
with check (
  tenant_id = public.get_my_tenant_id()
);

create policy providers_update
on public.providers
for update
to authenticated
using (
  tenant_id = public.get_my_tenant_id()
)
with check (
  tenant_id = public.get_my_tenant_id()
);

create policy providers_delete
on public.providers
for delete
to authenticated
using (
  tenant_id = public.get_my_tenant_id()
);

commit;
