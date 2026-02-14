import { Maintenance, MaintenanceStatus } from "../types";
import { differenceInDays } from "date-fns";

const parseISO = (dateStr?: string | null): Date => {
  if (!dateStr) return new Date(NaN);
  const parts = dateStr.split("-");
  if (parts.length !== 3) return new Date(NaN);
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
};

export function getMaintenanceStatusColor(item: Maintenance): string {
  // 🟢 concluídas
  if (item.status === MaintenanceStatus.COMPLETED) {
    return "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100";
  }

  // datas
  if (item.nextExecutionDate) {
    const diff = differenceInDays(parseISO(item.nextExecutionDate), new Date());

    // 🔴 vencidas
    if (diff < 0) {
      return "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100";
    }

    // 🟡 em dia
    return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
  }

  // neutro
  return "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100";
}
