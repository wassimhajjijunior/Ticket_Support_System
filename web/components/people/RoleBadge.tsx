import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

const ROLE_STYLES: Record<Role, string> = {
  ADMIN: "bg-brand-soft text-brand",
  AGENT: "bg-teal-soft text-ink-2",
  USER: "bg-sunken text-body",
};

export function RoleBadge({
  role,
  className,
}: {
  role: Role;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]",
        ROLE_STYLES[role],
        className
      )}
    >
      {role}
    </span>
  );
}
