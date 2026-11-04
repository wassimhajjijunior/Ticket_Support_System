import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TicketDetailView } from "@/components/tickets/TicketDetailView";

export const metadata: Metadata = {
  title: "Ticket",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticketId = Number(id);

  if (!Number.isInteger(ticketId) || ticketId <= 0) {
    notFound();
  }

  return <TicketDetailView ticketId={ticketId} />;
}
