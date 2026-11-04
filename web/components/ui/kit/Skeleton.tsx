import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="kit-skeleton"
      aria-hidden="true"
      className={cn(
        "shimmer relative overflow-hidden rounded-[10px] bg-sunken",
        className
      )}
      {...props}
    />
  );
}
