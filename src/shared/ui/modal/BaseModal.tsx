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

    // bloqueia scroll do body enquanto modal está aberto
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndexClass} bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={[
          "bg-white w-full",
          maxWidthClass,
          "rounded-3xl shadow-2xl ring-1 ring-black/5",
          "overflow-hidden flex flex-col max-h-[90vh]",
          "animate-in zoom-in-95 duration-200",
        ].join(" ")}
      >
        {/* HEADER */}
        {(title || subtitle || icon) && (
          <div className="px-6 py-5 border-b border-slate-200 bg-white shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                {icon && (
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    {icon}
                  </div>
                )}

                <div className="min-w-0">
                  {title && (
                    <h3 className="text-lg font-semibold text-slate-900 tracking-tight truncate">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                aria-label="Fechar"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* BODY */}
        <div className="px-6 py-6 overflow-y-auto space-y-5 bg-slate-50/40 scrollbar-thin scrollbar-thumb-slate-200">
          {children}
        </div>

        {/* FOOTER */}
        {footer && (
          <div className="px-6 py-5 border-t border-slate-200 bg-white shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default BaseModal;
