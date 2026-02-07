import React from "react";
import { MaintenanceType } from "../../../types";
import type {
  MaintenanceCondoOption,
  MaintenanceCategoryOption,
  MaintenanceUpsertFormData,
} from "../types";

type Props = {
  formData: MaintenanceUpsertFormData;
  setFormData: React.Dispatch<React.SetStateAction<MaintenanceUpsertFormData>>;
  condos: MaintenanceCondoOption[];
  categories: MaintenanceCategoryOption[];
};

export default function IdentificationSection({
  formData,
  setFormData,
  condos,
  categories,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50">
      <div className="px-5 py-4 border-b border-slate-200/60">
        <p className="text-xs font-semibold text-slate-700">Identificação</p>
        <p className="text-xs text-slate-500 mt-0.5">
          Dados básicos da manutenção.
        </p>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Título *
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition"
              value={formData.title ?? ""}
              onChange={(e) =>
                setFormData((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="Ex.: Limpeza da caixa d’água"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Condomínio *
            </label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition"
              value={formData.condoId ?? ""}
              onChange={(e) =>
                setFormData((p) => ({ ...p, condoId: e.target.value }))
              }
              required
            >
              <option value="" disabled>
                Selecione…
              </option>
              {condos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Categoria *
            </label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition"
              value={formData.category ?? ""}
              onChange={(e) =>
                setFormData((p) => ({ ...p, category: e.target.value }))
              }
              required
            >
              <option value="" disabled>
                Selecione…
              </option>
              {categories.map((c) => (
                <option key={c.id ?? c.name} value={c.name ?? c.id ?? ""}>
                  {c.name ?? c.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Tipo *
            </label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition"
              value={formData.type ?? ""}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  type: e.target.value as MaintenanceType,
                }))
              }
              required
            >
              <option value="" disabled>
                Selecione…
              </option>
              <option value={MaintenanceType.PREVENTIVE}>Preventiva</option>
              <option value={MaintenanceType.CORRECTIVE}>Corretiva</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
