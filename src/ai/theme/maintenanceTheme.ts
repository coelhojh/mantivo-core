import { differenceInDays } from "date-fns";
import { Maintenance, MaintenanceStatus } from "../types";

export type MantivoStatus = "overdue" | "due" | "done" | "neutral";

const parseISO = (dateStr?: string | null): Date => {
  if (!dateStr) return new Date(NaN);
  const parts = dateStr.split("-");
  if (parts.length !== 3) return new Date(NaN);
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
};

export function getMantivoMaintenanceStatus(item: Maintenance): MantivoStatus {
  if (item.status === MaintenanceStatus.COMPLETED) return "done";

  if (item.nextExecutionDate) {
    const diff = differenceInDays(parseISO(item.nextExecutionDate), new Date());
    return diff < 0 ? "overdue" : "due";
  }

  return "neutral";
}

export const mantivoStatusTheme: Record<MantivoStatus, string> = {
  overdue: "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100",
  due: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  done: "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100",
  neutral: "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100",
};

export function getMaintenanceStatusColor(item: Maintenance): string {
  return mantivoStatusTheme[getMantivoMaintenanceStatus(item)];
}
