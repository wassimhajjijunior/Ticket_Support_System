import * as React from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="kit-card"
      className={cn(
        "rounded-card border border-line bg-surface shadow-soft",
        className
      )}
      {...props}
    />
  );
}
