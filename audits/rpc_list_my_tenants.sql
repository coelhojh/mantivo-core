BEGIN;

CREATE OR REPLACE FUNCTION public.list_my_tenants()
RETURNS TABLE (
  id uuid,
  name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT t.id, t.name
  FROM public.tenants t
  JOIN public.tenant_members tm ON tm.tenant_id = t.id
  WHERE tm.user_id = auth.uid()
  ORDER BY t.name;
$$;

REVOKE ALL ON FUNCTION public.list_my_tenants() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_my_tenants() TO authenticated;

COMMIT;
