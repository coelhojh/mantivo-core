import React from "react";

type Cn = string | undefined | null | false;
const cn = (...classes: Cn[]) => classes.filter(Boolean).join(" ");

export const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--surface))]";

export const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={cn("rounded-[var(--radius)] bg-[rgb(var(--surface))] border border-[rgb(var(--border))] shadow-sm", className)}>
    {children}
  </div>
);

export const CardHeader: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={cn("px-5 py-4 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))] flex items-center justify-between", className)}>
    {children}
  </div>
);

export const CardBody: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={cn("p-5", className)}>{children}</div>
);

export const SectionTitle: React.FC<{ title: string; subtitle?: string; right?: React.ReactNode }> = ({ title, subtitle, right }) => (
  <div className="flex items-end justify-between gap-4">
    <div className="space-y-1">
      <h2 className="text-xl lg:text-2xl font-extrabold tracking-tight text-slate-900">{title}</h2>
      {subtitle && <p className="text-sm text-[rgb(var(--muted))]">{subtitle}</p>}
    </div>
    {right}
  </div>
);

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed";
const buttonSize: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-sm",
};
const buttonVariant: Record<ButtonVariant, string> = {
  primary: "bg-[rgb(var(--primary))] text-white shadow-sm hover:opacity-90",
  secondary: "bg-[rgb(var(--surface))] text-slate-700 border border-[rgb(var(--border))] hover:bg-slate-50",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
  danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
};

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }
> = ({ className, variant = "secondary", size = "md", ...props }) => (
  <button className={cn(buttonBase, buttonSize[size], buttonVariant[variant], focusRing, className)} {...props} />
);

export const IconButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "neutral" | "primary" | "success" | "danger" | "warning" }
> = ({ className, tone = "neutral", ...props }) => {
  const toneClass =
    tone === "primary"
      ? "bg-[rgba(96,37,129,.10)] text-[rgb(var(--primary))] hover:bg-[rgba(96,37,129,.16)]"
      : tone === "success"
      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      : tone === "danger"
      ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
      : tone === "warning"
      ? "bg-amber-50 text-amber-800 hover:bg-amber-100"
      : "bg-slate-100 text-slate-700 hover:bg-slate-200";

  return (
    <button
      className={cn("p-2 rounded-xl transition shadow-sm", toneClass, focusRing, className)}
      {...props}
    />
  );
};

export const Badge: React.FC<{ className?: string; children: React.ReactNode; tone?: "primary" | "neutral" | "success" | "danger" | "warning" }> = ({
  className,
  children,
  tone = "neutral",
}) => {
  const toneClass =
    tone === "primary"
      ? "bg-[rgba(96,37,129,.10)] text-[rgb(var(--primary))] border border-[rgba(96,37,129,.20)]"
      : tone === "success"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
      : tone === "danger"
      ? "bg-rose-50 text-rose-700 border border-rose-100"
      : tone === "warning"
      ? "bg-amber-50 text-amber-800 border border-amber-100"
      : "bg-slate-50 text-slate-700 border border-slate-200";

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full", toneClass, className)}>
      {children}
    </span>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { left?: React.ReactNode }> = ({
  className,
  left,
  ...props
}) => (
  <div className="relative">
    {left && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{left}</div>}
    <input
      className={cn(
        "w-full border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--surface))] text-sm font-medium",
        left ? "pl-10 pr-3 py-2.5" : "px-3 py-2.5",
        "shadow-sm hover:border-slate-300 transition",
        focusRing,
        className
      )}
      {...props}
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { left?: React.ReactNode }> = ({
  className,
  left,
  children,
  ...props
}) => (
  <div className="relative">
    {left && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{left}</div>}
    <select
      className={cn(
        "w-full border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--surface))] text-sm font-medium",
        left ? "pl-10 pr-8 py-2.5" : "px-3 py-2.5",
        "shadow-sm hover:border-slate-300 transition appearance-none",
        focusRing,
        className
      )}
      {...props}
    >
      {children}
    </select>
    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▾</div>
  </div>
);

export const ModalShell: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxW?: string; // ex: "max-w-3xl"
}> = ({ open, onClose, title, subtitle, icon, children, footer, maxW = "max-w-3xl" }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] p-4 flex items-center justify-center bg-black/55 backdrop-blur-sm">
      <div className={cn("w-full rounded-[28px] overflow-hidden shadow-2xl bg-[rgb(var(--surface))] border border-[rgb(var(--border))]", maxW)}>
        <div className="px-6 py-5 border-b border-[rgb(var(--border))] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="w-11 h-11 rounded-2xl bg-[rgba(96,37,129,.10)] text-[rgb(var(--primary))] flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-lg font-extrabold tracking-tight text-slate-900 truncate">{title}</div>
              {subtitle && <div className="text-sm text-[rgb(var(--muted))] truncate">{subtitle}</div>}
            </div>
          </div>
          <button onClick={onClose} className={cn("p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600", focusRing)} aria-label="Fechar">
            ✕
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">{children}</div>

        {footer && <div className="px-6 py-5 border-t border-[rgb(var(--border))] bg-[rgba(15,23,42,.02)]">{footer}</div>}
      </div>
    </div>
  );
};
