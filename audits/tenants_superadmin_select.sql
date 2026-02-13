begin;

drop policy if exists tenants_select_superadmin on public.tenants;

create policy tenants_select_superadmin
on public.tenants
for select
to authenticated
using (public.is_super_admin());

commit;
