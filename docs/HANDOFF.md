# Handoff — what works, where it lives, how to prove it

Written for the moment you take over the roadmap yourself. Everything below was executed against the
Docker stack at commit `c38339c` — the outputs are real, not expected values.

---

## 1. Run it

```powershell
cd C:\Users\LENOVO\Desktop\HelloWorld\Stage\Stage1

# first run, or after code changes
docker compose -f docker/docker-compose.yml up -d --build

# check
docker compose -f docker/docker-compose.yml ps
```

Expect:

```
api  Up (healthy)  0.0.0.0:8080->8080/tcp
db   Up (healthy)  0.0.0.0:55432->5432/tcp
web  Up (healthy)  0.0.0.0:3000->3000/tcp
```

Open **http://localhost:3000** → `admin` / `admin123`.
Stop with `docker compose -f docker/docker-compose.yml down` (add `-v` to wipe the database).

---

## 2. Prove each layer (copy-paste, in order)

### Infrastructure

```powershell
Invoke-WebRequest http://localhost:8080/actuator/health       | Select StatusCode   # 200
Invoke-WebRequest http://localhost:8080/actuator/prometheus   | Select StatusCode   # 200
Invoke-WebRequest http://localhost:3000/login                 | Select StatusCode   # 200
Invoke-WebRequest http://localhost:3000/api/actuator/health   | Select StatusCode   # 200
```

The fourth is the important one: it proves the Next.js `/api` rewrite reaches the API container by
service name, not through `localhost`.

### Auth

```powershell
$body  = @{username='admin';password='admin123'} | ConvertTo-Json
$login = Invoke-WebRequest http://localhost:3000/api/auth/login -Method Post -ContentType 'application/json' -Body $body
$token = ($login.Content | ConvertFrom-Json).token
$auth  = @{ Authorization = "Bearer $token" }
Invoke-WebRequest http://localhost:3000/api/user/me -Headers $auth | Select StatusCode   # 200

# and the negative case — no token
Invoke-WebRequest http://localhost:3000/api/ticket/allTickets -SkipHttpErrorCheck | Select StatusCode  # 401
```

### Data flow

```powershell
$proj = ((Invoke-WebRequest http://localhost:3000/api/project/allProjects -Headers $auth).Content | ConvertFrom-Json)[0]
$new  = @{ title='My ticket'; description='Testing'; priority='high'; projectId=$proj.id } | ConvertTo-Json
$t    = (Invoke-WebRequest http://localhost:3000/api/ticket/create -Method Post -ContentType 'application/json' -Headers $auth -Body $new).Content | ConvertFrom-Json

$t.id, $t.status, $t.assignedToName, $t.projectName     # id, OPEN, agent assigned automatically, Platform
```

Recorded on this machine: `create → 201, id=2, OPEN, assignee=agent2, project=Platform`.
Comment `201`, status→`FINISHED` `200`, assign `200`, `stats → total=2 finished=1`.

### Pages

With the `token` cookie set, `/`, `/AllTickets`, `/AllTickets/{id}`, `/Clients`, `/Agents`, `/Settings`
all returned **200**; unauthenticated `/` returns **307** to `/login?from=%2F`.

### Tests

```powershell
cd app;  .\mvnw.cmd -B clean verify     # 4 unit + 30 integration, H2, no database needed
cd web;  npx tsc --noEmit; npm run lint; npm run build
```

Use `clean` on the backend. A plain `verify` can reuse classes written by your IDE's Java language
server, which does not run Lombok — that produces a confusing `Unresolved compilation problems` error
that has nothing to do with the source.

---

## 3. Code map — where each thing is implemented

### Backend (`app/src/main/java/com/support_tickets/demo/`)

| Concern | File | Look for |
|---|---|---|
| Security rules | `Config/SecurityConfig.java` | stateless chain, `anyRequest().authenticated()`, JWT filter, JSON 401/403 handlers |
| Token issuing | `security/JwtUtil.java` | `Keys.hmacShaKeyFor`, fails fast under 32-byte secret |
| Token reading | `security/JwtAuthFilter.java` | bad token → continue unauthenticated, never 500 |
| Roles | `security/CustomUserDetailsService.java` | `ROLE_<role>` mapping |
| Error shape | `exception/GlobalExceptionHandler.java` | 400 / 401 / 403 / 404 / 409 / 500, no stack traces |
| Ticket rules | `service/TicketService.java` | create + auto-assign, status transition, assign, stats |
| Aggregates | `repository/TicketRepository.java` | JPQL counts and the 7-day series |
| Dev data | `Config/DevDataSeeder.java` | `@Profile("dev")`, idempotent, admin/agent1/agent2/Platform |
| Schema | `src/main/resources/db/migration/V1__baseline.sql` | Flyway baseline; `ddl-auto=validate` |
| Config | `src/main/resources/application*.properties` | every value is `${ENV:default}` |

### Frontend (`web/`)

| Concern | File | Look for |
|---|---|---|
| API client | `app/utils/api.ts` | baseURL `/api`, JWT header, 401 → logout |
| Route guard | `middleware.ts` | cookie check, public paths, `?from=` |
| Design tokens | `app/globals.css` | colour/type/radius/shadow variables |
| UI kit | `components/ui/kit/` | Button, Card, StatusPill, Table, Modal, Field… |
| Shell | `components/layout/` | sidebar, topbar, mobile nav |
| Dashboard | `components/dashboard/` | KPIs from `/ticket/stats`, chart, recent tickets |
| Ticket queue | `components/tickets/TicketQueueView.tsx` | filters, table→cards, create modal |
| Ticket detail | `components/tickets/TicketDetailView.tsx` | status select, assignee select, edit, delete, comments |

### Delivery

| Concern | File |
|---|---|
| API image | `docker/Dockerfile.api` — multi-stage, layered JAR, non-root, healthcheck |
| Web image | `docker/Dockerfile.web` — Next standalone, non-root |
| Stack | `docker/docker-compose.yml` — healthcheck-gated startup |
| CI | `.github/workflows/ci.yml` — path-filtered backend/frontend jobs |
| CD | `.github/workflows/cd.yml` — GHCR push + Trivy report/gate |
| Contract | `docs/api-contract.md` |
| Book | `book/chapters/01-docker.md`, `book/chapters/02-cicd.md`, `book/interview/` |

---

## 4. What is verified, and what is not

**Verified on this machine**

- 4 unit + 30 integration tests green (`clean verify`)
- frontend typecheck, lint and production build green
- all three containers healthy from a clean rebuild
- auth, ticket create, detail, comment, status change, assignment, stats — over HTTP through the
  Next.js proxy
- UI interaction (status + assignment persisted) driven through headless Chrome
- CI green on every push; CD green, images published and pulled back

**Not verified / deliberately left to you**

- no automated UI tests
- Terraform, Kubernetes, Helm, Argo CD — not started
- observability is only the `/actuator/prometheus` endpoint; no Grafana, alerts or SLOs
- Trivy reports 3 CRITICAL (api) + 1 CRITICAL (web); the gate is advisory, not blocking
- branch protection is not enabled, so CI is not yet enforced on `main`

---

## 5. Gotchas that will cost you an hour each

| Symptom | Cause | Fix |
|---|---|---|
| Browser login fails with `Invalid CORS request` | dev server not on `:3000`; API allows only that origin | run `npm run dev -- -p 3000`, or change `CORS_ALLOWED_ORIGINS` |
| `Unresolved compilation problems` in tests | IDE wrote Lombok-less classes into `target/classes` | `mvnw clean verify` |
| `.next` errors after switching dev/build | both share `.next` | delete `.next` between `next dev` and `next build` |
| Can't connect to DB on 5432 | a native PostgreSQL owns 5432 and 5433 | use 55432, or `DB_HOST_PORT` |
| Demo accounts exist after deploy | `SPRING_PROFILES_ACTIVE` defaults to `dev` | set it to `prod` |
| `docker compose up` fails on web | port 3000 already taken by a local `next dev` | stop the local server |

---

## 6. Your next steps

The rest of the roadmap is yours. Tooling status: `kubectl` and `k6` are installed; **terraform, helm and
kind are not**.

| Day | Task | Start with |
|---|---|---|
| 4 | Terraform (network, database, compute) | install terraform; use LocalStack until you have an AWS account |
| 5 | Kubernetes + Helm | install kind + helm; `kind create cluster`, then a Helm chart from the compose services |
| 6 | Observability | kube-prometheus-stack, custom `tickets_created_total` metric, Grafana dashboards |
| 7 | GitOps | Argo CD against this repo; branch protection once you work through PRs |

Two things will make that work easier, and I have not done them because they change how you work:

1. **Branch protection on `main`** — required CI checks. It will block direct pushes, so enable it when
   you move to PRs.
2. **Hard CRITICAL gate** — flip `continue-on-error: false` on the Trivy gate step in `cd.yml` once the
   4 remaining CRITICALs are cleared.
