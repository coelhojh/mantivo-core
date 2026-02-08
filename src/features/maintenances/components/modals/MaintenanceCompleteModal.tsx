import React, { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle } from "lucide-react";
import { format } from "date-fns";

import BaseModal from "../../../../shared/ui/modal/BaseModal";
import MaintenanceAttachmentsSection from "../attachments/MaintenanceAttachmentsSection";

import { AttachmentType } from "../../../../ai/types";
import type { Maintenance, MaintenanceAttachment } from "../../../../ai/types";

type CompleteData = {
  date: string;
  cost: number;
  providerName: string;
  providerContact: string;
  providerEmail: string;
  providerPhone: string;
  attachments: MaintenanceAttachment[];
};

type CompletePayload = {
  id: string;
  date: string;
  cost: number;
  attachments: MaintenanceAttachment[];
  provider: {
    name: string;
    contact: string;
    email: string;
    phone: string;
  };
};

type Props = {
  open: boolean;
  onClose: () => void;

  itemToComplete: Maintenance;
  isSubmitting: boolean;

  onConfirm: (payload: CompletePayload) => Promise<void> | void;

  formatBRL: (value: number) => string;
  handleCurrencyInputChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    onValue: (val: number) => void,
  ) => void;

  AttachmentTag: React.ComponentType<{ type: AttachmentType }>;
};

export default function MaintenanceCompleteModal({
  open,
  onClose,
  itemToComplete,
  isSubmitting,
  onConfirm,
  formatBRL,
  handleCurrencyInputChange,
  AttachmentTag,
}: Props) {
  const completeFileInputRef = useRef<HTMLInputElement>(null);

  const initialData: CompleteData = useMemo(() => {
    return {
      date: format(new Date(), "yyyy-MM-dd"),
      cost: itemToComplete?.estimatedCost || 0,
      providerName: (itemToComplete as any)?.providerName || "",
      providerContact: (itemToComplete as any)?.providerContact || "",
      providerEmail: (itemToComplete as any)?.providerEmail || "",
      providerPhone: (itemToComplete as any)?.providerPhone || "",
      attachments: ((itemToComplete as any)?.attachments || []) as MaintenanceAttachment[],
    };
  }, [itemToComplete]);

  const [completeData, setCompleteData] = useState<CompleteData>(initialData);

  const [selectedFileType, setSelectedFileType] = useState<AttachmentType>(
    AttachmentType.BUDGET,
  );

  useEffect(() => {
    if (!open) return;
    setCompleteData(initialData);
    if (completeFileInputRef.current) completeFileInputRef.current.value = "";
  }, [open, initialData]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uuid =
      (globalThis.crypto as any)?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const nowIso = new Date().toISOString();

    const newItems: MaintenanceAttachment[] = Array.from(files).map((f) => {
      return {
        id: `${uuid}-${f.name}`,
        name: f.name,
        type: selectedFileType,
        uploadDate: nowIso,
        size: f.size,
        file: f,
      } as any;
    });

    setCompleteData((prev) => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...newItems],
    }));

    if (completeFileInputRef.current) completeFileInputRef.current.value = "";
  };

  const removeAttachment = (idx: number) => {
    setCompleteData((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const payload: CompletePayload = {
      id: itemToComplete.id,
      date: completeData.date,
      cost: completeData.cost,
      attachments: completeData.attachments || [],
      provider: {
        name: completeData.providerName,
        contact: completeData.providerContact,
        email: completeData.providerEmail,
        phone: completeData.providerPhone,
      },
    };

    await onConfirm(payload);
  };

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
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 shadow-sm disabled:opacity-50 active:scale-[0.99] transition"
          >
            {isSubmitting ? "Processando..." : "Confirmar execução"}
          </button>
        </div>
      }
    >
      <form id="completeForm" onSubmit={handleSubmit} className="space-y-4">
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
                      setCompleteData((p) => ({
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
                        setCompleteData((p) => ({ ...p, cost: val })),
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
                      setCompleteData((p) => ({
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
                      setCompleteData((p) => ({
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
                      setCompleteData((p) => ({
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
                      setCompleteData((p) => ({
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
            onUpload={handleUpload}
            onRemove={removeAttachment}
            AttachmentTag={AttachmentTag}
          />
        </div>
      </form>
    </BaseModal>
  );
}
