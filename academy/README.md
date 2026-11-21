# DevOps Academy — hands-on workshop program

A light-mode curriculum site. Each *session* is one workshop: **concept → simulation → lab → checkpoint**.
Sessions are designed to be delivered on separate days; each one assumes the previous.

The dark 3D deck in `../workshop/` is the **overview/pitch** (60–90 min). This folder is the **program**.

---

## Run it

```powershell
cd C:\Users\LENOVO\Desktop\HelloWorld\Stage\Stage1
python -m http.server 4173 --directory academy
```

Open **http://localhost:4173**. No build step, no dependencies, works offline.

---

## The program

| Day | Session | Duration | Needs |
|---|---|---|---|
| 1 | 00 Orientation — the map | 60 min | nothing |
| 2 | 01 Git — commit-to-production graph | 75 min | a terminal |
| 3–4 | 02 Docker — image, layers, Dockerfile, Compose | 120 min | Docker |
| 5 | 03 CI — the pipeline stage by stage | 90 min | a GitHub repo |
| 6 | 04 Registry & releases | 60 min | after CI |
| 7 | 05 Security — scanning the artefact | 75 min | after registry |
| 8–9 | 06 Terraform | 120 min | AWS or LocalStack |
| 10–11 | 07 Kubernetes | 120 min | kind |
| 12 | 08 Observability | 90 min | after Kubernetes |
| 13 | 09 GitOps | 90 min | after Kubernetes |
| 14 | 10 Capstone | half day | everything |

That is roughly **14 half-days**. If you only have one day, run 00, 01, 03 and the close of 10.

---

## Interactive simulations (4)

| Session | Simulation | What the room does |
|---|---|---|
| 01 Git | two-lane commit graph | commits locally, pushes, opens a PR, merges — sees which graph changed |
| 02 Docker | layer stack | builds, changes `src/`, watches exactly the later layers invalidate |
| 03 CI | 3D pipeline | runs stages, injects a failing test, watches the rest get skipped |
| 02 Compose | service order | starts db → api → web and sees health gates decide the order |

Two more are wired and ready to mount if you add `sim: "compose"` to a session in `content.js`.

---

## Structure

| File | Purpose |
|---|---|
| `index.html` | shell (top bar, app mount, footer) |
| `content.js` | **all session content** — concepts, labs, code snippets, diagrams |
| `app.js` | router, renderer, the four simulations, lab progress |
| `styles.css` | light design tokens at the top |

**To change a session, edit `content.js` only.** Each entry supports:

```
id, n, title, duration, level, short
goal
concept: { intro, points[[key, text]], diagram }
sim: "git" | "docker" | "compose" | "pipeline" | null
lab: [{ title, body, cmd?, expect?, checkpoint? }]
real: { path, lang, snippet }        // actual code from this repository
```

---

## Facilitation notes

- **Do not demo for more than 10 minutes at a time.** The sim is for them to drive; you narrate the *why*.
- **Every lab ends in a checkpoint.** The footer counter is the only progress metric; use it to see who is stuck.
- **The diagrams are deliberately simple** so they can be redrawn on a whiteboard from memory. That is the retention test.
- Sessions 06–10 have no simulation on purpose: the real tooling is one command away, and a fake cloud teaches the wrong lesson.

---

## What is verified

Driven in headless Chrome against the served site, cache disabled:

- 11 session cards render; 11 spine segments
- Git sim: commit ×2 then push → 2 local + 2 remote commits, 3 log lines
- Docker sim: 7 layers build, then changing `src/` invalidates 4
- CI sim: 6 stages all pass, summary `PASSED`
- 360 px: no horizontal overflow
- console errors: **0**

## Known limitations

- Copy is English; translate `content.js` for a French session.
- No video or slides — this is a lab-first site.
- Lab commands assume the repository in this project; adapt the paths if you reuse it elsewhere.
