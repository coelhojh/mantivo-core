import React from "react";
import { Wrench } from "lucide-react";

import BaseModal from "../../../shared/ui/modal/BaseModal";
import { AttachmentType } from "../../types";

import type {
  MaintenanceUpsertFormData,
  MaintenanceCondoOption,
  MaintenanceCategoryOption,
  MaintenanceProviderOption,
  FrequencyPreset,
} from "../maintenance/types";

import IdentificationSection from "../maintenance/sections/IdentificationSection";
import ScheduleSection from "../maintenance/sections/ScheduleSection";
import ProviderSection from "../maintenance/sections/ProviderSection";
import AttachmentsSection from "../maintenance/sections/AttachmentsSection";

type Props = {
  open: boolean;
  editingId: string | null;

  // --- state controlado ---
  formData: MaintenanceUpsertFormData;
  setFormData: React.Dispatch<React.SetStateAction<MaintenanceUpsertFormData>>;

  // --- data ---
  condos: MaintenanceCondoOption[];
  categories: MaintenanceCategoryOption[];
  providers: MaintenanceProviderOption[];

  // --- cronograma ---
  frequencyPreset: FrequencyPreset;
  setFrequencyPreset: (v: FrequencyPreset) => void;
  isCorrective: boolean;

  // --- money ---
  formatBRL: (value: number) => string;
  handleCurrencyInputChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    cb: (val: number) => void
  ) => void;

  // --- provider ---
  handleProviderChange: (providerId: string) => void;

  // --- attachments ---
  selectedFileType: AttachmentType;
  setSelectedFileType: (v: AttachmentType) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean
  ) => void;
  removeAttachment: (idx: number, isEdit: boolean) => void;

  // --- ui helpers ---
  AttachmentTag: React.ComponentType<{ type: AttachmentType }>;

  // --- handlers ---
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
};

export default function MaintenanceUpsertModal({
  open,
  editingId,
  formData,
  setFormData,
  condos,
  categories,
  providers,
  frequencyPreset,
  setFrequencyPreset,
  isCorrective,
  formatBRL,
  handleCurrencyInputChange,
  handleProviderChange,
  selectedFileType,
  setSelectedFileType,
  fileInputRef,
  handleFileUpload,
  removeAttachment,
  AttachmentTag,
  onClose,
  onSubmit,
}: Props) {
  if (!open) return null;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={editingId ? "Editar manutenção" : "Nova manutenção"}
      subtitle="Gestão de cronograma e recorrência"
      icon={<Wrench size={18} className="text-blue-600" />}
      maxWidthClass="max-w-4xl"
      zIndexClass="z-[60]"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
          >
            Cancelar
          </button>

          <button
            type="submit"
            form="maintenanceForm"
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm active:scale-[0.99] transition"
          >
            {editingId ? "Atualizar" : "Criar manutenção"}
          </button>
        </div>
      }
    >
      <form
        id="maintenanceForm"
        onSubmit={onSubmit}
        className="space-y-8 font-sans"
      >
        <div className="space-y-4">
          <IdentificationSection
            formData={formData}
            setFormData={setFormData}
            condos={condos}
            categories={categories}
          />

          <ScheduleSection
            formData={formData}
            setFormData={setFormData}
            frequencyPreset={frequencyPreset}
            setFrequencyPreset={setFrequencyPreset}
            isCorrective={isCorrective}
            formatBRL={formatBRL}
            handleCurrencyInputChange={handleCurrencyInputChange}
          />

          <ProviderSection
            formData={formData}
            setFormData={setFormData}
            providers={providers}
            handleProviderChange={handleProviderChange}
          />

          <AttachmentsSection
            formData={formData}
            selectedFileType={selectedFileType}
            setSelectedFileType={setSelectedFileType}
            fileInputRef={fileInputRef}
            handleFileUpload={handleFileUpload}
            removeAttachment={removeAttachment}
            AttachmentTag={AttachmentTag}
          />
        </div>
      </form>
    </BaseModal>
  );
}
