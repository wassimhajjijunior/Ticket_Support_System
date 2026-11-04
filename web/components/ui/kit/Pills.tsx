import { cn } from "@/lib/utils";

interface PillStyle {
  label: string;
  text: string;
  dot: string;
}

const STATUS_STYLES: Record<string, PillStyle> = {
  OPEN: {
    label: "Open",
    text: "bg-brand-soft text-[#1457be]",
    dot: "bg-brand",
  },
  PENDING: {
    label: "Pending",
    text: "bg-warning-soft text-[#b54708]",
    dot: "bg-warning",
  },
  EXECUTED: {
    label: "Executed",
    text: "bg-teal-soft text-[#0f766e]",
    dot: "bg-teal",
  },
  FINISHED: {
    label: "Finished",
    text: "bg-success-soft text-[#087443]",
    dot: "bg-success",
  },
};

const PRIORITY_STYLES: Record<string, PillStyle> = {
  LOW: { label: "Low", text: "bg-sunken text-body", dot: "bg-faint" },
  MEDIUM: {
    label: "Medium",
    text: "bg-brand-soft text-[#1457be]",
    dot: "bg-brand",
  },
  HIGH: {
    label: "High",
    text: "bg-warning-soft text-[#b54708]",
    dot: "bg-warning",
  },
  URGENT: {
    label: "Urgent",
    text: "bg-danger-soft text-[#b42318]",
    dot: "bg-danger",
  },
};

const FALLBACK: PillStyle = {
  label: "Unknown",
  text: "bg-sunken text-body",
  dot: "bg-faint",
};

function Pill({
  style,
  className,
}: {
  style: PillStyle;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 py-1 text-[11px] font-semibold leading-none",
        style.text,
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full", style.dot)}
      />
      {style.label}
    </span>
  );
}

export interface StatusPillProps {
  status: string;
  className?: string;
}

export function StatusPill({ status, className }: StatusPillProps) {
  const key = status?.toUpperCase() ?? "";
  const style = STATUS_STYLES[key] ?? { ...FALLBACK, label: status || "Unknown" };
  return <Pill style={style} className={className} />;
}

export interface PriorityPillProps {
  priority: string;
  className?: string;
}

export function PriorityPill({ priority, className }: PriorityPillProps) {
  const key = priority?.toUpperCase() ?? "";
  const style =
    PRIORITY_STYLES[key] ?? { ...FALLBACK, label: priority || "Unknown" };
  return <Pill style={style} className={className} />;
}

export { STATUS_STYLES, PRIORITY_STYLES };
