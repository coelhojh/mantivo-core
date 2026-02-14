import React from "react";

type SkeletonProps = {
  className?: string;
  rounded?: "md" | "lg" | "xl" | "2xl";
};

const roundedMap: Record<NonNullable<SkeletonProps["rounded"]>, string> = {
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
};

export function Skeleton({ className = "", rounded = "xl" }: SkeletonProps) {
  return (
    <div
      className={[
        "mantivo-skeleton",
        roundedMap[rounded],
        "border border-black/5 dark:border-white/10",
        className,
      ].join(" ")}
      aria-hidden="true"
    />
  );
}
