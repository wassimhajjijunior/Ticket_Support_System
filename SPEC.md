# SPEC — Ticket Support System → DevOps Capstone

## Goal (one sentence)

Take the existing Spring Boot + Next.js ticket support system from a broken prototype to a working,
containerized, CI/CD-delivered, observable, GitOps-deployed application in one week, following
`devops-bootcamp-ticket-system.pdf`.

## Success criteria (each observable)

| # | Criterion | How it is observed |
|---|---|---|
| S1 | Repo is a monorepo with the 7 PDF folders | `ls` shows `app/ web/ docker/ .github/ terraform/ k8s/ monitoring/ docs/` |
| S2 | Backend builds and tests with no local database | `cd app && ./mvnw -B clean verify` → BUILD SUCCESS |
| S3 | Frontend typechecks, lints and builds | `cd web && npx tsc --noEmit && npm run lint && npm run build` → 0 errors |
| S4 | Auth actually works end to end | login returns a JWT; a protected endpoint returns 401 without it and 200 with it |
| S5 | Whole stack starts with one command | `docker compose -f docker/docker-compose.yml up` on a clean clone |
| S6 | CI blocks bad code and bad images | PR red on failing test / CRITICAL CVE; green on merge |
| S7 | CD publishes versioned, scanned images | GHCR has `sha-<short>` and `vX.Y.Z` tags for both images |
| S8 | Terraform applies and destroys cleanly | `terraform plan` valid; `terraform destroy` leaves the console empty |
| S9 | Helm installs the stack on kind | `helm install ticket ./k8s/chart` with probes, ingress, survives rolling update |
| S10 | Observability is live | `/actuator/prometheus` scraped; Grafana dashboard + ≥1 firing alert + SLO panel |
| S11 | GitOps self-heals | manual `kubectl edit` is reverted by Argo CD |
| S12 | README + demo video | Mermaid architecture diagram, "how to run", 3-minute video |

## Scope

**MUST**
- Fix the P0 code blockers that make the app non-functional (JWT, ticket create/update, security chain, build failures).
- PostgreSQL as the single database, run in Docker.
- Dockerfiles (non-root, multi-stage) + Compose for `api`, `web`, `db`.
- GitHub Actions CI (test, lint, typecheck, build) and CD (Trivy, GHCR, versioned tags).
- Actuator + Micrometer; custom ticket metrics.
- Kubernetes manifests + Helm chart with probes, ingress, resources.
- Prometheus + Grafana + Alertmanager; JSON logs with correlation ID; 2 SLOs.
- Argo CD GitOps application.
- Terraform modules (network, database, compute) written and validated; LocalStack accepted until an AWS account exists.

**SHOULD**
- Flyway migrations with a baseline; `ddl-auto=validate`.
- Bean Validation, global error handler, pagination, indexes.
- Loki + Alloy log aggregation.
- Sealed Secrets, NetworkPolicies, `runAsNonRoot`.
- Seed data (ADMIN + AGENTs + default project) on the `dev` profile.

**WON'T (this week)**
- Native mobile, i18n, payment, email delivery.
- Multi-tenant isolation.
- Real AWS spend (no account yet) beyond LocalStack.
- Distributed tracing (OpenTelemetry/Tempo) — listed as "after the week".
- Rewriting the UI design. Frontend work is limited to correctness + production-readiness.

## Verification commands

```powershell
# Backend
cd app; .\mvnw.cmd -B clean verify

# Frontend
cd web; npx tsc --noEmit; npm run lint; npm run build

# Stack
docker compose -f docker/docker-compose.yml config
docker compose -f docker/docker-compose.yml up -d --build

# Kubernetes
helm lint k8s/chart
helm template ticket k8s/chart

# Terraform
cd terraform; terraform fmt -check -recursive; terraform validate

# Smoke
curl http://localhost:8080/actuator/health
curl http://localhost:8080/actuator/prometheus
```

## Stack decision

| Decision | Choice | Why |
|---|---|---|
| Repo layout | Monorepo at `Stage1/` root | PDF assumes `ticket-system/app`; one CI, one Helm chart, one Argo app. Nested `.git` dirs archived to `_archive/git-history/`. |
| Database | **PostgreSQL**, in Docker | PDF assumes Postgres (RDS, StatefulSet, `pg_dump`). MySQL-only `function('RAND')` must be replaced. |
| Backend | Keep Spring Boot 3.5.3 / Java 21 | Already built; Java 21 LTS is the right runtime. |
| JWT | Upgrade JJWT 0.9.1 → **0.12.6** | 0.9.1 needs `javax.xml.bind`, removed in Java 11+ → login throws on Java 21. |
| Frontend | Keep Next.js 15 / React 19 / Tailwind v4 | Already built; add `output: "standalone"`. |
| AWS | Terraform written now, **LocalStack** until account exists | User has no AWS account yet. Modules stay provider-agnostic so the switch is one variable. |
| Secrets | Env vars now → Sealed/External Secrets in k8s | Never commit `application.properties` credentials. |

## Constraints

- One week, ~10 h/day. Day 1 is code hardening and is **not** in the PDF.
- Never commit secrets. Never use the AWS root user.
- Destroy cloud resources at the end of every session.
