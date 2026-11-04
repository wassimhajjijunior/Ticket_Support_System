import { Skeleton } from "@/components/ui/kit";

export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="space-y-4 pt-1"
    >
      <div className="space-y-2 px-1">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-3 w-80 max-w-full" />
      </div>

      <Skeleton className="h-[196px] w-full rounded-panel" />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-[122px] rounded-card" />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <Skeleton className="h-[316px] rounded-card" />
        <Skeleton className="h-[316px] rounded-card" />
      </div>

      <Skeleton className="h-[290px] rounded-card" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
