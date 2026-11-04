import * as React from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="kit-input"
      className={cn(
        "h-11 w-full min-w-0 rounded-field border border-line bg-surface px-3.5 text-sm text-ink shadow-[inset_0_1px_2px_rgba(16,24,40,0.03)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-faint focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:bg-sunken disabled:opacity-60 aria-invalid:border-danger aria-invalid:ring-4 aria-invalid:ring-danger/10",
        className
      )}
      {...props}
    />
  );
}
