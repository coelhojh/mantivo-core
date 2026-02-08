import { useState } from "react";
import {
  completeMaintenance,
  undoCompleteMaintenance,
} from "../../../ai/services/storageService";

export type CompleteMaintenancePayload = {
  id: string;
  date: string; // yyyy-mm-dd (padrão do seu storageService)
  cost: number;
  attachments: any[];
  provider: any;
};

export function useMaintenanceComplete() {
  const [isCompletingId, setIsCompletingId] = useState<string | null>(null);
  const [isUndoingId, setIsUndoingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function complete(payload: CompleteMaintenancePayload) {
    const { id, date, cost, attachments, provider } = payload;

    try {
      setError(null);
      setIsCompletingId(id);
      await completeMaintenance(id, date, cost, attachments, provider);
    } catch (err) {
      console.error("Erro ao concluir manutenção:", err);
      setError("Erro ao concluir manutenção");
      throw err;
    } finally {
      setIsCompletingId(null);
    }
  }

  async function undo(id: string) {
    try {
      setError(null);
      setIsUndoingId(id);
      await undoCompleteMaintenance(id);
    } catch (err) {
      console.error("Erro ao desfazer conclusão:", err);
      setError("Erro ao desfazer conclusão");
      throw err;
    } finally {
      setIsUndoingId(null);
    }
  }

  return {
    complete,
    undo,
    isCompletingId,
    isUndoingId,
    error,
  };
}
