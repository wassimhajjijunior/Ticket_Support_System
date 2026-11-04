# 01 — Docker & Compose

> **Status:** ✅ built and verified on this machine
> `relay-api:latest` 429 MB · `relay-web:latest` 336 MB · full stack healthy, login works through the proxy.

---

## 1. What we built

Three containers that start with one command: PostgreSQL, the Spring Boot API, and the Next.js web app.
The API waits for the database to report healthy, the web app waits for the API, and each container
checks its own health on a loop. The web app reaches the API by service name (`http://api:8080`) — never
through `localhost`.

---

## 2. Why it exists

Before this, running the project meant: install JDK 21, install Node 22, install PostgreSQL, create a
database, set five environment variables by hand, start two servers in the right order, and hope the
person next to you has the same Java version. Any mismatch produced a different failure on every machine.

Containers fix the *environment* half of that. Compose fixes the *wiring and ordering* half. Together
they turn "it works on my laptop" into "it works on any machine with Docker".

Concretely, without this you cannot answer: *what exactly is deployed?* With it, the answer is a file in
git.

---

## 3. The decision

| Decision | Options | Chosen | Why |
|---|---|---|---|
| Image strategy | single-stage vs **multi-stage** | multi-stage | the build toolchain (Maven, full JDK, `node_modules`) never reaches the runtime image |
| JAR packaging | fat jar vs **layered jars** | layered | dependencies change rarely, application code changes constantly → rebuilds copy ~100 KB instead of ~70 MB |
| Runtime JRE | `eclipse-temurin:21-jre` (~280 MB) vs **`21-jre-alpine`** (~180 MB) | alpine | sister image, musl libc; acceptable for this app |
| Next.js output | `next start` vs **`standalone`** | standalone | the server ships only the files it needs; no `node_modules` copy |
| API URL in the web image | runtime env var vs **build arg** | build arg | `next.config` rewrites are compiled into `routes-manifest.json` at build time — a runtime env var would be ignored |
| Orchestration | Compose vs Kubernetes | Compose | one machine, one command. Kubernetes is Day 5 and uses the same images |
| Host DB port | 5432 vs **55432** | 55432 | a native PostgreSQL on this machine owns 5432 *and* 5433 on IPv4 |

**Trade-off accepted:** the web image bakes `API_ORIGIN=http://api:8080` at build time. Rebuilding is
required if that hostname ever changes. In exchange you get a fully static rewrite with zero runtime
configuration — and in Kubernetes the ingress takes over that routing anyway, so the value stops mattering.

---

## 4. How it works

### 4.1 The API image — `docker/Dockerfile.api`

```dockerfile
# syntax=docker/dockerfile:1.7
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw
```

**Why the wrapper first?** Docker caches each instruction. Copying `pom.xml` and the wrapper before
`src/` means a code change only invalidates the cheap layers — the dependency download stays cached.

**Why `sed` and `chmod`?** The repo lives on Windows. `mvnw` can carry CRLF line endings and arrives
without the executable bit. Without this line you get `: not found` or `Permission denied` — the single
most common Spring Boot Docker failure.

```dockerfile
RUN --mount=type=cache,target=/root/.m2 \
    ./mvnw -B -ntp -q dependency:go-offline

COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    ./mvnw -B -ntp -DskipTests package
```

**Why a cache mount instead of a separate dependency layer?** The mount persists across builds but never
enters the image, so `~/.m2` is not shipped. `-DskipTests` is deliberate: tests belong in CI, not in the
image build (Day 3 wires them).

```dockerfile
RUN java -Djarmode=tools -jar target/*.jar extract --layers --destination /extracted
```

**Spring Boot 3.3+ uses `tools`.** The old `layertools` jarmode was removed. This is a version trap:
every tutorial written before 2024 tells you `-Djarmode=layertools`, and it fails on this project.

```dockerfile
FROM eclipse-temurin:21-jre-alpine AS runtime
RUN addgroup -S app && adduser -S -G app -u 1001 app
WORKDIR /app

COPY --from=build --chown=app:app /extracted/dependencies/          ./
COPY --from=build --chown=app:app /extracted/spring-boot-loader/    ./
COPY --from=build --chown=app:app /extracted/snapshot-dependencies/ ./
COPY --from=build --chown=app:app /extracted/application/           ./

RUN set -eux; mv /app/*.jar /app/app.jar; test -f /app/app.jar
USER 1001
```

**The bug we actually hit here.** The first build produced a container that restarted forever with
`Error: Unable to access jarfile app.jar`. Reason: `tools` extraction does not leave a jar called
`app.jar` — it leaves `support-tickets-0.0.1-SNAPSHOT.jar` (named after the Maven artifact) next to a
`lib/` directory. The `mv` normalises the name so the entrypoint never depends on the version string.
**Lesson:** a healthcheck that fails fast is what turned a silent restart loop into a one-line diagnosis.

**Why four `COPY` lines in that order?** Least-changing first. On a code change only `application/`
is re-copied; `dependencies/` stays cached.

```dockerfile
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+UseContainerSupport -Djava.security.egd=file:/dev/urandom" \
    SPRING_PROFILES_ACTIVE=prod

HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/actuator/health | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
```

`MaxRAMPercentage` makes the JVM read the *container's* memory limit instead of the host's. Without it a
JVM in a 512 MB container will happily size its heap for 16 GB and get OOM-killed.
`start-period=60s` stops Docker from declaring the container unhealthy while Spring is still booting.

### 4.2 The web image — `docker/Dockerfile.web`

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
```

**`npm ci`, not `npm install`.** `ci` installs exactly what the lockfile says and fails if they disagree —
reproducible builds. `install` may silently upgrade.

```dockerfile
FROM node:22-alpine AS build
ARG API_ORIGIN=http://api:8080
ENV API_ORIGIN=$API_ORIGIN
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
```

**Why a build ARG and not a runtime env var?** `next.config.ts` rewrites (`/api/* → API_ORIGIN/*`) are
evaluated during `next build` and written into `.next/routes-manifest.json`. Changing the env var at
container start does nothing. The comment in the file exists because this cost real debugging time on
another project.

```dockerfile
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
USER nextjs
CMD ["node", "server.js"]
```

**The classic standalone mistake:** `standalone` deliberately excludes `.next/static` and `public/`.
Forget those two lines and you get a page with no CSS and 404 images — while the build reports success.

### 4.3 The stack — `docker/docker-compose.yml`

```yaml
api:
  environment:
    DB_URL: jdbc:postgresql://db:5432/${POSTGRES_DB:-ticketsupport}
  depends_on:
    db:
      condition: service_healthy
```

**`db:5432`, never `localhost:55432`.** Inside the Compose network each service has a DNS name. The
published host port exists for *your* tools (psql, Adminer), not for other containers.

**`condition: service_healthy`** is the ordering mechanism. A plain `depends_on` only waits for the
container to *start*; PostgreSQL needs another few seconds before it accepts connections. Without the
condition the API crash-loops on its first Flyway connection attempt.

```yaml
healthcheck:
  test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:8080/actuator/health | grep -q '\"status\":\"UP\"' || exit 1"]
  start_period: 60s
  retries: 10
```

`wget` because `eclipse-temurin:21-jre-alpine` has **no curl**. `start_period` because Spring Boot needs
20–40 s. `retries: 10` because Flyway runs at startup and a slow disk can stretch that.

---

## 5. Do it yourself

```powershell
cd C:\Users\LENOVO\Desktop\HelloWorld\Stage\Stage1

copy docker\.env.example docker\.env      # optional; defaults work

docker compose -f docker\docker-compose.yml build      # ~10 min cold, seconds when cached
docker compose -f docker\docker-compose.yml up -d
docker compose -f docker\docker-compose.yml ps          # wait for 3x (healthy)

# proof, in order
curl http://localhost:8080/actuator/health              # {"status":"UP"}
curl http://localhost:3000/api/actuator/health          # the rewrite works
curl http://localhost:3000/login                        # 200
```

Then open **http://localhost:3000** and sign in with `admin` / `admin123`.

Stop: `docker compose -f docker\docker-compose.yml down`
Wipe the database too: `... down -v`

---

## 6. Really ready

| # | Check | Status | Evidence |
|---|---|---|---|
| 1 | Builds from a clean clone | ✅ | full cold build succeeded |
| 2 | API image runs as non-root | ✅ | `USER 1001`, `app` user created |
| 3 | Web image runs as non-root | ✅ | `USER nextjs` (uid 1001) |
| 4 | Startup order enforced by health, not `sleep` | ✅ | `condition: service_healthy` on both edges |
| 5 | Healthchecks exist on all three services | ✅ | `ps` shows `(healthy)` |
| 6 | Config comes from env vars, not baked files | ✅ | no credentials in the image |
| 7 | Secrets are not in the image | ✅ | `JWT_SECRET`, DB password injected at runtime |
| 8 | Container reaches the DB by service name | ✅ | `DB_URL=…//db:5432/…` |
| 9 | One command starts everything | ✅ | `docker compose up -d` |
| 10 | Images are reasonably small | 🟡 | 429 MB / 336 MB — acceptable, not tuned |
| 11 | `SPRING_PROFILES_ACTIVE=prod` for a real deploy | ⬜ | **compose defaults to `dev`, which seeds demo users** |
| 12 | Pinned by digest, scanned for CVEs | ⬜ | Day 3 (Trivy) |

**The one that will bite you:** item 11. The compose file sets `SPRING_PROFILES_ACTIVE=dev` so the demo
works out of the box. A real deployment must override it, or it will create `admin/admin123`.

---

## 7. Break it

| Fault | How | Symptom | How to find it |
|---|---|---|---|
| Wrong DB password | change `POSTGRES_PASSWORD` in `.env`, `up -d` | API restarts, web never starts | `docker compose logs api` → `password authentication failed` |
| Too little memory | add `mem_limit: 128m` to `api` | container exits with code 137 | `docker inspect relay-api-1 --format '{{.State.OOMKilled}}'` → `true` |
| Bad jar name | rename the `mv` line out of the Dockerfile | `Unable to access jarfile app.jar` loop | `docker logs` + `docker run --rm --entrypoint sh relay-api:latest -c 'ls /app'` |
| Wrong API host | build with `API_ORIGIN=http://localhost:8080` | page loads, all data calls 500 | `docker compose exec web env` and `wget -qO- http://api:8080/actuator/health` |
| DB volume gone | `docker compose down -v` then up | Flyway re-runs, data is gone | `docker volume ls` |

---

## 8. Interview practice

**Q1. Why multi-stage?**
- *One-liner:* so the compiler, the build cache and the source never ship in the runtime image.
- *Detail:* the final image contains a JRE, the layered application and nothing else — smaller attack
  surface, smaller pull, no Maven or npm on the production host.
- *Trap:* "isn't it the same image?" No — `FROM` starts a new stage; only what you `COPY --from` survives.

**Q2. What do Spring Boot layers actually buy you?**
- *One-liner:* dependency layers change rarely, so a code change re-uploads ~100 KB instead of ~70 MB.
- *Detail:* four layers — `dependencies`, `spring-boot-loader`, `snapshot-dependencies`, `application` —
  copied least- to most-changing.
- *Trap:* "does it make the image smaller?" No. It makes **rebuilds and pushes** faster. Different problem.

**Q3. Why `-XX:MaxRAMPercentage` instead of `-Xmx`?**
- *One-liner:* it derives the heap from the container limit, so the same image behaves correctly at any size.
- *Detail:* `-Xmx2g` in a 512 MB container is an OOMKill waiting to happen; `MaxRAMPercentage=75` leaves
  ~25 % for metaspace, stacks and the OS.
- *Trap:* "does the JVM see the container limit?" Not always — older JVMs read host memory. `UseContainerSupport`
  (default since 10) is why this works; that's why the flag is explicit here.

**Q4. Why healthchecks instead of `depends_on`?**
- *One-liner:* `depends_on` waits for "started", healthchecks wait for "ready".
- *Detail:* Postgres accepts TCP before it accepts queries. `condition: service_healthy` blocks until
  `pg_isready` passes, which is why the API does not crash-loop on Flyway.
- *Trap:* "can't I just `sleep 10`?" You can, and it will work on your laptop and fail on a slow CI runner.

**Q5. Why is the API's `DB_URL` `db:5432` and not `localhost:55432`?**
- *One-liner:* containers talk over the Compose network, not the host's published ports.
- *Detail:* `localhost` inside a container is the container itself. The published port is for host tools.
- *Trap:* "then why publish it at all?" So `psql`/Adminer on the host can inspect the same database.

**Q6. Why is `API_ORIGIN` a build arg?**
- *One-liner:* Next.js bakes rewrites into the build output, so it cannot be a runtime variable.
- *Detail:* `next.config.ts` rewrites are serialised into `.next/routes-manifest.json` during `next build`.
- *Trap:* "so how do you change the API host without rebuilding?" You route through an ingress or reverse
  proxy that owns the hostname — which is exactly what Day 5 does.

**Q7. Why `npm ci` over `npm install`?**
- *One-liner:* it installs the lockfile exactly and fails on mismatch.
- *Trap:* "when would you use `install`?" Only when intentionally changing dependencies.

**Q8. What does `standalone` change?**
- *One-liner:* it emits a self-contained server bundle with only the used modules.
- *Detail:* you must add `.next/static` and `public/` yourself; they are intentionally excluded.
- *Trap:* "does it shrink the *build* image?" No, only the runtime image.

**Q9. The image is 429 MB. Is that a problem?**
- *One-liner:* not for correctness; it costs pull time and registry storage.
- *Detail:* the JRE base is ~180 MB and the dependency layer is the rest. Next steps: `jlink` a custom
  runtime, or distroless. Node's 336 MB is mostly the standalone `node_modules`.
- *Trap:* "would you chase it this week?" No — measure, document, and spend the time on CI and
  observability, which change more outcomes.

**Q10. How would you run this in production?**
- *One-liner:* same images, different orchestration and configuration.
- *Detail:* `SPRING_PROFILES_ACTIVE=prod`, no seeder, secrets from a manager, images pinned by digest,
  scanned in CI, deployed to Kubernetes with probes and resource limits.
- *Trap:* "what breaks first?" The seeded `admin` account, if nobody flips the profile.

---

## 9. Numbers to remember

| Figure | Value | Why it matters |
|---|---|---|
| API image | **429 MB** | JRE base ~180 MB + dependencies |
| Web image | **336 MB** | standalone bundle + node runtime |
| Cold build | **~10 min** | dominated by base pulls and the Maven download |
| Warm rebuild | **seconds** | cache mounts + layer ordering |
| API healthy after start | **~10 s** (start-period 60 s) | Spring Boot boot time |
| Web healthy after start | **~3 s** | standalone server start |
| Published ports | **3000 / 8080 / 55432** | web / api / db |
| JWT secret minimum | **32 bytes** | `JwtUtil` fails fast below this |

---

## 10. What this chapter does not cover

- CVE scanning and pinned digests → Day 3 (Trivy in CI).
- Registry push and versioned tags → Day 3 (GHCR).
- Running the same images on Kubernetes with probes and limits → Day 5.
- The `.next` corruption trap: running `next build` while `next dev` owns the same directory produces
  `ENOENT … app-build-manifest.json`. Delete `.next` when switching between them.
