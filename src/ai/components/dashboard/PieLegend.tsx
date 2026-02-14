import React from "react";

type PieLegendItem = {
  label: string;
  value: number;
  color: string;
};

export function PieLegend({ items }: { items: PieLegendItem[] }) {
  const total = items.reduce((acc, i) => acc + i.value, 0);

  return (
    <div className="mt-3 space-y-1">
      {items.map((item) => {
        const percent = total ? Math.round((item.value / total) * 100) : 0;

        return (
          <div
            key={item.label}
            className="flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-black/70 dark:text-white/70">
                {item.label}
              </span>
            </div>

            <div className="font-medium text-black/80 dark:text-white/80">
              {item.value} • {percent}%
            </div>
          </div>
        );
      })}
    </div>
  );
}
