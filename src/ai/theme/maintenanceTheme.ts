import { Maintenance } from "../types";
import { getStatus3 } from "../../shared/utils/maintenanceStatus";

export type MantivoStatus = "overdue" | "due" | "done" | "neutral";

// Tailwind theme (para cards do Calendário / listas)
export const mantivoStatusTheme: Record<MantivoStatus, string> = {
  overdue: "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100",          // 🔴 vencidas
  due: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",          // 🟡 em dia
  done: "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100", // 🟢 concluídas
  neutral: "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100",
};

export function getMantivoMaintenanceStatus(item: Maintenance, now = new Date()): MantivoStatus {
  const s = getStatus3(item, now); // "OVERDUE" | "ON_TIME" | "COMPLETED"
  if (s === "COMPLETED") return "done";
  if (s === "OVERDUE") return "overdue";
  if (s === "ON_TIME") return "due";
  return "neutral";
}

export function getMaintenanceStatusColor(item: Maintenance, now?: Date): string {
  return mantivoStatusTheme[getMantivoMaintenanceStatus(item, now)];
}
