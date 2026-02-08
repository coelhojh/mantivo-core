import type { FrequencyPreset } from "../types";
import { FrequencyType, MaintenanceType } from "../../../types";

/**
 * Converte o preset de UI para (FrequencyType + days).
 * - Para presets fixos: days=0 (não é usado pelo calculateNextDate, exceto CUSTOM)
 * - Para CUSTOM: retorna null (mapper usa formData.frequencyType/frequencyDays)
 * - CORRECTIVE: sempre CUSTOM + 0 (manutenção corretiva não deve gerar recorrência)
 */
export function resolveFrequencyPreset(
  preset: FrequencyPreset,
  maintenanceType: MaintenanceType
): { type: FrequencyType; days: number } | null {
  if (maintenanceType === MaintenanceType.CORRECTIVE) {
    return { type: FrequencyType.CUSTOM, days: 0 };
  }

  switch (preset) {
    case "MONTHLY":
      return { type: FrequencyType.MONTHLY, days: 0 };
    case "QUARTERLY":
      return { type: FrequencyType.QUARTERLY, days: 0 };
    case "SEMIANNUAL":
      return { type: FrequencyType.SEMIANNUAL, days: 0 };
    case "YEARLY":
      return { type: FrequencyType.YEARLY, days: 0 };
    case "CUSTOM":
    default:
      return null;
  }
}
