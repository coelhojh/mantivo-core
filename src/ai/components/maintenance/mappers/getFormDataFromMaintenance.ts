import type { Maintenance, MaintenanceAttachment } from "../../../types";
import type { MaintenanceUpsertFormData } from "../types";

/**
 * Mapper puro: Domínio (Maintenance) -> Form (MaintenanceUpsertFormData)
 * Recebe attachments já ordenados (para não depender de util/UI).
 */
export function getFormDataFromMaintenance(
  m: Maintenance,
  sortedAttachments: MaintenanceAttachment[] = []
): MaintenanceUpsertFormData {
  return {
    title: m.title ?? "",
    description: m.description ?? "",

    condoId: m.condoId ?? "",
    category: m.category ?? "",
    type: m.type ?? ("" as MaintenanceUpsertFormData["type"]),

    nextExecutionDate: m.nextExecutionDate ?? "",
    frequencyType: m.frequencyType ?? undefined,
    frequencyDays: m.frequencyDays ?? undefined,

    estimatedCost: m.estimatedCost ?? 0,

    providerId: m.providerId ?? "",
    providerName: m.providerName ?? "",
    providerContact: m.providerContact ?? "",
    providerPhone: m.providerPhone ?? "",
    providerEmail: m.providerEmail ?? "",

    status: m.status,

    attachments: sortedAttachments.length ? sortedAttachments : (m.attachments ?? []),
  };
}
