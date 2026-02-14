import React from "react";
import { Eye, Edit2, Check, Trash2, RotateCcw, Loader2 } from "lucide-react";
import type { Maintenance } from "../../../ai/types";

type Props = {
  item: Maintenance;

  canEdit: boolean;
  canDelete: boolean;

  isCompleted: boolean;
  isCompletingId: string | null;

  onView: (item: Maintenance) => void;
  onEdit: (item: Maintenance) => void;
  onComplete: (item: Maintenance) => void;
  onUndoComplete: (id: string) => void;
  onDelete: (item: Maintenance) => void;

  size?: "sm" | "md";
};

export default function MaintenanceRowActions({
  item,
  canEdit,
  canDelete,
  isCompleted,
  isCompletingId,
  onView,
  onEdit,
  onComplete,
  onUndoComplete,
  onDelete,
  size = "md",
}: Props) {
  const isSm = size === "sm";
  const iconSize = isSm ? 13 : 16;

  const viewCls = isSm
    ? "p-1.5 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
    : "p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all shadow-sm";

  const editCls = isSm
    ? "p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
    : "p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all shadow-sm";

  const completeCls = isSm
    ? "p-1.5 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100"
    : "p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all shadow-sm";

  const undoBase = isSm
    ? "p-1.5 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-all"
    : "relative z-30 p-2 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-all shadow-sm";

  const delCls = isSm
    ? "p-1.5 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100"
    : "p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all shadow-sm";

  const isUndoLoading = isCompletingId === item.id;

  return (
    <>
      <button
        onClick={() => onView(item)}
        className={viewCls}
        title="Visualizar"
      >
        <Eye size={iconSize} />
      </button>

      {canEdit && (
        <button
          onClick={() => onEdit(item)}
          className={editCls}
          title="Editar"
        >
          <Edit2 size={iconSize} />
        </button>
      )}

      {canEdit && !isCompleted && (
        <button
          type="button"
          onClick={() => onComplete(item)}
          className={completeCls}
          title="Concluir"
        >
          <Check size={iconSize} />
        </button>
      )}

      {canEdit && isCompleted && (
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={() => onUndoComplete(item.id)}
          disabled={isUndoLoading}
          className={undoBase}
          title="Desfazer Conclusão"
        >
          {isUndoLoading ? (
            <Loader2 size={iconSize} className="animate-spin" />
          ) : (
            <RotateCcw size={iconSize} />
          )}
        </button>
      )}

      {canDelete && (
        <button
          onClick={() => onDelete(item)}
          className={delCls}
          title="Excluir"
        >
          <Trash2 size={iconSize} />
        </button>
      )}
    </>
  );
}
