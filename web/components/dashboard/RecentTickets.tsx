import Link from "next/link";
import { ArrowRight, Ticket } from "lucide-react";

import {
  Avatar,
  Button,
  Card,
  EmptyState,
  PriorityPill,
  SectionHeader,
  StatusPill,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/kit";
import { formatNumber, parseDate, relativeTime } from "@/lib/format";
import type { TicketDto } from "@/lib/types";

export function RecentTickets({ tickets }: { tickets: TicketDto[] }) {
  const recent = [...tickets]
    .sort(
      (a, b) =>
        parseDate(b.createdAt).getTime() - parseDate(a.createdAt).getTime()
    )
    .slice(0, 5);

  return (
    <Card
      className="animate-rise overflow-hidden"
      style={{ animationDelay: "220ms" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <SectionHeader
          title="Recent tickets"
          description={
            recent.length > 0
              ? `The latest ${formatNumber(recent.length)} of ${formatNumber(tickets.length)} tickets.`
              : "The newest work across your queue."
          }
        />
        <Button asChild variant="ghost" size="sm">
          <Link href="/AllTickets">
            View all
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      {recent.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No tickets yet"
          description="When someone raises a ticket it will land here, ready to triage."
          action={
            <Button asChild size="sm">
              <Link href="/AllTickets">Open the queue</Link>
            </Button>
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
                  <TableHead className="pr-4 text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="max-w-[280px] pl-4 lg:max-w-[360px]">
                      <p
                        className="truncate text-[13px] font-semibold text-ink"
                        title={ticket.title}
                      >
                        {ticket.title}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-faint">
                        {ticket.projectName} · #{ticket.id}
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
                          <span className="max-w-[100px] truncate text-[12px] text-body">
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
                      {relativeTime(ticket.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="divide-y divide-line/70 md:hidden">
            {recent.map((ticket) => (
              <li key={ticket.id} className="px-5 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="truncate text-[13px] font-semibold text-ink"
                      title={ticket.title}
                    >
                      {ticket.title}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-faint">
                      {ticket.projectName} · #{ticket.id}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-faint">
                    {relativeTime(ticket.createdAt)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <StatusPill status={ticket.status} />
                  <PriorityPill priority={ticket.priority} />
                  <span className="ml-auto max-w-[110px] truncate text-[11px] text-faint">
                    {ticket.assignedToName ?? "Unassigned"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
