"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  FilterX,
  Plus,
  RefreshCw,
  Ticket,
} from "lucide-react";

import {
  Avatar,
  Button,
  Card,
  EmptyState,
  PriorityPill,
  SearchInput,
  SectionHeader,
  Segmented,
  Skeleton,
  StatusPill,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/kit";
import { fetchAllTickets } from "@/lib/api";
import {
  formatNumber,
  parseDate,
  pluralize,
  relativeTime,
} from "@/lib/format";
import {
  PRIORITY_LABEL,
  PRIORITY_ORDER,
  STATUS_LABEL,
  STATUS_ORDER,
  type TicketDto,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/types";
import { useApi } from "@/lib/use-api";

import { CreateTicketModal } from "./CreateTicketModal";

type StatusFilter = "ALL" | TicketStatus;
type PriorityFilter = "ALL" | TicketPriority;

const STATUS_FILTER_ORDER: readonly TicketStatus[] = [
  "PENDING",
  "OPEN",
  "EXECUTED",
  "FINISHED",
];

const STATUS_OPTIONS = [
  { value: "ALL" as const, label: "All" },
  ...STATUS_FILTER_ORDER.map((status) => ({
    value: status,
    label: STATUS_LABEL[status],
  })),
];

const PRIORITY_OPTIONS = [
  { value: "ALL" as const, label: "All" },
  ...PRIORITY_ORDER.map((priority) => ({
    value: priority,
    label: PRIORITY_LABEL[priority],
  })),
];

function matchesSearch(ticket: TicketDto, query: string): boolean {
  if (!query) return true;
  return [ticket.title, ticket.description, ticket.assignedToName, ticket.projectName]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(query));
}

function QueueSkeleton() {
  return (
    <Card
      role="status"
      aria-label="Loading tickets"
      className="p-5 sm:p-6"
    >
      <div className="space-y-4">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="flex items-center gap-3">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-2.5 w-1/4" />
            </div>
            <Skeleton className="h-6 w-16 rounded-pill" />
            <Skeleton className="hidden h-6 w-16 rounded-pill sm:block" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading tickets…</span>
    </Card>
  );
}

function QueueError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 font-display text-heading text-ink">
        We couldn&apos;t load the queue
      </h2>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-faint">
        {message}
      </p>
      <Button onClick={onRetry} className="mt-5">
        <RefreshCw className="size-4" aria-hidden="true" />
        Try again
      </Button>
    </Card>
  );
}

export function TicketQueueView() {
  const router = useRouter();
  const load = useCallback(() => fetchAllTickets(), []);
  const { data, error, loading, refetch } = useApi(load);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [priorityFilter, setPriorityFilter] =
    useState<PriorityFilter>("ALL");
  const [createOpen, setCreateOpen] = useState(false);

  const tickets = useMemo(
    () =>
      [...(data ?? [])].sort(
        (a, b) =>
          parseDate(b.updatedAt).getTime() -
          parseDate(a.updatedAt).getTime()
      ),
    [data]
  );

  const query = search.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      tickets.filter((ticket) => {
        const statusMatches =
          statusFilter === "ALL" || ticket.status === statusFilter;
        const priorityMatches =
          priorityFilter === "ALL" || ticket.priority === priorityFilter;
        return (
          statusMatches && priorityMatches && matchesSearch(ticket, query)
        );
      }),
    [tickets, statusFilter, priorityFilter, query]
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: tickets.length };
    for (const status of STATUS_ORDER) {
      counts[status] = tickets.filter(
        (ticket) => ticket.status === status
      ).length;
    }
    return counts;
  }, [tickets]);

  const priorityCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: tickets.length };
    for (const priority of PRIORITY_ORDER) {
      counts[priority] = tickets.filter(
        (ticket) => ticket.priority === priority
      ).length;
    }
    return counts;
  }, [tickets]);

  const hasFilters =
    Boolean(query) || statusFilter !== "ALL" || priorityFilter !== "ALL";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
  };

  const openTicket = (id: number) => {
    router.push(`/AllTickets/${id}`);
  };

  const handleCreated = () => {
    setCreateOpen(false);
    refetch();
  };

  const header = (
    <SectionHeader
      title="Ticket queue"
      description={
        `${formatNumber(filtered.length)} of ${formatNumber(
          tickets.length
        )} ${pluralize(tickets.length, "ticket")} shown.`
      }
      action={
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" aria-hidden="true" />
          New ticket
        </Button>
      }
    />
  );

  return (
    <div className="space-y-4">
      {header}

      {loading && !data ? (
        <QueueSkeleton />
      ) : error && !data ? (
        <QueueError message={error} onRetry={refetch} />
      ) : (
        <>
          {error ? (
            <div
              role="alert"
              className="flex flex-wrap items-center gap-3 rounded-inner border border-danger/20 bg-danger-soft px-4 py-3 text-[12px] text-danger"
            >
              <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                Some tickets may be out of date. {error}
              </span>
              <Button variant="ghost" size="sm" onClick={refetch}>
                <RefreshCw className="size-4" aria-hidden="true" />
                Retry
              </Button>
            </div>
          ) : null}

          <Card className="p-4 sm:p-5">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <SearchInput
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search title, description, assignee…"
                  aria-label="Search tickets"
                  className="w-full sm:max-w-sm"
                />
                {hasFilters ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="self-start sm:self-auto"
                  >
                    <FilterX className="size-4" aria-hidden="true" />
                    Clear filters
                  </Button>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">
                    Status
                  </span>
                  <Segmented
                    ariaLabel="Filter by status"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={STATUS_OPTIONS.map((option) => ({
                      ...option,
                      count: statusCounts[option.value] ?? 0,
                    }))}
                    className="max-w-full flex-wrap"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">
                    Priority
                  </span>
                  <Segmented
                    ariaLabel="Filter by priority"
                    value={priorityFilter}
                    onChange={setPriorityFilter}
                    options={PRIORITY_OPTIONS.map((option) => ({
                      ...option,
                      count: priorityCounts[option.value] ?? 0,
                    }))}
                    className="max-w-full flex-wrap"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            {filtered.length === 0 ? (
              <EmptyState
                icon={Ticket}
                title={
                  hasFilters
                    ? "No tickets match these filters"
                    : "No tickets yet"
                }
                description={
                  hasFilters
                    ? "Try a different search, or clear the filters to see the whole queue."
                    : "When someone raises a ticket it will land here, ready to triage."
                }
                action={
                  hasFilters ? (
                    <Button variant="secondary" size="sm" onClick={clearFilters}>
                      <FilterX className="size-4" aria-hidden="true" />
                      Clear filters
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => setCreateOpen(true)}>
                      <Plus className="size-4" aria-hidden="true" />
                      New ticket
                    </Button>
                  )
                }
              />
            ) : (
              <>
                <div className="hidden px-2 md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-4">Ticket</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Assignee</TableHead>
                        <TableHead className="pr-4 text-right">
                          Updated
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((ticket) => (
                        <TableRow
                          key={ticket.id}
                          role="link"
                          tabIndex={0}
                          aria-label={`Open ticket #${ticket.id}: ${ticket.title}`}
                          onClick={() => openTicket(ticket.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              openTicket(ticket.id);
                            }
                          }}
                          className="cursor-pointer focus-visible:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand"
                        >
                          <TableCell className="max-w-[320px] pl-4 lg:max-w-[440px]">
                            <p
                              className="truncate text-[13px] font-semibold text-ink"
                              title={ticket.title}
                            >
                              {ticket.title}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-faint">
                              #{ticket.id} · {ticket.projectName}
                            </p>
                          </TableCell>
                          <TableCell>
                            <StatusPill status={ticket.status} />
                          </TableCell>
                          <TableCell>
                            <PriorityPill priority={ticket.priority} />
                          </TableCell>
                          <TableCell>
                            {ticket.assignedToName ? (
                              <span className="flex items-center gap-2">
                                <Avatar
                                  name={ticket.assignedToName}
                                  size="sm"
                                  className="ring-0"
                                />
                                <span className="max-w-[120px] truncate text-[12px] text-body">
                                  {ticket.assignedToName}
                                </span>
                              </span>
                            ) : (
                              <span className="text-[12px] text-faint">
                                Unassigned
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap pr-4 text-right text-[12px] text-faint">
                            {relativeTime(ticket.updatedAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <ul className="divide-y divide-line/70 md:hidden">
                  {filtered.map((ticket) => (
                    <li key={ticket.id}>
                      <Link
                        href={`/AllTickets/${ticket.id}`}
                        className="block px-5 py-4 outline-none transition-colors hover:bg-sunken/50 focus-visible:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p
                              className="truncate text-[13px] font-semibold text-ink"
                              title={ticket.title}
                            >
                              {ticket.title}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-faint">
                              #{ticket.id} · {ticket.projectName}
                            </p>
                          </div>
                          <span className="shrink-0 text-[11px] text-faint">
                            {relativeTime(ticket.updatedAt)}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <StatusPill status={ticket.status} />
                          <PriorityPill priority={ticket.priority} />
                          <span className="ml-auto max-w-[130px] truncate text-[11px] text-faint">
                            {ticket.assignedToName ?? "Unassigned"}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </>
      )}

      {createOpen ? (
        <CreateTicketModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={handleCreated}
        />
      ) : null}
    </div>
  );
}
