import type {
  AttachmentType,
  FrequencyType,MaintenanceType,
  MaintenanceAttachment,
  Maintenance,
} from "../../../types";
import type { MaintenanceUpsertFormData } from "../types";

export type BuildMaintenancePayloadArgs = {
  formData: MaintenanceUpsertFormData;

  /**
   * Override opcional vindo de preset (ex.: MONTHLY -> {type, days})
   * Se null, usa os campos do form.
   */
  frequencyPreset: { type: FrequencyType; days: number } | null;

  /**
   * Tipo selecionado no UI. Se algum attachment vier sem type, cai aqui.
   */
  selectedFileType: AttachmentType;
};

const toNull = (v: unknown) => {
  if (v === undefined) return null;
  if (typeof v === "string" && v.trim() === "") return null;
  return v as any;
};

const toNumberOrZero = (v: unknown) => {
  if (v === undefined || v === null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

/**
 * Função pura: UI(FormData) -> Partial<Maintenance> (camelCase),
 * compatível com saveMaintenance/updateMaintenance (service faz o payload snake_case).
 */
export function buildMaintenancePayload(
  args: BuildMaintenancePayloadArgs
): Partial<Maintenance> {
  const { formData, frequencyPreset, selectedFileType } = args;

  const title = (formData.title ?? "").trim();

  const frequencyType =
    frequencyPreset?.type ?? (formData.frequencyType ?? null);
  const frequencyDays =
    frequencyPreset?.days ??
    (typeof formData.frequencyDays === "number" ? formData.frequencyDays : 0);

  // Normaliza attachments: domínio pode estar com string; garantimos string sempre.
  const attachments: MaintenanceAttachment[] =
    (formData.attachments ?? []).map((a: any) => ({
      ...a,
      type: a?.type ? String(a.type) : String(selectedFileType),
    })) ?? [];

  return {
    condoId: formData.condoId,
    category: formData.category,
    type: formData.type as MaintenanceType, // validaremos "" no handler
    title,
    description: (formData as any).description ?? "",

    providerId: toNull(formData.providerId ?? null),
    providerName: (formData.providerName ?? "") as any,
    providerContact: (formData.providerContact ?? "") as any,
    providerEmail: (formData.providerEmail ?? "") as any,
    providerPhone: (formData.providerPhone ?? "") as any,

    cost: 0, // custo real entra no "completeMaintenance"
    estimatedCost: toNumberOrZero(formData.estimatedCost),

    frequencyType: (frequencyType ?? undefined) as FrequencyType | undefined,
    frequencyDays,

    nextExecutionDate: formData.nextExecutionDate,
    status: formData.status as any,

    attachments,
  };
}
