import React from "react";
import type { MaintenanceUpsertFormData, MaintenanceProviderOption } from "../types";

type Props = {
  formData: MaintenanceUpsertFormData;
  setFormData: React.Dispatch<React.SetStateAction<MaintenanceUpsertFormData>>;
  providers: MaintenanceProviderOption[];
  handleProviderChange: (providerId: string) => void;
};

export default function ProviderSection({
  formData,
  setFormData,
  providers,
  handleProviderChange,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50">
      <div className="px-5 py-4 border-b border-slate-200/60">
        <p className="text-xs font-semibold text-slate-700">
          Prestador de serviço
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          Opcional: registre responsável e contatos.
        </p>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Prestador de serviço
            </label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition"
              value={formData.providerId ?? ""}
              onChange={(e) => handleProviderChange(e.target.value)}
            >
              <option value="">(Sem prestador)</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition"
              value={formData.providerContact ?? ""}
              onChange={(e) =>
                setFormData((p) => ({ ...p, providerContact: e.target.value }))
              }
              placeholder="Pessoa de contato"
            />
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition"
              value={formData.providerPhone ?? ""}
              onChange={(e) =>
                setFormData((p) => ({ ...p, providerPhone: e.target.value }))
              }
              placeholder="Telefone/WhatsApp"
            />
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition md:col-span-2"
              value={formData.providerEmail ?? ""}
              onChange={(e) =>
                setFormData((p) => ({ ...p, providerEmail: e.target.value }))
              }
              placeholder="E-mail"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
