import React from "react";
import BaseModal from "../../../../shared/ui/modal/BaseModal";
import type { Maintenance } from "../../../../ai/types";

type Props = {
  open: boolean;
  onClose: () => void;
  itemToDelete: Maintenance | null;
  onConfirm: () => Promise<void> | void;
  isDeleting: boolean;
};

export default function MaintenanceDeleteModal({
  open,
  onClose,
  itemToDelete,
  onConfirm,
  isDeleting,
}: Props) {
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Remover manutenção?"
      subtitle={
        itemToDelete
          ? `Esta ação apagará "${itemToDelete.title}" permanentemente.`
          : undefined
      }
      // mantenha os mesmos props extras (icon, etc.) que existiam no bloco antigo,
      // quando você copiar do out_delete_modal_block.tsx
    >
      <div className="space-y-4">
        {/* Cole aqui o conteúdo interno do seu modal antigo (corpo + botões). */}
        {/* Importante: mantenha exatamente as mesmas classes e handlers. */}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            disabled={isDeleting}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition disabled:opacity-60"
            disabled={isDeleting || !itemToDelete}
          >
            {isDeleting ? "Removendo..." : "Remover"}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

