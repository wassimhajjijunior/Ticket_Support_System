"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  FilterX,
  RefreshCw,
  Users,
} from "lucide-react";

import {
  Avatar,
  Button,
  Card,
  EmptyState,
  SearchInput,
  SectionHeader,
  Segmented,
  Skeleton,
} from "@/components/ui/kit";
import { fetchAllUsers } from "@/lib/api";
import { formatNumber, pluralize } from "@/lib/format";
import { type Role, type UserDto } from "@/lib/types";
import { useApi } from "@/lib/use-api";

import { RoleBadge } from "./RoleBadge";

type RoleFilter = "ALL" | Role;

const ROLE_OPTIONS = [
  { value: "ALL" as const, label: "All" },
  { value: "ADMIN" as const, label: "Admin" },
  { value: "AGENT" as const, label: "Agent" },
  { value: "USER" as const, label: "User" },
];

function matchesSearch(user: UserDto, query: string): boolean {
  if (!query) return true;
  return [user.username, user.email, user.phone]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(query));
}

function PeopleSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading people"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
    >
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <Skeleton key={item} className="h-[116px] rounded-card" />
      ))}
      <span className="sr-only">Loading people…</span>
    </div>
  );
}

export function ClientsView() {
  const load = useCallback(() => fetchAllUsers(), []);
  const { data, error, loading, refetch } = useApi(load);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");

  const users = useMemo(
    () =>
      [...(data ?? [])].sort((a, b) =>
        a.username.localeCompare(b.username)
      ),
    [data]
  );

  const query = search.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      users.filter(
        (user) =>
          (roleFilter === "ALL" || user.role === roleFilter) &&
          matchesSearch(user, query)
      ),
    [users, roleFilter, query]
  );

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: users.length };
    for (const role of ["ADMIN", "AGENT", "USER"] as const) {
      counts[role] = users.filter((user) => user.role === role).length;
    }
    return counts;
  }, [users]);

  const hasFilters = Boolean(query) || roleFilter !== "ALL";

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Clients"
        description={
          users.length === 0
            ? "Everyone with a Relay account will show up here."
            : `${formatNumber(filtered.length)} of ${formatNumber(
                users.length
              )} ${pluralize(users.length, "person", "people")} shown.`
        }
      />

      {loading && !data ? (
        <PeopleSkeleton />
      ) : error && !data ? (
        <Card className="flex flex-col items-center px-6 py-14 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-display text-heading text-ink">
            We couldn&apos;t load people
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
                Some people may be out of date. {error}
              </span>
              <Button variant="ghost" size="sm" onClick={refetch}>
                <RefreshCw className="size-4" aria-hidden="true" />
                Retry
              </Button>
            </div>
          ) : null}

          <Card className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <SearchInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, phone…"
                aria-label="Search people"
                className="w-full sm:max-w-sm"
              />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">
                  Role
                </span>
                <Segmented
                  ariaLabel="Filter by role"
                  value={roleFilter}
                  onChange={setRoleFilter}
                  options={ROLE_OPTIONS.map((option) => ({
                    ...option,
                    count: roleCounts[option.value] ?? 0,
                  }))}
                  className="max-w-full flex-wrap"
                />
                {hasFilters ? (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <FilterX className="size-4" aria-hidden="true" />
                    Clear
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>

          {filtered.length === 0 ? (
            <Card>
              <EmptyState
                icon={Users}
                title={
                  hasFilters ? "No people match these filters" : "No people yet"
                }
                description={
                  hasFilters
                    ? "Try a different search, or clear the filters to see everyone."
                    : "Accounts created in Relay will appear here."
                }
                action={
                  hasFilters ? (
                    <Button variant="secondary" size="sm" onClick={clearFilters}>
                      <FilterX className="size-4" aria-hidden="true" />
                      Clear filters
                    </Button>
                  ) : undefined
                }
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((user) => (
                <Card key={user.id} className="p-5">
                  <div className="flex items-start gap-3">
                    <Avatar
                      name={user.username}
                      src={user.profileImagePath}
                      size="lg"
                      className="ring-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-[14px] font-semibold text-ink">
                          {user.username}
                        </p>
                        <RoleBadge role={user.role} />
                      </div>
                      <p
                        className="mt-1 truncate text-[12px] text-body"
                        title={user.email}
                      >
                        {user.email}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-faint">
                        {user.phone || "No phone"}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
