"use client";

import { useState } from "react";
import { Layers } from "lucide-react";

import {
  Card,
  EmptyState,
  SectionHeader,
  Segmented,
} from "@/components/ui/kit";
import { formatNumber, percent } from "@/lib/format";
import {
  PRIORITY_LABEL,
  PRIORITY_ORDER,
  STATUS_LABEL,
  STATUS_ORDER,
  type TicketStatsDto,
} from "@/lib/types";

type View = "status" | "priority";

const COLORS: Record<string, string> = {
  OPEN: "#1b6be0",
  PENDING: "#f79009",
  EXECUTED: "#22c7bc",
  FINISHED: "#12b76a",
  LOW: "#8792a4",
  MEDIUM: "#1b6be0",
  HIGH: "#f79009",
  URGENT: "#f04438",
};

const VIEW_OPTIONS = [
  { value: "status" as const, label: "Status" },
  { value: "priority" as const, label: "Priority" },
];

export function StatusBreakdown({ stats }: { stats: TicketStatsDto }) {
  const [view, setView] = useState<View>("status");

  const rows =
    view === "status"
      ? STATUS_ORDER.map((key) => ({
          key,
          label: STATUS_LABEL[key],
          count: stats.byStatus[key] ?? 0,
        }))
      : PRIORITY_ORDER.map((key) => ({
          key,
          label: PRIORITY_LABEL[key],
          count: stats.byPriority[key] ?? 0,
        }));

  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const summary = rows
    .map((row) => `${row.label}: ${row.count}`)
    .join(". ");

  return (
    <Card
      className="flex animate-rise flex-col p-5 sm:p-6"
      style={{ animationDelay: "180ms" }}
    >
      <SectionHeader
        title="Breakdown"
        description={
          view === "status"
            ? "Where every ticket sits right now."
            : "How demand is prioritised across the desk."
        }
        action={
          <Segmented
            options={VIEW_OPTIONS}
            value={view}
            onChange={setView}
            ariaLabel="Breakdown dimension"
          />
        }
      />

      {total === 0 ? (
        <EmptyState
          compact
          icon={Layers}
          title="Nothing to break down yet"
          description="Ticket counts will appear here as soon as the queue has work."
        />
      ) : (
        <>
          <div
            role="img"
            aria-label={summary}
            className="mt-5 flex h-3 w-full overflow-hidden rounded-pill bg-sunken"
          >
            {rows.map((row) =>
              row.count > 0 ? (
                <span
                  key={row.key}
                  className="h-full transition-[width] duration-500"
                  style={{
                    width: `${percent(row.count, total)}%`,
                    backgroundColor: COLORS[row.key],
                  }}
                />
              ) : null
            )}
          </div>

          <ul className="mt-4 flex flex-col gap-0.5">
            {rows.map((row) => (
              <li
                key={row.key}
                className="flex items-center gap-2.5 rounded-[10px] px-1 py-1.5"
              >
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: COLORS[row.key] }}
                />
                <span className="text-[12px] font-medium text-body">
                  {row.label}
                </span>
                <span className="ml-auto text-[12px] font-semibold text-ink tabular-nums">
                  {formatNumber(row.count)}
                </span>
                <span className="w-9 text-right text-[11px] text-faint tabular-nums">
                  {percent(row.count, total)}%
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-auto border-t border-line pt-3 text-[11px] text-faint">
            {formatNumber(total)}{" "}
            {total === 1 ? "ticket" : "tickets"} in this view
          </p>
        </>
      )}
    </Card>
  );
}
