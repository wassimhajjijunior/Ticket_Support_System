const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * The contract documents UTC timestamps (e.g. `2026-11-03T18:00:00Z`).
 * Some backend serialisers omit the trailing `Z`, so normalise before parsing.
 */
export function parseDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  return new Date(hasZone ? value : `${value}Z`);
}

export function shortDate(value: string | Date): string {
  const date = parseDate(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function weekdayShort(value: string | Date): string {
  const date = parseDate(value);
  if (Number.isNaN(date.getTime())) return "—";
  return WEEKDAYS[date.getDay()];
}

export function longDate(value: string | Date): string {
  const date = parseDate(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function relativeTime(value: string | Date): string {
  const date = parseDate(value);
  if (Number.isNaN(date.getTime())) return "—";

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);

  if (seconds < 45) return "just now";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  return shortDate(date);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function firstName(name: string | null | undefined): string {
  if (!name) return "";
  return name.trim().split(/\s+/)[0] ?? "";
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function percent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}
