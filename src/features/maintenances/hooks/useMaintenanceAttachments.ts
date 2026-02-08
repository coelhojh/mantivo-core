import React from "react";
import { AttachmentType, MaintenanceAttachment } from "../../../ai/types";

type SetStateFn<T> = (updater: (prev: T) => T) => void;

interface UseMaintenanceAttachmentsParams {
  sortAttachments: (items: MaintenanceAttachment[]) => MaintenanceAttachment[];
}

export function useMaintenanceAttachments({
  sortAttachments,
}: UseMaintenanceAttachmentsParams) {
  const buildNewItems = (
    files: FileList,
    selectedFileType: AttachmentType,
  ): MaintenanceAttachment[] => {
    return Array.from(files).map((file) => ({
      fileName: file.name,
      type: selectedFileType,
      url: "#",
      uploadDate: new Date().toISOString(),
    }));
  };

  const appendTo = <T extends { attachments?: MaintenanceAttachment[] }>(
    setState: SetStateFn<T>,
    newItems: MaintenanceAttachment[],
  ) => {
    setState((prev) => ({
      ...prev,
      attachments: sortAttachments([...(prev.attachments || []), ...newItems]),
    }));
  };

  const removeAt = <T extends { attachments?: MaintenanceAttachment[] }>(
    setState: SetStateFn<T>,
    index: number,
  ) => {
    setState((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== index),
    }));
  };

  const resetInput = (ref: React.RefObject<HTMLInputElement>) => {
    if (ref.current) ref.current.value = "";
  };

  return {
    buildNewItems,
    appendTo,
    removeAt,
    resetInput,
  };
}
