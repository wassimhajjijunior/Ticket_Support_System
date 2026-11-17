# The Build Book

A living record of this project: every engineering step written up once, properly, so it can be
re-read a month later, used to teach someone else, or rehearsed the night before an interview.

This is **not** a changelog. `PROGRESS.md` records *what happened*. This book records *what it means*
and *how to defend it*.

---

## How each chapter is structured

Every chapter follows the same eight sections. Same order, every time, so the book stays scannable.

| Section | What goes in it |
|---|---|
| **1. What we built** | Three sentences. No jargon. What exists now that did not before. |
| **2. Why it exists** | The problem, and what breaks without this. Concrete failure, not theory. |
| **3. The decision** | The options that were on the table, the choice, and the trade-off accepted. This is the part interviewers probe. |
| **4. How it works** | The actual artefacts — Dockerfile, workflow, manifest — pasted and annotated line by line. Why *this* line, not a generic explanation. |
| **5. Do it yourself** | The exact commands, in order, from a clean machine. What you should see after each. |
| **6. Really ready** | The checklist that separates "it runs on my laptop" from "I would put this in production". Every item either ticked with evidence or explicitly deferred with a reason. |
| **7. Break it** | Faults to inject on purpose, the symptom you should expect, and the command that finds the cause. This is what turns reading into skill. |
| **8. Interview practice** | Questions with answers at three levels: *one-liner* (say it out loud), *detail* (the follow-up), *trap* (the question that catches people who only watched a video). |

Each chapter ends with **Numbers to remember** — the handful of figures you should be able to quote
(e.g. "the API image is X MB because..."). Interviewers remember specifics.

---

## Chapters

| # | Chapter | Status |
|---|---|---|
| 01 | Docker & Compose — packaging the API, the web app and the database | ✅ written & verified |
| 02 | CI/CD — GitHub Actions, Trivy, GHCR | ✅ written & verified (gate advisory) |
| 03 | Terraform + LocalStack — infrastructure as code | ⬜ |
| 04 | Kubernetes & Helm — running it properly | ⬜ |
| 05 | Observability — metrics, logs, SLOs, alerting | ⬜ |
| 06 | GitOps — Argo CD, drift, secrets | ⬜ |
| 07 | Hardening — auth, secrets, supply chain | ⬜ |

---

## Interview bank

`interview/` holds the running question bank, grouped by theme, not by chapter — because real
interviews jump. Each answer is written to be **spoken**, not read.

- `interview/docker.md`
- `interview/cicd.md`
- `interview/kubernetes.md`
- `interview/observability.md`
- `interview/system-design.md` — how to describe *this* project in 90 seconds

---

## Rules for writing in this book

1. **Numbers over adjectives.** "Image went from 71 MB to 52 MB" beats "we optimised it".
2. **Every claim has a command.** If you cannot paste the command that proves it, it is not a fact yet.
3. **Record the wrong turns.** The option you rejected, and why, is more valuable than the one you took.
4. **No copy-paste without annotation.** A pasted file with no comments is a bookmark, not a chapter.
5. **Write the trap questions honestly.** The ones that would catch *you*.
