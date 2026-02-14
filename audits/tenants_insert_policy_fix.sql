begin;

drop policy if exists tenants_insert_self on public.tenants;

create policy tenants_insert_self
on public.tenants
for insert
to authenticated
with check (created_by = auth.uid());

commit;
