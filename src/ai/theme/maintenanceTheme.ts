import { Maintenance } from "../types";
import { getStatus3 } from "../../shared/utils/maintenanceStatus";

export type MantivoStatus = "overdue" | "due" | "done" | "neutral";

/**
 * Theme visual baseado nos design tokens do Mantivo.
 * Agora NÃO usamos cores hardcoded.
 */
export const mantivoStatusTheme: Record<MantivoStatus, string> = {
  overdue:
    "bg-[rgb(var(--danger)/0.10)] text-[rgb(var(--danger))] border-[rgb(var(--danger)/0.25)] hover:bg-[rgb(var(--danger)/0.15)]",
  due:
    "bg-[rgb(var(--warning)/0.10)] text-[rgb(var(--warning))] border-[rgb(var(--warning)/0.25)] hover:bg-[rgb(var(--warning)/0.15)]",
  done:
    "bg-[rgb(var(--success)/0.10)] text-[rgb(var(--success))] border-[rgb(var(--success)/0.25)] hover:bg-[rgb(var(--success)/0.15)]",
  neutral:
    "bg-[rgb(var(--surface))] text-black/60 dark:text-white/60 border-black/10 dark:border-white/10",
};

export function getMantivoMaintenanceStatus(
  item: Maintenance,
  now = new Date()
): MantivoStatus {
  const s = getStatus3(item, now);

  if (s === "COMPLETED") return "done";
  if (s === "OVERDUE") return "overdue";
  if (s === "ON_TIME") return "due";

  return "neutral";
}

export function getMaintenanceStatusColor(
  item: Maintenance,
  now?: Date
): string {
  return mantivoStatusTheme[getMantivoMaintenanceStatus(item, now)];
}
