"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { NAV_ITEMS, isNavItemActive } from "./nav-items";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-3 bottom-3 z-40 rounded-[20px] border border-line bg-surface/95 px-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] pt-1.5 shadow-float backdrop-blur-md md:hidden"
    >
      <ul className="flex items-stretch">
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-[14px] px-1 text-[10px] font-medium outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                  active
                    ? "bg-brand-soft text-brand"
                    : "text-faint hover:bg-sunken hover:text-ink"
                )}
              >
                <Icon
                  className="size-[19px]"
                  strokeWidth={active ? 2 : 1.75}
                  aria-hidden="true"
                />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
