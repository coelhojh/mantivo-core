import type {
  AttachmentType,
  FrequencyType,MaintenanceType,
  MaintenanceAttachment,
  Maintenance,
} from "../../../ai/types";

export type BuildMaintenancePayloadArgs = {
  formData: {
    condoId: string;
    category: any;
    type: any;
    title: string;
    description?: string;
    providerId?: string | null;
    providerName?: string;
    providerContact?: string;
    providerEmail?: string;
    providerPhone?: string;
    estimatedCost?: number | string | null;
    frequencyType?: any;
    frequencyDays?: number | null;
    nextExecutionDate?: string;
    status?: any;
    attachments?: any[];
  };

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

  if (!formData.type) {
    throw new Error("Tipo de manutenção é obrigatório.");
  }
  if (!formData.title?.trim()) {
    throw new Error("Título é obrigatório.");
  }
  if (!formData.condoId) {
    throw new Error("Condomínio é obrigatório.");
  }
  if (!formData.category) {
    throw new Error("Categoria é obrigatória.");
  }

  return {
    condoId: formData.condoId,
    category: formData.category,
    type: formData.type as MaintenanceType, // validaremos "" no handler
    title,
    description: formData.description ?? "",

    providerId: toNull(formData.providerId ?? null),
    providerName: formData.providerName ?? "",
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
