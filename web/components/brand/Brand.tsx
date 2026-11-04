import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("size-5", className)}
    >
      <path
        d="M4 8.5A2.5 2.5 0 0 1 6.5 6h11A2.5 2.5 0 0 1 20 8.5v1a2.5 2.5 0 0 0 0 5v1a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 15.5v-1a2.5 2.5 0 0 0 0-5v-1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.25 9.5v5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="0.5 2.6"
      />
    </svg>
  );
}

export interface BrandLockupProps {
  variant?: "default" | "inverse";
  subtitle?: string;
  className?: string;
}

export function BrandLockup({
  variant = "default",
  subtitle = "Support workspace",
  className,
}: BrandLockupProps) {
  const inverse = variant === "inverse";

  return (
    <span className={cn("flex items-center gap-3", className)}>
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-[13px]",
          inverse
            ? "bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm"
            : "brand-gradient text-white shadow-lift"
        )}
      >
        <BrandMark />
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            "block font-display text-[17px] font-bold leading-none tracking-[-0.03em]",
            inverse ? "text-white" : "text-ink"
          )}
        >
          Relay
        </span>
        <span
          className={cn(
            "mt-1 block truncate text-[11px] font-medium",
            inverse ? "text-white/70" : "text-faint"
          )}
        >
          {subtitle}
        </span>
      </span>
    </span>
  );
}
