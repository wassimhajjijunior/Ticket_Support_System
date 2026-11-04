# PROGRESS — Ticket Support System → DevOps Capstone

Plan: `SPEC.md` · Dated 7-day roadmap: `docs/ROADMAP.md`
Mode: enterprise / one-week bootcamp · Started 2026-11-03

## Milestones

| Day | Milestone | Status |
|---|---|---|
| 0 | Monorepo + tooling + AWS plan | ✅ done |
| 1 | Code hardening: both apps build, auth works | ✅ done |
| 2 | Docker + Compose (api, web, postgres) | ⬜ |
| 3 | CI/CD: GitHub Actions, Trivy, GHCR | ⬜ |
| 4 | Terraform (network, database, compute) + LocalStack | ⬜ |
| 5 | Kubernetes + Helm on kind | ⬜ |
| 6 | Observability: Prometheus, Grafana, alerts, SLOs | ⬜ |
| 7 | GitOps (Argo CD), security, README, demo video | ⬜ |

## 2026-11-03 — Day 0 (preparation)

Done:
- Restructured into a monorepo at the `Stage1/` root: `app/` (Spring Boot, was `support-tickets/`),
  `web/` (Next.js, was `ticket_support/`), plus `docker/ .github/workflows/ terraform/ k8s/ monitoring/ docs/`.
- Archived 6 nested `.git` directories to `_archive/git-history/` (was: `app/.git`,
  `app/src/main/.git`, `app/src/main/java/.git`, `app/.../controller/.git`, `app/target/classes/.git`,
  `web/.git`). `target/classes/.git` would have shipped git objects inside the Docker image.
- Wrote root `.gitignore` (build output, env files, terraform state, `_archive/`).
- Wrote `SPEC.md` (goal, 12 success criteria, MUST/SHOULD/WON'T, verification commands, stack decisions).
- Confirmed decisions: monorepo · PostgreSQL in Docker · Terraform now + LocalStack until an AWS account exists.

Verified:
- `Get-ChildItem` → root contains `app web docker .github terraform k8s monitoring docs _archive SPEC.md .gitignore`.
- `Get-ChildItem -Recurse -Filter .git` → only the root `.git` + one archived copy.
- Backend baseline: `npx tsc` N/A; `mvnw` not yet run. Frontend baseline: `npx tsc --noEmit` → **7 errors**, exit 2.

Blocked: none.

Next: Day 1 — two parallel lanes (backend P0 hardening in `app/`, frontend P0 hardening in `web/`).

## 2026-11-03 — Day 1 (frontend lane, `web/`)

Done:
- `components/Type/Ticket.tsx` — added `Priority` type + `normalizePriority()`; DTO fields `status/priority/createdAt/updatedAt`.
- `components/Allticket.tsx:78`, `components/Dashbord.tsx` — normalized priorities (fixes the TS2322 errors); `==` → `===`; clickable rows got `role/tabIndex/onKeyDown`.
- `components/ui/UpdateTicketForm.tsx` — builds a complete `Ticket`; dropped the nonexistent `time`/`assignee` writes.
- `app/Clients/page.tsx` — lowercase `page` → `ClientsPage` (fixes the react-hooks error).
- `app/utils/api.ts` — `baseURL: NEXT_PUBLIC_API_URL || "/api"`, `timeout: 15000`, 401 interceptor clears token+cookie and redirects (loop-guarded).
- `app/login/page.tsx` — real `POST /auth/login` → token in localStorage + `token` cookie → `router.push("/")`; inline errors, no `alert()`.
- `components/ui/profile/ProfileDetail.tsx` — real logout; `/me.jpg` absolute.
- `middleware.ts` — new cookie guard, redirects to `/login?from=…`, matcher excludes `api`, `_next`, static assets.
- `next.config.ts` — `output: "standalone"` + `/api/:path*` → `API_ORIGIN`.
- `.env.example` added; `.gitignore:34-35` `.env*` + `!.env.example`.
- Debug residue removed (`console.log`, `alert`), unused imports pruned, `alt`/`htmlFor`/`aria-label` added.

Verified (re-run by orchestrator, not trusted from the lane):
- `npx tsc --noEmit --incremental false` → exit 0, no diagnostics.
- `npm run lint` → `✔ No ESLint warnings or errors`, exit 0.
- `npm run build` → exit 0; 8 routes prerendered; `ƒ Middleware 33.4 kB`.
- `.next/standalone` present, `.next/BUILD_ID = 8PmIuGAMrz72GMC-zqo21` → real production artifact.
- `Select-String .gitignore -Pattern '\.env'` → `34: .env*` then `35: !.env.example` (correct order).

Not verified: the browser login round-trip (needs both services up — Day 2).

Blocked: none.

## 2026-11-03 — Day 1 (backend lane, `app/`)

Done:
- `pom.xml` — JJWT 0.9.1 (single artifact, `javax.xml.bind`, dead on Java 21) → `jjwt-api`/`jjwt-impl`/`jjwt-jackson` **0.12.6**; MySQL driver removed, PostgreSQL + Actuator + Micrometer-Prometheus + Flyway added; `maven-failsafe-plugin` for `*IT` tests.
- `security/JwtUtil` rewritten for the 0.12.6 API; secret/expiry from properties; **fails fast if the secret is <32 bytes**.
- `security/JwtAuthFilter` — malformed/expired tokens are caught, logged WARN, request continues unauthenticated. No more 500 on bad tokens.
- `Config/SecurityConfig` — `@EnableMethodSecurity`, stateless, CORS applied, `addFilterBefore(jwt)` live, `anyRequest().authenticated()`, 401 entry point; all commented-out dead code deleted.
- `Config/WebConfig` — single property-driven CORS (`app.cors.allowed-origins`); duplicate removed.
- `security/CustomUserDetailsService` — `User.role` → `ROLE_<role>`, `ROLE_USER` default.
- `security/SecurityUtil` — rejects anonymous principals.
- `mapper/TicketFormMapper` — `return null` removed (create-ticket now returns a body); `getById` → `findById().orElseThrow()`.
- `service/TicketService` — user-id-1 impersonation removed, null-safe auto-assign, `updateTicket` now loads the real `Project`, mutates the managed entity and saves; `@Transactional` on all mutations.
- `service/AuthService` — registration assigns `Role.USER` (was null).
- `repository/UserRepository` — `function('RAND')` → `function('random')` (PostgreSQL-safe).
- `application.properties` — fully env-var driven (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`, `SERVER_PORT`); Actuator + probes + graceful shutdown; `open-in-view=false`.
- New `application-dev/prod/test.properties`; `db/migration/V1__baseline.sql` (PostgreSQL DDL + 4 indexes).
- New `JwtUtilTest` (3), `AuthFlowIT` (4, MockMvc), `contextLoads` pinned to the `test` profile.
- `docker/docker-compose.dev.yml` (PostgreSQL only) + `app/.dockerignore`.

Verified:
- `.\mvnw.cmd -B clean verify` → **BUILD SUCCESS**, exit 0; surefire 4 + failsafe 4, 0 failures.
- Live smoke against real PostgreSQL 16 in Docker on port 55432:
  - `/actuator/health` → **UP**; Flyway `Successfully applied 1 migration … now at version v1`
  - `POST /auth/register` → **200**
  - `POST /auth/login` → **200**, 137-char JWT
  - `GET /ticket/allTickets` no token → **401**
  - `GET /ticket/allTickets` + Bearer → **200**
  - `GET /user/all` no token → **401** (PII no longer public)
  - `GET` with malformed token → **401** (not 500)
  - `GET /actuator/prometheus` → **401** ← see Known issues #1

Blocked: none.

## Known issues carried forward

1. **`/actuator/prometheus` returns 401.** Security permits `/actuator/health/**` and `/actuator/info` but not `/actuator/prometheus`. Must be reachable for Prometheus scraping → either permit it and rely on NetworkPolicy/ServiceMonitor isolation, or move management to a separate port. **Blocks Day 6.**
2. **Token cookie is not `httpOnly`** (`web/app/login/page.tsx`), so it is XSS-readable. Correct fix: a Next route handler (BFF) that sets an httpOnly cookie and proxies `/api`. Deferred, not forgotten.
3. **`users.email` is not UNIQUE** — the entity only marks `username` unique, so duplicate emails are possible. Needs an entity change + migration.
4. **Native PostgreSQL on this dev machine owns 5432 *and* 5433 on IPv4.** Docker published columns look correct but the Java driver reaches the host server and fails auth. Dev compose therefore publishes on **55432**; override with `DB_HOST_PORT`. Inside compose/Kubernetes the URL is always `db:5432`.
5. **Browser end-to-end (login → middleware → ticket list) still unproven** — needs `api` + `web` running together, which is Day 2.
6. **No AWS account** → Terraform written against LocalStack; AWS CV bullet stays partial.
7. **Git index is stale.** The outer repo still tracks the old gitlink paths `support-tickets` and `ticket_support`, which no longer exist. Nothing has been committed. Reset the index before the first commit:
   `git rm --cached support-tickets ticket_support` then `git add -A`.

## Next up — Day 2

1. `docker/Dockerfile.api` — multi-stage (`maven:3.9-eclipse-temurin-21` → `eclipse-temurin:21-jre-alpine`), non-root UID, `-XX:MaxRAMPercentage=75`, layered JARs.
2. `docker/Dockerfile.web` — `node:22-alpine` → Next.js standalone, non-root.
3. `docker/docker-compose.yml` — `api` + `web` + `db` (+ Adminer), healthchecks, `depends_on: service_healthy`, `DB_URL=jdbc:postgresql://db:5432/ticketsupport`, `API_ORIGIN=http://api:8080`.
4. `.dockerignore` for both; `hadolint` both Dockerfiles.
5. Exit test: `docker compose up` from a clean clone → login works in a browser → ticket list loads.
6. Fix Known issue #1 (permit `/actuator/prometheus`) while wiring health checks.

## 2026-11-03 — Roadmap site (docs/)

Done:
- `docs/index.html` + `docs/style.css` + `docs/app.js` — a standalone, self-contained roadmap site.
  No framework, no build step, no CDN, no network requests; opens from `file://` by double-click.
- Direction: "field manual" — warm paper, serif body, mono metadata, one vermilion accent, inline SVG grain.
- Content is the full 7-day plan: goal, learn-first links, 57 checkable steps, 31 watch-out callouts,
  break-it lab, exit test with copy button, deliverable, cut ladder, S1–S12 criteria, resource index, log template.
- Tracking: `localStorage` key `devops-roadmap-v1`; Day 1 pre-seeded complete; per-day %, overall %
  and the "Do this now" panel all derive from one state.
- Motivation: live deadline countdown, sticky progress rail, scroll-linked timeline spine, day-completion
  celebration, 25/50/75/100 milestone pops, active day auto-opened.

Verified (Playwright, against a local static server and again over `file://`):
- 7 days rendered, 57 steps, Day 1 seeded at 5/5 → overall 9%.
- Clicking a step row: day 2 → 11%, overall → 11%; **survives reload** (6 checked).
- Keyboard: focusing `d2-s2` and pressing Space → 22%.
- Copy button → label flips to "Copied".
- `prefers-reduced-motion: reduce` → transition duration 1e-06s.
- 0 external requests, 0 console errors, 0 page errors.
- 390px viewport: `scrollWidth === clientWidth` (375), zero offenders.

Fixed during verification (real defects, not polish):
- The spine ran through the day numbers → spine and dot realigned to the 108px gutter.
- Step rows were not clickable end-to-end and the checkbox was 0×0 (unfocusable) → label now wraps
  the whole row, `minmax(0,1fr)` grid track, 1px focusable input.
- Horizontal overflow on mobile (512px) → `min-width:0` + `overflow-wrap: anywhere` on long tokens,
  resource table moved into a scroll container.
- Exit-test blocks printed literal backticks.
- Missing favicon caused a 404 on every load.

Note: a first attempt to delegate this to @designer errored without writing any file; the page was
built directly and verified in the browser instead.

Blocked: none.

Next: `docs/ROADMAP.md` stays the source of truth; the site mirrors it. Day 2 work is unchanged.

## 2026-11-03 — Roadmap site v2 "ORBITAL" (dark)

Done — replaced the light "field manual" page with a dark mission-telemetry dashboard:
- `docs/index.html` · `docs/style.css` · `docs/app.js` · `docs/plan-data.js` (content split out so the
  plan can be edited without touching the engine). No framework, no build, no CDN, no network.
- Direction: full-mono, near-black (`#05070a`), one signal teal (`#2de2c5`), CSS grid + vignette +
  inline SVG grain. Amber for alerts, red for the deadline, green for completed.
- **Constellation** (`<canvas>`): 7 day nodes on a ring around an OPS core. Completed days light green,
  the active day pulses teal, ring edges light up with the completed path, and a packet travels
  along it. Hover → pointer + highlight; click → scrolls to that day.
- **Trajectory chart** (inline SVG): cumulative progress polyline vs an even-pace diagonal, plus a
  "TODAY" marker and an "ahead / behind by N%" verdict computed from the real calendar.
- **Telemetry strip**: overall %, days, steps (57 micro-bars) and a live `dd:hh:mm:ss` countdown.
- Terminal-window day logs (`~/ops/day-02`, traffic-light chrome, LIVE/DONE/TODO chips), alert panels,
  copy-buttons, cut matrix, S-1..S-12 criteria, resource table.
- Tracking: `localStorage` key `orbital-roadmap-v1`; Day 1 pre-seeded complete.

Verified (Playwright):
- 7 days, 57 steps, 5 seeded, 9% overall, 0 console errors, 0 external requests.
- Click a step → 11%; reload → still 6 checked (persisted); keyboard Space → 12%.
- Canvas: 9216 non-transparent pixels drawn; hover sets `cursor:pointer`; clicking D1 scrolled to
  `scrollY 1990` with `day-1` exactly at viewport top.
- Trajectory: 2 polylines + 7 dots; with days 1–3 simulated done → 37% and "ahead by 23%".
- `prefers-reduced-motion: reduce` → canvas still painted, all transitions 1e-06s.
- No horizontal overflow at 1440 / 768 / 390 (390: 375 === 375).
- Copy button → "copied". Reset → restores exactly Day 1 (5 checked, 9%).
- Opens correctly over `file://` (dark bg, 7 days, chart rendered, no page errors).

Notes:
- The first delegation to @designer errored before writing any file; this version was built directly
  and verified in the browser. `docs/ROADMAP.md` remains the source of truth.

Blocked: none.

Next: unchanged — Day 2 (Dockerfiles + Compose).

## 2026-11-03 — Backend feature-complete + hardened

Contract frozen in `docs/api-contract.md`; `app/` now implements all of it.

Done:
- `TicketDto` enriched (`projectName`, `createdByName`, `assignedToId/Name`, `commentCount`) with
  `@EntityGraph(project, createdBy, assignedTo)` on the read paths — the ticket list no longer N+1s.
- New: `PATCH /ticket/{id}/status`, `PATCH /ticket/{id}/assign`, `GET|POST /ticket/{id}/comments`,
  `GET /ticket/stats` (JPQL aggregates, zero-filled maps, 7-day series), `GET /user/me`,
  `GET /user/agents`, `POST /project/create` (ADMIN).
- **Privilege escalation closed**: `PUT /user/{id}` is owner-or-ADMIN and ignores `role` for non-admins;
  `POST /user/admin/createUser` now carries `@PreAuthorize("hasRole('ADMIN')")`; the unvalidated
  `POST /user/create` (role injection, null password) was deleted along with its service/mapper path.
- Global `@RestControllerAdvice` with the contract error shape; Bean Validation activated on all request DTOs.
- `/actuator/prometheus` is public (unblocks Day 6 scraping).
- `DevDataSeeder` (`@Profile("dev")`, idempotent): `admin`/`admin123`, `agent1`+`agent2`/`agent123`,
  project `Platform`. `spring.profiles.active` defaults to `dev`; prod must set `SPRING_PROFILES_ACTIVE=prod`.
- 30 integration tests across `UserApiIT`, `TicketApiIT`, `CommentApiIT`, `StatsApiIT`, `DevDataSeederIT`,
  `AuthFlowIT` + 4 unit tests.

Verified (re-run by orchestrator): `app> .\mvnw.cmd -B clean verify` → **BUILD SUCCESS**, failsafe 30/30,
surefire 4/4, exit 0. Guard confirmed at `UserController.java:59`; `/user/create` confirmed removed;
seeder confirmed at `Config/DevDataSeeder.java:22`.

Live proof (lane): clean DB → seeder logs → `admin` login 200 → 2 agents → `Platform` → USER calling
`/user/admin/createUser` → **403** → `POST /ticket/create` → **201**, auto-assigned to `agent1`.

Blocked: frontend redesign waiting on the reference-site design analysis (`obs-2`).

Next: rebuild `web/` against the contract, then verify the full flow end to end.

## 2026-11-04 — Day 2 (Docker & Compose) + book started

Done:
- `docker/Dockerfile.api` — multi-stage (Maven → `eclipse-temurin:21-jre-alpine`), `tools` jarmode
  layered extraction, thin jar normalised to `app.jar`, non-root UID 1001, `MaxRAMPercentage=75`,
  `wget` healthcheck against `/actuator/health`, BuildKit cache mount for `~/.m2`.
- `docker/Dockerfile.web` — `node:22-alpine` deps → build → runtime, Next **standalone** output,
  `.next/static` + `public/` copied explicitly, non-root `nextjs`, `API_ORIGIN` as a **build arg**
  (rewrites compile into `routes-manifest.json`), npm cache mount.
- `docker/docker-compose.yml` — `db` / `api` / `web` (+ `adminer` under the `tools` profile), all three
  with healthchecks, `depends_on: condition: service_healthy` on both edges, container-internal
  `db:5432`, host DB port 55432.
- `docker/.env.example`, `web/.dockerignore`, rewritten `app/.dockerignore` (excludes `_archive` and `.git`).
- `book/` — the Build Book: `README.md` (8-section chapter format) + `chapters/01-docker.md`
  (annotated Dockerfiles, decisions, ready checklist, 5 fault-injection drills, 10 interview Q&As).

Verified:
- `docker compose build` → both images built, **no errors**. `relay-api` 429 MB, `relay-web` 336 MB.
- `docker compose up -d` → `api`, `db`, `web` all `(healthy)`.
- `GET :8080/actuator/health` → 200; `GET :3000/api/actuator/health` → 200 (rewrite works in-container);
  `GET :3000/login` → 200; `POST :3000/api/auth/login` (admin/admin123) → 200 + 131-char JWT;
  `GET :3000/api/ticket/stats` with that token → 200.
- Seeder confirmed inside the container: `Seeded dev user 'admin'`, `agent1`, `agent2`, `Seeded dev project 'Platform'`.
- Cross-container DNS confirmed: `web> wget -qO- http://api:8080/actuator/health` → `{"status":"UP",…}`.

Bug found and fixed during verification:
- First API container restart-looped with `Unable to access jarfile app.jar`. The `tools` jarmode emits a
  thin jar named after the Maven artifact next to `lib/`, not `app.jar`. Fixed with a `mv /app/*.jar /app/app.jar`
  step plus a `test -f` guard. Recorded in the book as a teaching case.

Blocked: none.

Next: book chapter 02 (CI/CD) after Day 3; phase-2 frontend wiring still pending.

## Failed approaches

(none yet)
