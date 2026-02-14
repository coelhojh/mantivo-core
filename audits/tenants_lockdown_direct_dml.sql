begin;

-- deixa SELECT conforme suas policies (member + superadmin)
-- e remove DML direto; criação via RPC create_tenant()
revoke insert, update, delete on table public.tenants from authenticated;

commit;
