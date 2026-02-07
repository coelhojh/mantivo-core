import React from "react";
import { CheckCircle, Upload, Trash2 } from "lucide-react";
import BaseModal from "../../../../shared/ui/modal/BaseModal";

type Props = {
  open: boolean;
  onClose: () => void;

  itemToComplete: { title: string } | null;

  isCompleting: boolean;
  onSubmit: React.FormEventHandler<HTMLFormElement>;

  completeData: {
    date: string;
    cost: any;
    providerName: string;
    providerContact: string;
    providerEmail: string;
    providerPhone: string;
    attachments?: Array<{ fileName: string; type?: any }>;
  };
  setCompleteData: React.Dispatch<React.SetStateAction<any>>;

  formatBRL: (value: any) => string;
  handleCurrencyInputChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    onValue: (val: any) => void
  ) => void;

  selectedFileType: any;
  setSelectedFileType: (v: any) => void;

  completeFileInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    isComplete: boolean
  ) => void;

  removeAttachment: (idx: number, isComplete: boolean) => void;

  AttachmentTag: React.ComponentType<{ type: any }>;
  AttachmentType: any;
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
  AttachmentType,
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
          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-700">Anexos</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Adicione evidências (NF, fotos, laudo, ordem de serviço etc.).
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-3 items-start">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Tipo do anexo
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
                    value={selectedFileType}
                    onChange={(e) => setSelectedFileType(e.target.value)}
                  >
                    <option value={AttachmentType.BUDGET}>Orçamento</option>
                    <option value={AttachmentType.INVOICE}>Nota fiscal</option>
                    <option value={AttachmentType.ART_RRT}>ART/RRT</option>
                    <option value={AttachmentType.SERVICE_ORDER}>Ordem de Serviço</option>
                    <option value={AttachmentType.PHOTOS}>Fotos</option>
                    <option value={AttachmentType.TECHNICAL_REPORT}>Laudo</option>
                    <option value={AttachmentType.MAINTENANCE_REPORT}>Relatório</option>
                    <option value={AttachmentType.CERTIFICATE}>Certificado</option>
                    <option value={AttachmentType.OTHER}>Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Arquivos
                  </label>

                  <input
                    ref={completeFileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, true)}
                  />

                  <button
                    type="button"
                    onClick={() => completeFileInputRef.current?.click()}
                    className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100
 px-4 py-3 text-left hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                        <Upload size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          Adicionar arquivos
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          Clique para selecionar 1 ou mais arquivos
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {completeData.attachments?.length ? (
                <div className="space-y-2">
                  {completeData.attachments.map((a, idx) => (
                    <div
                      key={`${a.fileName}-${idx}`}
                      className="grid grid-cols-[140px_1fr_auto] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    >
                      <div className="flex items-center">
                        <AttachmentTag type={(a.type as any) ?? AttachmentType.OTHER} />
                      </div>

                      <p className="text-sm font-semibold text-slate-800 truncate min-w-0">
                        {a.fileName}
                      </p>

                      <button
                        type="button"
                        onClick={() => removeAttachment(idx, true)}
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                        title="Remover"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm text-slate-600">Nenhum anexo adicionado.</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dica: adicione pelo menos fotos ou nota fiscal para registrar a execução.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </BaseModal>
  );
}
