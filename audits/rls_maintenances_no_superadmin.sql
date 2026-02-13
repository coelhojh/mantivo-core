begin;

drop policy if exists maintenances_select on public.maintenances;
drop policy if exists maintenances_insert on public.maintenances;
drop policy if exists maintenances_update on public.maintenances;
drop policy if exists maintenances_delete on public.maintenances;

create policy maintenances_select
on public.maintenances
for select
to authenticated
using (
  tenant_id = public.get_my_tenant_id()
);

create policy maintenances_insert
on public.maintenances
for insert
to authenticated
with check (
  tenant_id = public.get_my_tenant_id()
);

create policy maintenances_update
on public.maintenances
for update
to authenticated
using (
  tenant_id = public.get_my_tenant_id()
)
with check (
  tenant_id = public.get_my_tenant_id()
);

create policy maintenances_delete
on public.maintenances
for delete
to authenticated
using (
  tenant_id = public.get_my_tenant_id()
);

commit;
