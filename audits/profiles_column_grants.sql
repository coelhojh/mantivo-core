begin;

-- 1) remove UPDATE geral (é isso que está mantendo UPDATE no active_tenant_id)
revoke update on table public.profiles from authenticated;

-- 2) mantém SELECT
grant select on table public.profiles to authenticated;

-- 3) libera UPDATE SOMENTE em campos de perfil "seguros"
grant update (name, company_name, preferences)
on table public.profiles
to authenticated;

-- (Opcional) Se você realmente precisa que o usuário atualize esses campos no app,
-- descomente UM A UM e só se tiver certeza que não são privilégios/ACL sensíveis:
-- grant update (permissions) on table public.profiles to authenticated;
-- grant update (allowed_condos) on table public.profiles to authenticated;

commit;
