import { format } from "date-fns";
import { FrequencyType, MaintenanceStatus, MaintenanceType } from "../../../types";
import type { MaintenanceUpsertFormData } from "../types";

export function getEmptyMaintenanceFormData(): MaintenanceUpsertFormData {
  return {
    title: "",
    description: "",
    condoId: "",
    category: "",
    type: "" as MaintenanceUpsertFormData["type"],

    nextExecutionDate: format(new Date(), "yyyy-MM-dd"),
    frequencyType: FrequencyType.MONTHLY,
    frequencyDays: 30,

    estimatedCost: 0,

    providerId: "",
    providerName: "",
    providerContact: "",
    providerPhone: "",
    providerEmail: "",

    status: MaintenanceStatus.ON_TIME,

    attachments: [],
  };
}
