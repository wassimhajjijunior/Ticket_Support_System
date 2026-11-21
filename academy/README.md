# DevOps Academy — a 3D, slide-by-slide workshop program

Eleven sessions, 61 slides, four 3D simulations. Light mode, no build step, works offline.
**Language-agnostic on purpose**: "your build tool", not a specific one.

---

## Run it

```powershell
cd C:\Users\LENOVO\Desktop\HelloWorld\Stage\Stage1
python -m http.server 4173 --directory academy
```

Open **http://localhost:4173**. Three.js is vendored (`academy/vendor/`), so a hall without wifi still runs it.

---

## Controls

| Action | Effect |
|---|---|
| `->` / `<-` / `PageUp` / `PageDown` | next / previous slide |
| `Home` / `End` | first / last slide |
| `Esc` | back to the program |
| Dots at the bottom | jump inside the current session |
| `3D` button | disable the scene (plain slides, still readable) |

---

## Structure

Each session is a sequence of slides. Every slide is one idea, and each one can carry:
a short lede, a bullet set, a stat row, a quote, a code block, a 3D scene, or a lab.

```
program
 └─ session (11)
     └─ slide (4-8 each)
         ├─ concept   (text you should be able to redraw)
         ├─ sim       (a 3D model you drive)
         └─ lab       (commands + expected output + checkpoint)
```

| File | Purpose |
|---|---|
| `index.html` | shell: canvas, bar, slide mount, pager |
| `content.js` | **all slide content** — edit this to change the program |
| `app.js` | router, slide renderer, simulation controllers, lab progress |
| `scenes.js` | the Three.js engine and the four scenes |
| `styles.css` | design tokens at the top |

---

## The four 3D simulations

| Session | Scene | What you drive |
|---|---|---|
| 01 Git | two spheres lanes, one local one remote | commit, push (spheres travel), open PR (ring), merge (ring turns green) |
| 02 Docker | seven stacked slabs | build (slabs appear), change source (layers 4-7 invalidate), dependency failure |
| 02 Compose | three boxes with health rings | `compose up` - db, api, web light up only in dependency order |
| 03 CI | six panels in perspective | run stages, arm a failing test, watch later stages stay dark |

The scene is stateful per slide: slides that need a starting state declare `sim.setup`, so
"open a PR" begins with commits already pushed.

---

## Program

| Session | Title | Length |
|---|---|---|
| 00 | Orientation - the whole map | 60 min |
| 01 | Git - the commit-to-production graph | 75 min |
| 02 | Docker - image, layers, Dockerfile, Compose | 120 min |
| 03 | CI - the pipeline, stage by stage | 90 min |
| 04 | Registry - versions, digests, rollback | 60 min |
| 05 | Security - scan the artefact you ship | 75 min |
| 06 | Terraform - infrastructure you can review | 120 min |
| 07 | Kubernetes - probes, rollouts, why pods die | 120 min |
| 08 | Observability - one good alert | 90 min |
| 09 | GitOps - git as the desired state | 90 min |
| 10 | Capstone - one commit, end to end | half day |

Sessions 04-10 are lab-first: no simulation, because the real tool is one command away.

---

## Editing

Everything you would change lives in `content.js`. A slide looks like:

```js
{
  kicker: "session 02 / slide 2",
  title: "Cache is the<br>whole game",
  lede: "...",
  points: [["Rule", "..."], ["Symptom", "..."]],
  viz: "docker",                       // scene shown behind the slide
  sim: { kind: "docker", title: "...", setup: [],
         buttons: [{ label: "build", action: "build", primary: true }] },
  lab: [{ title, body, cmd?, expect?, checkpoint? }]
}
```

Rendered by `app.js`; no other file needs to know.

---

## Verified

Driven in headless Chrome against the served site, cache disabled:

- 11 session cards; WebGL context live (canvas 1440x1000, `no-3d` false)
- Git sim: two commits -> two log lines, spheres appear
- CI sim: run -> 8 log lines, stages turn green in order
- Docker sim: build -> slabs appear; source change invalidates the last four
- Compose sim: up -> 7 log lines, services light in dependency order
- Lab checkpoint persists (footer counter updates)
- 360 px: no horizontal overflow
- console errors: **0**

## Known limitations

- Copy is English; translate `content.js` for a French session.
- 3D needs WebGL; the `3D` toggle and a no-WebGL fallback keep the text readable without it.
- No video, no PDF export - it is meant to be projected and driven live.
