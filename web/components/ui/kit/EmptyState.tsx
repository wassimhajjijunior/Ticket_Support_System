import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "px-4 py-8" : "px-6 py-14",
        className
      )}
    >
      {Icon ? (
        <span className="grid size-12 place-items-center rounded-full bg-sunken text-faint">
          <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
      ) : null}
      <p className="mt-3 font-display text-[16px] font-semibold text-ink">
        {title}
      </p>
      {description ? (
        <p className="mt-1 max-w-xs text-[12px] leading-relaxed text-faint">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
