begin;

revoke update (created_by, slug) on table public.tenants from authenticated;

commit;
