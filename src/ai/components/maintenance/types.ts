import type {
  MaintenanceType,
  FrequencyType,
  AttachmentType,
  MaintenanceStatus,
  MaintenanceAttachment,
} from "../../types";

export type FrequencyPreset =
  | "MONTHLY"
  | "QUARTERLY"
  | "SEMIANNUAL"
  | "YEARLY"
  | "CUSTOM";

export type MaintenanceCategoryOption = {
  id?: string;
  name: string;
};

export type MaintenanceProviderOption = {
  id: string;
  name: string;
};

export type MaintenanceCondoOption = {
  id: string;
  name: string;
};

// Aceita enum OU string (porque seu MaintenanceAttachment.type hoje é string)
export type MaintenanceFormAttachment = {
  type: AttachmentType | string;
  fileName: string;
  url?: string;
  size?: number;
  file?: File;
};

export type MaintenanceUpsertFormData = {
  title: string;
  condoId: string;
  category: string;
  type: MaintenanceType | "";

  nextExecutionDate: string;
  frequencyType?: FrequencyType;
  frequencyDays?: number;

  estimatedCost?: number;

  providerId?: string;
  providerName?: string; // usado no MaintenanceList.tsx
  providerContact?: string;
  providerPhone?: string;
  providerEmail?: string;

  status?: MaintenanceStatus; // usado no MaintenanceList.tsx

  // aceita tanto o modelo do DB quanto o modelo do form
  attachments?: Array<MaintenanceFormAttachment | MaintenanceAttachment>;
};
