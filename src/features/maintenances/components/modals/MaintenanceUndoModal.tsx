import React from "react";
import { RotateCcw } from "lucide-react";
import BaseModal from "../../../../shared/ui/modal/BaseModal";
import type { Maintenance } from "../../../../ai/types";

type Props = {
  open: boolean;
  onClose: () => void;
  itemToUndo: Maintenance | null;
  isUndoingId: string | null;
  onConfirm: () => Promise<void> | void;
};

export default function MaintenanceUndoModal({
  open,
  onClose,
  itemToUndo,
  isUndoingId,
  onConfirm,
}: Props) {
  const isUndoing = Boolean(isUndoingId);

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Desfazer conclusão?"
      subtitle={
        itemToUndo
          ? `Isso irá desfazer a conclusão de "${itemToUndo.title}".`
          : undefined
      }
      icon={<RotateCcw size={22} />}
      maxWidthClass="max-w-sm"
      zIndexClass="z-[100]"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isUndoing}
            className="w-full sm:w-auto px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold uppercase text-xs tracking-wider transition-all hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isUndoing || !itemToUndo}
            className="w-full sm:w-auto px-6 py-4 bg-amber-600 text-white rounded-2xl font-bold uppercase text-xs tracking-wider shadow-xl active:scale-95 disabled:opacity-50 hover:bg-amber-700 transition-colors shadow-amber-100"
          >
            {isUndoing ? "Desfazendo..." : "Sim, desfazer"}
          </button>
        </div>
      }
    >
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
        <p className="text-sm text-amber-800 font-semibold">
          Confirma desfazer a conclusão?
        </p>
        <p className="mt-1 text-xs text-amber-800/80">
          A manutenção voltará ao status anterior e poderá ser concluída
          novamente depois.
        </p>
      </div>
    </BaseModal>
  );
}
