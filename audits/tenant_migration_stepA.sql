BEGIN;

-- 1) Colunas tenant_id
ALTER TABLE public.categories    ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.condos        ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.providers     ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.maintenances  ADD COLUMN IF NOT EXISTS tenant_id uuid;

-- 2) Índices
CREATE INDEX IF NOT EXISTS idx_categories_tenant_id   ON public.categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_condos_tenant_id       ON public.condos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_providers_tenant_id    ON public.providers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenances_tenant_id ON public.maintenances(tenant_id);

-- 3) FK para tenants
ALTER TABLE public.categories
  ADD CONSTRAINT fk_categories_tenant
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.condos
  ADD CONSTRAINT fk_condos_tenant
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.providers
  ADD CONSTRAINT fk_providers_tenant
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.maintenances
  ADD CONSTRAINT fk_maintenances_tenant
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

COMMIT;
