# 7-Day DevOps Roadmap — Ticket Support System

**Start:** Tue 3 Nov 2026 · **End:** Mon 9 Nov 2026
**Source guide:** `devops-bootcamp-ticket-system.pdf` (7-day program), adapted to **two services** (Spring Boot API + Next.js web) and to what is already built.
**Live status:** this file is the single source of truth. Update the status column daily.

Legend: ✅ done · 🟡 partial · ⬜ todo

---

## Progress snapshot

| Day | Date | Theme | Status | Proof |
|---|---|---|---|---|
| 1 | Tue 3 Nov | Foundations + code repair | ✅ | `mvn verify` BUILD SUCCESS (8 tests) · `tsc`/`lint`/`build` 0 · live auth smoke passed |
| 2 | Wed 4 Nov | Docker + Compose | ⬜ | `docker compose up` → login in a browser |
| 3 | Thu 5 Nov | CI/CD | ⬜ | red/green pipeline + GHCR images |
| 4 | Fri 6 Nov | Terraform + LocalStack | ⬜ | `terraform validate` + full plan |
| 5 | Sat 7 Nov | Kubernetes + Helm | ⬜ | `helm install` survives a rolling update |
| 6 | Sun 8 Nov | Observability | ⬜ | Grafana dashboard + firing alert + SLO |
| 7 | Mon 9 Nov | GitOps + security + capstone | ⬜ | Argo CD self-heals + demo video |

**Overall: ~15%** (Day 1 of 7). Two of the twelve success criteria in `SPEC.md` are met: S2 (backend builds/tests) and S3 (frontend builds).

---

## How to run each day

| Block | Time | What |
|---|---|---|
| Learn | 1.5–2 h | Read/watch the "Learn first" list **before** touching the keyboard. Take notes in your own words. |
| Build | 5–6 h | Follow the numbered steps. Commit after each numbered step, not at the end. |
| Break it | 45–60 min | The deliberate-failure lab. This is where the learning actually happens. |
| Write | 45 min | Fill `docs/daily/dayN.md` + update the status table above. |

**Rules that make the week survivable**
1. Stuck > 45 minutes → write the blocker in `docs/daily/dayN.md`, move on, come back.
2. One commit per numbered step. The git history *is* the deliverable.
3. At the end of each day: `docker compose down`, `terraform destroy`, check the AWS billing page.
4. If you finish early, do that day's **stretch** step — do not start the next day.
5. Never debug from memory. `describe` / `logs` / `journalctl` / `curl -v` first.

---

# Day 1 — Tue 3 Nov — Foundations + code repair ✅ DONE

**Goal:** a project that actually builds, tests, and authenticates.

### Done
- Monorepo at the repo root: `app/ web/ docker/ .github/ terraform/ k8s/ monitoring/ docs/`; 6 nested `.git` dirs archived to `_archive/`.
- Backend: JJWT 0.9.1 → **0.12.6** (login was dead on Java 21), security chain enabled (`401` without token / `200` with), ticket create+update bugs fixed, MySQL → **PostgreSQL** with a Flyway baseline, Actuator + Prometheus, config from env vars, **8 tests green**.
- Frontend: 7 TS + 12 ESLint errors fixed, real `POST /auth/login`, `middleware.ts` route guard, `output: "standalone"`, `/api` base URL + dev rewrite.
- Live smoke against real PostgreSQL: health **UP**, Flyway v1 applied, register **200**, login **200** (137-char JWT), `/ticket/allTickets` → **401** without token / **200** with, `/user/all` → **401** (PII closed), malformed token → **401** not 500.

### Your 30-minute tasks (tonight)
1. `docker --version` · `kind --version` · `helm version` · `terraform -version` · `aws --version` · `k6 version` — install whatever is missing.
   - Search: `install kind kubernetes windows`, `install helm windows choco`, `install k6 windows`.
2. Create the AWS account **only if** you have a card to spare; set a **$5 billing alert** immediately and create an IAM admin user. If not, skip — Day 4 runs on LocalStack.
3. Reset the stale git index (nothing is committed yet):
   ```powershell
   git rm --cached support-tickets ticket_support
   git add -A
   git commit -m "chore: monorepo restructure + day 1 hardening"
   ```
4. Skim `SPEC.md` and the known issues list in `PROGRESS.md` — you will hit #1 and #2 later this week.

### Watch out
- Your machine's native PostgreSQL owns **5432 and 5433** on IPv4. The dev DB publishes on **55432**. Override with `DB_HOST_PORT` if you ever change it.
- Nothing is committed yet — do not start Day 2 with an uncommitted tree.

---

# Day 2 — Wed 4 Nov — Docker & Compose

**Goal:** `docker compose up` on a clean machine brings up API + web + Postgres, and login works in a browser.

### Learn first
- **"Best practices for writing Dockerfiles"** — docs.docker.com/build/building/best-practices/
- **Spring Boot containers topicals** — spring.io/guides/topicals/spring-boot-docker/
- **Next.js `output: standalone`** — nextjs.org/docs/app/api-reference/config/next-config-js/output
- Video: *TechWorld with Nana — Docker Tutorial for Beginners* (search: `techworld with nana docker full course 2026`)
- Video: *Bret Fisher — Spring Boot + Docker multi-stage* (search: `spring boot multi stage dockerfile eclipse temurin layered jar`)
- Search terms: `spring boot 3.5 layered jar tools jarmode`, `next.js standalone docker multistage`, `distroless vs alpine jre`

### Steps
1. **`docker/Dockerfile.api`** — stage 1 `maven:3.9-eclipse-temurin-21` runs `./mvnw -B -DskipTests package`; stage 2 `eclipse-temurin:21-jre-alpine`.
   - Extract layers: `java -Djarmode=tools -jar app.jar extract --layers --destination extracted` (Boot 3.3+ uses `tools`, **not** the old `layertools`).
   - `COPY` each layer in order (`dependencies` → `spring-boot-loader` → `snapshot-dependencies` → `application`).
   - `RUN addgroup -S app && adduser -S -G app -u 1001 app` then `USER 1001`.
   - `ENTRYPOINT ["java","-XX:MaxRAMPercentage=75","-jar","app.jar"]` — **no hardcoded `-Xmx`**.
2. **`docker/Dockerfile.web`** — stage 1 `node:22-alpine` runs `npm ci && npm run build`; stage 2 copies `.next/standalone`, `.next/static` **and** `public/`, then `USER` non-root.
3. **`.dockerignore`** in `app/` and `web/`.
4. **`docker/docker-compose.yml`** — services `api`, `web`, `db`, `adminer`.
   - `db`: `postgres:16-alpine`, `POSTGRES_DB/USER/PASSWORD`, `ports: ["${DB_HOST_PORT:-55432}:5432"]`, named volume, `pg_isready` healthcheck.
   - `api`: `build: { context: ../app, dockerfile: ../docker/Dockerfile.api }`, `DB_URL=jdbc:postgresql://db:5432/ticketsupport`, `JWT_SECRET` from `.env`, healthcheck, `depends_on: db: { condition: service_healthy }`.
   - `web`: build arg `API_ORIGIN=http://api:8080`, `depends_on: api`.
5. **`.env.example`** at the repo root + `docker/.env` (gitignored).
6. Fix **known issue #1**: add `/actuator/prometheus` to the permitted paths in `SecurityConfig` (it currently returns 401).
7. `hadolint` both Dockerfiles.

### Watch out (this is the day that usually goes wrong)
- **`.dockerignore` is not optional.** Without it, `target/`, `node_modules/` and `_archive/` go into the build context — slow builds and a leaked git history.
- **Next.js standalone does not include `public/` or `.next/static`.** Forgetting them gives a site with no CSS and 404 images.
- **`API_ORIGIN` is baked in at build time**, not read at container start — `next.config` rewrites are compiled into `.next/routes-manifest.json`. Pass it as a **build arg**, and verify with `docker compose exec web env`. (In Kubernetes this stops mattering because ingress-nginx routes `/api` itself.)
- **JRE Alpine has no `curl`.** Use `wget -qO- http://localhost:8080/actuator/health` in the healthcheck, or install curl and accept the bigger image.
- **Flyway runs at startup**, so the API will crashloop until `db` is healthy — that is what `depends_on … service_healthy` is for, not `sleep`.
- Docker Desktop on Windows: give it **≥6 GB RAM** now; Day 6 needs it.

### Exit test
```powershell
docker compose -f docker/docker-compose.yml config
docker compose -f docker/docker-compose.yml up -d --build
curl http://localhost:8080/actuator/health              # {"status":"UP"}
docker compose -f docker/docker-compose.yml exec web wget -qO- http://localhost:3000/api/actuator/health
# browser: http://localhost:3000/login → log in → /AllTickets loads
docker image ls --format "{{.Repository}} {{.Size}}"    # record both sizes
```

### Break it
Set `DB_PASSWORD=wrong`, then give `api` `mem_limit: 128m`. Read the logs and explain each failure before fixing.

### Deliverable
`docs/daily/day2.md`: before/after image sizes, the two failures and their root causes.

---

# Day 3 — Thu 5 Nov — CI/CD

**Goal:** a PR that cannot merge without tests passing, and a merge that produces scanned, versioned images.

### Learn first
- **GitHub Actions** — docs.github.com/en/actions (read "Workflow syntax" and "Using secrets")
- **`actions/setup-java`** README (for `cache: maven`)
- **Trivy** — trivy.dev/latest/docs/ (read "Filesystem scanning" and "Image scanning")
- Video: *TechWorld with Nana — GitHub Actions from Zero* (search: `github actions full course ci cd`)
- Search terms: `maven failsafe verify integration tests github actions`, `ghcr docker login-action metadata-action semver`
- Optional: **Conventional Commits** + **SemVer** — conventionalcommits.org, semver.org

### Steps
1. `.github/workflows/ci.yml` — two jobs with `dorny/paths-filter` so backend changes do not rebuild the frontend:
   - **backend:** `actions/checkout@v4`, `actions/setup-java@v4` (`temurin`, `21`, `cache: maven`), `chmod +x mvnw`, `./mvnw -B verify` (failsafe runs the ITs — `test` alone will not).
   - **frontend:** `actions/setup-node@v4` (`node-version: 22`, `cache: npm`), `npm ci`, `npx tsc --noEmit`, `npm run lint`, `npm run build`.
2. `.github/workflows/cd.yml` — on push to `main`: `docker/metadata-action` (tags `sha-<short>` + semver), `docker/build-push-action` (build args!), `aquasecurity/trivy-action` with `severity: CRITICAL,HIGH`, `exit-code: 1`, `ignore-unfixed: true`, then push to `ghcr.io/<you>/ticket-api` and `ticket-web`.
3. `permissions: { contents: read, packages: write }` on the CD job.
4. `.github/dependabot.yml` — 4 ecosystems: `maven`, `npm`, `docker`, `github-actions`. Group minor/patch.
5. Branch protection on `main`: require CI, require 1 review (self-review is fine for a solo repo — untick "include administrators" so you are not locked out).
6. Status badge in `README.md`.

### Watch out
- **`mvnw` loses its executable bit** on Linux runners. `chmod +x mvnw` or call `mvn` — otherwise "Permission denied".
- **Surefire ≠ Failsafe.** `./mvnw test` will not run `AuthFlowIT`. Use `verify`.
- **Base-image CVEs will fail your build** on day one. Trivy `ignore-unfixed: true` is the sane default; pin images by digest later.
- **GHCR paths must be lowercase** — your GitHub username may not be. Hardcode lowercase in `images:`.
- Branch protection only offers the check after the workflow has run once — push the CI file first, then protect.
- Frontend build in CI needs `API_ORIGIN` for the rewrite to be baked; pass a dummy (`http://api:8080`) — it is irrelevant at build time for the ingress path.

### Exit test
Push a deliberately failing test → CI red. Push a dependency with a known CRITICAL CVE → Trivy red. Revert both → green → both images appear in GHCR with two tags each.

### Break it
Merge a change that renames an endpoint the frontend calls. The pipeline stays green — **note that gap**: CI proves it builds, not that it works. That gap is what Day 5/7 tries to close.

### Deliverable
`docs/daily/day3.md` with the two screenshots (red run, green run) and the GHCR tag list.

---

# Day 4 — Fri 6 Nov — Terraform + LocalStack

**Goal:** the AWS-shaped environment is described in code, validated, and destroyable.

### Learn first
- **Terraform AWS get-started** — developer.hashicorp.com/terraform/tutorials/aws-get-started (do the S3-backend and variables pages)
- **AWS VPC basics** — docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html (subnets, route tables, IGW, SG)
- **LocalStack** — docs.localstack.cloud/ (read "supported services" before you plan)
- Video: *TechWorld with Nana — Terraform in 1 hour* (search: `terraform full course aws nana`)
- Search terms: `terraform s3 backend dynamodb lock`, `terraform module vpc two az`, `localstack terraform provider endpoint`

### Steps
1. `terraform/bootstrap/` — S3 state bucket (versioning, SSE, public-access-block) + DynamoDB table `LockID`. Local state for the bootstrap itself.
2. `terraform/network/` — VPC, 2 public subnets in 2 AZs, IGW, route table, SG for the app.
3. `terraform/database/` — RDS PostgreSQL `db.t3.micro`, `skip_final_snapshot = true`, `deletion_protection = false`, private subnets, SG allowing only the app SG.
4. `terraform/compute/` — EC2 `t3.micro`, IAM instance profile, user-data installing Docker, SG 80/443 + SSH from your IP only.
5. `variables.tf` / `outputs.tf` / `terraform.tfvars.example`. Credentials via `aws_secretsmanager_secret` or SSM — **never in `.tfvars`**.
6. `.github/workflows/terraform.yml` — `fmt -check`, `validate`, `tflint`, `plan` on PR. OIDC (`role-to-assume`) once you have an account; until then run it only locally.
7. **LocalStack path (no AWS account):** run `localstack start`, point the provider at `http://localhost:4566` with fake creds, and `terraform plan/apply` the **network + compute** modules. RDS on LocalStack free tier is unreliable — validate that module with `terraform validate` + `plan` against a stub.

### Watch out
- **Do not create a NAT Gateway.** ~$32/month plus data. Public subnets are fine for a bootcamp.
- RDS free tier is **single-AZ `db.t3.micro` / `db.t4g.micro`** only, and it refuses to destroy without `skip_final_snapshot = true`.
- S3 bucket names are **globally unique** — suffix with your initials and a random string.
- `terraform fmt -check` fails in CI on Windows CRLF. Add `.gitattributes` with `*.tf text eol=lf`.
- Never commit `terraform.tfstate` or `*.tfvars` (already in `.gitignore`).
- LocalStack free is **not** full AWS. Be honest in the write-up about what was planned vs actually applied — that distinction matters in an interview.
- Check the billing page every morning. `terraform destroy` every evening.

### Exit test
```powershell
terraform fmt -check -recursive
terraform validate
terraform plan -out tfplan        # shows VPC + subnets + SG + RDS + EC2
terraform destroy                 # leaves nothing behind
```

### Deliverable
`docs/daily/day4.md` with the full `plan` output summary and a cost table (what each resource would cost per day).

---

# Day 5 — Sat 7 Nov — Kubernetes + Helm

**Goal:** the whole stack runs on a local cluster from one `helm install`, survives a bad rollout, and scales.

### Learn first
- **Kubernetes Basics** — kubernetes.io/docs/tutorials/kubernetes-basics/
- **kind + ingress** — kind.sigs.k8s.io/docs/user/ingress/ (the `extraPortMappings` + `ingress-ready=true` label part)
- **Spring Boot health probes** — docs.spring.io/spring-boot/reference/actuator/endpoints.html (`liveness` / `readiness` groups)
- **Helm chart template guide** — helm.sh/docs/chart_template_guide/
- Video: *TechWorld with Nana — Kubernetes full course* (search: `kubernetes full course beginners nana`)
- Search terms: `kind ingress nginx extraPortMappings`, `spring boot startupProbe livenessProbe readinessProbe`, `helm checksum/config annotation rollout`

### Steps
1. `k8s/kind-config.yaml` — `extraPortMappings` 80→80, 443→443, node label `ingress-ready=true`. `kind create cluster --config`.
2. Install ingress-nginx + `kubectl apply -f .../provider/kind/deploy.yaml`.
3. **Deployment `api`** ×3 replicas: `startupProbe` (30 × 5 s), `livenessProbe` `/actuator/health/liveness`, `readinessProbe` `/actuator/health/readiness`, `resources.requests.cpu: 200m / memory: 512Mi`, `limits.memory: 768Mi`, `JAVA_TOOL_OPTIONS: -XX:MaxRAMPercentage=75`.
4. **Deployment `web`** ×2, Service, ConfigMap, Secret, **Postgres StatefulSet + `volumeClaimTemplates`** (learning only — production is RDS).
5. **Ingress `ticket.local`** — `/api` → `api:8080`, `/` → `web:3000`. Add `127.0.0.1 ticket.local` to `C:\Windows\System32\drivers\etc\hosts`.
6. `kubectl rollout undo` after a bad image tag. Install `metrics-server`, add HPA, run k6.
7. Convert to a Helm chart: `Chart.yaml`, `values.yaml`, `values-dev.yaml`, `values-prod.yaml`, `{{ .Values }}` everywhere, `checksum/config` annotations.

### Watch out
- **A short `initialDelaySeconds` on `livenessProbe` will CrashLoopBackOff a Spring Boot app.** Spring needs 20–40 s. Always add a `startupProbe` and let liveness take over after it.
- **JVM heap > container limit = OOMKilled.** Limits of `512Mi` mean the JVM must be told `MaxRAMPercentage`, not left to defaults.
- **`kindnet` does not enforce NetworkPolicy.** Anything you write on Day 7 is declarative-only unless you switch CNI to Calico. Say so honestly.
- HPA shows `<unknown>` until `metrics-server` is installed **and** `resources.requests.cpu` is set.
- Editing a ConfigMap does **not** restart pods. That is what the `checksum/config` annotation is for.
- `helm uninstall` deletes the PVC — your DB data goes with it.
- Windows `kind` + Docker Desktop: if `localhost:80` is taken by IIS/other, change the mapping to 8081.

### Exit test
```powershell
helm lint k8s/chart
helm upgrade --install ticket k8s/chart -n ticket --create-namespace -f k8s/chart/values-dev.yaml
curl http://ticket.local/api/actuator/health
kubectl get pods -n ticket                 # all Running
kubectl set image deploy/api api=ghcr.io/x/api:doesnotexist -n ticket   # then diagnose + rollback
```

### Break it
In order, without help: ImagePullBackOff, OOMKilled, failing readiness, wrong Service selector. Diagnose each using only `kubectl describe`, `kubectl logs`, `kubectl get events`.

### Deliverable
`docs/daily/day5.md` — the four failure diagnoses and the `kubectl` command that revealed each.

---

# Day 6 — Sun 8 Nov — Observability

**Goal:** you can answer "is it healthy, is it fast, and what broke?" without opening a terminal.

### Learn first
- **Micrometer + Actuator metrics** — docs.spring.io/spring-boot/reference/actuator/metrics.html
- **Prometheus getting started + PromQL basics** — prometheus.io/docs/prometheus/latest/getting-started/ and .../querying/basics/
- **kube-prometheus-stack README** — github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack
- **Google SRE Book ch. 4 (SLOs)** — sre.google/sre-book/service-level-objectives/
- **k6 docs** — grafana.com/docs/k6/latest/
- Video: *"Prometheus & Grafana for Spring Boot"* (search: `spring boot micrometer prometheus grafana dashboard tutorial`)
- Search terms: `micrometer percentiles-histogram http server requests`, `servicemonitor kube-prometheus-stack labels release`, `loki alloy kubernetes logs tutorial`

### Steps
1. Fix **known issue #1**: permit `/actuator/prometheus` (or move `management.server.port` to 8081 and expose only that). Verify `curl :8080/actuator/prometheus | head`.
2. Enable `management.metrics.distribution.percentiles-histogram.http.server.requests=true` — without it p95 is meaningless.
3. **Custom business metrics** in `TicketService`: `tickets_created_total` (Counter), `tickets_open` (Gauge, refresh on create/close), `ticket_resolution_seconds` (Timer). Use `MeterRegistry`, tag by `priority`.
4. `helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack -n monitoring`.
5. `ServiceMonitor` selecting the api Service, with `labels: { release: kube-prometheus-stack }`.
6. Grafana dashboards as ConfigMaps labelled `grafana_dashboard: "1"`, exported JSON into `monitoring/grafana/`. Panels: JVM heap/GC/threads, HTTP rate/errors/p95, Hikari pool, business metrics.
7. **Logs:** install Alloy (not Promtail — deprecated). Add a servlet `Filter` that puts a `correlationId` into MDC and into the `X-Request-Id` header, and include `%X{correlationId}` in the log pattern. Remove the MDC in `finally`.
8. `PrometheusRule`: error rate > 5 %, p95 > 500 ms, `KubePodCrashLooping`, memory > 90 %. Route to a `webhook.site` URL for the demo.
9. Two SLOs: 99.5 % availability, 95 % of requests < 500 ms. Recording rules + a Grafana stat panel.
10. `k6` load test; kill a pod mid-test and watch the alert fire.

### Watch out
- **`/actuator/prometheus` is 401 today** — nothing on this day works until that is fixed.
- **kube-prometheus-stack is heavy** (~2 GB). On a small Docker VM it will OOM the whole cluster. Raise Docker memory before installing.
- **ServiceMonitor is silently ignored** if the `release` label does not match the Helm release name. Check `kubectl get servicemonitor -n monitoring -o yaml`.
- **Default Micrometer buckets are too coarse** for a p95 under 500 ms — the histogram flag above is mandatory.
- **Never log emails, phones or tokens.** Your DTOs contain PII; mask before logging.
- Alertmanager needs a real webhook. If you use Slack/Discord, the payload shape differs — test with `webhook.site` first.
- `Timer` for resolution time only makes sense once tickets actually transition to `FINISHED` — today there is no status endpoint. Either add `PATCH /ticket/{id}/status` (30 min) or measure `time-to-assign` instead and say so.

### Exit test
Grafana shows live traffic while k6 runs → delete the api pod → `KubePodCrashLooping` fires within ~2 min → `/actuator/prometheus` returns 200 with `tickets_created_total`.

### Deliverable
`docs/daily/day6.md` + `docs/postmortem.md` (timestamped timeline, customer impact, root cause, one action item).

---

# Day 7 — Mon 9 Nov — GitOps, security, capstone

**Goal:** a commit reaches the cluster with no `kubectl apply`, and hand-edits are reverted.

### Learn first
- **Argo CD getting started** — argo-cd.readthedocs.io/en/stable/getting-started/
- **Sealed Secrets** — github.com/bitnami-labs/sealed-secrets (read the "How it works" diagram)
- **OWASP Kubernetes security cheat sheet** — cheatsheetseries.owasp.org
- **Trivy config scanning** — trivy.dev/latest/docs/scanner/misconfiguration/
- Video: *"Argo CD in 20 minutes"* (search: `argocd gitops tutorial hands on`)
- Search terms: `argocd application helm selfHeal prune`, `kubeseal sealed secrets controller`, `github actions update helm image tag`

### Steps
1. Install Argo CD on kind; `kubectl port-forward svc/argocd-server -n argocd 8080:443`; password from `argocd-initial-admin-secret`.
2. `Application` pointing at `k8s/chart` with `syncPolicy.automated: { prune: true, selfHeal: true }`.
3. Prove self-heal: `kubectl scale deploy/api --replicas=1 -n ticket` → Argo restores 3.
4. **Close the loop:** CD job updates `image.tag` in `values-dev.yaml` and commits; Argo deploys. Needs `permissions: contents: write` and a PAT if branch protection blocks the bot.
5. Install the sealed-secrets controller; replace plain Secrets with `SealedSecret`s; commit the sealed manifests.
6. Add `.trivyignore` only for documented exceptions. Add `trivy config k8s/` to CI.
7. `NetworkPolicy` + `securityContext: { runAsNonRoot: true, readOnlyRootFilesystem: true, allowPrivilegeEscalation: false }` (remember: kindnet does not enforce policies).
8. `values-staging.yaml` + `values-prod.yaml` + a manual approval `environment:` gate in CD.
9. **End-to-end:** edit a template, PR, merge → image → GHCR → Argo → Grafana shows the new pod.
10. `README.md` with a Mermaid architecture diagram, "how to run", and the CI/CD flow. Record a 3-minute video. Pin the repo.

### Watch out
- Argo CD compares **live vs git**, so any `kubectl edit` is drift — that is the feature, but it also means manual debugging edits vanish. Use `--dry-run` or a scratch namespace.
- Sealed Secrets are **cluster-bound**: re-seal after recreating the kind cluster, or nothing decrypts.
- If your CD job commits to a protected branch, it will fail. Use a PAT with bypass, or let Argo CD Image Updater pull instead.
- `readOnlyRootFilesystem: true` breaks the JVM unless `/tmp` is mounted as `emptyDir`.
- A "3-minute video" that shows slides instead of a live commit → cluster → dashboard is worth nothing. Record the real loop.

### Exit test
Run `kubectl edit deploy/api -n ticket` and change replicas → Argo reverts it. Merge a code change → new image → new pods → Grafana shows it.

### Deliverable
README + `docs/demo-script.md` + video link + updated CV bullets (they are in the PDF, page 11).

---

## If you fall behind — cut in this order

| Order | Cut | Keeps |
|---|---|---|
| 1 | Terraform depth → `network` + `compute` only | AWS story still demonstrable |
| 2 | Loki/Alloy → `kubectl logs -f` | Prometheus + Grafana + alerts + SLOs |
| 3 | HPA, k6, Adminer, cosign | everything that matters |
| — | **Never cut** | Docker · CI/CD · K8s+Helm · Prometheus/Grafana/alerts · Argo CD · README+video |

## Resource index

| Topic | Doc | Video / search |
|---|---|---|
| Dockerfiles | docs.docker.com/build/building/best-practices/ | `techworld with nana docker full course` |
| Spring Boot in containers | spring.io/guides/topicals/spring-boot-docker/ | `spring boot layered jar docker` |
| Next.js standalone | nextjs.org/docs/app/api-reference/config/next-config-js/output | `next.js docker standalone multistage` |
| GitHub Actions | docs.github.com/en/actions | `github actions full course ci cd` |
| Trivy | trivy.dev/latest/docs/ | `trivy container scanning github actions` |
| Terraform | developer.hashicorp.com/terraform/tutorials/aws-get-started | `terraform full course aws` |
| LocalStack | docs.localstack.cloud/ | `localstack terraform tutorial` |
| Kubernetes | kubernetes.io/docs/tutorials/kubernetes-basics/ | `kubernetes full course beginners` |
| kind ingress | kind.sigs.k8s.io/docs/user/ingress/ | `kind ingress nginx local` |
| Helm | helm.sh/docs/chart_template_guide/ | `helm chart tutorial from scratch` |
| Actuator/metrics | docs.spring.io/spring-boot/reference/actuator/metrics.html | `spring boot actuator prometheus grafana` |
| Prometheus | prometheus.io/docs/prometheus/latest/getting-started/ | `promql tutorial` |
| SRE / SLOs | sre.google/sre-book/service-level-objectives/ | `slo sli tutorial` |
| k6 | grafana.com/docs/k6/latest/ | `k6 load testing tutorial` |
| Argo CD | argo-cd.readthedocs.io/en/stable/getting-started/ | `argocd gitops hands on` |
| Sealed Secrets | github.com/bitnami-labs/sealed-secrets | `kubeseal tutorial` |
| Linux debugging | *The Linux Command Line* (free PDF) | `journalctl systemd tutorial` |

## Daily log template (`docs/daily/dayN.md`)

```markdown
# Day N — <date> — <theme>

## Done
-

## Verified
- <command> → <observed result>

## Broke / fixed
- Symptom:
- Root cause:
- Fix:
- How I found it:

## Learned in my own words


## Next
-
```
