# Workshop deck — From commit to production

A 3D presentation for a single-session DevOps workshop. Built as a static site: no build step, no npm
install, no internet at the venue.

---

## Run it

ES modules do not load from `file://`, so serve the folder:

```powershell
cd C:\Users\LENOVO\Desktop\HelloWorld\Stage\Stage1
python -m http.server 4173 --directory workshop
```

Open **http://localhost:4173**.

No Python? Any static server works: `npx --yes serve workshop -l 4173`.

Everything is vendored locally — `vendor/three.module.min.js` is checked in, so a hall with no wifi still
runs this.

---

## Controls

| Action | Effect |
|---|---|
| `←` `→` / `PageUp` `PageDown` / `Space` | previous / next slide |
| `Home` / `End` | first / last slide |
| `Esc` | back to the title |
| Click a stage in the architecture list (slide 5) | jumps to that stage's slide and flies the camera |
| Click a 3D node (mouse or trackpad) | same jump, from the scene itself |
| Right-hand rail | jump to any slide |

---

## What's inside

| File | Purpose |
|---|---|
| `index.html` | shell: canvas, HUD, rail, import map |
| `content.js` | **all slide copy** — edit this to change the deck |
| `main.js` | renders slides from `content.js`, scroll/keyboard nav, Three.js scene |
| `styles.css` | the whole visual system (tokens at the top) |
| `SCRIPT.md` | the spoken track, beat by beat |
| `vendor/three.module.min.js` | Three.js, vendored for offline use |

**To change words, edit `content.js` only.** Each entry is one beat; the renderer understands `facts`,
`points`, `ladder`, `columns`, `tool`, `lesson` and a few flags (`loop`, `diagram`, `architecture`, `live`).

---

## The 18 beats

1. Title — from commit to production
2. Why now — delivery is a rate, not an event
3. The wall between dev and ops
4. The lifecycle loop
5. Architecture — nine stages (the interactive hub)
6. Source · 7. CI · 8. Package · 9. Security · 10. Registry
11. IaC · 12. Kubernetes · 13. Observability · 14. GitOps
15. The job — build, protect, operate, improve + DORA
16. Live — this repository
17. Go deeper — learning ladder + exercises
18. Close — the judgement, not the tools

Stage slides 6–14 are the nine nodes of the 3D pipeline. Selecting one flies the camera to it.

---

## Design constraints held

- One accent colour (`--accent`, signal orange). Near-black canvas. Hairlines for structure.
- Single type family, 2–3 sizes, tight tracking on display text.
- Motion 300–700 ms, ease-out; no bounce, no infinite float on text.
- `prefers-reduced-motion` stops camera drift and renders on demand — verified.
- Mobile at 360 px with no horizontal scroll — verified.
- Zero console errors, zero failed requests — verified in headless Chrome.

---

## Known limitations

- The 3D scene is deliberately low-poly and needs WebGL; without it the deck falls back to plain slides
  (text still reads).
- Copy is English. If the session is in French, translate `content.js` — nothing else needs to change.
- There is no print/PDF export; it is meant to be projected.
