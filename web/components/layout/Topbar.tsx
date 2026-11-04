"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  CheckCheck,
  ChevronDown,
  LogOut,
  Settings2,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, SearchInput } from "@/components/ui/kit";
import { clearSession } from "@/lib/api";
import { useCurrentUser } from "@/lib/current-user";
import { greetingForHour } from "@/lib/format";
import { pageTitleFor } from "./nav-items";

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useCurrentUser();
  const [greeting, setGreeting] = useState("Welcome");

  useEffect(() => {
    setGreeting(greetingForHour(new Date().getHours()));
  }, []);

  const pageTitle = pageTitleFor(pathname);

  const handleLogout = () => {
    clearSession();
    router.replace("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-3 z-30 flex items-center gap-2 rounded-[18px] border border-line bg-surface/90 px-3 py-2.5 shadow-soft backdrop-blur-md md:top-4 md:gap-3 md:px-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium text-faint">
          {greeting}
          {user ? `, ${user.username}` : ""}
        </p>
        <h1
          className="truncate font-display text-[18px] font-bold leading-tight tracking-[-0.02em] text-ink md:text-subheading"
          title={pageTitle}
        >
          {pageTitle}
        </h1>
      </div>

      <SearchInput
        placeholder="Search tickets…"
        shortcut="⌘K"
        className="hidden w-[200px] lg:block xl:w-[260px]"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Notifications"
            className="relative grid size-10 shrink-0 place-items-center rounded-pill border border-line bg-surface text-body outline-none transition-colors hover:bg-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <Bell className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={10}
          className="w-72 rounded-inner border-line bg-surface p-2 shadow-float"
        >
          <div className="px-2 py-1.5">
            <p className="text-[13px] font-semibold text-ink">Notifications</p>
            <p className="text-[11px] text-faint">Updates about your tickets</p>
          </div>
          <DropdownMenuSeparator className="bg-line" />
          <div className="flex flex-col items-center gap-1.5 px-4 py-6 text-center">
            <span className="grid size-10 place-items-center rounded-full bg-success-soft text-success">
              <CheckCheck className="size-4" aria-hidden="true" />
            </span>
            <p className="text-[13px] font-medium text-ink">
              You’re all caught up
            </p>
            <p className="text-[11px] text-faint">
              New activity will show up here.
            </p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Account menu"
            className="flex shrink-0 items-center gap-2 rounded-pill border border-line bg-surface p-1 pr-2 outline-none transition-colors hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:pr-2.5"
          >
            <Avatar name={user?.username ?? "Account"} size="sm" />
            <span className="hidden text-left sm:block">
              <span className="block max-w-[110px] truncate text-[12px] font-semibold leading-tight text-ink">
                {user?.username ?? "Account"}
              </span>
              <span className="block text-[9px] font-semibold uppercase tracking-[0.1em] text-faint">
                {user?.role ?? "Member"}
              </span>
            </span>
            <ChevronDown
              className="hidden size-3.5 text-faint sm:block"
              aria-hidden="true"
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={10}
          className="w-60 rounded-inner border-line bg-surface p-1.5 shadow-float"
        >
          <DropdownMenuLabel className="px-2.5 py-2">
            <span className="block text-[13px] font-semibold text-ink">
              {user?.username ?? "Signed in"}
            </span>
            <span className="mt-0.5 block truncate text-[11px] font-normal text-faint">
              {user?.email ?? "Loading profile…"}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-line" />
          <DropdownMenuItem
            asChild
            className="cursor-pointer rounded-seg px-2.5 py-2 text-[13px] text-body focus:bg-sunken focus:text-ink"
          >
            <Link href="/Settings">
              <Settings2 className="size-4" aria-hidden="true" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-line" />
          <DropdownMenuItem
            onSelect={handleLogout}
            className="cursor-pointer rounded-seg px-2.5 py-2 text-[13px] text-danger focus:bg-danger-soft focus:text-danger"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
