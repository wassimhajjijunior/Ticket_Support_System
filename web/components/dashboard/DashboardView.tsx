"use client";

import Link from "next/link";
import { useCallback } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CircleDot,
  Inbox,
  RefreshCw,
  UserX,
} from "lucide-react";

import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { RecentTickets } from "@/components/dashboard/RecentTickets";
import { StatusBreakdown } from "@/components/dashboard/StatusBreakdown";
import {
  Button,
  Card,
  Skeleton,
  StatCard,
} from "@/components/ui/kit";
import { fetchAllTickets, fetchStats } from "@/lib/api";
import { formatNumber, percent, pluralize, weekdayShort } from "@/lib/format";
import type { DayStat, TicketDto, TicketStatsDto } from "@/lib/types";
import { useApi } from "@/lib/use-api";

interface DashboardData {
  stats: TicketStatsDto;
  tickets: TicketDto[];
}

function DashboardHeader() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-1 pt-1">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
          Live overview
        </p>
        <h2 className="mt-1 font-display text-title text-ink sm:text-hero">
          Your desk at a glance
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-body sm:text-sm">
          A live read on the queue, straight from your workspace.
        </p>
      </div>
      <Button asChild variant="secondary">
        <Link href="/AllTickets">
          Open tickets
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}

function WeekPulse({ days }: { days: DayStat[] }) {
  const data = days.slice(-7);
  const max = Math.max(1, ...data.map((day) => day.created));
  const total = data.reduce((sum, day) => sum + day.created, 0);
  const first = data[0]?.date;
  const last = data[data.length - 1]?.date;

  return (
    <div className="rounded-inner border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between text-[11px] font-medium text-white/70">
        <span>Created · last 7 days</span>
        <span className="font-semibold text-white tabular-nums">{total}</span>
      </div>
      <div className="mt-3 flex h-16 items-end gap-1.5" aria-hidden="true">
        {data.map((day) => {
          const height =
            day.created === 0
              ? 4
              : Math.max(10, Math.round((day.created / max) * 100));
          return (
            <div
              key={day.date}
              className="flex h-full flex-1 items-end"
            >
              <span
                className={
                  day.created === 0
                    ? "w-full rounded-full bg-white/20"
                    : "w-full rounded-full bg-white/85"
                }
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[9px] font-semibold uppercase tracking-[0.08em] text-white/45">
        <span>{first ? weekdayShort(first) : ""}</span>
        <span>{last ? weekdayShort(last) : ""}</span>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading dashboard"
      className="space-y-4 pt-1"
    >
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
      <span className="sr-only">Loading dashboard…</span>
    </div>
  );
}

export default function DashboardView() {
  const load = useCallback(async (): Promise<DashboardData> => {
    const [stats, tickets] = await Promise.all([
      fetchStats(),
      fetchAllTickets(),
    ]);
    return { stats, tickets };
  }, []);

  const { data, error, loading, refetch } = useApi(load);

  if (loading) {
    return (
      <div className="space-y-4">
        <DashboardHeader />
        <DashboardSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <DashboardHeader />
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-display text-heading text-ink">
            We couldn’t load your desk
          </h2>
          <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-faint">
            {error ?? "The dashboard returned no data. Please try again."}
          </p>
          <Button onClick={refetch} className="mt-5">
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </Button>
        </Card>
      </div>
    );
  }

  const { stats, tickets } = data;
  const open = (stats.byStatus.OPEN ?? 0) + (stats.byStatus.PENDING ?? 0);
  const resolved = stats.byStatus.FINISHED ?? 0;
  const unassigned = stats.unassigned;
  const weekCreated = stats.last7Days.reduce(
    (sum, day) => sum + day.created,
    0
  );
  const weekClosed = stats.last7Days.reduce((sum, day) => sum + day.closed, 0);

  const headline =
    stats.total === 0
      ? "A clean slate. Nice work."
      : open === 0
        ? "The queue is clear. Nicely done."
        : `${open} ${pluralize(open, "ticket")} ${
            open === 1 ? "needs" : "need"
          } your attention.`;

  return (
    <div className="space-y-4">
      <DashboardHeader />

      <section
        aria-labelledby="queue-headline"
        className="brand-gradient animate-rise relative isolate overflow-hidden rounded-panel p-6 text-white shadow-lift sm:p-8 lg:p-10"
      >
        <div
          aria-hidden="true"
          className="noise pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-soft-light"
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 200 200"
          fill="none"
          className="pointer-events-none absolute -right-24 -top-28 size-[420px] text-white/10"
        >
          {[92, 72, 52, 32].map((radius) => (
            <circle
              key={radius}
              cx="100"
              cy="100"
              r={radius}
              stroke="currentColor"
              strokeWidth="0.8"
            />
          ))}
        </svg>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-white/10 blur-3xl"
        />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-pill border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80 backdrop-blur-sm">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-white"
              />
              Live queue
            </span>
            <h2
              id="queue-headline"
              className="mt-4 max-w-xl font-display text-[30px] font-bold leading-[1.06] tracking-[-0.03em] sm:text-[38px] lg:text-[42px]"
            >
              {headline}
            </h2>
            <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-white/75 sm:text-sm">
              {formatNumber(resolved)} resolved · {formatNumber(unassigned)}{" "}
              unassigned · {formatNumber(weekCreated)} created this week
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
              <Button
                asChild
                variant="secondary"
                className="border-transparent bg-white text-ink hover:bg-white/90 hover:text-ink"
              >
                <Link href="/AllTickets">
                  Open the queue
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <span className="text-[11px] font-medium text-white/65">
                {formatNumber(weekClosed)} closed in the last 7 days
              </span>
            </div>
          </div>

          {stats.last7Days.length > 0 ? (
            <WeekPulse days={stats.last7Days} />
          ) : null}
        </div>
      </section>

      <section
        aria-label="Key numbers"
        className="grid animate-rise grid-cols-2 gap-3 xl:grid-cols-4"
        style={{ animationDelay: "80ms" }}
      >
        <StatCard
          label="Total"
          value={formatNumber(stats.total)}
          icon={Inbox}
          tone="ink"
          hint={`${formatNumber(open)} currently open`}
        />
        <StatCard
          label="Open"
          value={formatNumber(open)}
          icon={CircleDot}
          tone="brand"
          hint={
            stats.total > 0
              ? `${percent(open, stats.total)}% of all tickets`
              : "No tickets yet"
          }
        />
        <StatCard
          label="Resolved"
          value={formatNumber(resolved)}
          icon={CheckCircle2}
          tone="success"
          hint={`${formatNumber(weekClosed)} closed this week`}
        />
        <StatCard
          label="Unassigned"
          value={formatNumber(unassigned)}
          icon={UserX}
          tone="warning"
          hint={
            unassigned > 0
              ? "Waiting for an owner"
              : "Every ticket has an owner"
          }
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <ActivityChart days={stats.last7Days} />
        <StatusBreakdown stats={stats} />
      </div>

      <RecentTickets tickets={tickets} />
    </div>
  );
}
