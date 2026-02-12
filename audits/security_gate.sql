-- Mantivo Security Gate (read-only)
-- Rode antes de produção / após migrações

\echo '== 1) tenant_id NOT NULL (core tables)'
select 'condos' t, count(*) filter (where tenant_id is null) as nulls from public.condos
union all select 'providers', count(*) filter (where tenant_id is null) from public.providers
union all select 'maintenances', count(*) filter (where tenant_id is null) from public.maintenances;

\echo '== 2) RLS + FORCE (core + identity tables)'
select c.relname as table,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
  and c.relname in ('categories','condos','providers','maintenances','profiles','tenant_members','tenants')
order by c.relname;

\echo '== 3) indexes on tenant_id (core)'
select
  t.relname as table,
  i.relname as index_name,
  pg_get_indexdef(i.oid) as index_def
from pg_index ix
join pg_class i on i.oid = ix.indexrelid
join pg_class t on t.oid = ix.indrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname='public'
  and t.relname in ('condos','providers','maintenances','categories')
  and pg_get_indexdef(i.oid) ilike '%(tenant_id%'
order by t.relname, i.relname;

\echo '== 4) anon grants (should be 0 rows)'
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema='public'
  and grantee='anon'
order by table_name, privilege_type;

\echo '== 5) authenticated grants sanity (sensitive tables)'
select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) privileges
from information_schema.role_table_grants
where table_schema='public'
  and table_name in ('profiles','tenant_members','tenants')
  and grantee='authenticated'
group by table_name, grantee
order by table_name;

\echo '== 6) get_my_tenant_id() hardening'
select pg_get_functiondef('public.get_my_tenant_id()'::regprocedure);
