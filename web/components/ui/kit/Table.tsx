import * as React from "react";

import { cn } from "@/lib/utils";

export function Table({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<"table"> & { containerClassName?: string }) {
  return (
    <div className={cn("w-full overflow-x-auto", containerClassName)}>
      <table
        data-slot="kit-table"
        className={cn("w-full border-collapse text-left", className)}
        {...props}
      />
    </div>
  );
}

export function TableHeader({
  className,
  ...props
}: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="kit-table-header"
      className={cn("border-b border-line", className)}
      {...props}
    />
  );
}

export function TableBody({
  className,
  ...props
}: React.ComponentProps<"tbody">) {
  return <tbody data-slot="kit-table-body" className={className} {...props} />;
}

export function TableRow({
  className,
  ...props
}: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="kit-table-row"
      className={cn(
        "border-b border-line/70 transition-colors duration-150 last:border-0 hover:bg-sunken/50",
        className
      )}
      {...props}
    />
  );
}

export function TableHead({
  className,
  ...props
}: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="kit-table-head"
      scope="col"
      className={cn(
        "whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-faint",
        className
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  ...props
}: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="kit-table-cell"
      className={cn("px-3 py-3 align-middle text-sm text-body", className)}
      {...props}
    />
  );
}
