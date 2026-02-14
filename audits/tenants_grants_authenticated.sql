begin;

grant insert on table public.tenants to authenticated;
grant update on table public.tenants to authenticated;
grant delete on table public.tenants to authenticated;

commit;
