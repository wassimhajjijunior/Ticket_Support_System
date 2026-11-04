# API Contract — Ticket Support System

Frozen contract between `app/` (Spring Boot) and `web/` (Next.js). Both sides implement against this.
Base URL: `http://localhost:8080`. All responses JSON. All protected routes need `Authorization: Bearer <jwt>`.

## Auth

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/auth/register` | — | `{username,email,password,phone}` | `200` plain text |
| POST | `/auth/login` | — | `{username,password}` | `200 {token}` |

Registration assigns `Role.USER`. Duplicate username/email → `409`.

## Users

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| GET | `/user/me` | yes | — | `UserDto` |
| GET | `/user/all` | yes | — | `UserDto[]` |
| GET | `/user/agents` | yes | — | `UserDto[]` where role = AGENT |
| GET | `/user/{username}` | yes | — | `UserDto` |
| PUT | `/user/{id}` | owner or ADMIN | `{username,email,phone}` | `UserDto` |
| POST | `/user/admin/createUser` | **ADMIN only** | `{username,email,password,role,phone}` | `UserDto` |

`UserDto` = `{ id, username, email, role, phone, profileImagePath }`

Rules:
- A non-admin may update **only their own** record → otherwise `403`.
- `role` is **ignored** on update unless the caller is `ADMIN`. Never allow self-promotion.
- `password` is never returned.

## Projects

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| GET | `/project/allProjects` | yes | — | `{id,name}[]` |
| POST | `/project/create` | ADMIN | `{name}` | `{id,name}` |

## Tickets

`TicketDto` =
```json
{
  "id": 1,
  "title": "...",
  "description": "...",
  "status": "OPEN",
  "priority": "HIGH",
  "projectId": 1,
  "projectName": "Platform",
  "createdById": 2,
  "createdByName": "wassim",
  "assignedToId": 3,
  "assignedToName": "agent-one",
  "commentCount": 2,
  "createdAt": "2026-11-03T18:00:00Z",
  "updatedAt": "2026-11-03T18:00:00Z"
}
```

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| GET | `/ticket/allTickets` | yes | — | `TicketDto[]` |
| GET | `/ticket/myTickets` | yes | — | `TicketDto[]` (created by me **or** assigned to me) |
| GET | `/ticket/TicketDetails/{id}` | yes | — | `TicketDto` (`404` if absent) |
| POST | `/ticket/create` | yes | `{title,description,priority,projectId}` | `201 TicketDto` |
| PUT | `/ticket/TicketUpdate/{id}` | yes | `{title,description,priority,projectId}` | `200 TicketDto` |
| PATCH | `/ticket/{id}/status` | yes | `{status}` | `200 TicketDto` |
| PATCH | `/ticket/{id}/assign` | yes | `{assigneeId}` (null to unassign) | `200 TicketDto` |
| DELETE | `/ticket/DeleteTicket/{id}` | yes | — | `204` |

- `status` ∈ `PENDING | OPEN | EXECUTED | FINISHED`
- `priority` ∈ `LOW | MEDIUM | HIGH | URGENT` (normalise on the server; accept any case)
- `create` auto-assigns the least-busy `AGENT` if one exists, otherwise leaves `assignedTo` null.
- `create` returns the created ticket — **never null**.

## Comments

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| GET | `/ticket/{id}/comments` | yes | — | `CommentDto[]` oldest first |
| POST | `/ticket/{id}/comments` | yes | `{content}` | `201 CommentDto` |

`CommentDto` = `{ id, ticketId, content, authorId, authorName, createdAt }`

## Stats

| Method | Path | Auth | Response |
|---|---|---|---|
| GET | `/ticket/stats` | yes | see below |

```json
{
  "total": 24,
  "unassigned": 3,
  "byStatus":   { "PENDING": 1, "OPEN": 12, "EXECUTED": 6, "FINISHED": 5 },
  "byPriority": { "LOW": 4, "MEDIUM": 11, "HIGH": 7, "URGENT": 2 },
  "myOpen": 4,
  "last7Days": [ { "date": "2026-11-03", "created": 3, "closed": 1 } ]
}
```

## Dev bootstrap (fresh database)

`DevDataSeeder` runs on the `dev` profile (`@Profile("dev")`, idempotent) and creates, if absent:

| User | Role | Password |
|---|---|---|
| `admin` | ADMIN | `SEED_ADMIN_PASSWORD` (default `admin123`) |
| `agent1` | AGENT | `SEED_AGENT_PASSWORD` (default `agent123`) |
| `agent2` | AGENT | `SEED_AGENT_PASSWORD` (default `agent123`) |

Plus one project, `Platform`. Override the passwords with env vars; never ship the defaults.

`application.properties` sets `spring.profiles.active=${SPRING_PROFILES_ACTIVE:dev}`, so a bare
`java -jar` is immediately usable. **A production deployment must set `SPRING_PROFILES_ACTIVE=prod`**,
which disables the seeder.

## Health & metrics

| Path | Auth |
|---|---|
| `/actuator/health` | public |
| `/actuator/health/liveness` | public |
| `/actuator/health/readiness` | public |
| `/actuator/prometheus` | public (scraped by Prometheus) |

## Error format

All 4xx/5xx return:
```json
{ "timestamp": "...", "status": 404, "error": "Not Found", "message": "Ticket 42 not found", "path": "/ticket/TicketDetails/42" }
```

| Code | When |
|---|---|
| 400 | validation failure |
| 401 | missing/invalid/expired token |
| 403 | authenticated but not allowed |
| 404 | entity missing |
| 409 | duplicate username or email |
| 500 | unexpected (never leak a stack trace) |

## Frontend rules

- Base URL: `NEXT_PUBLIC_API_URL || "/api"` (dev rewrite + ingress handle the rest).
- 401 anywhere → clear token, redirect to `/login`.
- Never send `role` in an update payload.
- The UI must not display data it cannot fetch: no hardcoded dashboards, agents, or metrics.
