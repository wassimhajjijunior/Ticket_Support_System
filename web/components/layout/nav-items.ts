import {
  Headset,
  LayoutDashboard,
  Settings2,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Tickets", href: "/AllTickets", icon: Ticket },
  { label: "Clients", href: "/Clients", icon: Users },
  { label: "Agents", href: "/Agents", icon: Headset },
  { label: "Settings", href: "/Settings", icon: Settings2 },
] as const;

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function pageTitleFor(pathname: string): string {
  const match = NAV_ITEMS.find((item) => isNavItemActive(pathname, item.href));
  if (match) return match.label;

  const segment = pathname.split("/").filter(Boolean)[0];
  if (!segment) return "Dashboard";
  return segment
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
