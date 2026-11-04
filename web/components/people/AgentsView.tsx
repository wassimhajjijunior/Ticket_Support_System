"use client";

import { useCallback, useMemo } from "react";
import {
  AlertTriangle,
  Headset,
  RefreshCw,
} from "lucide-react";

import {
  Avatar,
  Button,
  Card,
  EmptyState,
  SectionHeader,
  Skeleton,
} from "@/components/ui/kit";
import { fetchAgents, fetchAllTickets } from "@/lib/api";
import { formatNumber, percent, pluralize } from "@/lib/format";
import { type TicketDto, type UserDto } from "@/lib/types";
import { useApi } from "@/lib/use-api";

import { RoleBadge } from "./RoleBadge";

interface AgentsData {
  agents: UserDto[];
  tickets: TicketDto[];
}

interface Workload {
  agent: UserDto;
  assigned: number;
  open: number;
  resolved: number;
}

function buildWorkload(agents: UserDto[], tickets: TicketDto[]): Workload[] {
  return agents.map((agent) => {
    const assignedTickets = tickets.filter(
      (ticket) => ticket.assignedToId === agent.id
    );
    return {
      agent,
      assigned: assignedTickets.length,
      open: assignedTickets.filter(
        (ticket) => ticket.status === "OPEN" || ticket.status === "PENDING"
      ).length,
      resolved: assignedTickets.filter(
        (ticket) => ticket.status === "EXECUTED" || ticket.status === "FINISHED"
      ).length,
    };
  });
}

function AgentsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading agents"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
    >
      {[0, 1, 2, 3].map((item) => (
        <Skeleton key={item} className="h-[170px] rounded-card" />
      ))}
      <span className="sr-only">Loading agents…</span>
    </div>
  );
}

export function AgentsView() {
  const load = useCallback(async (): Promise<AgentsData> => {
    const [agents, tickets] = await Promise.all([
      fetchAgents(),
      fetchAllTickets(),
    ]);
    return { agents, tickets };
  }, []);

  const { data, error, loading, refetch } = useApi(load);

  const agents = useMemo(() => data?.agents ?? [], [data]);
  const tickets = useMemo(() => data?.tickets ?? [], [data]);

  const workload = useMemo(
    () => buildWorkload(agents, tickets),
    [agents, tickets]
  );

  const totalAssigned = workload.reduce(
    (sum, item) => sum + item.assigned,
    0
  );

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Agents"
        description={
          agents.length === 0
            ? "Support agents will appear here once they have an account."
            : `${formatNumber(agents.length)} ${pluralize(
                agents.length,
                "agent"
              )} · ${formatNumber(totalAssigned)} assigned ${pluralize(
                totalAssigned,
                "ticket"
              )}.`
        }
      />

      {loading && !data ? (
        <AgentsSkeleton />
      ) : error && !data ? (
        <Card className="flex flex-col items-center px-6 py-14 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-display text-heading text-ink">
            We couldn&apos;t load the team
          </h2>
          <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-faint">
            {error}
          </p>
          <Button onClick={refetch} className="mt-5">
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </Button>
        </Card>
      ) : (
        <>
          {error ? (
            <div
              role="alert"
              className="flex flex-wrap items-center gap-3 rounded-inner border border-danger/20 bg-danger-soft px-4 py-3 text-[12px] text-danger"
            >
              <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                Workload may be out of date. {error}
              </span>
              <Button variant="ghost" size="sm" onClick={refetch}>
                <RefreshCw className="size-4" aria-hidden="true" />
                Retry
              </Button>
            </div>
          ) : null}

          {workload.length === 0 ? (
            <Card>
              <EmptyState
                icon={Headset}
                title="No agents yet"
                description="When an account is given the agent role it will show up here with its workload."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {workload.map((item) => {
                const utilization = percent(item.assigned, tickets.length);
                return (
                  <Card key={item.agent.id} className="p-5">
                    <div className="flex items-start gap-3">
                      <Avatar
                        name={item.agent.username}
                        src={item.agent.profileImagePath}
                        size="lg"
                        className="ring-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-[14px] font-semibold text-ink">
                            {item.agent.username}
                          </p>
                          <RoleBadge role={item.agent.role} />
                        </div>
                        <p
                          className="mt-1 truncate text-[12px] text-body"
                          title={item.agent.email}
                        >
                          {item.agent.email}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] text-faint">
                          {item.agent.phone || "No phone"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-ink">
                          {formatNumber(item.assigned)}{" "}
                          {pluralize(item.assigned, "ticket")} assigned
                        </span>
                        <span className="text-faint tabular-nums">
                          {utilization}%
                        </span>
                      </div>
                      <div
                        role="img"
                        aria-label={`${item.agent.username} has ${item.assigned} assigned tickets, ${item.open} open and ${item.resolved} resolved`}
                        className="mt-2 h-2 w-full overflow-hidden rounded-pill bg-sunken"
                      >
                        <span
                          className="block h-full rounded-pill bg-brand transition-[width] duration-500"
                          style={{ width: `${utilization}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[11px] text-faint">
                        {formatNumber(item.open)} open ·{" "}
                        {formatNumber(item.resolved)} resolved
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
