import type { MaintenanceAttachment } from "../../../ai/types";

export type MaintenanceCompleteData = {
  date: string;
  cost: number;
  providerName: string;
  providerContact: string;
  providerEmail: string;
  providerPhone: string;
  attachments: MaintenanceAttachment[];
};
