import { useCallback, useMemo, useState } from "react";
import type { Maintenance, MaintenanceType } from "../../../ai/types";
import { saveMaintenance, updateMaintenance } from "../../../ai/services/storageService";

type UpsertMode = "create" | "edit";

type SubmitArgs = {
  formData: any;
  frequencyPreset: any;
  selectedFileType: any;
  items: Maintenance[];

  resolveFrequencyPreset: (preset: any, type: MaintenanceType) => any;
  buildMaintenancePayload: (args: {
    formData: any;
    frequencyPreset: any;
    selectedFileType: any;
  }) => any;

  onClose: () => void;
  onSuccess: () => void;
  onError?: (message: string, error?: unknown) => void;
};

export function useMaintenanceUpsert() {
  const [mode, setMode] = useState<UpsertMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = useMemo(
    () => mode === "edit" && !!editingId,
    [mode, editingId]
  );

  const startCreate = useCallback(() => {
    setMode("create");
    setEditingId(null);
  }, []);

  const startEdit = useCallback((id: string) => {
    setMode("edit");
    setEditingId(id);
  }, []);

  const cancelEdit = useCallback(() => {
    setMode("create");
    setEditingId(null);
  }, []);

  const submit = useCallback(
    async (args: SubmitArgs) => {
      const {
        formData,
        frequencyPreset,
        selectedFileType,
        items,
        resolveFrequencyPreset,
        buildMaintenancePayload,
        onClose,
        onSuccess,
        onError,
      } = args;

      // validação mínima (mantém comportamento do componente)
      if (!formData?.title || !formData?.condoId || !formData?.category || !formData?.type) {
        onError?.("Preencha os campos obrigatórios.");
        return;
      }

      setIsSubmitting(true);
      try {
        const resolvedFrequency = resolveFrequencyPreset(
          frequencyPreset,
          formData.type as MaintenanceType
        );

        const payload = buildMaintenancePayload({
          formData,
          frequencyPreset: resolvedFrequency,
          selectedFileType,
        });

        const base = editingId ? items.find((m) => m.id === editingId) : null;

        if (editingId && !base) {
          onError?.("Não foi possível localizar a manutenção para atualizar.");
          return;
        }

        if (editingId) {
          await updateMaintenance({
            ...(base as Maintenance),
            ...payload,
            id: (base as Maintenance).id,
          });
        } else {
          await saveMaintenance(payload);
        }

        onClose();
        onSuccess();
        startCreate();
      } catch (e: any) {
        const msg = e?.message ? `Erro ao salvar: ${e.message}` : "Erro ao salvar.";
        onError?.(msg, e);
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingId, startCreate]
  );

  return {
    mode,
    editingId,
    isEditing,
    isSubmitting,
    startCreate,
    startEdit,
    cancelEdit,
    submit,
  };
}
