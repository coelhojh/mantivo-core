BEGIN;

CREATE OR REPLACE FUNCTION public.list_tenants_for_superadmin()
RETURNS TABLE (
  id uuid,
  name text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT t.id, t.name, t.created_at
  FROM public.tenants t
  WHERE public.is_super_admin()
  ORDER BY t.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.list_tenants_for_superadmin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_tenants_for_superadmin() TO authenticated;

COMMIT;
