import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { getSupabase } from "../../services/supabaseClient";
import { getAllTenants, refreshUserProfile } from "../../services/storageService";

type Tenant = {
  id: string;
  name: string;
};

function bumpTenantVersion() {
  localStorage.setItem("tenant_version", String(Date.now()));
  window.dispatchEvent(new Event("mantivo:tenant-changed"));
}

const SuperadminTenantSwitcher: React.FC = () => {
  const supabase = getSupabase();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);

  // Evita double-run em React StrictMode
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    (async () => {
      setLoading(true);
      try {
        // Carrega lista de tenants (RPC list_tenants_for_superadmin)
        const list = await getAllTenants();
        setTenants(Array.isArray(list) ? list : []);

        // Tenta obter tenant atual do cache
        const cached = JSON.parse(localStorage.getItem("cg_user_cache") || "{}");
        setActiveTenantId(cached?.activeTenantId || null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSwitch = async (tenantId: string) => {
    if (!supabase) {
      alert("Supabase não inicializado (getSupabase() retornou null).");
      return;
    }
    if (!tenantId) return;

    const prev = activeTenantId;
    setActiveTenantId(tenantId); // feedback imediato

    setSwitching(true);
    try {
      // IMPORTANTÍSSIMO: o parâmetro precisa bater com a assinatura do Postgres:
      // public.set_active_tenant(p_tenant_id uuid)
      const { error } = await supabase.rpc("set_active_tenant", {
        p_tenant_id: tenantId,
      });

      if (error) {
        console.error("[SuperadminTenantSwitcher] set_active_tenant error:", error);
        setActiveTenantId(prev ?? null);
        alert(`Falha ao trocar tenant: ${(error as any)?.message ?? "erro desconhecido"}`);
        return;
      }

      // Atualiza cache do usuário (pega active_tenant_id atualizado)
      try {
        await supabase.auth.refreshSession();
      } catch {
        // noop
      }

      try {
        await refreshUserProfile();
      } catch {
        // noop (se falhar, ainda assim forçamos remount)
      }

      // Garante que o app inteiro refaça queries com o tenant novo
      bumpTenantVersion();
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-xs font-bold text-amber-700 uppercase">
          Superadmin — Tenant Switcher
        </p>
        {(loading || switching) && (
          <Loader2 className="animate-spin text-amber-700" size={16} />
        )}
      </div>

      {loading ? (
        <div className="text-sm text-amber-800">Carregando tenants...</div>
      ) : tenants.length === 0 ? (
        <div className="text-sm text-amber-800">
          Nenhum tenant encontrado (verifique RPC/permissões).
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-amber-800">
            Tenant ativo
          </label>

          <select
            className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm"
            value={activeTenantId ?? ""}
            disabled={switching}
            onChange={(e) => handleSwitch(e.target.value)}
          >
            <option value="" disabled>
              Selecione um tenant...
            </option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.id.slice(0, 8)}…)
              </option>
            ))}
          </select>

          <div className="text-[11px] text-amber-800/80">
            Trocar tenant força remount do app (tenant_version) para refazer queries
            com o novo contexto.
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperadminTenantSwitcher;
