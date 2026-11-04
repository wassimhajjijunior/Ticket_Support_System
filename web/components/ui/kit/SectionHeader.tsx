import * as React from "react";

import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3",
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="font-display text-subheading text-ink">{title}</h2>
        {description ? (
          <p className="mt-1 text-[13px] leading-relaxed text-faint">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
