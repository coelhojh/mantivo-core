\echo '== SECURITY GATE: baseline info =='
select now() as ran_at;

\echo '== 1) Tables with tenant_id must be NOT NULL =='
select table_name,
       sum(case when is_nullable='YES' then 1 else 0 end) as nullable_columns_named_tenant_id
from information_schema.columns
where table_schema='public'
  and column_name='tenant_id'
group by table_name
order by table_name;

\echo '== 2) RLS enabled status (public schema) =='
select c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
  and c.relkind='r'
order by 1;

\echo '== 3) Policies summary =='
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname='public'
order by tablename, policyname;

\echo '== 4) Grants for authenticated (watch sensitive tables) =='
select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) privileges
from information_schema.role_table_grants
where table_schema='public'
  and grantee in ('authenticated','anon')
group by table_name, grantee
order by table_name, grantee;

\echo '== 5) Functions that are SECURITY DEFINER in public =='
select n.nspname as schema,
       p.proname as function,
       pg_get_function_identity_arguments(p.oid) as args,
       p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname='public'
order by 1,2;

\echo '== DONE =='
