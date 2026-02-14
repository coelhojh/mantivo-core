import React, { useEffect, useState } from "react";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
};

export function Reveal({ children, className = "", delayMs = 0 }: RevealProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), delayMs);
    return () => window.clearTimeout(t);
  }, [delayMs]);

  return (
    <div
      className={[
        "transition-all duration-500 ease-out will-change-transform",
        "motion-reduce:transition-none motion-reduce:transform-none",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
