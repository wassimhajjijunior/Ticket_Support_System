/* ==========================================================================
   ORBITAL — engine
   Rendering, progress state, telemetry, constellation.
   No dependencies. No network. localStorage only.
   ========================================================================== */
(function () {
  "use strict";

  let STORE_KEY = "orbital-roadmap-v1";
  let DEADLINE = new Date(META.deadline);
  let TOTAL_STEPS = DAYS.reduce(function (a, d) { return a + d.steps.length; }, 0);

  let checked = load();
  let reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------- state */
  function load() {
    try {
      let raw = localStorage.getItem(STORE_KEY);
      if (raw) return new Set(JSON.parse(raw));
    } catch (e) { /* corrupt store: reseed */ }
    let seed = new Set();
    DAYS[0].steps.forEach(function (_, i) { seed.add("d1-s" + (i + 1)); });
    return seed;
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(Array.from(checked))); }
    catch (e) { /* private mode: keep in memory */ }
    flashSaved();
  }

  let esc = function (s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };
  let fmt = function (s) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
  };
  let stripMd = function (s) { return s.replace(/\*\*/g, "").replace(/`/g, ""); };
  let pad = function (n) { return String(n).padStart(2, "0"); };

  /* --------------------------------------------------------------- render */
  let CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5.2 5.2L20 6.6"/></svg>';

  function renderDays() {
    let tl = document.getElementById("timeline");
    DAYS.forEach(function (d) {
      let el = document.createElement("article");
      el.className = "day";
      el.id = "day-" + d.n;
      el.dataset.day = d.n;

      let learn = d.learn && d.learn.length
        ? '<div class="blk"><div class="blk-h">learn first <span class="n">02</span></div><ul class="learn">' +
          d.learn.map(function (l) {
            return "<li>" + (l.h
              ? '<a href="' + l.h + '" target="_blank" rel="noopener noreferrer">' + esc(l.t) + "</a>"
              : esc(l.t)) + "</li>";
          }).join("") + "</ul></div>"
        : "";

      el.innerHTML =
        '<div class="day-node" aria-hidden="true"></div>' +
        '<div class="win">' +
          '<div class="win-bar">' +
            '<span class="win-dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
            '<span class="win-path"><b>' + esc(d.path) + "</b></span>" +
            '<span class="win-right">' +
              '<span class="status todo" data-status>todo</span>' +
              '<button class="toggle" type="button" aria-expanded="false" aria-controls="panel-' + d.n + '">' +
                '<span class="c" aria-hidden="true">▸</span> open</button>' +
            "</span>" +
          "</div>" +
          '<div class="win-body">' +
            '<h3 class="day-title"><span class="num">D' + pad(d.n) + "</span>" + esc(d.theme) + "</h3>" +
            '<div class="day-sub">' + esc(d.date) + " · " + d.steps.length + " steps</div>" +
            '<div class="dbar"><i data-bar></i></div>' +
            '<div class="dmeta"><span>progress</span><span data-pct>0%</span></div>' +
            '<div class="panel" id="panel-' + d.n + '"><div>' +

              '<div class="blk"><div class="blk-h">goal <span class="n">01</span></div>' +
                '<p class="goal">' + fmt(d.goal) + "</p></div>" +
              learn +
              '<div class="blk"><div class="blk-h">build <span class="n">03</span></div><ul class="steps">' +
                d.steps.map(function (s, i) {
                  let id = "d" + d.n + "-s" + (i + 1);
                  return '<li class="step"><input type="checkbox" id="' + id + '" data-step="' + id + '">' +
                    '<label for="' + id + '" class="step-label">' +
                      '<span class="box" aria-hidden="true">' + CHECK + "</span>" +
                      '<span class="step-txt"><span class="t">' + fmt(s) + "</span></span>" +
                    "</label></li>";
                }).join("") +
              "</ul></div>" +
              '<div class="blk"><div class="blk-h">watch out <span class="n">04</span></div><div class="alerts">' +
                d.watch.map(function (w) {
                  return '<div class="alert"><span class="k">alert</span>' + fmt(w) + "</div>";
                }).join("") +
              "</div></div>" +
              '<div class="blk"><div class="blk-h">break it <span class="n">05</span></div>' +
                '<p class="goal">' + fmt(d.breakIt) + "</p></div>" +
              '<div class="blk"><div class="blk-h">exit test <span class="n">06</span></div>' +
                '<div class="cmd"><button class="copy" type="button">copy</button>' +
                "<pre><code>" + esc(d.exit) + "</code></pre></div></div>" +
              '<div class="blk"><div class="blk-h">deliverable <span class="n">07</span></div>' +
                '<p class="goal">' + fmt(d.deliverable) + "</p></div>" +

            "</div></div>" +
          "</div>" +
        "</div>";

      tl.appendChild(el);

      let btn = el.querySelector(".toggle");
      btn.addEventListener("click", function () {
        let open = el.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", String(open));
        btn.lastChild.textContent = open ? " close" : " open";
      });

      el.querySelectorAll("input[data-step]").forEach(function (cb) {
        cb.addEventListener("change", function () {
          if (cb.checked) checked.add(cb.dataset.step);
          else checked.delete(cb.dataset.step);
          save();
          update();
        });
      });

      el.querySelectorAll(".copy").forEach(function (b) {
        b.addEventListener("click", function () { copyBlock(b); });
      });

      if (d.n <= 2) {
        el.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
        btn.lastChild.textContent = " close";
      }
    });
  }

  function renderMatrix() {
    let host = document.getElementById("matrix");
    let html = '<div class="mrow head"><div>order</div><div>drop this</div><div class="keep">keeps</div></div>';
    CUT.forEach(function (c) {
      html += '<div class="mrow' + (c.never ? " never" : "") + '">' +
        '<div class="n">' + esc(c.n) + "</div>" +
        '<div class="drop">' + fmt(c.drop) + "</div>" +
        '<div class="keep">' + fmt(c.keep) + "</div></div>";
    });
    host.innerHTML = html;
  }

  function renderCriteria() {
    let host = document.getElementById("crit");
    host.innerHTML = CRITERIA.map(function (c) {
      return '<div class="crit-item' + (c.met ? " met" : "") + '">' +
        '<span class="led" aria-hidden="true"></span>' +
        '<div class="txt">' + esc(c.text) +
          "<small>" + (c.met ? "met" : "pending") + "</small></div>" +
        '<div class="id">' + esc(c.id) + "</div></div>";
    }).join("");
    let met = CRITERIA.filter(function (c) { return c.met; }).length;
    document.getElementById("crit-met").textContent = met;
  }

  function renderResources() {
    let body = document.getElementById("res-body");
    body.innerHTML = RESOURCES.map(function (r) {
      return "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + '</td><td><span class="q">' + esc(r[2]) + "</span></td></tr>";
    }).join("");
  }

  /* ------------------------------------------------------------- progress */
  let prevPct = null;
  let prevDay = {};

  function stats(d) {
    let done = 0;
    d.steps.forEach(function (_, i) { if (checked.has("d" + d.n + "-s" + (i + 1))) done++; });
    return { total: d.steps.length, done: done, pct: Math.round((done / d.steps.length) * 100) };
  }

  function update() {
    let totalDone = 0, daysDone = 0, activeAssigned = false, activeDay = null;
    let dayPct = [];

    DAYS.forEach(function (d) {
      let s = stats(d);
      totalDone += s.done;
      dayPct.push(s.pct);

      let el = document.getElementById("day-" + d.n);
      let complete = s.done === s.total;
      let isActive = !complete && !activeAssigned;
      if (isActive) { activeAssigned = true; activeDay = d; }
      if (complete) daysDone++;

      el.classList.toggle("is-done", complete);
      el.classList.toggle("is-active", isActive);

      let st = el.querySelector("[data-status]");
      st.textContent = complete ? "done" : isActive ? "live" : "todo";
      st.className = "status " + (complete ? "done" : isActive ? "active" : "todo");

      el.querySelector("[data-bar]").style.width = s.pct + "%";
      el.querySelector("[data-pct]").textContent = s.pct + "%";

      if (prevDay[d.n] !== undefined && prevDay[d.n] < 100 && s.pct === 100) {
        let win = el.querySelector(".win");
        win.classList.add("pop");
        setTimeout(function () { win.classList.remove("pop"); }, 500);
      }
      prevDay[d.n] = s.pct;
    });

    let overall = Math.round((totalDone / TOTAL_STEPS) * 100);

    setText("tb-days", daysDone + "/7");
    setText("tb-steps", totalDone + "/" + TOTAL_STEPS);
    setText("tb-pct", overall + "%");
    setText("tm-pct", overall);
    setText("tm-days", daysDone);
    setText("tm-steps", totalDone);
    setText("hud-nodes", daysDone);
    document.getElementById("tb-fill").style.width = overall + "%";
    document.getElementById("total-steps").textContent = TOTAL_STEPS;

    paintSparks(dayPct, daysDone, totalDone);

    if (prevPct !== null && !reduced) {
      [25, 50, 75, 100].forEach(function (m) {
        if (prevPct < m && overall >= m) {
          let v = document.getElementById("tm-pct");
          v.classList.add("pop");
          setTimeout(function () { v.classList.remove("pop"); }, 500);
        }
      });
    }
    prevPct = overall;

    renderTrajectory(dayPct);
    nextAction(activeDay);
    graphDirty = true;
  }

  function setText(id, v) {
    let el = document.getElementById(id);
    if (el) el.textContent = v;
  }

  function paintSparks(dayPct, daysDone, totalDone) {
    let p = document.getElementById("spark-progress");
    if (p) {
      Array.prototype.forEach.call(p.children, function (bar, i) {
        bar.style.height = Math.max(8, dayPct[i]) + "%";
        bar.classList.toggle("on", dayPct[i] > 0);
      });
    }
    let d = document.getElementById("spark-days");
    if (d) {
      Array.prototype.forEach.call(d.children, function (bar, i) {
        bar.classList.toggle("on", i < daysDone);
      });
    }
    let s = document.getElementById("spark-steps");
    if (s) {
      let idx = 0;
      Array.prototype.forEach.call(s.children, function (bar) {
        idx++;
        bar.classList.toggle("on", idx <= totalDone);
      });
    }
  }

  function buildSparks() {
    let p = document.getElementById("spark-progress");
    for (let i = 0; i < DAYS.length; i++) p.appendChild(document.createElement("i"));

    let d = document.getElementById("spark-days");
    for (let j = 0; j < DAYS.length; j++) d.appendChild(document.createElement("i"));

    let s = document.getElementById("spark-steps");
    for (let k = 0; k < TOTAL_STEPS; k++) s.appendChild(document.createElement("i"));
  }

  function nextAction(activeDay) {
    let found = null;
    DAYS.forEach(function (d) {
      d.steps.forEach(function (step, i) {
        if (!found && !checked.has("d" + d.n + "-s" + (i + 1))) {
          found = { day: d, step: step, idx: i };
        }
      });
    });

    if (!found) {
      setText("now-day", "mission complete");
      setText("now-step", "All " + TOTAL_STEPS + " steps checked.");
      setText("now-why", "record the demo · pin the repo · update the CV");
      document.getElementById("now-go").dataset.target = "day-7";
      return;
    }

    setText("now-day", "day " + pad(found.day.n) + " · " + found.day.theme);
    setText("now-step", stripMd(found.step));
    setText("now-why", "step " + (found.idx + 1) + " of " + found.day.steps.length + " · " + found.day.date);
    document.getElementById("now-go").dataset.target = "day-" + found.day.n;
  }

  document.getElementById("now-go").addEventListener("click", function (e) {
    let el = document.getElementById(e.currentTarget.dataset.target);
    if (!el) return;
    if (!el.classList.contains("is-open")) {
      el.classList.add("is-open");
      let b = el.querySelector(".toggle");
      if (b) { b.setAttribute("aria-expanded", "true"); b.lastChild.textContent = " close"; }
    }
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* ----------------------------------------------------------------- clock */
  function tickClock() {
    let now = new Date();
    let ms = DEADLINE - now;

    let cd = document.getElementById("countdown");
    if (cd) {
      if (ms <= 0) cd.textContent = "T-MINUS 00:00:00";
      else {
        let d = Math.floor(ms / 86400000);
        let h = Math.floor((ms % 86400000) / 3600000);
        let m = Math.floor((ms % 3600000) / 60000);
        cd.textContent = "T-MINUS " + d + "d " + pad(h) + "h " + pad(m) + "m";
      }
    }
    let tc = document.getElementById("tm-clock");
    if (tc) {
      if (ms <= 0) tc.textContent = "00:00:00";
      else {
        let dd = Math.floor(ms / 86400000);
        let hh = Math.floor((ms % 86400000) / 3600000);
        let mm = Math.floor((ms % 3600000) / 60000);
        let ss = Math.floor((ms % 60000) / 1000);
        tc.textContent = pad(dd) + ":" + pad(hh) + ":" + pad(mm) + ":" + pad(ss);
      }
    }
    let clock = document.getElementById("hud-clock");
    if (clock) {
      clock.textContent = pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
    }
  }

  /* ------------------------------------------------------------------ copy */
  function copyBlock(btn) {
    let pre = btn.parentElement.querySelector("pre");
    let text = pre.innerText;
    let done = function () {
      btn.textContent = "copied";
      btn.classList.add("ok");
      setTimeout(function () { btn.textContent = "copy"; btn.classList.remove("ok"); }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done)["catch"](fallback);
    } else fallback();

    function fallback() {
      let ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { /* nothing else we can do */ }
      document.body.removeChild(ta);
    }
  }

  /* ------------------------------------------------------------------ save */
  let savedTimer = null;
  function flashSaved() {
    let el = document.getElementById("saved");
    if (!el) return;
    el.textContent = "state persisted";
    el.style.color = "var(--signal)";
    clearTimeout(savedTimer);
    savedTimer = setTimeout(function () {
      el.textContent = "state persisted locally";
      el.style.color = "";
    }, 1400);
  }

  document.getElementById("reset").addEventListener("click", function () {
    if (!confirm("Reset all progress? Only Day 1 stays checked.")) return;
    checked = new Set();
    DAYS[0].steps.forEach(function (_, i) { checked.add("d1-s" + (i + 1)); });
    save();
    document.querySelectorAll("input[data-step]").forEach(function (cb) {
      cb.checked = checked.has(cb.dataset.step);
    });
    prevDay = {};
    prevPct = null;
    update();
  });

  /* ---------------------------------------------------------------- reveal */
  let io = ("IntersectionObserver" in window)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      }, { rootMargin: "0px 0px -6% 0px" })
    : null;

  function wireReveal() {
    document.querySelectorAll(".sec-head, .now, .matrix, .crit, .res-wrap, .cmd").forEach(function (el) {
      el.classList.add("reveal");
      if (io) io.observe(el); else el.classList.add("in");
    });
  }

  /* ------------------------------------------------------------ spine fill */
  function spine() {
    let tl = document.getElementById("timeline");
    let fill = document.getElementById("tl-fill");
    if (!tl || !fill) return;
    let r = tl.getBoundingClientRect();
    let passed = Math.min(Math.max(window.innerHeight * 0.45 - r.top, 0), r.height);
    fill.style.height = passed + "px";
  }
  window.addEventListener("scroll", spine, { passive: true });
  window.addEventListener("resize", spine);

  /* ==========================================================================
     CONSTELLATION
     ========================================================================== */
  let canvas = document.getElementById("graph");
  let ctx = canvas ? canvas.getContext("2d") : null;
  let graphDirty = true;
  let hovered = -1;
  let nodes = [];
  let stars = [];
  let W = 0, H = 0, DPR = 1;
  let rafId = null;
  let visible = true;

  let COLOR = {
    signal: "#2de2c5",
    ok: "#7be495",
    dim: "#45525f",
    line: "rgba(255,255,255,0.07)",
    label: "#6b7b8c",
    core: "#dbe5ee"
  };

  function layout() {
    if (!canvas) return;
    let rect = canvas.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    let cx = W / 2, cy = H / 2;
    let R = Math.min(W, H) * 0.34;

    nodes = DAYS.map(function (d, i) {
      let a = -Math.PI / 2 + (i * 2 * Math.PI) / DAYS.length;
      return { n: d.n, x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R, theme: d.theme };
    });

    stars = [];
    for (let i = 0; i < 46; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.2 + 0.3,
        p: Math.random() * Math.PI * 2,
        s: Math.random() * 0.8 + 0.4
      });
    }
    graphDirty = true;
  }

  function dayState(n) {
    let d = DAYS[n - 1];
    let s = stats(d);
    if (s.done === s.total) return "done";
    return "todo";
  }

  function activeNumber() {
    for (let i = 0; i < DAYS.length; i++) {
      let s = stats(DAYS[i]);
      if (s.done !== s.total) return DAYS[i].n;
    }
    return -1;
  }

  function draw(t) {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    // stars
    stars.forEach(function (s) {
      let a = reduced ? 0.5 : 0.28 + 0.32 * (0.5 + 0.5 * Math.sin(t * 0.0006 * s.s + s.p));
      ctx.beginPath();
      ctx.fillStyle = "rgba(190,220,235," + a.toFixed(3) + ")";
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    let cx = W / 2, cy = H / 2;
    let active = activeNumber();

    // spokes to core
    nodes.forEach(function (nd) {
      ctx.beginPath();
      ctx.strokeStyle = COLOR.line;
      ctx.lineWidth = 1;
      ctx.moveTo(cx, cy);
      ctx.lineTo(nd.x, nd.y);
      ctx.stroke();
    });

    // ring edges (completed path lights up)
    for (let i = 0; i < nodes.length - 1; i++) {
      let a = nodes[i], b = nodes[i + 1];
      let lit = dayState(a.n) === "done";
      ctx.beginPath();
      ctx.strokeStyle = lit ? "rgba(45,226,197,0.5)" : COLOR.line;
      ctx.lineWidth = lit ? 1.6 : 1;
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // travelling packet along the completed path
    if (!reduced) {
      let litNodes = nodes.filter(function (n) { return dayState(n.n) === "done"; });
      if (litNodes.length > 1) {
        let seg = (litNodes.length - 1) * 2;
        let pos = (t * 0.00035) % seg;
        let idx = Math.floor(pos);
        let frac = pos - idx;
        let from = litNodes[Math.min(idx, litNodes.length - 2)];
        let to = litNodes[Math.min(idx + 1, litNodes.length - 1)];
        let px = from.x + (to.x - from.x) * frac;
        let py = from.y + (to.y - from.y) * frac;
        ctx.beginPath();
        ctx.fillStyle = "#2de2c5";
        ctx.shadowColor = "#2de2c5";
        ctx.shadowBlur = 14;
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // core
    ctx.beginPath();
    ctx.fillStyle = "rgba(45,226,197,0.07)";
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.strokeStyle = "rgba(45,226,197,0.55)";
    ctx.lineWidth = 1.4;
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = COLOR.signal;
    ctx.arc(cx, cy, 3.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "9px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = COLOR.label;
    ctx.fillText("OPS", cx, cy + 34);

    // day nodes
    nodes.forEach(function (nd, i) {
      let state = dayState(nd.n);
      let isActive = nd.n === active;
      let isHover = i === hovered;

      if (state === "done") {
        ctx.beginPath();
        ctx.fillStyle = "rgba(123,228,149,0.16)";
        ctx.arc(nd.x, nd.y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = COLOR.ok;
        ctx.shadowColor = COLOR.ok;
        ctx.shadowBlur = 12;
        ctx.arc(nd.x, nd.y, 5.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (isActive) {
        let pulse = reduced ? 1 : 1 + 0.16 * Math.sin(t * 0.004);
        ctx.beginPath();
        ctx.strokeStyle = "rgba(45,226,197,0.35)";
        ctx.lineWidth = 1;
        ctx.arc(nd.x, nd.y, 13 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.fillStyle = COLOR.signal;
        ctx.shadowColor = COLOR.signal;
        ctx.shadowBlur = 16;
        ctx.arc(nd.x, nd.y, 5.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.beginPath();
        ctx.fillStyle = "#05070a";
        ctx.strokeStyle = isHover ? COLOR.signal : COLOR.dim;
        ctx.lineWidth = 1.2;
        ctx.arc(nd.x, nd.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.font = (isHover || isActive ? "600 " : "") + "9.5px ui-monospace, monospace";
      ctx.fillStyle = state === "done" ? COLOR.ok : isActive ? COLOR.signal : COLOR.label;
      ctx.fillText("D" + nd.n, nd.x, nd.y + (nd.y > cy ? 22 : -14));
    });

    graphDirty = false;
  }

  function loop(t) {
    rafId = null;
    if (!visible) return;
    if (reduced) { if (graphDirty) draw(t); }
    else { draw(t); rafId = requestAnimationFrame(loop); }
  }

  function startLoop() {
    if (reduced) { draw(performance.now()); return; }
    if (rafId === null) rafId = requestAnimationFrame(loop);
  }

  function hitTest(ev) {
    let rect = canvas.getBoundingClientRect();
    let x = ev.clientX - rect.left;
    let y = ev.clientY - rect.top;
    let best = -1, bestD = 22;
    nodes.forEach(function (nd, i) {
      let d = Math.hypot(nd.x - x, nd.y - y);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

  function initGraph() {
    if (!canvas || !ctx) return;
    layout();
    startLoop();

    canvas.addEventListener("mousemove", function (e) {
      let h = hitTest(e);
      if (h !== hovered) {
        hovered = h;
        canvas.style.cursor = h >= 0 ? "pointer" : "default";
        if (reduced) draw(performance.now());
      }
    });
    canvas.addEventListener("mouseleave", function () {
      hovered = -1;
      canvas.style.cursor = "default";
      if (reduced) draw(performance.now());
    });
    canvas.addEventListener("click", function (e) {
      let h = hitTest(e);
      if (h < 0) return;
      let el = document.getElementById("day-" + nodes[h].n);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    window.addEventListener("resize", function () {
      layout();
      if (reduced) draw(performance.now());
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) startLoop();
      }, { threshold: 0 }).observe(canvas);
    }
  }

  /* ---------------------------------------------------------- trajectory */
  function renderTrajectory(dayPct) {
    let svg = document.getElementById("traj");
    if (!svg) return;

    let VW = 640, VH = 210, L = 40, R = 14, T = 14, B = 30;
    let pw = VW - L - R, ph = VH - T - B;
    let x = function (i) { return L + (i / (DAYS.length - 1)) * pw; };
    let y = function (v) { return T + (1 - v) * ph; };

    let cum = 0;
    let pts = [];
    DAYS.forEach(function (d) {
      cum += stats(d).done;
      pts.push(cum / TOTAL_STEPS);
    });

    let grid = "";
    [0, 0.25, 0.5, 0.75, 1].forEach(function (v) {
      grid += '<line x1="' + L + '" y1="' + y(v) + '" x2="' + (VW - R) + '" y2="' + y(v) + '" stroke="#1a232e" stroke-width="1"/>';
      grid += '<text x="' + (L - 8) + '" y="' + (y(v) + 3) + '" text-anchor="end" font-size="9" fill="#45525f">' +
        Math.round(v * 100) + "</text>";
    });

    let line = pts.map(function (v, i) { return x(i) + "," + y(v); }).join(" ");
    let area = L + "," + y(0) + " " + line + " " + x(DAYS.length - 1) + "," + y(0);

    let dots = "";
    pts.forEach(function (v, i) {
      let complete = dayPct[i] === 100;
      dots += '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="' + (complete ? 4 : 3.2) + '" fill="' +
        (complete ? "#7be495" : "#2de2c5") + '"/>';
      dots += '<text x="' + x(i) + '" y="' + (VH - 10) + '" text-anchor="middle" font-size="9" fill="#45525f">D' +
        (i + 1) + "</text>";
    });

    let start = new Date("2026-11-03T00:00:00");
    let end = new Date(META.deadline);
    let elapsed = Math.min(Math.max((new Date() - start) / (end - start), 0), 1);
    let todayX = L + elapsed * pw;
    let marker =
      '<line x1="' + todayX + '" y1="' + T + '" x2="' + todayX + '" y2="' + (VH - B) +
        '" stroke="#f5a524" stroke-width="1" stroke-dasharray="2 4" opacity="0.6"/>' +
      '<text x="' + todayX + '" y="9" text-anchor="middle" font-size="8.5" fill="#f5a524" letter-spacing="1">TODAY</text>';

    svg.innerHTML =
      '<defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#2de2c5" stop-opacity="0.30"/>' +
        '<stop offset="100%" stop-color="#2de2c5" stop-opacity="0"/>' +
      "</linearGradient></defs>" +
      grid +
      '<polyline points="' + x(0) + "," + y(0) + " " + x(DAYS.length - 1) + "," + y(1) +
        '" fill="none" stroke="#354354" stroke-width="1.4" stroke-dasharray="4 5"/>' +
      '<polygon points="' + area + '" fill="url(#ag)"/>' +
      '<polyline points="' + line + '" fill="none" stroke="#2de2c5" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
      dots +
      marker;

    let actual = pts[pts.length - 1];
    let diff = actual - elapsed;

    let note = document.getElementById("traj-note");
    if (note) {
      let gap = Math.abs(Math.round(diff * 100));
      note.textContent = diff >= 0 ? "ahead by " + gap + "%" : gap + "% behind pace";
      note.className = "note " + (diff >= 0 ? "ahead" : "behind");
    }
  }

  /* ------------------------------------------------------------------ boot */
  renderDays();
  renderMatrix();
  renderCriteria();
  renderResources();
  buildSparks();
  wireReveal();

  document.querySelectorAll("input[data-step]").forEach(function (cb) {
    cb.checked = checked.has(cb.dataset.step);
  });

  tickClock();
  setInterval(tickClock, 1000);

  update();
  initGraph();
  spine();
})();
