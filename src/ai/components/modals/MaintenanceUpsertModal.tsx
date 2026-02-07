import React from "react";
import { Wrench, X } from "lucide-react";

// Ajuste o path se seu BaseModal estiver em outro lugar
import BaseModal from "../../../shared/ui/modal/BaseModal";

import {
  MaintenanceType,
  FrequencyType,
  AttachmentType,
} from "../../types";

export type FrequencyPreset = "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "YEARLY" | "CUSTOM";

type Props = {
  open: boolean;
  editingId: string | null;

  // --- state controlado pelo MaintenanceList ---
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;

  // --- data ---
  condos: Array<{ id: string; name: string }>;
  categories: any[];
  providers: Array<{ id: string; name: string }>;

  // --- cronograma ---
  frequencyPreset: FrequencyPreset;
  setFrequencyPreset: (v: FrequencyPreset) => void;
  isCorrective: boolean;

  // --- money ---
  formatBRL: (value: number) => string;
  handleCurrencyInputChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    cb: (val: number) => void
  ) => void;

  // --- provider ---
  handleProviderChange: (providerId: string) => void;

  // --- attachments ---
  selectedFileType: any;
  setSelectedFileType: (v: any) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => void;
  removeAttachment: (idx: number, isEdit: boolean) => void;

  // --- ui helpers ---
  AttachmentTag: React.ComponentType<{ type: AttachmentType }>;

  // --- handlers ---
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
};

export default function MaintenanceUpsertModal({
  open,
  editingId,
  formData,
  setFormData,
  condos,
  categories,
  providers,
  frequencyPreset,
  setFrequencyPreset,
  isCorrective,
  formatBRL,
  handleCurrencyInputChange,
  handleProviderChange,
  selectedFileType,
  setSelectedFileType,
  fileInputRef,
  handleFileUpload,
  removeAttachment,
  AttachmentTag,
  onClose,
  onSubmit,
}: Props) {
  if (!open) return null;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={editingId ? "Editar manutenção" : "Nova manutenção"}
      subtitle="Gestão de cronograma e recorrência"
      icon={<Wrench size={18} className="text-blue-600" />}
      maxWidthClass="max-w-4xl"
      zIndexClass="z-[60]"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
          >
            Cancelar
          </button>

          <button
            type="submit"
            form="maintenanceForm"
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm active:scale-[0.99] transition"
          >
            {editingId ? "Atualizar" : "Criar manutenção"}
          </button>
        </div>
      }
    >
      <form
        id="maintenanceForm"
        onSubmit={onSubmit}
        className="space-y-8 font-sans"
      >
        {/* SEÇÕES DO FORMULÁRIO */}
        <div className="space-y-4">
          {/* SEÇÃO: Identificação */}
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
                      setFormData((p: any) => ({ ...p, title: e.target.value }))
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
                      setFormData((p: any) => ({
                        ...p,
                        condoId: e.target.value,
                      }))
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
                      setFormData((p: any) => ({
                        ...p,
                        category: e.target.value,
                      }))
                    }
                    required
                  >
                    <option value="" disabled>
                      Selecione…
                    </option>
                    {categories.map((c: any) => (
                      <option key={c.id ?? c.name} value={c.name ?? c.id}>
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
                    value={(formData.type as any) ?? ""}
                    onChange={(e) =>
                      setFormData((p: any) => ({
                        ...p,
                        type: e.target.value as any,
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

          {/* SEÇÃO: Cronograma */}
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
                    value={(formData.nextExecutionDate as any) ?? ""}
                    onChange={(e) =>
                      setFormData((p: any) => ({
                        ...p,
                        nextExecutionDate: e.target.value,
                      }))
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
                        setFormData((p: any) => ({
                          ...p,
                          frequencyType: FrequencyType.MONTHLY,
                          frequencyDays: 30,
                        }));
                        return;
                      }

                      if (v === "YEARLY") {
                        setFormData((p: any) => ({
                          ...p,
                          frequencyType: FrequencyType.YEARLY,
                          frequencyDays: 365,
                        }));
                        return;
                      }

                      if (v === "QUARTERLY") {
                        setFormData((p: any) => ({
                          ...p,
                          frequencyType: FrequencyType.CUSTOM,
                          frequencyDays: 90,
                        }));
                        return;
                      }

                      if (v === "SEMIANNUAL") {
                        setFormData((p: any) => ({
                          ...p,
                          frequencyType: FrequencyType.CUSTOM,
                          frequencyDays: 180,
                        }));
                        return;
                      }

                      // CUSTOM
                      setFormData((p: any) => ({
                        ...p,
                        frequencyType: FrequencyType.CUSTOM,
                        frequencyDays: Number((p.frequencyDays as any) ?? 30),
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
                      value={(formData.frequencyDays as any) ?? 30}
                      onChange={(e) =>
                        setFormData((p: any) => ({
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
                    value={formatBRL((formData.estimatedCost as any) ?? 0)}
                    onChange={(e) =>
                      handleCurrencyInputChange(e, (val) =>
                        setFormData((p: any) => ({ ...p, estimatedCost: val }))
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

          {/* SEÇÃO: Prestador */}
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
                      setFormData((p: any) => ({
                        ...p,
                        providerContact: e.target.value,
                      }))
                    }
                    placeholder="Pessoa de contato"
                  />
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition"
                    value={formData.providerPhone ?? ""}
                    onChange={(e) =>
                      setFormData((p: any) => ({
                        ...p,
                        providerPhone: e.target.value,
                      }))
                    }
                    placeholder="Telefone/WhatsApp"
                  />
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition md:col-span-2"
                    value={formData.providerEmail ?? ""}
                    onChange={(e) =>
                      setFormData((p: any) => ({
                        ...p,
                        providerEmail: e.target.value,
                      }))
                    }
                    placeholder="E-mail"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO: Anexos */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50">
            <div className="px-5 py-4 border-b border-indigo-200/60">
              <p className="text-xs font-semibold text-indigo-900">Anexos</p>
              <p className="text-xs text-indigo-900/70 mt-0.5">
                Orçamentos, notas fiscais, laudos, fotos e documentos.
              </p>
            </div>

            <div className="p-5">
              <div className="flex flex-col md:flex-row gap-3">
                <select
                  className="border border-slate-200 rounded-xl px-3 py-2 outline-none text-sm bg-white font-medium md:w-64"
                  value={selectedFileType}
                  onChange={(e) => setSelectedFileType(e.target.value)}
                >
                  <option value={AttachmentType.BUDGET}>Orçamento</option>
                  <option value={AttachmentType.INVOICE}>Nota fiscal</option>
                  <option value={AttachmentType.ART_RRT}>ART/RRT</option>
                  <option value={AttachmentType.TECHNICAL_REPORT}>Laudo técnico</option>
                  <option value={AttachmentType.MAINTENANCE_REPORT}>Relatório</option>
                  <option value={AttachmentType.SERVICE_ORDER}>Ordem de Serviço</option>
                  <option value={AttachmentType.CERTIFICATE}>Certificado</option>
                  <option value={AttachmentType.OTHER}>Outros</option>
                </select>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none text-sm bg-white"
                  onChange={(e) => handleFileUpload(e, false)}
                />
              </div>

              {!!formData.attachments?.length && (
                <div className="mt-3 space-y-2">
                  {(formData.attachments || []).map((a: any, idx: number) => (
                    <div
                      key={`${a.fileName}-${idx}`}
                      className="grid grid-cols-[140px_1fr_auto] items-center gap-3 bg-white/70 border border-indigo-200/60 rounded-xl px-3 py-2"
                    >
                      <div className="flex items-center">
                        <AttachmentTag
                          type={
                            (a.type as AttachmentType) ?? AttachmentType.OTHER
                          }
                        />
                      </div>

                      <p className="text-sm font-semibold text-slate-700 truncate min-w-0">
                        {a.fileName}
                      </p>

                      <button
  type="button"
  onClick={() => removeAttachment(idx, false)}
  className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-100"
  title="Remover anexo"
>
  <X size={14} />
</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </BaseModal>
  );
}
