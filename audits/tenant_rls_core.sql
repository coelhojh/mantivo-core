BEGIN;

-- =========================================================
-- CONDOS
-- =========================================================
DROP POLICY IF EXISTS "Access condos" ON public.condos;
DROP POLICY IF EXISTS "Owner sees condos" ON public.condos;
DROP POLICY IF EXISTS "Tenant isolation condos" ON public.condos;

DROP POLICY IF EXISTS condos_select ON public.condos;
DROP POLICY IF EXISTS condos_insert ON public.condos;
DROP POLICY IF EXISTS condos_update ON public.condos;
DROP POLICY IF EXISTS condos_delete ON public.condos;

CREATE POLICY condos_select
ON public.condos
FOR SELECT
TO authenticated
USING (
  is_super_admin()
  OR tenant_id = public.get_my_tenant_id()
);

CREATE POLICY condos_insert
ON public.condos
FOR INSERT
TO authenticated
WITH CHECK (
  is_super_admin()
  OR tenant_id = public.get_my_tenant_id()
);

CREATE POLICY condos_update
ON public.condos
FOR UPDATE
TO authenticated
USING (
  is_super_admin()
  OR tenant_id = public.get_my_tenant_id()
)
WITH CHECK (
  is_super_admin()
  OR tenant_id = public.get_my_tenant_id()
);

-- você já criou, mas deixo padronizado no pacote
CREATE POLICY condos_delete
ON public.condos
FOR DELETE
TO authenticated
USING (
  is_super_admin()
  OR tenant_id = public.get_my_tenant_id()
);

-- =========================================================
-- PROVIDERS
-- =========================================================
DROP POLICY IF EXISTS "Access providers" ON public.providers;
DROP POLICY IF EXISTS "Manage providers" ON public.providers;
DROP POLICY IF EXISTS "Tenant isolation providers" ON public.providers;

DROP POLICY IF EXISTS providers_select ON public.providers;
DROP POLICY IF EXISTS providers_insert ON public.providers;
DROP POLICY IF EXISTS providers_update ON public.providers;
DROP POLICY IF EXISTS providers_delete ON public.providers;

CREATE POLICY providers_select
ON public.providers
FOR SELECT
TO authenticated
USING (
  is_super_admin()
  OR tenant_id = public.get_my_tenant_id()
);

CREATE POLICY providers_insert
ON public.providers
FOR INSERT
TO authenticated
WITH CHECK (
  is_super_admin()
  OR tenant_id = public.get_my_tenant_id()
);

CREATE POLICY providers_update
ON public.providers
FOR UPDATE
TO authenticated
USING (
  is_super_admin()
  OR tenant_id = public.get_my_tenant_id()
)
WITH CHECK (
  is_super_admin()
  OR tenant_id = public.get_my_tenant_id()
);

CREATE POLICY providers_delete
ON public.providers
FOR DELETE
TO authenticated
USING (
  is_super_admin()
  OR tenant_id = public.get_my_tenant_id()
);

-- =========================================================
-- MAINTENANCES
-- =========================================================
DROP POLICY IF EXISTS "Access maintenances" ON public.maintenances;
DROP POLICY IF EXISTS "Manage maintenances" ON public.maintenances;
DROP POLICY IF EXISTS "Tenant isolation maintenances" ON public.maintenances;

DROP POLICY IF EXISTS maintenances_select ON public.maintenances;
DROP POLICY IF EXISTS maintenances_insert ON public.maintenances;
DROP POLICY IF EXISTS maintenances_update ON public.maintenances;
DROP POLICY IF EXISTS maintenances_delete ON public.maintenances;

CREATE POLICY maintenances_select
ON public.maintenances
FOR SELECT
TO authenticated
USING (
  is_super_admin()
  OR tenant_id = public.get_my_tenant_id()
);

CREATE POLICY maintenances_insert
ON public.maintenances
FOR INSERT
TO authenticated
WITH CHECK (
  is_super_admin()
  OR tenant_id = public.get_my_tenant_id()
);

CREATE POLICY maintenances_update
ON public.maintenances
FOR UPDATE
TO authenticated
USING (
  is_super_admin()
  OR tenant_id = public.get_my_tenant_id()
)
WITH CHECK (
  is_super_admin()
  OR tenant_id = public.get_my_tenant_id()
);

CREATE POLICY maintenances_delete
ON public.maintenances
FOR DELETE
TO authenticated
USING (
  is_super_admin()
  OR tenant_id = public.get_my_tenant_id()
);

COMMIT;
