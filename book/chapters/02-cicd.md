# 02 — CI/CD with GitHub Actions

> **Status:** implementation written and statically validated; **first real pipeline run pending**.
> This chapter records design and verified pre-flight checks only. It does not claim a green pipeline.

---

## 1. What we built

Two GitHub Actions workflows and a Dependabot configuration:

- **CI** runs tests, type checking, linting and builds on every pull request and on `main`.
- **CD** builds both Docker images on merges to `main`, pushes them to GHCR, and scans them with Trivy.
- **Dependabot** proposes weekly updates for Maven, npm, Docker base images and GitHub Actions.

The workflows live in `.github/workflows/ci.yml`, `.github/workflows/cd.yml` and `.github/dependabot.yml`.

---

## 2. Why it exists

Before CI, “it works” meant “it worked when somebody last ran it on their laptop”. A pull request could
break the backend tests or the frontend build without anyone noticing until deployment.

CI makes correctness **repeatable and visible**. CD turns the same source commit into a traceable,
scanned artifact. The important boundary is:

> CI answers “should this change be accepted?” CD answers “what exactly should run?”

A registry tag is not proof that the code is good. It is only proof that an image was produced.

---

## 3. The decision

| Decision | Options | Chosen | Trade-off |
|---|---|---|---|
| Repository shape | separate workflows per repo vs **one monorepo pipeline** | monorepo + path filters | one source of truth, but filters are mandatory to avoid unnecessary builds |
| Test trigger | every push vs **PR + main** | PR + main | catches problems before merge and confirms the merged result |
| Backend test phase | `test` vs **`verify`** | `verify` | runs Failsafe integration tests as well as Surefire unit tests |
| Registry | Docker Hub vs **GHCR** | GHCR | `GITHUB_TOKEN` already has permission; no extra registry credential |
| Vulnerability gate | report only vs **fail on HIGH/CRITICAL** | fail | stronger guarantee, but base-image CVEs can block merges |
| Action versions | latest majors vs **stable majors** | stable (`v4`, `v5`, `v6`) | avoids surprise breaking changes; Dependabot can propose upgrades later |
| Scan/push order | scan then push vs **push then scan** | push then scan | simpler and cache-friendly, but a vulnerable image may exist briefly |

**Accepted limitation:** CD pushes before scanning. The job still fails when Trivy finds a qualifying
CVE, so deployment can be blocked, but the tag already exists. For a strict “never publish vulnerable
images” guarantee, build with `load: true`, scan locally, and only push after the scan passes.

---

## 4. How it works

### 4.1 Path-filtered CI

```yaml
changes:
  outputs:
    backend: ${{ steps.filter.outputs.backend }}
    frontend: ${{ steps.filter.outputs.frontend }}
  steps:
    - uses: actions/checkout@v4
    - uses: dorny/paths-filter@v3
      id: filter
      with:
        filters: |
          backend:
            - 'app/**'
            - 'docker/Dockerfile.api'
          frontend:
            - 'web/**'
            - 'docker/Dockerfile.web'
```

`dorny/paths-filter` sets an output to the string `true` when any matching file changed. The two build
jobs then gate on that output:

```yaml
if: needs.changes.outputs.backend == 'true'
```

**Why this matters:** a frontend-only PR does not download Maven dependencies or compile Java. A
backend-only PR does not run `npm ci` or `next build`. Monorepos need this deliberately; it is not automatic.

### 4.2 Backend job

```yaml
- uses: actions/setup-java@v4
  with:
    distribution: temurin
    java-version: '21'
    cache: maven

- run: chmod +x mvnw
- run: ./mvnw -B -ntp verify
```

`cache: maven` reuses dependencies between runs. `-B` is batch mode and `-ntp` suppresses transfer
progress logs, which makes CI output readable. The H2 `test` profile means no PostgreSQL service is
needed in CI.

On failure, Surefire and Failsafe reports are uploaded as artifacts so the failure can be diagnosed
without rerunning the job.

### 4.3 Frontend job

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: npm
    cache-dependency-path: web/package-lock.json
- run: npm ci
- run: npx tsc --noEmit --incremental false
- run: npm run lint
- run: npm run build
```

These are four separate gates on purpose: dependency installation, type correctness, style rules and
actual production compilation. A TypeScript error is not the same failure as a Next.js build error;
separate steps make the cause visible immediately.

### 4.4 CD matrix

```yaml
matrix:
  include:
    - name: api
      context: ./app
      dockerfile: ./docker/Dockerfile.api
    - name: web
      context: ./web
      dockerfile: ./docker/Dockerfile.web
```

One job definition publishes both images. `fail-fast: false` means an API failure does not hide a web
failure. BuildKit caches are scoped by image so one service cannot poison the other’s cache.

### 4.5 Tags and registry identity

```yaml
owner="$(echo '${{ github.repository_owner }}' | tr '[:upper:]' '[:lower:]')"
```

GHCR package paths must be lowercase. GitHub usernames are not guaranteed to be lowercase, so the owner
is normalized rather than assumed.

`docker/metadata-action` produces a commit SHA tag and `latest` on the default branch. The SHA tag is
the deployment candidate; `latest` is a convenience pointer, not a rollback strategy.

### 4.6 Web build argument

```yaml
build-args: ${{ matrix.name == 'web' && 'API_ORIGIN=http://api:8080' || '' }}
```

Only the web image consumes `API_ORIGIN`. Supplying it to the API image would produce an unused-build-arg
warning. The value is needed at build time because Next.js compiles rewrites into the route manifest.

### 4.7 Vulnerability gate

```yaml
- uses: aquasecurity/trivy-action@v0.36.0
  with:
    image-ref: ${{ steps.image.outputs.sha_tag }}
    exit-code: '1'
    ignore-unfixed: true
    severity: CRITICAL,HIGH
```

`ignore-unfixed` avoids failing on CVEs for which no patched package exists yet. That is a pragmatic
choice for a bootcamp, not a claim that unfixed vulnerabilities are harmless. High/critical findings with
available fixes still fail the job.

---

## 5. Do it yourself

### Offline validation already performed

```powershell
# Parse all three YAML files with js-yaml (already present through eslint).
# Query each action's GitHub tags and compare every `with:` key to action.yml.
```

Results:

- All three YAML files parse successfully.
- All 13 action references resolve to real tags.
- Every supplied `with:` input exists in the corresponding action schema.
- `mvnw` is committed as `100755`.
- Root `.gitattributes` pins LF for workflows, Dockerfiles and infrastructure files.

### Start the first real run

```powershell
git push origin main
```

Then inspect **GitHub → Actions** and record:

1. Whether `changes` correctly identifies the modified paths.
2. Whether backend `verify` runs all unit and integration tests.
3. Whether frontend typecheck, lint and build all pass.
4. Whether both GHCR packages receive a `sha-*` tag.
5. Whether Trivy blocks or passes each image.

**This has not been executed yet.** Any timing or runtime result added later must come from that run.

---

## 6. Really ready

| Check | Status | Evidence |
|---|---|---|
| YAML parses | ✅ | js-yaml validation of all three files |
| Action tags exist | ✅ | GitHub API checks |
| Action inputs valid | ✅ | each action’s `action.yml` |
| Maven wrapper executable | ✅ | Git mode `100755` |
| CI runs on PRs | 🟡 configured, unexecuted | first PR/run pending |
| Backend tests pass in CI | ⬜ | pending |
| Frontend build passes in CI | ⬜ | pending |
| Images publish to GHCR | ⬜ | pending |
| Trivy gate works | ⬜ | pending |
| Branch protection requires CI | ⬜ | not enabled yet |

A green local build is useful evidence, but it is not proof of a green hosted runner. Hosted runners
have different credentials, filesystem, network, CPU architecture and cache state.

---

## 7. Break it

| Fault to inject | Expected result | What it teaches |
|---|---|---|
| Change only a Markdown file | both build jobs should skip | path filters save time, but required-check configuration must tolerate skips |
| Change only `web/lib/types.ts` | only frontend job runs | path filters actually match the intended tree |
| Deliberately fail a backend test | backend job fails and uploads reports | Failsafe tests run under `verify`, not just `test` |
| Deliberately fail TypeScript | frontend stops at typecheck | steps fail fast and make the cause obvious |
| Use a dependency with a known fixed CRITICAL CVE | Trivy fails CD | the gate is real, not decorative |
| Delete or downgrade the GHCR token permission | login/push fails | `packages: write` is required |
| Change an action to a nonexistent tag | workflow fails before build | action versions are external dependencies and must be checked |

---

## 8. Interview practice

### “Why have CI if you already test locally?”

- **One-liner:** local tests prove my machine; CI proves the change in a clean, shared environment.
- **Detail:** CI removes local state, enforces the same checks for every contributor, and gives GitHub a
  merge gate.
- **Trap:** “CI guarantees production works.” No — it verifies specific checks, not real traffic,
  infrastructure, migrations or browser behavior.

### “Why separate CI and CD?”

- **One-liner:** acceptance and artifact production have different triggers and permissions.
- **Detail:** CI needs read-only source access; CD needs package write access. Keeping them separate
  limits the privileged workflow to `main`.
- **Trap:** running deployment on every PR because it is “faster feedback”. That increases secret and
  supply-chain exposure.

### “Why test with `verify` rather than `test`?”

- **One-liner:** `verify` includes the integration-test phase.
- **Detail:** Surefire handles unit tests; Failsafe handles `*IT` integration tests later in the Maven
  lifecycle.
- **Trap:** a green `mvn test` can mean your integration tests never ran.

### “Why is `latest` not enough?”

- **One-liner:** it is mutable, so you cannot prove which commit ran.
- **Detail:** SHA tags make rollbacks and incident review deterministic.
- **Trap:** using `latest` in a healthcheck failure investigation and expecting to know what changed.

### “Should vulnerability scanning block deployment?”

- **One-liner:** yes for fixable high/critical findings, with explicit exceptions where necessary.
- **Detail:** `ignore-unfixed` avoids impossible-to-fix noise, but exceptions must be reviewed, not hidden.
- **Trap:** failing on every CVE regardless of exploitability, which trains teams to bypass the scanner.

### “Why did your first Trivy tag fail?”

- **One-liner:** I had used a tag that did not exist; the repository’s real release tags are v-prefixed.
- **Detail:** I checked every action reference against the GitHub API before pushing and changed it to
  `aquasecurity/trivy-action@v0.36.0`.
- **Trap:** YAML validation cannot catch a nonexistent action tag. Static schema checks and repository
  lookup answer different questions.

---

## 9. Numbers to remember

| Figure | Value |
|---|---|
| CI jobs | 3 (`changes`, `backend`, `frontend`) |
| CD images | 2 (`relay-api`, `relay-web`) |
| Action references checked | 13 |
| Ecosystems watched by Dependabot | 4 |
| Wrapper mode | `100755` |
| First hosted run | **pending** |

---

## 10. What this chapter deliberately does not claim

No green checkmarks, no CI duration, no GHCR package links, no vulnerability-count result and no “CD is
verified” statement. Those belong in the follow-up written after the first real run.
