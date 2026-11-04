/* ==========================================================================
   ORBITAL — plan data
   Single source of truth for the page. Edit this file to change the plan.
   ========================================================================== */

const META = {
  op: "OP. TICKET-SYSTEM",
  window: "03 — 09 NOV 2026",
  deadline: "2026-11-09T23:59:59",
  tagline: "Seven days from code to production."
};

const DAYS = [
  {
    n: 1, date: "Tue 3 Nov", theme: "Foundations & repair", path: "~/ops/day-01", done: true,
    goal: "A project that actually builds, tests, and authenticates.",
    learn: [],
    steps: [
      "Monorepo restructure with the seven folders; archive the six nested `.git` dirs",
      "Backend: JJWT 0.9.1 → 0.12.6, security chain enabled, ticket create/update fixed",
      "Backend: MySQL → PostgreSQL with a Flyway baseline (`V1__baseline.sql`)",
      "Backend: Actuator + Prometheus, config from env vars, 8 tests green",
      "Frontend: TS/ESLint clean, real login, `middleware.ts`, `output: \"standalone\"`"
    ],
    watch: [
      "Native PostgreSQL on this machine owns 5432 **and** 5433 on IPv4. The dev database publishes on **55432**; override with `DB_HOST_PORT`."
    ],
    breakIt: "Already done: a malformed token returns 401, not 500.",
    exit: "mvn verify BUILD SUCCESS · tsc + lint + build exit 0 · auth smoke passed",
    deliverable: "docs/daily/day1.md"
  },
  {
    n: 2, date: "Wed 4 Nov", theme: "Docker & Compose", path: "~/ops/day-02",
    goal: "docker compose up on a clean machine brings up API + web + Postgres, and login works in a browser.",
    learn: [
      { t: "Docker — best practices for writing Dockerfiles", h: "https://docs.docker.com/build/building/best-practices/" },
      { t: "Spring Boot — containers topicals", h: "https://spring.io/guides/topicals/spring-boot-docker/" },
      { t: "Next.js — output: standalone", h: "https://nextjs.org/docs/app/api-reference/config/next-config-js/output" },
      { t: "Watch — TechWorld with Nana, Docker full course", h: null }
    ],
    steps: [
      "Write `docker/Dockerfile.api` — Maven build stage → `eclipse-temurin:21-jre-alpine`",
      "Extract Spring Boot layers with `-Djarmode=tools` and `COPY` them in dependency order",
      "Run as non-root (UID 1001) and set `-XX:MaxRAMPercentage=75`",
      "Write `docker/Dockerfile.web` — `node:22-alpine` build → standalone runtime",
      "Copy `.next/standalone`, `.next/static` and `public/` into the web image",
      "Write `.dockerignore` for both `app/` and `web/`",
      "Write `docker/docker-compose.yml` with `api`, `web`, `db`, `adminer` and healthchecks",
      "Fix known issue #1: permit `/actuator/prometheus` in `SecurityConfig`",
      "Lint both Dockerfiles with `hadolint` and record image sizes"
    ],
    watch: [
      "`.dockerignore` is not optional. Without it `target/`, `node_modules/` and `_archive/` enter the build context and leak your git history.",
      "Next.js standalone does **not** include `public/` or `.next/static`. Forgetting them gives a site with no CSS and 404 images.",
      "`API_ORIGIN` is baked in at **build** time, not read at container start — `next.config` rewrites compile into `routes-manifest.json`. Pass it as a build arg.",
      "JRE Alpine has no `curl`. Use `wget -qO-` in healthchecks.",
      "Flyway runs at startup, so the API crashloops until Postgres is healthy — use `depends_on: service_healthy`, not `sleep`."
    ],
    breakIt: "Set `DB_PASSWORD=wrong`, then cap `api` at `mem_limit: 128m`. Explain each failure from the logs before fixing it.",
    exit: "docker compose up -d --build · curl :8080/actuator/health → UP · login at :3000 → /AllTickets loads",
    deliverable: "docs/daily/day2.md with before/after image sizes"
  },
  {
    n: 3, date: "Thu 5 Nov", theme: "CI/CD", path: "~/ops/day-03",
    goal: "A PR that cannot merge without tests, and a merge that produces scanned, versioned images.",
    learn: [
      { t: "GitHub Actions — workflow syntax & secrets", h: "https://docs.github.com/en/actions" },
      { t: "Trivy — filesystem & image scanning", h: "https://trivy.dev/latest/docs/" },
      { t: "actions/setup-java (cache: maven)", h: "https://github.com/actions/setup-java" },
      { t: "Watch — TechWorld with Nana, GitHub Actions", h: null }
    ],
    steps: [
      "Create `.github/workflows/ci.yml` with `dorny/paths-filter` splitting backend and frontend jobs",
      "Backend job: `setup-java@v4` (temurin, 21, `cache: maven`) + `./mvnw -B verify`",
      "Frontend job: `npm ci`, `tsc --noEmit`, `npm run lint`, `next build`",
      "Create `cd.yml`: `docker/metadata-action` tags + `build-push-action` to GHCR",
      "Trivy image scan on `CRITICAL,HIGH` with `ignore-unfixed` and `exit-code: 1`",
      "Add `dependabot.yml` for maven, npm, docker and github-actions",
      "Enable branch protection on `main` and put the badge in `README.md`"
    ],
    watch: [
      "`mvnw` loses its executable bit on Linux runners — `chmod +x mvnw` or call `mvn`.",
      "`./mvnw test` skips `AuthFlowIT`. Failsafe only runs on `verify`.",
      "Base-image CVEs will fail your first build. `ignore-unfixed: true` is the sane default.",
      "GHCR image paths must be lowercase — your GitHub username may not be.",
      "Branch protection only offers the check after the workflow has run once."
    ],
    breakIt: "Merge a change that renames an endpoint the frontend calls. CI stays green. That gap is exactly why Day 5 and Day 7 exist.",
    exit: "Failing test → red · CVE dependency → red · revert → green · two tags per image in GHCR",
    deliverable: "docs/daily/day3.md with the red run, the green run and the tag list"
  },
  {
    n: 4, date: "Fri 6 Nov", theme: "Terraform & LocalStack", path: "~/ops/day-04",
    goal: "The AWS-shaped environment is described in code, validated, and destroyable.",
    learn: [
      { t: "Terraform — AWS get started", h: "https://developer.hashicorp.com/terraform/tutorials/aws-get-started" },
      { t: "AWS — what is a VPC", h: "https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html" },
      { t: "LocalStack — supported services", h: "https://docs.localstack.cloud/" },
      { t: "Watch — TechWorld with Nana, Terraform in 1 hour", h: null }
    ],
    steps: [
      "`terraform/bootstrap/` — S3 state bucket (versioned, SSE, private) + DynamoDB `LockID`",
      "`terraform/network/` — VPC, 2 public subnets in 2 AZs, IGW, route table, security group",
      "`terraform/database/` — RDS PostgreSQL `db.t3.micro` with `skip_final_snapshot = true`",
      "`terraform/compute/` — EC2 `t3.micro`, IAM instance profile, user-data installing Docker",
      "Link the modules: SG-to-SG ingress, credentials from SSM / Secrets Manager",
      "`.github/workflows/terraform.yml` — fmt, validate, tflint, plan on PR",
      "LocalStack fallback: plan/apply network + compute with fake credentials"
    ],
    watch: [
      "No NAT Gateway — roughly $32/month. Public subnets are fine for this week.",
      "RDS free tier refuses to destroy without `skip_final_snapshot = true`.",
      "S3 bucket names are globally unique — suffix with initials plus a random string.",
      "`terraform fmt -check` fails on CRLF. Add `.gitattributes` with `*.tf text eol=lf`.",
      "LocalStack free is not full AWS. Be explicit about planned vs actually applied — that distinction is what an interviewer probes."
    ],
    breakIt: "Remove the RDS security-group rule. Diagnose from the app logs, then fix it in Terraform — never in the console.",
    exit: "terraform fmt -check -recursive · validate · plan -out tfplan · destroy leaves nothing behind",
    deliverable: "docs/daily/day4.md plus a cost table per resource per day"
  },
  {
    n: 5, date: "Sat 7 Nov", theme: "Kubernetes & Helm", path: "~/ops/day-05",
    goal: "The whole stack runs on a local cluster from one helm install, survives a bad rollout, and scales.",
    learn: [
      { t: "Kubernetes — basics tutorial", h: "https://kubernetes.io/docs/tutorials/kubernetes-basics/" },
      { t: "kind — ingress with extraPortMappings", h: "https://kind.sigs.k8s.io/docs/user/ingress/" },
      { t: "Spring Boot — Actuator health groups", h: "https://docs.spring.io/spring-boot/reference/actuator/endpoints.html" },
      { t: "Helm — chart template guide", h: "https://helm.sh/docs/chart_template_guide/" }
    ],
    steps: [
      "`k8s/kind-config.yaml` with `extraPortMappings` for 80/443 and `ingress-ready=true`",
      "Install ingress-nginx and apply the kind provider manifest",
      "Deployment `api` ×3 with `startupProbe`, liveness and readiness on the actuator groups",
      "Set requests/limits and `JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=75`",
      "Deployment `web` ×2, Services, ConfigMap, Secret",
      "PostgreSQL StatefulSet with `volumeClaimTemplates` (learning only — production is RDS)",
      "Ingress `ticket.local`: `/api` → api, `/` → web",
      "Rolling update + `kubectl rollout undo`; install metrics-server, add HPA, run k6",
      "Convert everything to a Helm chart with `values-dev.yaml` / `values-prod.yaml`"
    ],
    watch: [
      "A short liveness `initialDelaySeconds` will CrashLoopBackOff a Spring Boot app. Add a `startupProbe` and let liveness take over.",
      "JVM heap above the container limit means OOMKilled. Use `MaxRAMPercentage`, never a hardcoded `-Xmx`.",
      "`kindnet` does not enforce NetworkPolicy — Day 7 policies are declarative only unless you switch to Calico.",
      "HPA shows `<unknown>` until metrics-server is installed **and** `requests.cpu` is set.",
      "Editing a ConfigMap does not restart pods. That is what the `checksum/config` annotation is for."
    ],
    breakIt: "Work through ImagePullBackOff, OOMKilled, failing readiness and a wrong Service selector using only describe, logs and get events.",
    exit: "helm upgrade --install ticket k8s/chart · curl http://ticket.local/api/actuator/health · all pods Running",
    deliverable: "docs/daily/day5.md — the four diagnoses and the command that revealed each"
  },
  {
    n: 6, date: "Sun 8 Nov", theme: "Observability", path: "~/ops/day-06",
    goal: "You can answer “is it healthy, is it fast, and what broke?” without opening a terminal.",
    learn: [
      { t: "Spring Boot — Actuator & Micrometer metrics", h: "https://docs.spring.io/spring-boot/reference/actuator/metrics.html" },
      { t: "Prometheus — getting started", h: "https://prometheus.io/docs/prometheus/latest/getting-started/" },
      { t: "kube-prometheus-stack chart", h: "https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack" },
      { t: "Google SRE Book — SLOs", h: "https://sre.google/sre-book/service-level-objectives/" },
      { t: "k6 — load testing", h: "https://grafana.com/docs/k6/latest/" }
    ],
    steps: [
      "Fix known issue #1 — permit `/actuator/prometheus` (it returns 401 today)",
      "Enable `management.metrics.distribution.percentiles-histogram.http.server.requests`",
      "Add `tickets_created_total`, `tickets_open` and `ticket_resolution_seconds`",
      "Install `kube-prometheus-stack` and add a ServiceMonitor with a matching `release` label",
      "Build Grafana dashboards and commit the JSON to `monitoring/grafana/`",
      "Install Alloy and ship container logs",
      "Add a servlet Filter with a correlation ID in MDC and `X-Request-Id`",
      "Write `PrometheusRule` alerts: error rate, p95, CrashLooping, memory above 90%",
      "Define two SLOs with recording rules and a Grafana panel",
      "Run k6, kill a pod, watch the alert fire, write the postmortem"
    ],
    watch: [
      "`/actuator/prometheus` is 401 today. Nothing on this day works until that is fixed.",
      "kube-prometheus-stack needs roughly 2 GB. Raise Docker memory or the whole cluster OOMs.",
      "A ServiceMonitor with the wrong `release` label is silently ignored. Check it with `-o yaml`.",
      "Default Micrometer buckets are too coarse for a p95 under 500 ms — the histogram flag is mandatory.",
      "Never log emails, phones or tokens. Your DTOs carry PII.",
      "There is no status endpoint yet, so `ticket_resolution_seconds` has nothing to measure — add `PATCH /ticket/{id}/status` or measure time-to-assign instead."
    ],
    breakIt: "Kill pods during a k6 run, stop Postgres, inject latency. Record the time-to-detect for each.",
    exit: "Dashboard live under load · one alert fired · tickets_created_total visible in Prometheus",
    deliverable: "docs/daily/day6.md + docs/postmortem.md"
  },
  {
    n: 7, date: "Mon 9 Nov", theme: "GitOps & capstone", path: "~/ops/day-07",
    goal: "A commit reaches the cluster with no kubectl apply, and hand-edits are reverted.",
    learn: [
      { t: "Argo CD — getting started", h: "https://argo-cd.readthedocs.io/en/stable/getting-started/" },
      { t: "Sealed Secrets — how it works", h: "https://github.com/bitnami-labs/sealed-secrets" },
      { t: "OWASP — Kubernetes security cheat sheet", h: "https://cheatsheetseries.owasp.org/cheatsheets/Kubernetes_Security_Cheat_Sheet.html" },
      { t: "Trivy — misconfiguration scanning", h: "https://trivy.dev/latest/docs/scanner/misconfiguration/" }
    ],
    steps: [
      "Install Argo CD on kind and log in through a port-forward",
      "Create the `Application` with `selfHeal: true` and `prune: true`",
      "Prove self-heal: scale api by hand, watch Argo restore it",
      "CD job updates `image.tag` in `values-dev.yaml` and commits",
      "Install the sealed-secrets controller and replace plain Secrets",
      "Add `trivy config k8s/` to CI",
      "Add NetworkPolicies and a hardened `securityContext`",
      "Add staging/prod values plus a manual approval gate",
      "End-to-end: template change → PR → merge → image → Argo → Grafana",
      "Write the README with a Mermaid diagram and record the 3-minute demo"
    ],
    watch: [
      "Argo CD reverts every `kubectl edit`. That is the feature, but your debugging edits vanish.",
      "Sealed Secrets are cluster-bound — re-seal after recreating the kind cluster.",
      "A CD bot cannot push to a protected branch. Use a PAT with bypass, or Argo CD Image Updater.",
      "`readOnlyRootFilesystem: true` breaks the JVM unless `/tmp` is mounted as an `emptyDir`."
    ],
    breakIt: "kubectl edit deploy/api and watch Argo revert it. Then merge a deliberately broken change and roll it back through git.",
    exit: "Manual edit reverted automatically · merged change reaches Grafana",
    deliverable: "README.md + docs/demo-script.md + the demo video"
  }
];

const CUT = [
  { n: "01", drop: "Terraform depth → network + compute modules only", keep: "The AWS story is still demonstrable." },
  { n: "02", drop: "Loki / Alloy → fall back to kubectl logs -f", keep: "Prometheus, Grafana, alerts and SLOs." },
  { n: "03", drop: "Stretch only: HPA, k6, Adminer, cosign", keep: "Everything that actually gets shown." },
  { n: "✕", never: true, drop: "Never cut: Docker · CI/CD · K8s + Helm · Prometheus/Grafana/alerts · Argo CD · README + video", keep: "These are the four CV bullets." }
];

const CRITERIA = [
  { id: "S1", text: "Monorepo with the seven PDF folders", met: true },
  { id: "S2", text: "Backend builds and tests with no local database", met: true },
  { id: "S3", text: "Frontend typechecks, lints and builds clean", met: true },
  { id: "S4", text: "Auth works end to end — 401 without token, 200 with" },
  { id: "S5", text: "Whole stack starts with one docker compose up" },
  { id: "S6", text: "CI blocks bad code and CRITICAL CVEs" },
  { id: "S7", text: "CD publishes versioned, scanned images to GHCR" },
  { id: "S8", text: "Terraform applies and destroys cleanly" },
  { id: "S9", text: "Helm installs the stack on kind and survives a rollout" },
  { id: "S10", text: "Dashboard, a firing alert and two SLOs are live" },
  { id: "S11", text: "Argo CD reverts manual drift" },
  { id: "S12", text: "README with diagram + 3-minute demo video" }
];

const RESOURCES = [
  ["Dockerfiles", "docs.docker.com/build/building/best-practices/", "techworld with nana docker full course"],
  ["Spring Boot in containers", "spring.io/guides/topicals/spring-boot-docker/", "spring boot layered jar docker"],
  ["Next.js standalone", "nextjs.org/docs/app/api-reference/config/next-config-js/output", "next.js docker standalone multistage"],
  ["GitHub Actions", "docs.github.com/en/actions", "github actions full course ci cd"],
  ["Trivy", "trivy.dev/latest/docs/", "trivy container scanning github actions"],
  ["Terraform", "developer.hashicorp.com/terraform/tutorials/aws-get-started", "terraform full course aws"],
  ["LocalStack", "docs.localstack.cloud/", "localstack terraform tutorial"],
  ["Kubernetes", "kubernetes.io/docs/tutorials/kubernetes-basics/", "kubernetes full course beginners"],
  ["kind + ingress", "kind.sigs.k8s.io/docs/user/ingress/", "kind ingress nginx local"],
  ["Helm", "helm.sh/docs/chart_template_guide/", "helm chart tutorial from scratch"],
  ["Actuator & metrics", "docs.spring.io/spring-boot/reference/actuator/metrics.html", "spring boot actuator prometheus grafana"],
  ["Prometheus", "prometheus.io/docs/prometheus/latest/getting-started/", "promql tutorial"],
  ["SRE / SLOs", "sre.google/sre-book/service-level-objectives/", "slo sli tutorial"],
  ["k6", "grafana.com/docs/k6/latest/", "k6 load testing tutorial"],
  ["Argo CD", "argo-cd.readthedocs.io/en/stable/getting-started/", "argocd gitops hands on"],
  ["Sealed Secrets", "github.com/bitnami-labs/sealed-secrets", "kubeseal tutorial"]
];
