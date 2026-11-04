import type { Metadata } from "next";

import { TicketQueueView } from "@/components/tickets/TicketQueueView";

export const metadata: Metadata = {
  title: "Tickets",
};

export default function Page() {
  return <TicketQueueView />;
}
