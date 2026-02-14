BEGIN;

-- Wrapper com o parâmetro que o frontend usa: tenant_id
-- Chama a função já existente (com o parâmetro real dela).
-- Ajuste SOMENTE a linha marcada se o nome do parâmetro interno for diferente.

CREATE OR REPLACE FUNCTION public.set_active_tenant(tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ✅ IMPORTANTE: ajuste esta linha se a função interna tiver outro nome/assinatura
  PERFORM public.set_active_tenant(tenant_id::uuid);
END;
$$;

-- Permissões
REVOKE ALL ON FUNCTION public.set_active_tenant(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_active_tenant(uuid) TO authenticated;

COMMIT;
