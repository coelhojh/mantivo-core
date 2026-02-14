import React from "react";
import { X } from "lucide-react";
import { AttachmentType } from "../../../../ai/types";
import type { MaintenanceAttachmentsSectionProps } from "./types";


export default function MaintenanceAttachmentsSection({
  title = "Anexos",
  subtitle = "Orçamentos, notas fiscais, laudos, fotos e documentos.",
  attachments,
  selectedFileType,
  setSelectedFileType,
  inputRef,
  onUpload,
  onRemove,
  AttachmentTag,
}: MaintenanceAttachmentsSectionProps) {
  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50">
      <div className="px-5 py-4 border-b border-indigo-200/60">
        <p className="text-xs font-semibold text-indigo-900">{title}</p>
        <p className="text-xs text-indigo-900/70 mt-0.5">{subtitle}</p>
      </div>

      <div className="p-5">
        <div className="flex flex-col md:flex-row gap-3">
          <select
            className="border border-slate-200 rounded-xl px-3 py-2 outline-none text-sm bg-white font-medium md:w-64"
            value={selectedFileType}
            onChange={(e) => setSelectedFileType(e.target.value as AttachmentType)}
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
            ref={inputRef}
            type="file"
            multiple
            className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none text-sm bg-white"
            onChange={onUpload}
          />
        </div>

        {!!attachments?.length && (
          <div className="mt-3 space-y-2">
            {attachments.map((a, idx) => (
              <div
                key={`${a.fileName}-${idx}`}
                className="grid grid-cols-[140px_1fr_auto] items-center gap-3 bg-white/70 border border-indigo-200/60 rounded-xl px-3 py-2"
              >
                <div className="flex items-center">
                  <AttachmentTag type={(a.type as AttachmentType) ?? AttachmentType.OTHER} />
                </div>

                <p className="text-sm font-semibold text-slate-700 truncate min-w-0">
                  {a.fileName}
                </p>

                <button
                  type="button"
                  onClick={() => onRemove(idx)}
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
  );
}
