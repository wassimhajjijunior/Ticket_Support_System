import { createEngine } from "./scenes.js";

const PROGRAM = window.PROGRAM || [];
const slideEl = document.getElementById("slide");
const pager = document.getElementById("pager");
const barSession = document.getElementById("bar-session");
const footLeft = document.getElementById("foot-left");
const footRight = document.getElementById("foot-right");
const STORE = "academy-labs-v2";

const engine = createEngine(document.getElementById("scene"));

/* ---------------------------------------------------------------- state */
const flat = [];
PROGRAM.forEach(function (s, si) {
  (s.slides || []).forEach(function (sl, li) { flat.push({ s: s, si: si, sl: sl, li: li }); });
});

let done = load();
let currentIndex = -1;
let simLog = [];
let simFailArmed = false;
let timers = [];

function load() {
  try { return new Set(JSON.parse(localStorage.getItem(STORE) || "[]")); }
  catch (e) { return new Set(); }
}
function save() {
  try { localStorage.setItem(STORE, JSON.stringify(Array.from(done))); } catch (e) {}
}
function paintProgress() {
  let total = 0;
  PROGRAM.forEach(function (s) {
    (s.slides || []).forEach(function (sl) { total += (sl.lab || []).filter(function (l) { return l.checkpoint; }).length; });
  });
  footRight.textContent = done.size + " / " + total + " labs done";
}

const esc = function (s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

function clearTimers() { timers.forEach(function (t) { clearTimeout(t); }); timers = []; }
function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

/* ---------------------------------------------------------------- render */
function renderSlide(entry) {
  clearTimers();
  const sl = entry.sl;
  const parts = [];

  parts.push('<div class="slide-in">');
  parts.push('<p class="kicker">' + esc(sl.kicker || "") + "</p>");
  parts.push("<h1>" + (sl.title || "") + "</h1>");
  if (sl.lede) parts.push('<p class="lede">' + sl.lede + "</p>");
  if (sl.body) parts.push('<div class="body">' + sl.body + "</div>");

  if (sl.points) {
    parts.push('<ul class="points">' + sl.points.map(function (p) {
      return "<li><b>" + esc(p[0]) + "</b> " + esc(p[1]) + "</li>";
    }).join("") + "</ul>");
  }

  if (sl.stats) {
    parts.push('<div class="stats">' + sl.stats.map(function (p) {
      return '<div class="stat"><b>' + esc(p[0]) + "</b><span>" + esc(p[1]) + "</span></div>";
    }).join("") + "</div>");
  }

  if (sl.quote) {
    parts.push('<blockquote class="quote">' + esc(sl.quote) +
      (sl.quoteAttr ? "<span>" + esc(sl.quoteAttr) + "</span>" : "") + "</blockquote>");
  }

  if (sl.code) parts.push(codeBlock(sl.code.label, sl.code.snippet));

  if (sl.sim) {
    parts.push('<div class="sim-ui" id="sim-ui">' +
      '<div class="sim-head"><span class="sim-title">' + esc(sl.sim.title) + "</span>" +
      '<div class="sim-actions">' + (sl.sim.buttons || []).map(function (b) {
        return '<button class="btn' + (b.primary ? " primary" : "") + '" data-sim="' + esc(b.action) + '">' + esc(b.label) + "</button>";
      }).join("") + "</div></div>" +
      '<div class="sim-state" id="sim-state" aria-live="polite"></div>' +
      "</div>");
  }

  if (sl.lab) {
    parts.push('<div class="lab">' + sl.lab.map(function (l, i) {
      const key = entry.s.id + ":" + entry.li + ":" + i;
      const checked = done.has(key) ? " checked" : "";
      return '<div class="lab-step"><div class="lab-num">' + String(i + 1).padStart(2, "0") + "</div><div>" +
        "<h4>" + esc(l.title) + "</h4><p>" + esc(l.body) + "</p>" +
        (l.cmd ? codeBlock("terminal", l.cmd) : "") +
        (l.expect ? '<div class="expect">' + esc(l.expect) + "</div>" : "") +
        (l.checkpoint ? '<label class="check"><input type="checkbox" data-lab="' + key + '"' + checked + "><span>" + esc(l.checkpoint) + "</span></label>" : "") +
        "</div></div>";
    }).join("") + "</div>");
  }

  parts.push("</div>");
  slideEl.innerHTML = parts.join("");

  wireCopy();
  wireLabs();
  wireSim(entry.sl);

  barSession.textContent = "session " + entry.s.n + " - " + entry.s.title;
  document.title = entry.s.title + " - DevOps Academy";

  simLog = [];
  simFailArmed = false;
  paintSim();

  if (engine.isReady()) {
    engine.show(entry.sl.viz || (entry.sl.sim ? entry.sl.sim.kind : "abstract"));
    if (entry.sl.sim && entry.sl.sim.setup) {
      entry.sl.sim.setup.forEach(function (a) { const r = engine.action(a); if (r) simLog.push({ msg: r, cls: "" }); });
      paintSim();
    }
  }
}

function codeBlock(label, text) {
  const id = "c" + Math.random().toString(36).slice(2, 8);
  return '<div class="code"><div class="code-bar"><span>' + esc(label) + "</span>" +
    '<button class="copy" data-copy="' + id + '">copy</button></div>' +
    '<pre id="' + id + '"><code>' + esc(text) + "</code></pre></div>";
}

function wireCopy() {
  slideEl.querySelectorAll(".copy").forEach(function (b) {
    b.addEventListener("click", function () {
      const el = document.getElementById(b.dataset.copy);
      if (!el) return;
      const text = el.innerText;
      const ok = function () {
        b.textContent = "copied";
        later(function () { b.textContent = "copy"; }, 1400);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(ok, fallback); else fallback();
      function fallback() {
        const ta = document.createElement("textarea");
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); ok(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });
  });
}

function wireLabs() {
  slideEl.querySelectorAll("[data-lab]").forEach(function (cb) {
    cb.addEventListener("change", function () {
      if (cb.checked) done.add(cb.dataset.lab); else done.delete(cb.dataset.lab);
      save(); paintProgress();
    });
  });
}

/* ---------------------------------------------------------------- sim */
function say(msg, cls) {
  simLog.push({ msg: msg, cls: cls || "" });
  paintSim();
}

function paintSim() {
  const box = document.getElementById("sim-state");
  if (!box) return;
  if (!simLog.length) {
    box.innerHTML = '<div><i>--</i><span>use the controls above - the 3D scene reflects each action</span></div>';
    return;
  }
  box.innerHTML = simLog.slice(-9).map(function (l) {
    return '<div><i>' + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) +
      '</i><span class="' + l.cls + '">' + esc(l.msg) + "</span></div>";
  }).join("");
  box.scrollTop = box.scrollHeight;
}

function wireSim(sl) {
  if (!sl.sim) return;
  slideEl.querySelectorAll("[data-sim]").forEach(function (b) {
    b.addEventListener("click", function () { runAction(b.dataset.sim, b); });
  });
}

function runAction(action, btn) {
  const kind = currentSlide().sl.sim ? currentSlide().sl.sim.kind : null;
  if (!kind) return;

  if (kind === "pipeline") {
    if (action === "run") return runPipeline();
    if (action === "fail") {
      simFailArmed = !simFailArmed;
      btn.setAttribute("aria-pressed", String(simFailArmed));
      const r = engine.isReady() ? engine.action("failToggle", simFailArmed) : "";
      say(r || (simFailArmed ? "failing test armed" : "test fixed"), simFailArmed ? "warn" : "ok");
      return;
    }
  }

  if (kind === "compose") {
    if (action === "up") return runCompose();
    if (action === "down") { engine.action("reset"); say("compose down - containers removed, volume kept"); return; }
  }

  if (kind === "git" && action === "commitPush") {
    const a = engine.action("commit");
    const b = engine.action("push");
    say(a); say(b, "ok");
    return;
  }

  if (kind === "docker" && action === "change") {
    const r = engine.action("change");
    say(r, "warn");
    return;
  }

  const r = engine.action(action);
  if (r) say(r, action === "reset" || action === "down" ? "" : "ok");
}

function runPipeline() {
  engine.action("begin");
  say("pipeline started");
  const names = ["checkout", "setup", "build", "test", "scan", "push"];
  const failAt = simFailArmed ? 3 : -1;
  let i = 0;

  function step() {
    if (i >= names.length) {
      engine.action("done");
      say("pipeline passed - artefact built and published", "ok");
      return;
    }
    engine.action("stage", i);
    say(names[i] + " ...");
    if (i === failAt) {
      say("test failed - scan and push never run", "fail");
      say("nothing was published. that is the point.", "warn");
      return;
    }
    i++;
    later(step, 620);
  }
  step();
}

function runCompose() {
  const names = ["db", "api", "web"];
  let i = 0;
  function next() {
    if (i >= names.length) { say("all healthy - web is serving", "ok"); return; }
    engine.action("start", i);
    say(names[i] + " starting" + (i > 0 ? " (waiting for " + names[i - 1] + " healthy)" : ""));
    later(function () {
      engine.action("healthy", i);
      say(names[i] + " healthy", "ok");
      i++;
      later(next, 320);
    }, 720);
  }
  next();
}

/* ---------------------------------------------------------------- nav */
function currentSlide() { return flat[currentIndex]; }

function goTo(index) {
  if (index < 0 || index >= flat.length) return;
  const entry = flat[index];
  const sameSession = currentIndex >= 0 && flat[currentIndex].s.id === entry.s.id;
  currentIndex = index;
  location.hash = "#/" + entry.s.id + "/" + entry.li;
  renderSlide(entry);
  if (!sameSession) window.scrollTo(0, 0);
  paintPager();
}

function paintPager() {
  const entry = currentSlide();
  if (!entry) { pager.innerHTML = ""; return; }
  const sessionSlides = flat.filter(function (f) { return f.s.id === entry.s.id; });
  const posInSession = sessionSlides.indexOf(entry);

  const dots = sessionSlides.map(function (f, i) {
    return '<button class="dot' + (i === posInSession ? " on" : "") + '" data-dot="' + flat.indexOf(f) + '" aria-label="slide ' + (i + 1) + '"></button>';
  }).join("");

  pager.innerHTML =
    '<button id="prev" aria-label="previous"' + (currentIndex === 0 ? " disabled" : "") + ">&lt;</button>" +
    '<div class="dots">' + dots + "</div>" +
    '<span class="count">' + String(currentIndex + 1).padStart(2, "0") + " / " + flat.length + "</span>" +
    '<button id="next" aria-label="next"' + (currentIndex === flat.length - 1 ? " disabled" : "") + ">&gt;</button>";

  const prev = document.getElementById("prev");
  const next = document.getElementById("next");
  if (prev) prev.addEventListener("click", function () { goTo(currentIndex - 1); });
  if (next) next.addEventListener("click", function () { goTo(currentIndex + 1); });
  pager.querySelectorAll("[data-dot]").forEach(function (d) {
    d.addEventListener("click", function () { goTo(Number(d.dataset.dot)); });
  });
}

function renderHome() {
  currentIndex = -1;
  const cards = PROGRAM.map(function (s) {
    return '<button class="session-card" data-session="' + s.id + '">' +
      '<span class="n">session ' + s.n + "</span>" +
      "<h3>" + esc(s.title) + "</h3>" +
      "<p>" + esc(s.short) + "</p>" +
      '<span class="m">' + esc(s.duration) + " / " + esc(s.level) + "</span></button>";
  }).join("");

  slideEl.innerHTML =
    '<div class="slide-in">' +
      '<p class="kicker">11 sessions / 3D simulations / language-agnostic labs</p>' +
      "<h1>Learn DevOps by<br>building the loop.</h1>" +
      '<p class="lede">Each session is one workshop told slide by slide: a concept you can redraw, a 3D model you drive ' +
      'until it breaks, and a lab you run on your own machine. No specific language, no specific framework - ' +
      "the same ideas behind any stack.</p>" +
      '<ul class="points">' +
        "<li><b>Concept</b> - short, opinionated, and complete enough to explain to someone else.</li>" +
        "<li><b>Simulation</b> - you click, the model reacts; break it and see what changes.</li>" +
        "<li><b>Lab</b> - real commands, expected output, one checkpoint each.</li>" +
      "</ul>" +
      '<div class="home-grid">' + cards + "</div>" +
    "</div>";

  slideEl.querySelectorAll("[data-session]").forEach(function (b) {
    b.addEventListener("click", function () {
      const idx = flat.findIndex(function (f) { return f.s.id === b.dataset.session; });
      if (idx >= 0) goTo(idx);
    });
  });

  barSession.textContent = "program overview";
  document.title = "DevOps Academy";
  pager.innerHTML = '<span class="count">' + flat.length + " slides</span>";
  footLeft.textContent = "11 sessions / 3D simulations / language-agnostic labs";
  if (engine.isReady()) engine.show("abstract");
}

/* ---------------------------------------------------------------- router */
function route() {
  const raw = location.hash.replace(/^#\/?/, "");
  if (!raw) { renderHome(); return; }
  const parts = raw.split("/");
  const sid = parts[0];
  const li = parts[1] ? Number(parts[1]) : 0;
  const idx = flat.findIndex(function (f) { return f.s.id === sid && f.li === li; });
  if (idx === -1) { renderHome(); return; }
  currentIndex = idx;
  renderSlide(flat[idx]);
  paintPager();
}

document.addEventListener("keydown", function (e) {
  if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); goTo(currentIndex + 1); }
  else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); goTo(currentIndex - 1); }
  else if (e.key === "Home") { e.preventDefault(); goTo(0); }
  else if (e.key === "End") { e.preventDefault(); goTo(flat.length - 1); }
  else if (e.key === "Escape") { location.hash = "#/"; }
});

document.getElementById("scenes-toggle").addEventListener("click", function (e) {
  const on = e.currentTarget.getAttribute("aria-pressed") !== "true";
  e.currentTarget.setAttribute("aria-pressed", String(on));
  engine.setEnabled(on);
});

document.getElementById("reset-labs").addEventListener("click", function () {
  if (!confirm("Clear all lab checkpoints?")) return;
  done = new Set(); save(); paintProgress(); route();
});

window.addEventListener("hashchange", route);
paintProgress();
route();

