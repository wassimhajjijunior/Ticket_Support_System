# Interview Bank — CI/CD

Answers are designed to be spoken. Use the one-liner first; add detail only if asked.

## Core concepts

### Q1. What is the difference between CI and CD?

- **One-liner:** CI decides whether a change is acceptable; CD turns an accepted change into a deployable artifact or deployment.
- **Detail:** my CI runs tests, type checks, lint and builds. My CD builds, tags, publishes and scans container images.
- **Trap:** “a successful Docker push means the application is healthy.” It proves artifact publication, not runtime health.

### Q2. Why not deploy directly from your laptop?

- **One-liner:** because the process would depend on local state and one person’s machine.
- **Detail:** a pipeline gives a clean environment, repeatable steps, logs and an auditable link from commit to artifact.
- **Trap:** “I use the same commands locally.” That helps, but it does not provide permissions, isolation, auditability or merge enforcement.

### Q3. What should CI check before merge?

- **One-liner:** the fastest checks that prove the change still builds and behaves as expected.
- **Detail:** for this project: backend `mvn verify`, frontend `npm ci`, TypeScript, ESLint and `next build`.
- **Trap:** measuring CI only by how many checks it has. Slow or flaky pipelines get bypassed; signal quality matters more than count.

## Monorepo and Maven/npm specifics

### Q4. How do you avoid rebuilding everything in a monorepo?

- **One-liner:** filter jobs by changed paths.
- **Detail:** `dorny/paths-filter` maps `app/**` to the backend job and `web/**` to the frontend job, so unrelated work is skipped.
- **Trap:** required branch-protection checks that are skipped on unrelated changes. The rules must account for conditional jobs rather than hanging forever.

### Q5. Why `./mvnw verify` instead of `./mvnw test`?

- **One-liner:** `verify` runs the full lifecycle including integration tests.
- **Detail:** Surefire handles unit tests; Failsafe runs `*IT` classes in the integration-test phase.
- **Trap:** saying “all tests pass” after running only `test`.

### Q6. Why `npm ci` in CI?

- **One-liner:** it installs exactly the lockfile and fails if the manifest and lockfile disagree.
- **Detail:** `npm install` can change dependency resolution and the lockfile; `npm ci` is designed for reproducible automation.
- **Trap:** using `npm install` because it happened to work once and calling that reproducible.

### Q7. Why cache dependencies, and what can go wrong?

- **One-liner:** caching avoids downloading the same dependencies on every run.
- **Detail:** Maven and npm caches are keyed by dependency manifests. They reduce time but must not become a hidden source of stale artifacts.
- **Trap:** debugging a build failure for hours before testing with a clean cache.

## Images, registries and releases

### Q8. Why tag images with the commit SHA?

- **One-liner:** it makes the running artifact traceable to exact source.
- **Detail:** `latest` is a moving pointer; a SHA tag supports deterministic deployment, rollback and incident investigation.
- **Trap:** deploying `latest` and then being unable to say what code is running.

### Q9. Why GHCR instead of Docker Hub?

- **One-liner:** it is integrated with the repository and can use `GITHUB_TOKEN`.
- **Detail:** the CD job requests `packages: write` and logs in as the current GitHub actor, avoiding a separate registry credential.
- **Trap:** putting registry passwords in workflow YAML or image build args.

### Q10. Why lowercase the GHCR owner?

- **One-liner:** GHCR package paths must be lowercase while GitHub usernames may contain uppercase characters.
- **Detail:** the workflow normalizes `github.repository_owner` with `tr` before constructing image references.
- **Trap:** valid YAML that fails only when the registry rejects the path.

## Security and supply chain

### Q11. What does Trivy add to the pipeline?

- **One-liner:** it checks OS and library dependencies for known vulnerabilities before an image is accepted.
- **Detail:** the job fails on `CRITICAL,HIGH` with fixes available; `ignore-unfixed` suppresses findings with no upstream fix.
- **Trap:** treating a scan report as proof the image is secure. It checks known CVEs, not application logic or configuration.

### Q12. Push then scan, or scan then push?

- **One-liner:** scan then push is the stronger supply-chain guarantee.
- **Detail:** my current CD pushes first for simplicity and caching, then scans. That means a vulnerable image may exist briefly even though the job fails.
- **Trap:** claiming a failed post-push scan means the vulnerable artifact was never published.

### Q13. Why not run CD on every pull request?

- **One-liner:** deployment needs more privilege and should only run for trusted code.
- **Detail:** CI uses read-only source access; CD gets package write access only on `main`.
- **Trap:** exposing registry credentials or signing keys to untrusted fork code.

### Q14. Are GitHub Actions themselves dependencies?

- **One-liner:** yes — action tags are executable third-party code referenced by your workflow.
- **Detail:** I found a nonexistent Trivy tag during pre-flight by querying the repository’s releases and refs, then switched to `aquasecurity/trivy-action@v0.36.0`.
- **Trap:** assuming YAML validation proves an action reference exists.

## Operations and failure handling

### Q15. What happens when a CI step fails?

- **One-liner:** the job stops and the failure is visible on the PR; CD should not produce a release artifact.
- **Detail:** backend reports are uploaded on failure so the exact failing test can be diagnosed without rerunning everything.
- **Trap:** immediately retrying without reading the log. First determine whether the failure is code, environment, credentials or a flaky test.

### Q16. What is the difference between a skipped job and a failed job?

- **One-liner:** skipped means its path filter did not match; failed means it ran and something went wrong.
- **Detail:** in this pipeline a docs-only change should skip both build jobs, while a real backend change must run the backend job.
- **Trap:** a green summary caused by accidentally skipping every required check.

### Q17. What would you add next to this pipeline?

- **One-liner:** branch protection, then deploy validation against a real environment.
- **Detail:** require the relevant CI checks on `main`, then add container smoke tests, image signing and GitOps deployment.
- **Trap:** adding more stages before proving the basic pipeline is green and dependable.

## 60-second answer

> “My CI is path-filtered: backend changes run Maven `verify`, and frontend changes run install, TypeScript,
> ESLint and a Next.js production build. CD runs only on `main`, builds both images with BuildKit, tags them
> with the commit SHA and `latest`, pushes to GHCR using the repository token, and scans with Trivy. I also
> validated every action tag and input against the upstream schemas before pushing, which caught a nonexistent
> Trivy tag. The next step is watching the first hosted run, then requiring those checks through branch protection.”
