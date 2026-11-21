/* Academy app: hash router, module renderer, simulations, lab progress. */
(function () {
  "use strict";

  var SESSIONS = window.SESSIONS || [];
  var app = document.getElementById("app");
  var footProgress = document.getElementById("foot-progress");
  var STORE = "academy-labs-v1";

  var done = load();
  function load() {
    try { return new Set(JSON.parse(localStorage.getItem(STORE) || "[]")); }
    catch (e) { return new Set(); }
  }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(Array.from(done))); } catch (e) {}
    paintProgress();
  }
  function paintProgress() {
    var total = 0;
    SESSIONS.forEach(function (s) { total += (s.lab || []).filter(function (l) { return l.checkpoint; }).length; });
    footProgress.textContent = done.size + " / " + total + " labs done";
  }

  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };

  /* ------------------------------------------------------------ diagrams */
  function svgWrap(inner, h) {
    return '<svg viewBox="0 0 420 ' + (h || 150) + '" role="img" aria-hidden="true">' + inner + "</svg>";
  }

  function diagramHTML(kind) {
    var box = 'fill="#fff" stroke="#cdc7b9"';
    var ink = 'fill="#14161a" font-family="ui-monospace,monospace" font-size="9"';
    var sub = 'fill="#8a9099" font-family="ui-monospace,monospace" font-size="8"';
    var acc = "#b8451f";

    if (kind === "loop") {
      var names = ["plan", "code", "build", "test", "release", "deploy", "operate", "monitor"];
      var cells = names.map(function (n, i) {
        var x = 14 + (i % 4) * 99, y = 22 + Math.floor(i / 4) * 58;
        return '<rect x="' + x + '" y="' + y + '" width="86" height="40" rx="2" ' + box + '/>' +
          '<text x="' + (x + 43) + '" y="' + (y + 25) + '" text-anchor="middle" ' + ink + '>' + n + "</text>";
      }).join("");
      return svgWrap(cells +
        '<path d="M400 82 C 412 100, 4 100, 12 82" fill="none" stroke="' + acc + '" stroke-width="1.4"/>' +
        '<text x="210" y="128" text-anchor="middle" ' + sub + '>the loop  -  skipping a stage moves it to production</text>', 140);
    }

    if (kind === "git") {
      return svgWrap(
        '<text x="14" y="18" ' + sub + '>LOCAL</text>' +
        '<text x="14" y="88" ' + sub + '>REMOTE</text>' +
        '<line x1="14" y1="42" x2="330" y2="42" stroke="#e2ded4" stroke-width="2"/>' +
        '<line x1="14" y1="112" x2="330" y2="112" stroke="#e2ded4" stroke-width="2"/>' +
        [0, 1, 2].map(function (i) {
          return '<circle cx="' + (44 + i * 52) + '" cy="42" r="9" fill="#fffdf9" stroke="#a9691a" stroke-width="1.6"/>';
        }).join("") +
        [0, 1].map(function (i) {
          return '<circle cx="' + (96 + i * 52) + '" cy="112" r="9" fill="#e4f3ec" stroke="#0f7b4f" stroke-width="1.6"/>';
        }).join("") +
        '<path d="M96 51 L96 103" stroke="' + acc + '" stroke-width="1.3" stroke-dasharray="3 3"/>' +
        '<text x="104" y="76" ' + sub + '>push copies commits</text>' +
        '<rect x="330" y="102" width="72" height="20" rx="2" fill="none" stroke="' + acc + '"/>' +
        '<text x="366" y="116" text-anchor="middle" ' + sub + '>PR + merge</text>', 140);
    }

    if (kind === "docker") {
      return svgWrap(
        '<text x="14" y="18" ' + sub + '>IMAGE = ORDERED LAYERS</text>' +
        [0, 1, 2, 3].map(function (i) {
          var y = 74 - i * 17;
          return '<rect x="24" y="' + y + '" width="200" height="15" rx="1" fill="#fff" stroke="#cdc7b9"/>' +
            '<text x="32" y="' + (y + 11) + '" ' + sub + '>' + ["FROM maven", "COPY pom", "COPY src", "RUN package"][i] + "</text>";
        }).join("") +
        '<rect x="240" y="24" width="152" height="66" rx="2" fill="#e4f3ec" stroke="#0f7b4f"/>' +
        '<text x="252" y="40" ' + sub + '>runtime stage</text>' +
        '<text x="252" y="56" ' + ink + '>JRE + app.jar</text>' +
        '<text x="252" y="72" ' + sub + '>no Maven, no src</text>' +
        '<path d="M228 60 L238 60" stroke="' + acc + '" stroke-width="1.4"/>' +
        '<text x="24" y="106" ' + sub + '>change src/ -> layers 1-2 stay cached</text>', 120);
    }

    if (kind === "ci") {
      var st = ["checkout", "setup", "build", "test", "scan", "push"];
      return svgWrap(st.map(function (n, i) {
        var x = 12 + i * 67;
        return '<rect x="' + x + '" y="34" width="58" height="46" rx="2" fill="#fff" stroke="#cdc7b9"/>' +
          '<text x="' + (x + 29) + '" y="54" text-anchor="middle" ' + ink + '>' + (i + 1) + "</text>" +
          '<text x="' + (x + 29) + '" y="70" text-anchor="middle" ' + sub + '>' + n + "</text>" +
          (i < st.length - 1 ? '<path d="M' + (x + 58) + ' 57 L' + (x + 66) + ' 57" stroke="#cdc7b9" stroke-width="1.4"/>' : "");
      }).join("") +
        '<text x="12" y="104" ' + sub + '>each stage is a different kind of proof; a red stage stops the rest</text>', 120);
    }

    // generic stage strip for the remaining sessions
    var gen = ["input", "transform", "verify", "output"].map(function (n, i) {
      var x = 24 + i * 96;
      return '<rect x="' + x + '" y="40" width="80" height="44" rx="2" ' + box + '/>' +
        '<text x="' + (x + 40) + '" y="66" text-anchor="middle" ' + ink + '>' + n + "</text>" +
        (i < 3 ? '<path d="M' + (x + 80) + ' 62 L' + (x + 94) + ' 62" stroke="#cdc7b9" stroke-width="1.4"/>' : "");
    }).join("");
    return svgWrap(gen + '<text x="24" y="110" ' + sub + ">" + esc(kind) + "  -  see the lab for the real workflow</text>", 128);
  }

  /* ------------------------------------------------------------ home */
  function renderHome() {
    var cards = SESSIONS.map(function (s, i) {
      return '<button class="session-card" data-goto="' + s.id + '">' +
        '<span class="n">session ' + s.n + "</span>" +
        "<h3>" + esc(s.title) + "</h3>" +
        "<p>" + esc(s.short) + "</p>" +
        '<span class="meta"><b>' + esc(s.duration) + "</b><b>" + esc(s.level) + "</b>" +
        (s.sim ? "<b>interactive</b>" : "") + "</span>" +
        "</button>";
    }).join("");

    var spine = SESSIONS.map(function (s, i) {
      return '<span class="spine-step' + (i === 0 ? " on" : "") + '"></span>';
    }).join("");

    app.innerHTML =
      '<section class="hero">' +
        '<p class="eyebrow">hands-on program  /  11 sessions</p>' +
        "<h1>Learn DevOps by running it,<br>one concept at a time.</h1>" +
        '<p class="lede">Not slides. Each session is a workshop: a concept you can draw, a simulation you can drive, ' +
        "real code from a working repository, and a lab you execute yourself. Sessions are designed to be delivered " +
        "on separate days  -  pick one, run it, and the next one builds on it.</p>" +
        '<div class="hero-meta">' +
          '<span class="chip">concept -> simulation -> lab -> checkpoint</span>' +
          '<span class="chip">4 interactive simulations</span>' +
          '<span class="chip">real repo, real commands</span>' +
        "</div>" +
      "</section>" +
      '<section class="spine"><div class="spine-track">' + spine + "</div>" +
        '<div class="program">' + cards + "</div>" +
      "</section>";

    app.querySelectorAll("[data-goto]").forEach(function (b) {
      b.addEventListener("click", function () { location.hash = "#/" + b.dataset.goto; });
    });
  }

  /* ------------------------------------------------------------ module */
  function renderModule(id) {
    var s = SESSIONS.find(function (x) { return x.id === id; });
    if (!s) { location.hash = "#/"; return; }
    var idx = SESSIONS.indexOf(s);

    var points = (s.concept.points || []).map(function (p) {
      return '<div class="fact"><b>' + esc(p[0]) + "</b><span>" + esc(p[1]) + "</span></div>";
    }).join("");

    var labs = (s.lab || []).map(function (l, i) {
      var key = s.id + "-" + i;
      var cmd = l.cmd ? codeBlock("terminal", l.cmd, s.id + "-cmd-" + i) : "";
      var expect = l.expect ? '<div class="expect">' + esc(l.expect) + "</div>" : "";
      var check = l.checkpoint
        ? '<label class="check"><input type="checkbox" data-lab="' + key + '"' + (done.has(key) ? " checked" : "") +
          "><span>" + esc(l.checkpoint) + "</span></label>"
        : "";
      return '<div class="lab-step"><div class="lab-num">' + String(i + 1).padStart(2, "0") + "</div><div>" +
        "<h4>" + esc(l.title) + "</h4><p>" + esc(l.body) + "</p>" + cmd + expect + check + "</div></div>";
    }).join("");

    var simPanel = s.sim
      ? '<div class="sim" id="sim-root"></div>'
      : '<div class="callout">This session is lab-first: no simulation, because the real thing is one command away. ' +
        "Use the Lab tab and keep the concept diagram open next to your terminal.</div>";

    var prev = idx > 0 ? SESSIONS[idx - 1] : null;
    var next = idx < SESSIONS.length - 1 ? SESSIONS[idx + 1] : null;

    app.innerHTML =
      '<section class="module-head">' +
        '<p class="eyebrow">session ' + s.n + "  /  " + esc(s.duration) + "</p>" +
        '<div class="row"><h1>' + esc(s.title) + "</h1>" +
          '<span class="chip">' + esc(s.level) + "</span></div>" +
        '<p class="module-goal"><b>Goal  - </b> ' + esc(s.goal) + "</p>" +
      "</section>" +

      '<div class="tabs" role="tablist">' +
        '<button class="tab on" data-tab="concept" role="tab" aria-selected="true">1  /  Concept</button>' +
        '<button class="tab" data-tab="sim" role="tab" aria-selected="false">2  /  ' + (s.sim ? "Simulation" : "Try it") + "</button>" +
        '<button class="tab" data-tab="lab" role="tab" aria-selected="false">3  /  Lab</button>' +
      "</div>" +

      '<section class="panel" data-panel="concept">' +
        '<div class="grid-2">' +
          "<div><p class=\"lede\">" + esc(s.concept.intro) + "</p>" +
            '<div class="facts">' + points + "</div></div>" +
          "<div>" +
            '<div class="diagram">' + diagramHTML(s.concept.diagram) +
              '<p class="diagram-cap">' + esc(s.concept.diagram) + "  /  conceptual model</p></div>" +
            '<div style="margin-top:18px">' + codeBlock(s.real.path, s.real.snippet, s.id + "-real") + "</div>" +
          "</div>" +
        "</div>" +
      "</section>" +

      '<section class="panel" data-panel="sim" hidden>' + simPanel + "</section>" +

      '<section class="panel" data-panel="lab" hidden><div class="lab">' + labs + "</div></section>" +

      '<div class="prevnext">' +
        (prev ? '<a href="#/' + prev.id + '"><- ' + esc(prev.title) + "</a>" : "<span></span>") +
        (next ? '<a href="#/' + next.id + '">' + esc(next.title) + " -></a>" : "<span></span>") +
      "</div>";

    // tabs
    app.querySelectorAll(".tab").forEach(function (t) {
      t.addEventListener("click", function () {
        app.querySelectorAll(".tab").forEach(function (x) {
          x.classList.toggle("on", x === t);
          x.setAttribute("aria-selected", String(x === t));
        });
        app.querySelectorAll(".panel").forEach(function (p) {
          p.hidden = p.dataset.panel !== t.dataset.tab;
        });
      });
    });

    // checkpoints
    app.querySelectorAll("[data-lab]").forEach(function (cb) {
      cb.addEventListener("change", function () {
        if (cb.checked) done.add(cb.dataset.lab); else done.delete(cb.dataset.lab);
        save();
      });
    });

    wireCopy();
    if (s.sim) mountSim(s.sim);
  }

  function codeBlock(label, text, id) {
    return '<div class="code"><div class="code-bar"><span>' + esc(label) + '</span>' +
      '<button class="copy" data-copy="' + id + '">copy</button></div>' +
      '<pre id="' + id + '"><code>' + esc(text) + "</code></pre></div>";
  }

  function wireCopy() {
    app.querySelectorAll(".copy").forEach(function (b) {
      b.addEventListener("click", function () {
        var el = document.getElementById(b.dataset.copy);
        if (!el) return;
        var text = el.innerText;
        var ok = function () {
          b.textContent = "copied"; b.classList.add("ok");
          setTimeout(function () { b.textContent = "copy"; b.classList.remove("ok"); }, 1400);
        };
        if (navigator.clipboard) navigator.clipboard.writeText(text).then(ok, fallback); else fallback();
        function fallback() {
          var ta = document.createElement("textarea");
          ta.value = text; document.body.appendChild(ta); ta.select();
          try { document.execCommand("copy"); ok(); } catch (e) {}
          document.body.removeChild(ta);
        }
      });
    });
  }

  /* ------------------------------------------------------------ simulations */
  function mountSim(kind) {
    var root = document.getElementById("sim-root");
    if (!root) return;
    if (kind === "git") mountGit(root);
    if (kind === "docker") mountDocker(root);
    if (kind === "pipeline") mountPipeline(root);
    if (kind === "compose") mountCompose(root);
  }

  function shell(root, title, buttons) {
    root.innerHTML =
      '<div class="sim-head"><span class="sim-title">' + esc(title) + '</span>' +
      '<div class="sim-actions">' + buttons + "</div></div>" +
      '<div class="sim-body"></div>' +
      '<div class="log" id="sim-log" aria-live="polite"></div>';
    return {
      body: root.querySelector(".sim-body"),
      log: root.querySelector("#sim-log"),
      say: function (msg, cls) {
        var d = document.createElement("div");
        d.innerHTML = "<i>" + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) +
          "</i><span class=\"" + (cls || "") + "\">" + esc(msg) + "</span>";
        this.log.appendChild(d);
        this.log.scrollTop = this.log.scrollHeight;
      }
    };
  }

  /* --- git graph ------------------------------------------------------- */
  function mountGit(root) {
    var state = { local: [], remote: [], pr: false, merged: false };
    var ui = shell(root, "commit -> push -> pull request -> merge",
      '<button class="btn primary" data-act="commit">git commit</button>' +
      '<button class="btn" data-act="push">git push</button>' +
      '<button class="btn" data-act="pr">open PR</button>' +
      '<button class="btn" data-act="merge">merge</button>' +
      '<button class="btn danger" data-act="reset">reset</button>');

    function draw() {
      var localDots = state.local.map(function (c) {
        return '<span class="commit local' + (c.fresh ? " pop" : "") + '">' + c.sha + "</span>";
      }).join("") || '<span class="mono" style="color:var(--muted);font-size:11px">clean working tree</span>';
      var remoteDots = state.remote.map(function (c) {
        return '<span class="commit remote' + (c.fresh ? " pop" : "") + '">' + c.sha + "</span>";
      }).join("") || '<span class="mono" style="color:var(--muted);font-size:11px">nothing pushed yet</span>';

      ui.body.innerHTML =
        '<div class="gitgraph"><div class="git-lanes">' +
          '<div class="git-lane"><h4>local</h4><div class="commits">' + localDots + "</div></div>" +
          '<div class="git-lane"><h4>remote (origin/main)</h4><div class="commits">' + remoteDots +
            (state.pr ? '<span class="branch-tag">PR open</span>' : "") +
            (state.merged ? '<span class="branch-tag" style="border-color:var(--ok);color:var(--ok)">merged</span>' : "") +
          "</div></div>" +
        "</div></div>";
      state.local.forEach(function (c) { c.fresh = false; });
      state.remote.forEach(function (c) { c.fresh = false; });
    }

    var n = 0;
    root.querySelectorAll("[data-act]").forEach(function (b) {
      b.addEventListener("click", function () {
        var act = b.dataset.act;
        if (act === "commit") {
          n++;
          var sha = ("c" + n).padStart(7, "0");
          state.local.push({ sha: sha, fresh: true });
          ui.say("commit " + sha + "  -  local only. The remote does not know yet.");
        } else if (act === "push") {
          var pending = state.local.filter(function (c) { return !state.remote.some(function (r) { return r.sha === c.sha; }); });
          if (!pending.length) { ui.say("everything up to date  -  nothing to push", "warn"); return; }
          pending.forEach(function (c) { state.remote.push({ sha: c.sha, fresh: true }); });
          ui.say("pushed " + pending.length + " commit(s). Remote graph now has them.", "ok");
        } else if (act === "pr") {
          if (!state.remote.length) { ui.say("push first  -  a PR proposes a branch that exists", "fail"); return; }
          state.pr = true;
          ui.say("pull request opened. CI now runs on the proposed branch, not on main.", "ok");
        } else if (act === "merge") {
          if (!state.pr) { ui.say("no PR open  -  nothing to merge", "warn"); return; }
          state.pr = false; state.merged = true;
          ui.say("merged. Main moved; the change exists for everyone.", "ok");
        } else {
          state = { local: [], remote: [], pr: false, merged: false }; n = 0;
          ui.say("reset");
        }
        draw();
      });
    });
    draw();
  }

  /* --- docker layers --------------------------------------------------- */
  function mountDocker(root) {
    var INSTR = [
      { cmd: "FROM maven:3.9-eclipse-temurin-21", size: "420 MB", dep: true },
      { cmd: "COPY pom.xml .", size: "2 KB", dep: true },
      { cmd: "RUN mvn dependency:go-offline", size: "310 MB", dep: true },
      { cmd: "COPY src ./src", size: "140 KB", dep: false },
      { cmd: "RUN mvn package", size: "71 MB", dep: false },
      { cmd: "FROM eclipse-temurin:21-jre-alpine", size: "180 MB", dep: true },
      { cmd: "COPY --from=build /extracted/app.jar", size: "71 MB", dep: true }
    ];
    var state = { built: 0, staleFrom: null };
    var ui = shell(root, "image = ordered layers  /  cache invalidation",
      '<button class="btn primary" data-act="build">build</button>' +
      '<button class="btn" data-act="change">change src/</button>' +
      '<button class="btn danger" data-act="reset">reset</button>');

    function draw() {
      ui.body.innerHTML = '<div class="stack">' + INSTR.map(function (l, i) {
        var cls = "layer";
        if (state.staleFrom !== null && i >= state.staleFrom) cls += " stale";
        else if (i < state.built) cls += l.dep ? " cached" : " built";
        else cls += " pending";
        return '<div class="' + cls + '"><span class="idx">' + String(i + 1).padStart(2, "0") + "</span>" +
          '<span class="cmd">' + esc(l.cmd) + '</span><span class="size">' + l.size + "</span></div>";
      }).join("") + "</div>" +
        '<p class="stage-summary" style="margin-top:14px">layers cached: <b>' +
        (state.staleFrom === null ? state.built : state.staleFrom) + " / " + INSTR.length + "</b></p>";
    }

    root.querySelectorAll("[data-act]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.dataset.act === "build") {
          if (state.staleFrom !== null) {
            var rebuild = state.staleFrom;
            state.staleFrom = null;
            ui.say("rebuilding from layer " + (rebuild + 1) + "  -  earlier layers stay cached", "warn");
            state.built = rebuild;
            setTimeout(function () { state.built = INSTR.length; draw(); ui.say("built in the time of the last layers only", "ok"); }, 700);
          } else {
            state.built = INSTR.length;
            ui.say("built all " + INSTR.length + " layers (first build: nothing cached)", "ok");
          }
        } else if (b.dataset.act === "change") {
          var idx = INSTR.findIndex(function (l) { return l.cmd.indexOf("COPY src") === 0; });
          state.staleFrom = idx;
          ui.say("src/ changed -> layer " + (idx + 1) + " and everything after is invalidated", "warn");
        } else {
          state = { built: 0, staleFrom: null };
          ui.say("reset");
        }
        draw();
      });
    });
    draw();
  }

  /* --- pipeline -------------------------------------------------------- */
  function mountPipeline(root) {
    var STAGES = [
      { n: "checkout", i: "1", d: 3 }, { n: "setup", i: "2", d: 8 }, { n: "build", i: "3", d: 22 },
      { n: "test", i: "4", d: 31 }, { n: "scan", i: "5", d: 14 }, { n: "push", i: "6", d: 6 }
    ];
    var state = { idx: -1, failed: false, running: false };
    var ui = shell(root, "pipeline  /  each stage is a different proof",
      '<button class="btn primary" data-act="run">run pipeline</button>' +
      '<button class="btn danger" data-act="fail">failing test</button>' +
      '<button class="btn" data-act="reset">reset</button>');

    function draw() {
      var nodes = STAGES.map(function (st, i) {
        var cls = "stage";
        if (state.idx === i) cls += " running";
        else if (state.idx > i) cls += (state.failed && i === 3 ? " failed" : " passed");
        else if (state.failed && i > 3 && state.idx >= 3) cls += " skipped";
        return '<div class="' + cls + '"><span class="icon">' + st.i + '</span><span class="name">' + st.n +
          '</span><span class="dur">' + (state.idx > i ? (state.failed && i === 3 ? "fail" : st.d + "s") : " - ") + "</span></div>" +
          (i < STAGES.length - 1 ? '<span class="pipe-arrow">-></span>' : "");
      }).join("");

      ui.body.innerHTML = '<div class="pipeline-scene"><div class="pipeline">' + nodes + "</div></div>" +
        '<p class="stage-summary">status: <b>' +
        (state.running ? "running" : state.failed ? "failed at test" : state.idx >= STAGES.length ? "passed" : "idle") +
        "</b>" + (state.failed ? "  /  later stages skipped" : "") + "</p>";
    }

    function run() {
      if (state.running) return;
      state.running = true; state.idx = 0;
      var failAt = state.failed ? 3 : -1;
      ui.say("pipeline started");
      var step = function () {
        if (state.idx >= STAGES.length) {
          state.running = false;
          ui.say("pipeline passed  -  image tagged and pushed", "ok");
          draw(); return;
        }
        draw();
        var st = STAGES[state.idx];
        ui.say(st.n + " ... " + st.d + "s");
        if (state.idx === failAt) {
          state.failed = true; state.running = false;
          ui.say("test failed  -  pipeline stops. scan and push never run.", "fail");
          ui.say("nothing was published. that is the point.", "warn");
          draw(); return;
        }
        state.idx++;
        setTimeout(step, 620);
      };
      step();
    }

    root.querySelectorAll("[data-act]").forEach(function (b) {
      b.addEventListener("click", function () {
        var act = b.dataset.act;
        if (act === "run") { state = { idx: -1, failed: state.failed, running: false }; run(); }
        else if (act === "fail") { state.failed = !state.failed; state.idx = -1;
          b.setAttribute("aria-pressed", String(state.failed));
          ui.say(state.failed ? "failing test injected  -  next run will stop at test" : "test fixed", state.failed ? "warn" : "ok"); draw(); }
        else { state = { idx: -1, failed: false, running: false }; ui.say("reset"); draw(); }
      });
    });
    draw();
  }

  /* --- compose --------------------------------------------------------- */
  function mountCompose(root) {
    var SERVICES = [
      { n: "db", why: "postgres:16-alpine", dep: null },
      { n: "api", why: "needs db healthy", dep: "db" },
      { n: "web", why: "needs api healthy", dep: "api" }
    ];
    var state = { phase: 0 };
    var ui = shell(root, "docker compose up  /  health gates decide order",
      '<button class="btn primary" data-act="up">docker compose up</button>' +
      '<button class="btn danger" data-act="down">down</button>');

    function row(s, i) {
      var cls = "compose-row waiting", status = "waiting";
      if (state.phase > i * 2) { cls = "compose-row healthy"; status = "healthy"; }
      else if (state.phase === i * 2 + 1) { cls = "compose-row starting"; status = "starting"; }
      return '<div class="' + cls + '"><span class="svc">' + s.n + '</span>' +
        '<span class="why">' + esc(s.why) + '</span><span class="status">' + status + "</span></div>";
    }

    function draw() { ui.body.innerHTML = '<div class="compose">' + SERVICES.map(row).join("") + "</div>"; }

    root.querySelectorAll("[data-act]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.dataset.act === "down") { state.phase = 0; ui.say("compose down  -  containers removed, volume kept"); draw(); return; }
        state.phase = 1; draw();
        var i = 0;
        var next = function () {
          if (i >= SERVICES.length) {
            state.phase = SERVICES.length * 2;
            draw(); ui.say("all healthy  -  web is serving", "ok"); return;
          }
          var s = SERVICES[i];
          ui.say(s.n + " starting" + (s.dep ? " (waiting for " + s.dep + " to be healthy)" : ""));
          setTimeout(function () {
            state.phase = i * 2 + 2;
            draw();
            ui.say(s.n + " healthy", "ok");
            i++; setTimeout(next, 380);
          }, 700);
        };
        next();
      });
    });
    draw();
  }

  /* ------------------------------------------------------------ router */
  function route() {
    var hash = location.hash.replace(/^#\/?/, "");
    if (!hash) { renderHome(); paintProgress(); return; }
    renderModule(hash);
    paintProgress();
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  window.addEventListener("hashchange", route);
  document.getElementById("progress-reset").addEventListener("click", function () {
    if (!confirm("Clear all lab checkpoints?")) return;
    done = new Set(); save();
    route();
  });

  route();
})();



