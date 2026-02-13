begin;

drop policy if exists condos_select on public.condos;
drop policy if exists condos_insert on public.condos;
drop policy if exists condos_update on public.condos;
drop policy if exists condos_delete on public.condos;

create policy condos_select
on public.condos
for select
to authenticated
using (
  tenant_id = public.get_my_tenant_id()
);

create policy condos_insert
on public.condos
for insert
to authenticated
with check (
  tenant_id = public.get_my_tenant_id()
);

create policy condos_update
on public.condos
for update
to authenticated
using (
  tenant_id = public.get_my_tenant_id()
)
with check (
  tenant_id = public.get_my_tenant_id()
);

create policy condos_delete
on public.condos
for delete
to authenticated
using (
  tenant_id = public.get_my_tenant_id()
);

commit;
