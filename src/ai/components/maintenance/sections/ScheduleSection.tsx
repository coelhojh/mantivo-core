import React from "react";
import { FrequencyType } from "../../../types";
import type { MaintenanceUpsertFormData, FrequencyPreset } from "../types";

type Props = {
  formData: MaintenanceUpsertFormData;
  setFormData: React.Dispatch<React.SetStateAction<MaintenanceUpsertFormData>>;

  frequencyPreset: FrequencyPreset;
  setFrequencyPreset: (v: FrequencyPreset) => void;
  isCorrective: boolean;

  formatBRL: (value: number) => string;
  handleCurrencyInputChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    cb: (val: number) => void
  ) => void;
};

export default function ScheduleSection({
  formData,
  setFormData,
  frequencyPreset,
  setFrequencyPreset,
  isCorrective,
  formatBRL,
  handleCurrencyInputChange,
}: Props) {
  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50">
      <div className="px-5 py-4 border-b border-indigo-200/60">
        <p className="text-xs font-semibold text-indigo-900">Cronograma</p>
        <p className="text-xs text-indigo-900/70 mt-0.5">
          Defina vencimento e recorrência (se aplicável).
        </p>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Próximo vencimento *
            </label>
            <input
              type="date"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition"
              value={formData.nextExecutionDate ?? ""}
              onChange={(e) =>
                setFormData((p) => ({ ...p, nextExecutionDate: e.target.value }))
              }
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Frequência
            </label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition disabled:bg-slate-50"
              value={frequencyPreset}
              onChange={(e) => {
                const v = e.target.value as FrequencyPreset;
                setFrequencyPreset(v);

                if (v === "MONTHLY") {
                  setFormData((p) => ({
                    ...p,
                    frequencyType: FrequencyType.MONTHLY,
                    frequencyDays: 30,
                  }));
                  return;
                }

                if (v === "YEARLY") {
                  setFormData((p) => ({
                    ...p,
                    frequencyType: FrequencyType.YEARLY,
                    frequencyDays: 365,
                  }));
                  return;
                }

                if (v === "QUARTERLY") {
                  setFormData((p) => ({
                    ...p,
                    frequencyType: FrequencyType.CUSTOM,
                    frequencyDays: 90,
                  }));
                  return;
                }

                if (v === "SEMIANNUAL") {
                  setFormData((p) => ({
                    ...p,
                    frequencyType: FrequencyType.CUSTOM,
                    frequencyDays: 180,
                  }));
                  return;
                }

                // CUSTOM
                setFormData((p) => ({
                  ...p,
                  frequencyType: FrequencyType.CUSTOM,
                  frequencyDays: Number(p.frequencyDays ?? 30),
                }));
              }}
              disabled={isCorrective}
            >
              <option value="MONTHLY">Mensal</option>
              <option value="QUARTERLY">Trimestral</option>
              <option value="SEMIANNUAL">Semestral</option>
              <option value="YEARLY">Anual</option>
              <option value="CUSTOM">Personalizado</option>
            </select>
          </div>

          {!isCorrective && frequencyPreset === "CUSTOM" && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Intervalo (dias)
              </label>
              <input
                type="number"
                min={1}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition"
                value={formData.frequencyDays ?? 30}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    frequencyDays: Number(e.target.value || 0),
                  }))
                }
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Use para frequência personalizada.
              </p>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Custo estimado
            </label>
            <input
              type="text"
              inputMode="numeric"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition"
              value={formatBRL(formData.estimatedCost ?? 0)}
              onChange={(e) =>
                handleCurrencyInputChange(e, (val) =>
                  setFormData((p) => ({ ...p, estimatedCost: val }))
                )
              }
              placeholder="R$ 0,00"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Dica: digite somente números.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
