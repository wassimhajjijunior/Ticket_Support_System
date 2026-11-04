"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LifeBuoy, Plus } from "lucide-react";

import { BrandLockup } from "@/components/brand/Brand";
import { Button } from "@/components/ui/kit";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isNavItemActive } from "./nav-items";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Workspace navigation"
      className="sticky top-3 hidden h-[calc(100dvh-1.5rem)] w-[264px] shrink-0 flex-col md:top-4 md:flex md:h-[calc(100dvh-2rem)]"
    >
      <div className="flex h-full flex-col rounded-card border border-line bg-surface p-3 shadow-soft">
        <Link
          href="/"
          className="flex items-center rounded-inner px-2 py-2 outline-none transition-colors hover:bg-sunken/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          aria-label="Relay home"
        >
          <BrandLockup />
        </Link>

        <p className="mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
          Workspace
        </p>

        <nav aria-label="Primary" className="mt-2 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isNavItemActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex h-10 items-center gap-3 rounded-seg px-3 text-[13px] font-medium outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                  active
                    ? "bg-brand-soft text-brand"
                    : "text-body hover:bg-sunken hover:text-ink"
                )}
              >
                <Icon
                  className={cn(
                    "size-[18px] shrink-0 transition-colors",
                    active ? "text-brand" : "text-faint group-hover:text-ink"
                  )}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                <span className="truncate">{item.label}</span>
                {active ? (
                  <span
                    aria-hidden="true"
                    className="ml-auto size-1.5 rounded-full bg-brand"
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3 pt-6">
          <div className="rounded-inner bg-sunken/70 p-3.5">
            <div className="flex items-center gap-2 text-ink">
              <LifeBuoy className="size-4 text-teal" aria-hidden="true" />
              <span className="text-[12px] font-semibold">Desk tip</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-faint">
              Clear urgent tickets first — filters live on the Tickets page.
            </p>
          </div>

          <Button asChild size="sm" className="w-full">
            <Link href="/AllTickets">
              <Plus className="size-4" aria-hidden="true" />
              New ticket
            </Link>
          </Button>

          <p className="px-1 text-center text-[10px] font-medium tracking-wide text-faint">
            Relay · Ticket desk
          </p>
        </div>
      </div>
    </aside>
  );
}
