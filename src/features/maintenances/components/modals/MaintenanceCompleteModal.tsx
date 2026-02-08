import React from "react";
import { CheckCircle } from "lucide-react";
import BaseModal from "../../../../shared/ui/modal/BaseModal";
import MaintenanceAttachmentsSection from "../attachments/MaintenanceAttachmentsSection";
import type { AttachmentType, MaintenanceAttachment } from "../../../../ai/types";
import type { MaintenanceCompleteData } from "../../types/MaintenanceCompleteData";

type Props = {
  open: boolean;
  onClose: () => void;

  itemToComplete: { title: string } | null;

  isCompleting: boolean;
  onSubmit: React.FormEventHandler<HTMLFormElement>;

  completeData: MaintenanceCompleteData;
  setCompleteData: React.Dispatch<React.SetStateAction<MaintenanceCompleteData>>;

  formatBRL: (value: number) => string;
  handleCurrencyInputChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    onValue: (val: number) => void
  ) => void;

  selectedFileType: AttachmentType;
  setSelectedFileType: (v: AttachmentType) => void;

  completeFileInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    isComplete: boolean
  ) => void;

  removeAttachment: (idx: number, isComplete: boolean) => void;

  AttachmentTag: React.ComponentType<{ type: AttachmentType }>;
};

export default function MaintenanceCompleteModal({
  open,
  onClose,
  itemToComplete,
  isCompleting,
  onSubmit,
  completeData,
  setCompleteData,
  formatBRL,
  handleCurrencyInputChange,
  selectedFileType,
  setSelectedFileType,
  completeFileInputRef,
  handleFileUpload,
  removeAttachment,
  AttachmentTag,

}: Props) {
  if (!itemToComplete) return null;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Concluir manutenção"
      subtitle={itemToComplete.title}
      icon={<CheckCircle size={18} className="text-emerald-600" />}
      maxWidthClass="max-w-3xl"
      zIndexClass="z-[70]"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Cancelar
          </button>

          <button
            type="submit"
            form="completeForm"
            disabled={isCompleting}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 shadow-sm disabled:opacity-50 active:scale-[0.99] transition"
          >
            {isCompleting ? "Processando..." : "Confirmar execução"}
          </button>
        </div>
      }
    >
      <form id="completeForm" onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-4">
          {/* SEÇÃO: Execução */}
          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-700">Execução</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Informe quando foi executado e o custo final (se aplicável).
              </p>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Data da execução <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-slate-200"
                    value={completeData.date}
                    onChange={(e) =>
                      setCompleteData((p: any) => ({
                        ...p,
                        date: e.target.value,
                      }))
                    }
                    required
            />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Custo da execução
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-slate-200"
                    value={formatBRL(completeData.cost)}
                    onChange={(e) =>
                      handleCurrencyInputChange(e, (val) =>
                        setCompleteData((p: any) => ({ ...p, cost: val }))
                      )
                    }
                    placeholder="R$ 0,00"
            />
                  <p className="mt-1.5 text-xs text-slate-500">
                    Se preferir, deixe em branco e ajuste depois.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO: Prestador */}
          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-700">
                Prestador (opcional)
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Registre quem executou para facilitar consultas futuras.
              </p>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Nome
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-slate-200"
                    value={completeData.providerName}
                    onChange={(e) =>
                      setCompleteData((p: any) => ({
                        ...p,
                        providerName: e.target.value,
                      }))
                    }
                    placeholder="Ex: João Silva"
            />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Contato / Responsável
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-slate-200"
                    value={completeData.providerContact}
                    onChange={(e) =>
                      setCompleteData((p: any) => ({
                        ...p,
                        providerContact: e.target.value,
                      }))
                    }
                    placeholder="Ex: Técnico responsável"
            />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    E-mail
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-slate-200"
                    value={completeData.providerEmail}
                    onChange={(e) =>
                      setCompleteData((p: any) => ({
                        ...p,
                        providerEmail: e.target.value,
                      }))
                    }
                    placeholder="ex@empresa.com"
            />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Telefone
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-slate-200"
                    value={completeData.providerPhone}
                    onChange={(e) =>
                      setCompleteData((p: any) => ({
                        ...p,
                        providerPhone: e.target.value,
                      }))
                    }
                    placeholder="(71) 9xxxx-xxxx"
            />
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO: Anexos */}
            <MaintenanceAttachmentsSection
              title="Anexos"
              subtitle="Adicione evidências (NF, fotos, laudo, ordem de serviço etc.)."
              attachments={(completeData.attachments || []) as MaintenanceAttachment[]}
              selectedFileType={selectedFileType}
              setSelectedFileType={setSelectedFileType}
              inputRef={completeFileInputRef}
              onUpload={(e) => handleFileUpload(e, true)}
              onRemove={(idx) => removeAttachment(idx, true)}
              AttachmentTag={AttachmentTag}
            />
          </div>
        </form>
    </BaseModal>
  );
}
