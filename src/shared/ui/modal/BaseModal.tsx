// src/shared/ui/modal/BaseModal.tsx
import React, { useEffect } from "react";
import { X } from "lucide-react";

type BaseModalProps = {
  open: boolean;
  onClose: () => void;

  title?: string;
  subtitle?: string;

  icon?: React.ReactNode;

  maxWidthClass?: string; // ex: "max-w-2xl", "max-w-3xl"
  children: React.ReactNode;
  footer?: React.ReactNode;

  zIndexClass?: string; // ex: "z-[80]"
};

const BaseModal: React.FC<BaseModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  icon,
  maxWidthClass = "max-w-2xl",
  children,
  footer,
  zIndexClass = "z-[80]",
}) => {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndexClass} bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200`}
      onMouseDown={(e) => {
        // fecha clicando no backdrop
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-white w-full ${maxWidthClass} rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200`}
      >
        {/* HEADER */}
        {(title || subtitle || icon) && (
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
            <div className="flex items-center gap-4 min-w-0">
              {icon && (
                <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight truncate">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-sm text-slate-500 font-medium mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 text-slate-400 transition-colors"
              aria-label="Fechar"
              title="Fechar"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* BODY */}
        <div className="p-8 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-slate-200 bg-slate-50/30">
          {children}
        </div>

        {/* FOOTER */}
        {footer && (
          <div className="p-8 border-t border-slate-100 bg-white shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default BaseModal;
