begin;

drop policy if exists categories_select on public.categories;
drop policy if exists categories_insert on public.categories;
drop policy if exists categories_update on public.categories;
drop policy if exists categories_delete on public.categories;

create policy categories_select
on public.categories
for select
to authenticated
using (
  is_system = true
  OR tenant_id = public.get_my_tenant_id()
);

create policy categories_insert
on public.categories
for insert
to authenticated
with check (
  tenant_id = public.get_my_tenant_id()
  AND is_system = false
);

create policy categories_update
on public.categories
for update
to authenticated
using (
  tenant_id = public.get_my_tenant_id()
  AND is_system = false
)
with check (
  tenant_id = public.get_my_tenant_id()
  AND is_system = false
);

create policy categories_delete
on public.categories
for delete
to authenticated
using (
  tenant_id = public.get_my_tenant_id()
  AND is_system = false
);

commit;
