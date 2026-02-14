import React from "react";
import { Eye } from "lucide-react";

import BaseModal from "../../../../shared/ui/modal/BaseModal";
import { Condo, Maintenance, MaintenanceType, AttachmentType } from "../../../../ai/types"; // ajuste se seu path for diferente

type Props = {
  open: boolean;
  item: Maintenance | null;
  condos: Condo[];

  canEdit: boolean;

  onClose: () => void;
  onEdit?: (item: Maintenance) => void;

  // Dependências que hoje vivem no MaintenanceList.tsx (mantemos lá e só “injetamos” aqui)
  getStatus3: (m: Maintenance, now: Date) => any;
  STATUS3_LABEL: Record<string, string>;
  getTypeClasses: (t: any) => string;
  safeFormatDate: (d: any) => string;

  AttachmentTag: React.ComponentType<{ type: AttachmentType }>;
};

export default function MaintenanceViewModal({
  open,
  item,
  condos,
  canEdit,
  onClose,
  onEdit,
  getStatus3,
  STATUS3_LABEL,
  getTypeClasses,
  safeFormatDate,
  AttachmentTag,
}: Props) {
  if (!open || !item) return null;

  const s3 = getStatus3(item, new Date());

  const statusChipClass =
    s3 === "OVERDUE"
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : s3 === "COMPLETED"
        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
        : "bg-blue-50 text-blue-700 ring-blue-200";

  const typeChipClass = getTypeClasses(item.type);

  const getAttachmentUrl = (a: any) =>
    a?.url || a?.publicUrl || a?.downloadUrl || a?.signedUrl || a?.path || "";

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Visualizar manutenção"
      subtitle="Somente leitura"
      icon={<Eye size={18} className="text-slate-600" />}
      maxWidthClass="max-w-4xl"
      zIndexClass="z-[80]"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Fechar
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={() => item && onEdit?.(item)}
              className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 shadow-sm"
            >
              Editar
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* CABEÇALHO / CHIPS */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{item.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Visualização detalhada do registro (sem edição).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${typeChipClass}`}
                title="Tipo"
              >
                {item.type}
              </span>

              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${statusChipClass}`}
                title="Status operacional"
              >
                {STATUS3_LABEL[s3] ?? String(s3)}
              </span>
            </div>
          </div>
        </div>

        {/* GRID PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* BLOCO: Identificação */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50">
            <div className="px-5 py-4 border-b border-slate-200/60">
              <p className="text-xs font-semibold text-slate-700">Identificação</p>
              <p className="text-xs text-slate-500 mt-0.5">Dados básicos da manutenção.</p>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Condomínio</p>
                  <p className="text-sm text-slate-800 mt-1">
                    {condos.find((c) => c.id === (item as any).condoId)?.name || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Categoria</p>
                  <p className="text-sm text-slate-800 mt-1">{(item as any).category || "—"}</p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Status operacional
                  </p>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{STATUS3_LABEL[s3] ?? String(s3)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* BLOCO: Datas e ciclo */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50">
            <div className="px-5 py-4 border-b border-slate-200/60">
              <p className="text-xs font-semibold text-slate-700">Datas e ciclo</p>
              <p className="text-xs text-slate-500 mt-0.5">Prazos, recorrência e histórico.</p>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Próximo vencimento
                  </p>
                  <p
                    className={`text-sm font-semibold mt-1 ${
                      s3 === "OVERDUE" ? "text-rose-700" : "text-slate-800"
                    }`}
                  >
                    {safeFormatDate((item as any).nextExecutionDate)}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Última execução</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {safeFormatDate((item as any).lastExecutionDate)}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Frequência</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {(item as any).type === MaintenanceType.CORRECTIVE
                      ? "—"
                      : `${(item as any).frequencyType} ${
                          (item as any).frequencyDays ? `(${(item as any).frequencyDays}d)` : ""
                        }`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ANEXOS */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50">
            <div className="px-5 py-4 border-b border-slate-200/60">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-slate-700">Anexos</p>
                <span className="text-xs text-slate-500">{(item as any).attachments?.length ?? 0} arquivo(s)</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Documentos e evidências da manutenção.</p>
            </div>

            <div className="p-5">
              {(item as any).attachments?.length ? (
                <div className="space-y-2">
                  {(item as any).attachments.map((a: any, idx: number) => {
                    const url = getAttachmentUrl(a);
                    return (
                      <div
                        key={`${a.fileName}-${idx}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{a.fileName}</p>
                          <div className="mt-1">
                            <AttachmentTag type={a.type as AttachmentType} />
                          </div>
                        </div>

                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
                            title="Abrir anexo"
                          >
                            Abrir
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">sem link</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-4">
                  <p className="text-sm text-slate-700">Nenhum anexo cadastrado.</p>
                  <p className="text-xs text-slate-500 mt-0.5">Dica: anexe fotos, NF, laudos e ordem de serviço.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
