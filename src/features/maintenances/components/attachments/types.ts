import type { AttachmentType, MaintenanceAttachment } from "../../../../ai/types";
import type React from "react";

export type MaintenanceAttachmentsSectionProps = {
  title?: string;
  subtitle?: string;

  attachments: MaintenanceAttachment[];

  selectedFileType: AttachmentType;
  setSelectedFileType: (v: AttachmentType) => void;

  inputRef: React.RefObject<HTMLInputElement>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (idx: number) => void;

  AttachmentTag: React.ComponentType<{ type: AttachmentType }>;
};
