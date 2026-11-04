import {
  Avatar as AvatarRoot,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

const SIZES = {
  sm: "size-7 text-[10px]",
  md: "size-9 text-xs",
  lg: "size-11 text-sm",
} as const;

const PALETTE = [
  "bg-brand-soft text-[#1457be]",
  "bg-teal-soft text-[#0f766e]",
  "bg-success-soft text-[#087443]",
  "bg-warning-soft text-[#b54708]",
  "bg-[#eef0fb] text-[#4a4db3]",
];

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const label = name?.trim() || "Unknown user";
  const hash = Array.from(label).reduce(
    (total, character) => total + character.charCodeAt(0),
    0
  );
  const palette = PALETTE[hash % PALETTE.length];

  return (
    <AvatarRoot className={cn(SIZES[size], "ring-2 ring-white", className)}>
      {src ? <AvatarImage src={src} alt={label} /> : null}
      <AvatarFallback
        className={cn("font-semibold tracking-tight", palette)}
        aria-label={label}
      >
        {initials(label)}
      </AvatarFallback>
    </AvatarRoot>
  );
}
