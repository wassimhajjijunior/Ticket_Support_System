import * as THREE from "three";

/* ------------------------------------------------------------------ data */
const SLIDES = window.SLIDES || [];
const STAGE_NAMES = [
  "source", "ci", "package", "security", "registry",
  "iac", "kubernetes", "observability", "gitops"
];

/* ------------------------------------------------------------------ render DOM */
const deck = document.getElementById("deck");
const rail = document.getElementById("rail");
const counter = document.getElementById("counter");
const progressBar = document.getElementById("progress-bar");

const esc = (s) => String(s ?? "");

function slideHTML(s, i) {
  const parts = [];
  parts.push(`<p class="kicker">${esc(s.kicker)}</p>`);
  parts.push(`<h1>${s.title}</h1>`);
  if (s.lede) parts.push(`<p class="lede">${s.lede}</p>`);

  if (s.facts) {
    parts.push(`<div class="facts">${s.facts.map(([n, t]) =>
      `<div class="fact"><b>${esc(n)}</b><span>${esc(t)}</span></div>`).join("")}</div>`);
    if (s.source) parts.push(`<p class="source">source · ${esc(s.source)}</p>`);
  }

  if (s.diagram === "wall") {
    parts.push(`<div class="wall-diagram">
      <div class="wall-side"><h3>developers</h3><p>rewarded for change</p></div>
      <div class="wall-bar">the handoff</div>
      <div class="wall-side"><h3>operations</h3><p>rewarded for stability</p></div>
    </div>`);
  }

  if (s.points) {
    parts.push(`<ul class="points">${s.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>`);
  }

  if (s.loop) {
    parts.push(`<div class="loop">
      <i>plan</i><i>code</i><i>build</i><i>test</i>
      <i>release</i><i>deploy</i><i>operate</i><i>monitor</i>
    </div>`);
  }

  if (s.architecture) {
    parts.push(`<div class="stage-grid">${STAGE_NAMES.map((n, idx) =>
      `<button class="stage-chip" data-jump="${idx}">
        <b>0${idx + 1}</b><span>${esc(n)}</span><i aria-hidden="true">→</i>
      </button>`).join("")}</div>`);
  }

  if (s.tool || s.lesson) {
    parts.push(`<div class="mark">
      ${s.tool ? `<div class="mark-row"><span class="mark-k">tool</span><span class="mark-v tool">${esc(s.tool)}</span></div>` : ""}
      ${s.lesson ? `<div class="mark-row"><span class="mark-k">takeaway</span><span class="mark-v lesson">${esc(s.lesson)}</span></div>` : ""}
    </div>`);
  }

  if (s.columns) {
    parts.push(`<div class="columns">${s.columns.map(([h, t]) =>
      `<div class="col"><h3>${esc(h)}</h3><p>${esc(t)}</p></div>`).join("")}</div>`);
    if (s.metrics) {
      parts.push(`<div class="metrics">${s.metrics.map((m) => `<span>${esc(m)}</span>`).join("")}</div>`);
      if (s.metricsNote) parts.push(`<p class="metrics-note">${esc(s.metricsNote)}</p>`);
    }
  }

  if (s.ladder) {
    parts.push(`<div class="ladder">${s.ladder.map(([n, t, d]) =>
      `<div class="ladder-row"><b>${esc(n)}</b><span class="t">${esc(t)}</span><span class="d">${esc(d)}</span></div>`).join("")}</div>`);
    if (s.exercises) {
      parts.push(`<div class="exercises"><h3>try this week</h3><ul>${s.exercises.map((e) => `<li>${esc(e)}</li>`).join("")}</ul></div>`);
    }
  }

  if (s.live) {
    const cells = [
      ["api", "Spring Boot 3.5 · Java 21"],
      ["database", "PostgreSQL 16 · Flyway"],
      ["web", "Next.js 15 · React 19"],
      ["pipeline", "GitHub Actions → GHCR"],
      ["security", "Trivy · SHA tags"],
      ["runtime", "Docker · Compose · healthchecks"]
    ];
    parts.push(`<div class="live-grid">${cells.map(([k, v]) =>
      `<div class="live-cell"><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join("")}</div>`);
  }

  if (s.note && s.kind !== "close" && s.kind !== "title") parts.push(`<p class="title-note">${esc(s.note)}</p>`);
  if (s.kind === "close" && s.note) parts.push(`<p class="title-note">${esc(s.note)}</p>`);

  return `<div class="slide-in">${parts.join("")}</div>`;
}

deck.innerHTML = SLIDES.map((s, i) =>
  `<section class="slide${i === 0 ? " is-active" : ""}" data-slide="${i}" data-id="${s.id}" data-node="${s.node ?? ""}">
     ${slideHTML(s, i)}
   </section>`).join("");

rail.innerHTML = SLIDES.map((s, i) =>
  `<button data-goto="${i}" aria-label="Slide ${i + 1}: ${esc(s.id)}"${i === 0 ? ' class="on"' : ""}></button>`).join("");

const sections = Array.from(deck.querySelectorAll(".slide"));
const railButtons = Array.from(rail.querySelectorAll("button"));
let activeIndex = 0;

/* ------------------------------------------------------------------ navigation */
function goTo(i) {
  const target = sections[Math.max(0, Math.min(sections.length - 1, i))];
  if (!target) return;
  target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
}

function setActive(i) {
  if (i === activeIndex) return;
  activeIndex = i;
  sections.forEach((s, idx) => { s.classList.toggle("is-active", idx === i); });
  railButtons.forEach((b, idx) => { b.classList.toggle("on", idx === i); });
  counter.textContent = `${String(i + 1).padStart(2, "0")} / ${String(SLIDES.length).padStart(2, "0")}`;
  progressBar.style.width = `${((i + 1) / SLIDES.length) * 100}%`;
  focusStage(sections[i].dataset.node);
}

rail.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-goto]");
  if (b) goTo(Number(b.dataset.goto));
});

deck.addEventListener("click", (e) => {
  const jump = e.target.closest("[data-jump]");
  if (!jump) return;
  const node = Number(jump.dataset.jump);
  const target = sections.find((s) => Number(s.dataset.node) === node);
  if (target) goTo(sections.indexOf(target));
});

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
    e.preventDefault(); goTo(activeIndex + 1);
  } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
    e.preventDefault(); goTo(activeIndex - 1);
  } else if (e.key === "Escape") {
    goTo(0);
  } else if (e.key === "Home") {
    e.preventDefault(); goTo(0);
  } else if (e.key === "End") {
    e.preventDefault(); goTo(sections.length - 1);
  }
});

const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) setActive(Number(en.target.dataset.slide));
  });
}, { threshold: 0.55 });
sections.forEach((s) => { io.observe(s); });

/* ------------------------------------------------------------------ three */
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.getElementById("stage");
if (prefersReduced) document.getElementById("reduced-badge").hidden = false;

let renderer, scene, camera, clock;
let nodes = [];
let curveLine, particles, particleData = [];
let cameraTarget = new THREE.Vector3(0, 0.6, 8);
let lookTarget = new THREE.Vector3(0, 0, 0);
let hovered = -1;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch { return false; }
}

function buildScene() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0a0b0d, 14, 52);

  camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 220);
  camera.position.set(0, 0.8, 9);

  scene.add(new THREE.AmbientLight(0x7f8a8f, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(4, 6, 8);
  scene.add(key);
  const rim = new THREE.PointLight(0xff6a3d, 18, 26, 2);
  rim.position.set(-4, -2, -6);
  scene.add(rim);

  const positions = STAGE_NAMES.map((_, i) => new THREE.Vector3(
    Math.sin(i * 0.86) * 3.1,
    Math.cos(i * 0.68) * 1.15,
    -i * 5.4
  ));

  const curve = new THREE.CatmullRomCurve3(positions);
  const geoLine = new THREE.BufferGeometry().setFromPoints(curve.getPoints(220));
  curveLine = new THREE.Line(geoLine, new THREE.LineBasicMaterial({ color: 0x3a4044, transparent: true, opacity: 0.55 }));
  scene.add(curveLine);

  const core = new THREE.SphereGeometry(0.52, 22, 16);
  const shell = new THREE.IcosahedronGeometry(0.92, 1);
  positions.forEach((p, i) => {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1b2023, emissive: 0x000000, roughness: 0.35, metalness: 0.35
    });
    const mesh = new THREE.Mesh(core, mat);
    mesh.position.copy(p);
    mesh.userData.index = i;
    scene.add(mesh);

    const wire = new THREE.Mesh(shell, new THREE.MeshBasicMaterial({
      color: 0x2e353a, wireframe: true, transparent: true, opacity: 0.5
    }));
    wire.position.copy(p);
    wire.userData.parentIndex = i;
    scene.add(wire);

    nodes.push({ mesh, wire, base: p.clone(), mat, index: i });
  });

  // flowing packets along the curve
  const count = 220;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(count * 3);
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0xff6a3d, size: 0.055, transparent: true, opacity: 0.85, sizeAttenuation: true
  }));
  scene.add(particles);
  particleData = Array.from({ length: count }, (_, i) => ({
    t: i / count,
    speed: 0.018 + Math.random() * 0.022
  }));

  clock = new THREE.Clock();
  window.addEventListener("resize", onResize, { passive: true });
  onResize();
}

function onResize() {
  if (!renderer) return;
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

/* camera flies to the stage a slide is about */
function focusStage(nodeIndexRaw) {
  if (!scene) return;
  const idx = nodeIndexRaw === "" || nodeIndexRaw == null ? null : Number(nodeIndexRaw);

  if (idx == null || Number.isNaN(idx) || !nodes[idx]) {
    // overview: pull back and look down the pipeline
    cameraTarget.set(0, 1.4, 8.5);
    lookTarget.set(0, 0, -12);
    nodes.forEach((n, i) => { setNodeState(n, false, i === (activeIndex % STAGE_NAMES.length)); });
    return;
  }

  const n = nodes[idx];
  // look to the LEFT of the node so the node itself sits in the right third,
  // clear of the text column
  cameraTarget.set(n.base.x, n.base.y + 0.9, n.base.z + 9.4);
  lookTarget.set(n.base.x - 2.6, n.base.y + 0.15, n.base.z);
  nodes.forEach((m, i) => { setNodeState(m, i === idx, false); });
}

function setNodeState(n, active, subtle) {
  const targetColor = active ? 0xff6a3d : 0x1b2023;
  const emissive = active ? 0xff6a3d : (subtle ? 0x221610 : 0x000000);
  n.mat.color.setHex(targetColor);
  n.mat.emissive.setHex(emissive);
  n.mat.emissiveIntensity = active ? 1.9 : (subtle ? 0.55 : 0.05);
  n.wire.material.color.setHex(active ? 0xffb59a : 0x2e353a);
  n.wire.material.opacity = active ? 0.85 : 0.45;
  n.scaleTarget = active ? 1.05 : 1;
}

/* ------------------------------------------------------------------ pointer */
let downPt = null;

canvas.addEventListener("pointerdown", (e) => { downPt = { x: e.clientX, y: e.clientY }; });

canvas.addEventListener("pointerup", (e) => {
  if (!downPt) return;
  const moved = Math.hypot(e.clientX - downPt.x, e.clientY - downPt.y);
  downPt = null;
  if (moved > 8) return; // it was a drag, not a click

  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(nodes.map((n) => n.mesh), false)[0];
  if (!hit) return;
  const node = hit.object.userData.index;
  const target = sections.find((s) => Number(s.dataset.node) === node);
  if (target) goTo(sections.indexOf(target));
});

canvas.addEventListener("pointermove", (e) => {
  if (!scene) return;
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(nodes.map((n) => n.mesh), false)[0];
  const idx = hit ? hit.object.userData.index : -1;
  if (idx !== hovered) {
    hovered = idx;
    canvas.style.cursor = idx >= 0 ? "pointer" : "default";
  }
});

/* ------------------------------------------------------------------ loop */
function projectParticles(time) {
  if (!particles) return;
  const pos = particles.geometry.attributes.position.array;
  for (let i = 0; i < particleData.length; i++) {
    const d = particleData[i];
    const t = prefersReduced ? d.t : (d.t + time * d.speed) % 1;
    const p = curvePoint(t);
    pos[i * 3] = p.x;
    pos[i * 3 + 1] = p.y;
    pos[i * 3 + 2] = p.z;
  }
  particles.geometry.attributes.position.needsUpdate = true;
}

let curveCache = null;
function curvePoint(t) {
  if (!curveCache) curveCache = new THREE.CatmullRomCurve3(
    STAGE_NAMES.map((_, i) => new THREE.Vector3(
      Math.sin(i * 0.86) * 3.1,
      Math.cos(i * 0.68) * 1.15,
      -i * 5.4
    ))
  );
  return curveCache.getPointAt(Math.max(0, Math.min(1, t)));
}

function animate() {
  requestAnimationFrame(animate);
  const time = prefersReduced ? 0 : clock.getElapsedTime();

  if (!prefersReduced) {
    camera.position.lerp(cameraTarget, 0.055);

  } else {
    camera.position.copy(cameraTarget);
  }

  camera.lookAt(lookTarget.x, lookTarget.y, lookTarget.z);

  nodes.forEach((n) => {
    const target = n.scaleTarget ?? 1;
    const s = n.mesh.scale.x + (target - n.mesh.scale.x) * 0.12;
    n.mesh.scale.setScalar(s);
    n.wire.scale.setScalar(s * 1.05);
    // a node right next to the camera renders as a huge unlit blob — hide it
    const near = camera.position.distanceTo(n.base) < 5.6;
    n.mesh.visible = !near;
    n.wire.visible = !near;
    if (!prefersReduced) {
      n.wire.rotation.y += 0.0018 + n.index * 0.00012;
      n.wire.rotation.x += 0.0006;
    }
  });

  projectParticles(time);
  renderer.render(scene, camera);
}

/* reduced motion: draw on demand, not in a loop */
function drawOnce() {
  if (!renderer) return;
  camera.position.copy(cameraTarget);
  camera.lookAt(lookTarget);
  nodes.forEach((n) => {
    const target = n.scaleTarget ?? 1;
    n.mesh.scale.setScalar(target);
    n.wire.scale.setScalar(target * 1.05);
  });
  projectParticles(0);
  renderer.render(scene, camera);
}

function boot() {
  if (!hasWebGL()) {
    document.body.classList.add("no-webgl");
    return;
  }
  buildScene();
  setActive(0);
  focusStage(sections[0].dataset.node);

  if (prefersReduced) {
    drawOnce();
    document.addEventListener("keydown", () => setTimeout(drawOnce, 60));
    document.addEventListener("click", () => setTimeout(drawOnce, 350));
    document.addEventListener("scroll", () => setTimeout(drawOnce, 120), { passive: true });
  } else {
    animate();
  }
}

boot();

/* keep counter sane on first paint */
counter.textContent = `01 / ${String(SLIDES.length).padStart(2, "0")}`;
progressBar.style.width = `${(1 / SLIDES.length) * 100}%`;
