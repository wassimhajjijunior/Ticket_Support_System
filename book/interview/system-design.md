# Interview Bank — System Design & The Project Pitch

This is the file you rehearse the night before. It is not about Docker or Kubernetes — it is about
answering *"tell me about a project you built"* without rambling, and surviving the five follow-ups
that always come next.

Ground rule: **describe what you actually built, then describe what you would add.** Interviewers
respect "not built, and here's what I'd do" far more than a confident answer that collapses on the
second question.

---

## 1. The 90-second pitch

Say it out loud until it stops feeling like a script. Order matters: problem → shape → the two hard
parts → result.

> "I built a ticket support system for small support teams. Customers raise tickets, agents get them
> assigned and move them through a lifecycle: pending, open, executed, finished. It's a Spring Boot 3.5
> API on Java 21 with PostgreSQL, and a Next.js 15 front end. JWT auth with three roles — user, agent,
> admin — and role checks enforced on the server, not the UI.
>
> Two parts were genuinely hard. First, the API had security that *looked* implemented — there was a JWT
> filter, but the security chain was commented out and every endpoint was open. I rebuilt that: stateless
> auth, 401 versus 403 handled by dedicated handlers, and a global exception handler so errors are
> structured instead of stack traces. Second, the front end was showing hardcoded dashboards and fake
> chat. I replaced all of it with real endpoints — stats, comments, assignment — so nothing on screen is
> invented.
>
> Then I containerised it: multi-stage Dockerfiles, layered jars for the API, Next standalone output for
> the web app, and Compose with healthcheck-gated startup so the API waits for Postgres instead of
> sleeping. The whole stack comes up with one command."

**Why this works:** it states the domain in one sentence, names two real problems with the fix, and ends
on something verifiable. It never says "I learned about..." — it says "I built, I replaced, I containerised".

---

## 2. The 30-second version

For when they say "quickly".

> "A ticket support system: Spring Boot API, PostgreSQL, Next.js front end, JWT with three roles. I
> rebuilt the auth and error handling, replaced every mocked screen with real endpoints, and
> containerised the whole stack so it starts with one Compose command."

---

## 3. If they ask you to draw it

Draw boxes left to right, and narrate while you draw — silence while drawing looks like hesitation.

```
Browser ── Next.js (SSR + client) ──/api rewrite──> Spring Boot ──> PostgreSQL
                                                        │
                                                   Actuator /metrics
```

What to say at each box:

- **Browser → Next.js**: "Server components render the shell; the client fetches data through one axios
  instance so the JWT header and the 401 handling live in exactly one place."
- **Next.js → API**: "In development a rewrite proxies `/api/*` to `:8080`. In production the ingress
  owns that path, so the front end never hardcodes a backend host."
- **API**: "Stateless. JWT filter populates the security context; authorization is per-endpoint.
  Validation and error mapping are global, so controllers stay thin."
- **PostgreSQL**: "Flyway owns the schema — `ddl-auto=validate`, never `update` — so the migration is
  the source of truth."
- **Actuator**: "Health groups for liveness and readiness, and a Prometheus endpoint for scraping."

Then stop drawing. Do not decorate.

---

## 4. The five follow-ups (and honest answers)

### "How would you scale this?"

- **Now:** one instance, one database, no cache. Fine for the target user.
- **Next step, in order:** make the API stateless everywhere (it already is), run N replicas behind a
  load balancer, move sessions out of memory (already JWT, so nothing to move), then add a read replica
  for list queries.
- **Only then:** cache. "I'd cache `/ticket/stats` for 10–30 seconds — it's the most expensive read and
  the least sensitive to staleness."
- **Trap to avoid:** saying "Kubernetes solves scaling". It doesn't. It schedules; you still need
  statelessness and a database plan.

### "What happens when the API dies mid-request?"

- Health checks fail → the container stops receiving traffic; Compose/Kubernetes restarts it.
- Writes are transactional, so an interrupted write rolls back rather than half-applying.
- What is **not** handled today: retries on the client, and idempotency keys for ticket creation. If a
  create request times out after the write, a retry creates a duplicate. Say that plainly — then say
  you'd add an idempotency key.

### "Why JWT instead of server sessions?"

- Stateless: any replica can validate without shared session storage.
- Cost: you cannot revoke a token before it expires without extra machinery (a denylist or short TTL +
  refresh). This project uses a 1-hour expiry and no refresh token — an honest gap.
- Trap: claiming JWT is "more secure". It is not; it is *more scalable*. Session cookies with
  `HttpOnly` are often safer against XSS.

### "How do the front end and back end stay in sync?"

- A written contract (`docs/api-contract.md`) with exact field names, status codes and error shape.
- TypeScript types in `web/lib/types.ts` mirror it; the API returns the same shape it documents.
- Trap: "we just test it manually". That is the answer that loses the offer. Better: "next step is
  generating client types from the OpenAPI spec so drift fails the build."

### "How would you add real-time updates?"

- Polling first: cheapest, and for a support queue a 10-second poll is usually enough.
- Then Server-Sent Events for one-way updates — simpler than WebSockets and survives proxies better.
- WebSockets only when you need bidirectional low-latency.
- The real design question is *who owns the event*: today the API is the only writer, so it can emit.
  If a second service appears, you need a broker (Kafka/RabbitMQ) and idempotent consumers.

---

## 5. Mistakes to avoid saying

| Don't say | Say instead |
|---|---|
| "It's a microservices app" | It's two services. Microservices means independent deploy and data ownership — not "I have a frontend and a backend". |
| "I used JWT so it's secure" | "JWT gives stateless auth; XSS is handled by short expiry plus never rendering untrusted HTML — the httpOnly-cookie migration is still open." |
| "Docker makes it scalable" | "Docker makes it *reproducible*; scaling needs stateless services and a database plan." |
| "The tests cover everything" | "30 integration tests cover the API contract; the UI has no automated tests yet — that's the next gap." |
| "It's production ready" | "It's deployable: it builds, runs as non-root, has health checks and migrations. Not production-hardened: no scanning in CI yet, no secrets manager." |

---

## 6. Numbers to quote

Specifics beat adjectives. Have these ready:

| Number | Meaning |
|---|---|
| **2 services** | Spring Boot API + Next.js web, one PostgreSQL |
| **30 integration + 4 unit tests** | `mvn verify` green |
| **9 routes** | including a dynamic ticket detail route |
| **429 MB / 336 MB** | API and web images |
| **~10 min cold, seconds warm** | image build time |
| **32 bytes** | minimum JWT secret; the app refuses to start below it |
| **55432** | host port for Postgres, chosen to avoid a native instance on 5432/5433 |
| **1 commit** | that consolidated two broken submodule pointers into a real repo — a good story about debugging git |

---

## 7. The one question you should ask them

At the end they ask "any questions?". Ask something that shows you think about delivery, not just code:

> "How do you currently get a change from merge to production — and where does it usually break?"

It invites them to talk about their own pain, which is the most useful 5 minutes of the interview, and
it quietly signals that you've done the CI/CD work.
