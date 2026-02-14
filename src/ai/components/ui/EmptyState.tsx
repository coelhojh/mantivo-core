import React from "react";

export function EmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center text-center">
      <div className="mb-2 text-sm font-semibold text-black/70 dark:text-white/70">
        {title}
      </div>
      {subtitle && (
        <div className="max-w-[260px] text-xs text-black/50 dark:text-white/50">
          {subtitle}
        </div>
      )}
    </div>
  );
}
