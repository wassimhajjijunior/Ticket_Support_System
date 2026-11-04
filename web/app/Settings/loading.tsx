import { Skeleton } from "@/components/ui/kit";

export default function Loading() {
  return (
    <div role="status" aria-label="Loading settings" className="space-y-4">
      <div className="space-y-2 px-1">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-3 w-72 max-w-full" />
      </div>
      <Skeleton className="h-[420px] w-full max-w-2xl rounded-card" />
      <span className="sr-only">Loading settings…</span>
    </div>
  );
}
