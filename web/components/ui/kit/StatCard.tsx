import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "./Card";

export type StatTone = "brand" | "teal" | "success" | "warning" | "danger" | "ink";

const TONES: Record<StatTone, string> = {
  brand: "bg-brand-soft text-brand",
  teal: "bg-teal-soft text-[#0f766e]",
  success: "bg-success-soft text-[#087443]",
  warning: "bg-warning-soft text-[#b54708]",
  danger: "bg-danger-soft text-[#b42318]",
  ink: "bg-sunken text-ink",
};

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  tone?: StatTone;
  hint?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "ink",
  hint,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden p-4 transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-lift sm:p-5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-faint">
          {label}
        </p>
        {Icon ? (
          <span
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-inner",
              TONES[tone]
            )}
          >
            <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-display text-[30px] font-bold leading-none tracking-[-0.03em] text-ink tabular-nums sm:text-[32px]">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-[11px] leading-relaxed text-faint">{hint}</p>
      ) : null}
    </Card>
  );
}
