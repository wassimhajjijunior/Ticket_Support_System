# Spoken script — From commit to production

> Workshop deck. This is the spoken track, not slide text. Read it out loud once before the session;
> anything hard to say, rewrite. Target: 5–6 minutes of continuous talk for the core arc, then you open
> the repository and let the room ask questions.

---

## Opening (slide 1 — 45 s)

> "Before we start: show of hands, who has pushed code to production this month?
> Keep it up if you also had to *watch* it after.
>
> That gap — between shipping and knowing — is the whole subject today. Not Docker, not Kubernetes.
> Those are consequences. The subject is how you make change cheap and failure survivable.
>
> Three things by the end: why delivery is a rate, what the nine stages of a pipeline actually do,
> and what a DevOps engineer's week looks like when it's working."

---

## Why now (slide 2 — 60 s)

> "Deployment used to be an event. A night, a window, a rollback plan printed on paper.
> Now it's a rate — several times a day for the teams that win.
>
> And notice the numbers: 83% of teams run CI/CD, but almost three quarters **self-host** their pipeline.
> When people tell you DevOps is 'just cloud', that's wrong. A lot of this work happens on servers you
> can touch.
>
> Also notice: 47% GitHub Actions, 32% GitLab, 28% Jenkins — and a quarter of companies run more than
> one. Learn one properly. Learn the second one to read."

---

## The wall (slide 3 — 45 s)

> "Here's the failure this exists to fix. Developers are measured on change. Operations are measured on
> stability. Put a wall between them and the handoff is a document — and documents don't run tests.
>
> DevOps is not a team you hire. It's a property of how those two sides work together. If you remember
> one sentence from today: *the handoff is where risk is created.*"

---

## The loop (slide 4 — 30 s)

> "Plan, code, build, test, release, deploy, operate, monitor — and back to plan.
> Every tool you'll ever meet sits on one of those legs. When you're lost in a tool conversation, ask:
> which leg does this shorten?"

---

## Architecture (slide 5 — 60 s)

> "This is the picture for the rest of the session. Nine stages, one commit at the start, a running
> system at the end.
>
> I'm going to zoom into each one. If I go too fast, stop me — this is the part worth slowing down for.
> Click any stage on the list and we'll jump there."

*(Click one stage. Let the camera move. This is the moment the room leans in.)*

---

## The stages (slides 6–14 — ~2 min total, ~15 s each)

- **Source.** "Small changes merged often. Every other practice depends on this one."
- **CI.** "Answers one question on every change: does this break anything? If a human answers that, it won't happen on a Friday."
- **Package.** "Build once, run anywhere. The artefact is the unit of truth — if you rebuild per environment, you don't know what you tested."
- **Security.** "Scan the image you're about to ship, not the repository. Report everything, gate on what you can act on."
- **Registry.** "SHA tags, not `latest`. Rollback is a feature; if you can't name the previous version, you don't have one."
- **IaC.** "Servers as source code. Plan shows the diff before it happens — that's the whole discipline."
- **Kubernetes.** "Declare the state, let it converge. Most 'Kubernetes is hard' stories are a missing readiness probe."
- **Observability.** "Metrics say something is wrong, logs say where, traces say which hop. The alert should fire on what a user feels."
- **GitOps.** "Git is the desired state. A manual change is drift, and drift gets reverted."

---

## The job (slide 15 — 60 s)

> "Now the part nobody shows you. The week is not writing YAML.
>
> It's build, protect, operate, improve. On-call is part of the job, not a punishment. Postmortems are
> how a team gets better instead of just older.
>
> And the four numbers that measure whether any of it worked: deployment frequency, lead time, change
> failure rate, time to restore. In an interview, they won't ask you to define them. They'll ask which
> one your team was worst at, and what you changed."

---

## Live (slide 16 — 90 s, this is where you open the repo)

> "Everything I just described is one repository. Spring Boot, PostgreSQL, Next.js — and the pipeline
> around them.
>
> The workflow is path-filtered: a frontend change doesn't compile Java. The image is built once,
> tagged with the commit, scanned, pushed.
>
> And here's the honest part: the security gate is advisory right now, because four critical findings
> remain that upstream hasn't fixed for our version line. I could have hidden that. A pipeline that lies
> to you is worse than no pipeline."

---

## Close (slide 17 — 45 s)

> "Tools change every three years. The judgement — what to automate, what to gate, what to measure —
> is what compounds.
>
> So here's the homework, and it's the only one that matters: build one pipeline you can explain end to
> end, then explain it to someone else. If you can't explain it, you don't have it yet.
>
> Questions. Then we open the code."

---

## If you're short on time

Cut slides 6–14 to three: **CI**, **Package**, **Observability**. Keep the wall, the architecture zoom,
the job, and the honest close. The close is the part they remember.
