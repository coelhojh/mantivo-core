import React from "react";
import { AttachmentType } from "../../../types";
import type { MaintenanceUpsertFormData } from "../types";

import MaintenanceAttachmentsSection from "../../../../features/maintenances/components/attachments/MaintenanceAttachmentsSection";

type Props = {
  formData: MaintenanceUpsertFormData;

  selectedFileType: AttachmentType;
  setSelectedFileType: (v: AttachmentType) => void;

  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => void;
  removeAttachment: (idx: number, isEdit: boolean) => void;

  AttachmentTag: React.ComponentType<{ type: AttachmentType }>;
};

export default function AttachmentsSection({
  formData,
  selectedFileType,
  setSelectedFileType,
  fileInputRef,
  handleFileUpload,
  removeAttachment,
  AttachmentTag,
}: Props) {
  return (
    <MaintenanceAttachmentsSection
      attachments={formData.attachments || []}
      selectedFileType={selectedFileType}
      setSelectedFileType={setSelectedFileType}
      inputRef={fileInputRef}
      onUpload={(e) => handleFileUpload(e, false)}
      onRemove={(idx) => removeAttachment(idx, false)}
      AttachmentTag={AttachmentTag}
    />
  );
}
