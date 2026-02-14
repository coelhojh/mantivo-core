import { useCallback, useMemo, useState } from "react";
import type { Maintenance, MaintenanceType } from "../../../ai/types";
import { saveMaintenance, updateMaintenance } from "../../../ai/services/storageService";
import { buildMaintenancePayload } from "../mappers/buildMaintenancePayload";

type UpsertMode = "create" | "edit";

type SubmitArgs = {
  formData: any;
  frequencyPreset: any;
  selectedFileType: any;
  items: Maintenance[];

  resolveFrequencyPreset: (preset: any, type: MaintenanceType) => any;
  onSuccess: () => void;
  onError?: (message: string, error?: unknown) => void;
};

type UpsertControllerDeps = {
  canEdit: boolean;
  checkPlanLimits: (resource: string) => Promise<boolean>;
  setShowUpgradeModal: (open: boolean) => void;

  setShowModal: (open: boolean) => void;
  setFormData: (data: any) => void;

  getEmptyMaintenanceFormData: () => any;
  getFormDataFromMaintenance: (m: Maintenance, sortedAttachments: any[]) => any;
  sortAttachments: (attachments: any[]) => any[];
};

export function useMaintenanceUpsert(deps: UpsertControllerDeps) {
  const {
    canEdit,
    checkPlanLimits,
    setShowUpgradeModal,
    setShowModal,
    setFormData,
    getEmptyMaintenanceFormData,
    getFormDataFromMaintenance,
    sortAttachments,
  } = deps;

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

  const close = useCallback(() => {
    setShowModal(false);
    startCreate();
    setFormData(getEmptyMaintenanceFormData());
  }, [getEmptyMaintenanceFormData, setFormData, setShowModal, startCreate]);

  const openCreate = useCallback(async () => {
    if (!canEdit) return;

    const allowed = await checkPlanLimits("maintenance");
    if (!allowed) {
      setShowUpgradeModal(true);
      return;
    }

    setFormData(getEmptyMaintenanceFormData());
    startCreate();
    setShowModal(true);
  }, [
    canEdit,
    checkPlanLimits,
    getEmptyMaintenanceFormData,
    setFormData,
    setShowModal,
    setShowUpgradeModal,
    startCreate,
  ]);

  const openEdit = useCallback(
    async (maintenance: Maintenance) => {
      if (!canEdit) return;

      const sortedAttachments = sortAttachments(maintenance.attachments || []);
      setFormData(getFormDataFromMaintenance(maintenance, sortedAttachments));
      startEdit(maintenance.id);
      setShowModal(true);
    },
    [
      canEdit,
      getFormDataFromMaintenance,
      setFormData,
      setShowModal,
      sortAttachments,
      startEdit,
    ]
  );

  const submit = useCallback(
    async (args: SubmitArgs) => {
      const {
        formData,
        frequencyPreset,
        selectedFileType,
        items,
        resolveFrequencyPreset,
        onSuccess,
        onError,
      } = args;

      if (
        !formData?.title ||
        !formData?.condoId ||
        !formData?.category ||
        !formData?.type
      ) {
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

        close();
        onSuccess();
        startCreate();
      } catch (e: any) {
        const msg = e?.message
          ? `Erro ao salvar: ${e.message}`
          : "Erro ao salvar.";
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
    openCreate,
    openEdit,
    close,
    submit,
  };
}
