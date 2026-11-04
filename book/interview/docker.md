# Interview Bank — Docker & Containers

Answers are written to be **spoken**. Read them out loud; if a sentence is hard to say, rewrite it.
Each question has three layers: a one-liner to open, the detail if they lean in, and the trap that
catches people who only watched a video.

---

## Fundamentals

### Q1. What problem do containers actually solve?

- **One-liner:** they package the runtime environment, so the binary runs identically everywhere.
- **Detail:** the failure mode before containers was "works on my machine" — different JDK patch
  versions, different `node_modules`, different locale. A container ships the filesystem plus the
  process contract, so only the kernel is shared.
- **Trap:** "so it's a VM, right?" No. A VM virtualises hardware and runs its own kernel; a container
  is an isolated process on the host kernel. That's why a container starts in milliseconds and a VM in
  tens of seconds.

### Q2. Image vs container vs volume?

- **One-liner:** an image is the immutable template; a container is a running instance; a volume is
  storage that outlives the container.
- **Detail:** images are layered and content-addressed. Starting a container adds a thin writable layer
  on top; delete the container and that layer is gone — unless data lives in a named volume or a bind mount.
- **Trap:** "if I `docker compose down`, do I lose my database?" Only with `-v`. Named volumes persist
  across `down` and are removed by `down -v`.

### Q3. Why multi-stage builds?

- **One-liner:** the compiler, the source and the build cache never reach the runtime image.
- **Detail:** each `FROM` starts a new stage; only what you `COPY --from` survives. Typical result: a
  build stage of ~900 MB collapsing to a ~430 MB runtime with no Maven, no git, no source.
- **Trap:** "does it make the image smaller?" Yes — but the bigger win is usually **attack surface**:
  no package manager, no shell tooling, nothing to pivot to.

---

## Dockerfile craft

### Q4. What are Spring Boot layers and what do they buy you?

- **One-liner:** they split the fat jar into four layers so a code change re-uploads ~100 KB, not ~70 MB.
- **Detail:** `dependencies`, `spring-boot-loader`, `snapshot-dependencies`, `application` — copied
  least- to most-frequently-changing.
- **Trap:** "so the image is smaller?" No. The image size is identical. What changes is **rebuild and
  push time**, which is what CI spends money on.

### Q5. Which jarmode do you use, and what's the version trap?

- **One-liner:** `-Djarmode=tools` on Spring Boot 3.3+; `layertools` was removed.
- **Detail:** every pre-2024 tutorial uses `layertools`, and it fails on a current Boot version. This
  project hit it for real.
- **Trap:** "what does extraction actually produce?" **Not** a file called `app.jar`. It produces the
  artifact-named jar (`support-tickets-0.0.1-SNAPSHOT.jar`) beside a `lib/` directory. If your entrypoint
  hardcodes `app.jar`, the container restart-loops with `Unable to access jarfile app.jar`.

### Q6. Why `-XX:MaxRAMPercentage=75` instead of `-Xmx`?

- **One-liner:** it derives the heap from the container's limit, so one image behaves correctly at any size.
- **Detail:** the JVM needs room for metaspace, thread stacks and the OS. 75 % heap leaves roughly 25 %
  headroom; a hardcoded `-Xmx` is either wasteful or fatal.
- **Trap:** "does the JVM see the container limit?" It does since Java 10 (`UseContainerSupport`, on by
  default) — but not on older JVMs, and not if you override the flags carelessly. This project sets it
  explicitly so the intent is visible.

### Q7. `npm ci` or `npm install` in a Dockerfile?

- **One-liner:** `ci` installs exactly the lockfile and fails on any mismatch.
- **Detail:** reproducible builds; `install` can rewrite the lockfile and silently upgrade a transitive
  dependency between builds.
- **Trap:** "when would you use `install`?" Only when intentionally changing dependencies — never in CI.

### Q8. What's special about Next.js `output: "standalone"`?

- **One-liner:** it emits a minimal self-contained server with only the modules actually used.
- **Detail:** you must copy `.next/static` and `public/` yourself — standalone deliberately excludes
  them. Forgetting either produces a page that loads with no CSS and 404 images, **while the build
  reports success**.
- **Trap:** "does it shrink the build image?" No, the runtime image only.

---

## Running containers

### Q9. Why healthchecks if `depends_on` already exists?

- **One-liner:** `depends_on` waits for *started*; `condition: service_healthy` waits for *ready*.
- **Detail:** PostgreSQL accepts a TCP connection before it accepts queries. Without the condition the
  API crash-loops on its first Flyway connection.
- **Trap:** "why not `sleep 10`?" It works on your laptop and fails on a slow runner. Health conditions
  are state-based, not time-based.

### Q10. Inside a container, why is the DB host `db` and not `localhost`?

- **One-liner:** containers resolve each other by service name on the Compose network; `localhost` is the
  container itself.
- **Detail:** the published host port exists for *your* tools — psql, Adminer — not for sibling containers.
- **Trap:** "then why publish the port at all?" Debuggability. And in production you usually stop
  publishing it and reach the DB only through the cluster network.

### Q11. How do you debug a container that restarts in a loop?

- **One-liner:** `docker compose logs <svc>`, then get a shell and look at the filesystem.
- **Detail:** `docker run --rm --entrypoint sh <image> -c 'ls -la /app'` answers "is the file where the
  entrypoint thinks it is?" in one command. That is exactly how the `app.jar` bug was diagnosed here.
- **Trap:** "what if the logs are empty?" The process died before logging — check `docker inspect
  --format '{{.State.ExitCode}}'` and whether the entrypoint exists at all.

### Q12. Container exits with code 137. What happened?

- **One-liner:** it was OOM-killed.
- **Detail:** 128 + 9 (SIGKILL). Confirm with `docker inspect --format '{{.State.OOMKilled}}'`. For a JVM,
  the usual cause is a heap that ignores the container limit.
- **Trap:** "was it the app's fault?" Not necessarily — it can be the limit being wrong, or a leak that
  only appears under load. Distinguish before fixing.

### Q13. How do secrets get into a container?

- **One-liner:** injected at runtime from the environment or a secret manager — never baked into the image.
- **Detail:** a secret in a `Dockerfile` or an `ARG` is in the layer history forever, even if a later
  instruction removes it. `docker history` does not forget.
- **Trap:** "is a `.env` file safe?" It's better than baking, worse than a manager. It must be gitignored,
  and in Kubernetes you replace it with Sealed/External Secrets.

---

## Production judgement

### Q14. The API image is 429 MB. Is that a problem?

- **One-liner:** not for correctness; it costs pull time and registry storage.
- **Detail:** the JRE base is ~180 MB; the rest is dependencies. Options: `jlink` a trimmed runtime,
  distroless, or split hot vs cold dependencies further.
- **Trap:** "would you optimise it before shipping?" No. Measure, record the number, and spend the week
  on CI and observability, which change outcomes more.

### Q15. How do you make the same image work in dev, CI and production?

- **One-liner:** configuration comes from the environment; the image never knows which environment it's in.
- **Detail:** same image, different env vars and orchestration. Compose locally, Kubernetes in prod, and
  one profile switch (`SPRING_PROFILES_ACTIVE`) for seeding differences.
- **Trap:** "so what breaks first?" The dev profile that seeds an `admin` account. If production forgets
  to override it, you ship working credentials.

### Q16. What's missing before you'd call this production-ready?

- **One-liner:** pinned digests, CVE scanning in CI, resource limits, and secrets management.
- **Detail:** plus non-root (done), read-only root filesystem, a log driver, and a restart policy.
- **Trap:** "is non-root enough?" No — non-root is table stakes. The real question is whether the image
  can be scanned and traced to a commit.

---

## 60-second project pitch (use this in interviews)

> "I containerised a two-service system: a Spring Boot API and a Next.js frontend, with PostgreSQL.
> Both images are multi-stage and run as non-root. The API uses Spring Boot layered jars so dependency
> layers stay cached, and the frontend uses Next's standalone output, which cut the runtime image down
> and removed the build toolchain from it. Compose wires the three together with healthcheck-gated
> startup, so the API waits for Postgres to be ready rather than sleeping. I hit a real bug where
> Boot 3.3's `tools` jarmode produces an artifact-named jar rather than `app.jar` — the healthcheck
> surfaced the restart loop and I traced it by shelling into the image. Next I'm wiring the same images
> into GitHub Actions with Trivy scanning."
