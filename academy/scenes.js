import * as THREE from "three";

/* Light-mode 3D scenes. One renderer, one scene per simulation, labels as sprites. */

const C = {
  paper: 0xf4f2ec,
  ink: 0x15171b,
  muted: 0x9aa0a8,
  line: 0xccc6b6,
  accent: 0xb8451f,
  ok: 0x0f7b4f,
  warn: 0xa9691a,
  fail: 0xb42318,
  cool: 0xdfe3e8,
  warm: 0xece2d0
};

function labelSprite(text, opts) {
  const o = opts || {};
  const pad = 10;
  const fontPx = 42;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.font = `600 ${fontPx}px ui-monospace, monospace`;
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2;
  const h = fontPx + pad * 2;
  canvas.width = w * 2;
  canvas.height = h * 2;
  const c2 = canvas.getContext("2d");
  c2.scale(2, 2);
  c2.font = `600 ${fontPx}px ui-monospace, monospace`;
  c2.fillStyle = o.color || "#15171b";
  c2.textBaseline = "middle";
  c2.fillText(text, pad, h / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sp = new THREE.Sprite(mat);
  const scale = o.scale || 0.0032;
  sp.scale.set(w * scale, h * scale, 1);
  return sp;
}

function lerp(a, b, k) { return a + (b - a) * k; }

export function createEngine(canvas) {
  let renderer, sceneRoot;
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  const clock = new THREE.Clock();
  const registry = new Map();
  let current = null;
  let enabled = true;
  let reduced = false;
  let tweenList = [];

  try {
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) { reduced = false; }

  function hasWebGL() {
    try {
      const c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
    } catch (e) { return false; }
  }

  function init() {
    if (!hasWebGL()) { document.body.classList.add("no-3d"); return false; }
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearAlpha(0);

    sceneRoot = new THREE.Scene();
    sceneRoot.fog = new THREE.Fog(0xf4f2ec, 22, 46);

    const hemi = new THREE.HemisphereLight(0xffffff, 0xd0c8b6, 0.7);
    sceneRoot.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 2.3);
    key.position.set(4, 6.5, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -8; key.shadow.camera.right = 8;
    key.shadow.camera.top = 8; key.shadow.camera.bottom = -8;
    key.shadow.bias = -0.0015;
    sceneRoot.add(key);

    const rim = new THREE.DirectionalLight(0xb8451f, 0.35);
    rim.position.set(-6, 2, -4);
    sceneRoot.add(rim);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.ShadowMaterial({ color: 0x2a2a2a, opacity: 0.13 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -3.1;
    ground.receiveShadow = true;
    sceneRoot.add(ground);

    camera.position.set(0, 1.9, 8.2);
    camera.lookAt(0, 0, 0);
    resize();
    return true;
  }

  function resize() {
    if (!renderer) return;
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const narrow = w < 700;
    camera.position.set(0, narrow ? 2.4 : 1.9, narrow ? 10.4 : 8.2);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }

  /* ---------------------------------------------------------- tween */
  function tween(obj, to, dur, onDone) {
    const from = {};
    Object.keys(to).forEach(function (k) { from[k] = obj[k]; });
    if (reduced) {
      Object.keys(to).forEach(function (k) { obj[k] = to[k]; });
      if (onDone) onDone();
      return;
    }
    tweenList.push({ obj: obj, from: from, to: to, t: 0, dur: dur || 0.5, onDone: onDone });
  }

  function stepTweens(dt) {
    tweenList = tweenList.filter(function (tw) {
      tw.t += dt;
      const k = Math.min(1, tw.t / tw.dur);
      const e = 1 - Math.pow(1 - k, 3);
      Object.keys(tw.to).forEach(function (key) {
        tw.obj[key] = lerp(tw.from[key], tw.to[key], e);
      });
      if (k >= 1) { if (tw.onDone) tw.onDone(); return false; }
      return true;
    });
  }

  /* ---------------------------------------------------------- scenes */
  function buildGit() {
    const g = new THREE.Group();
    const sphere = new THREE.SphereGeometry(0.24, 22, 16);
    const localMat = new THREE.MeshStandardMaterial({ color: 0xc9b391, roughness: 0.5, metalness: 0.08 });
    const remoteMat = new THREE.MeshStandardMaterial({ color: 0x8fbfa8, roughness: 0.5, metalness: 0.08 });
    const state = { local: [], remote: [], pr: false, n: 0 };
    const lanes = new THREE.Group();

    function laneLabel(text, y) {
      const s = labelSprite(text, { scale: 0.0026, color: "#8b9099" });
      s.position.set(-3.6, y + 0.34, 0);
      lanes.add(s);
    }
    laneLabel("LOCAL", 0.95);
    laneLabel("REMOTE", -0.95);

    [0.95, -0.95].forEach(function (y) {
      const line = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 6.2, 6),
        new THREE.MeshStandardMaterial({ color: 0xbfb8a6, roughness: 1 })
      );
      line.rotation.z = Math.PI / 2;
      line.position.set(0, y, 0);
      lanes.add(line);
    });

    g.add(lanes);

    function addCommit(kind, n) {
      const m = new THREE.Mesh(sphere, (kind === "local" ? localMat : remoteMat).clone());
      m.castShadow = true;
      m.position.set(-3.0 + n * 0.85, kind === "local" ? 0.95 : -0.95, 0);
      m.scale.setScalar(0.001);
      g.add(m);
      tween(m.scale, { x: 1, y: 1, z: 1 }, 0.45);
      return m;
    }

    return {
      group: g,
      reset: function () {
        state.local.forEach(function (m) { g.remove(m); });
        state.remote.forEach(function (m) { g.remove(m); });
        state.local = []; state.remote = []; state.pr = false; state.n = 0;
      },
      action: function (name) {
        if (name === "commit") {
          state.n++;
          state.local.push(addCommit("local", state.local.length));
          return "commit " + ("c" + state.n).slice(-6);
        }
        if (name === "push") {
          const pending = state.local.slice(state.remote.length);
          if (!pending.length) return "nothing to push";
          pending.forEach(function (src, i) {
            const m = addCommit("remote", state.remote.length);
            m.position.copy(src.position);
            const targetX = -3.0 + state.remote.length * 0.85;
            state.remote.push(m);
            tween(m.position, { x: targetX, y: -0.95, z: 0 }, 0.7);
            tween(src.material.color, { r: 0.81, g: 0.89, b: 0.85 }, 0.7);
          });
          return "pushed " + pending.length;
        }
        if (name === "pr") {
          if (!state.remote.length) return "push first";
          state.pr = true;
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.34, 0.03, 8, 40),
            new THREE.MeshStandardMaterial({ color: C.accent, roughness: 0.4 })
          );
          const last = state.remote[state.remote.length - 1];
          ring.position.copy(last.position);
          ring.position.z += 0.45;
          g.add(ring);
          return "pull request opened";
        }
        if (name === "merge") {
          if (!state.pr) return "no pull request open";
          state.pr = false;
          g.children.filter(function (o) { return o.geometry && o.geometry.type === "TorusGeometry"; })
            .forEach(function (r) {
              tween(r.material.color, { r: 0.06, g: 0.48, b: 0.31 }, 0.5);
              tween(r.scale, { x: 1.15, y: 1.15, z: 1.15 }, 0.4);
            });
          return "merged into main";
        }
        return "";
      },
      update: function (t) {
        g.rotation.y = reduced ? 0 : Math.sin(t * 0.25) * 0.1;
      }
    };
  }

  function buildDocker() {
    const g = new THREE.Group();
    const INSTR = [
      ["FROM build image", 0.78],
      ["COPY manifest", 0.16],
      ["INSTALL deps", 0.62],
      ["COPY source", 0.24],
      ["BUILD artefact", 0.42],
      ["FROM runtime", 0.58],
      ["COPY artefact", 0.2]
    ];
    const slabs = [];
    const staleFrom = { value: -1 };

    INSTR.forEach(function (entry, i) {
      const w = 3.5 - i * 0.06;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.2, 1.9),
        new THREE.MeshStandardMaterial({ color: i < 3 ? 0xd8caae : 0xb9d2c4, roughness: 0.7, metalness: 0.03 })
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.position.set(0, -1.5 + i * 0.36, 0);
      mesh.scale.y = 0.001;
      mesh.userData.base = mesh.position.y;
      mesh.userData.color = mesh.material.color.getHex();
      g.add(mesh);
      slabs.push(mesh);

      const lbl = labelSprite(entry[0], { scale: 0.0021, color: "#6f767e" });
      lbl.position.set(-2.55, -1.5 + i * 0.36, 1.05);
      g.add(lbl);
    });

    return {
      group: g,
      reset: function () {
        staleFrom.value = -1;
        slabs.forEach(function (m) {
          m.scale.y = 0.001;
          m.position.y = m.userData.base;
          m.material.color.setHex(m.userData.color);
          m.material.opacity = 1;
          m.material.transparent = false;
        });
      },
      action: function (name, arg) {
        if (name === "build") {
          slabs.forEach(function (m, i) {
            if (i < staleFrom.value) return;
            tween(m.scale, { x: 1, y: 1, z: 1 }, 0.3 + i * 0.05);
            tween(m.position, { y: m.userData.base }, 0.3);
            tween(m.material.color, { r: (m.userData.color >> 16 & 255) / 255, g: (m.userData.color >> 8 & 255) / 255, b: (m.userData.color & 255) / 255 }, 0.4);
          });
          if (staleFrom.value > -1) { staleFrom.value = -1; return "rebuilt from layer 4"; }
          return "built " + slabs.length + " layers";
        }
        if (name === "change") {
          staleFrom.value = 3;
          slabs.forEach(function (m, i) {
            if (i < 3) return;
            tween(m.material.color, { r: 0.95, g: 0.9, b: 0.82 }, 0.3);
            tween(m.position, { y: m.userData.base + 0.14 }, 0.3);
          });
          return "source changed: layers 4-7 invalidated";
        }
        if (name === "fail") {
          slabs.forEach(function (m, i) {
            if (i !== 2) return;
            tween(m.material.color, { r: 0.71, g: 0.14, b: 0.09 }, 0.35);
            tween(m.position, { y: m.userData.base + 0.3 }, 0.35);
          });
          return "dependency install failed";
        }
        return "";
      },
      update: function (t) {
        g.rotation.y = reduced ? -0.25 : -0.25 + Math.sin(t * 0.3) * 0.06;
      }
    };
  }

  function buildPipeline() {
    const g = new THREE.Group();
    const NAMES = ["checkout", "setup", "build", "test", "scan", "push"];
    const panels = [];
    const state = { idx: -1, failedAt: -1 };

    NAMES.forEach(function (n, i) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.78, 0.66, 0.1),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0.02 })
      );
      mesh.castShadow = true;
      const x = -2.4 + i * 0.95;
      const y = Math.cos((i - 2.5) * 0.28) * 0.22;
      mesh.position.set(x, y, 0);
      mesh.userData = { baseY: y, baseZ: 0, name: n, color: 0xffffff };
      g.add(mesh);
      panels.push(mesh);

      const lbl = labelSprite(n, { scale: 0.0019, color: "#6f767e" });
      lbl.position.set(x, y - 0.55, 0.1);
      g.add(lbl);
    });

    return {
      group: g,
      reset: function () {
        state.idx = -1; state.failedAt = -1;
        panels.forEach(function (m) {
          m.material.color.setHex(0xffffff);
          m.material.opacity = 1; m.material.transparent = false;
          m.position.y = m.userData.baseY; m.position.z = m.userData.baseZ;
        });
      },
      action: function (name, arg) {
        if (name === "reset") { this.reset(); return "reset"; }
        if (name === "failToggle") {
          state.failedAt = arg ? 3 : -1;
          return arg ? "failing test armed at stage 4" : "test fixed";
        }
        if (name === "begin") {
          this.reset();
          state.idx = 0;
          return "started";
        }
        if (name === "stage") {
          const i = arg;
          state.idx = i;
          const m = panels[i];
          if (m) {
            tween(m.position, { z: 0.45, y: m.userData.baseY + 0.16 }, 0.25);
            const isFail = state.failedAt === i;
            const col = isFail ? C.fail : C.ok;
            tween(m.material.color, { r: (col >> 16 & 255) / 255, g: (col >> 8 & 255) / 255, b: (col & 255) / 255 }, 0.3);
            if (isFail) {
              panels.forEach(function (p, j) {
                if (j <= i) return;
                tween(p.material, { opacity: 0.25 }, 0.3);
                p.material.transparent = true;
              });
            }
          }
          return NAMES[i];
        }
        if (name === "done") {
          panels.forEach(function (m) { tween(m.position, { z: 0.2, y: m.userData.baseY + 0.08 }, 0.35); });
          return "passed";
        }
        return "";
      },
      update: function (t) {
        g.rotation.y = reduced ? 0 : Math.sin(t * 0.22) * 0.12;
        g.rotation.x = reduced ? 0 : -0.06;
      }
    };
  }

  function buildCompose() {
    const g = new THREE.Group();
    const services = [];
    const yFor = [1.5, 0, -1.5];
    const COLORS = [0xd9e4dc, 0xe7ddcb, 0xd9e4dc];

    yFor.forEach(function (y, i) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.72, 1.1),
        new THREE.MeshStandardMaterial({ color: COLORS[i], roughness: 0.6, metalness: 0.04 })
      );
      box.castShadow = true;
      box.position.set(0, y, 0);
      g.add(box);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.62, 0.025, 8, 44),
        new THREE.MeshStandardMaterial({ color: C.line, roughness: 0.5 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, y - 0.42, 0);
      g.add(ring);

      const lbl = labelSprite(["db", "api", "web"][i], { scale: 0.0024, color: "#6f767e" });
      lbl.position.set(-1.15, y, 0.55);
      g.add(lbl);

      services.push({ box: box, ring: ring, y: y });
    });

    function ringColor(i, hex) {
      const m = services[i].ring.material;
      tween(m.color, { r: (hex >> 16 & 255) / 255, g: (hex >> 8 & 255) / 255, b: (hex & 255) / 255 }, 0.35);
    }

    return {
      group: g,
      reset: function () {
        services.forEach(function (s, i) {
          s.ring.material.color.setHex(C.line);
          s.box.material.emissive && s.box.material.emissive.setHex(0x000000);
          s.box.position.y = s.y;
        });
      },
      action: function (name, arg) {
        if (name === "reset") { this.reset(); return "stopped"; }
        if (name === "start") {
          const i = arg;
          ringColor(i, C.warn);
          tween(services[i].box.position, { y: services[i].y + 0.14 }, 0.3);
          return (["db", "api", "web"][i]) + " starting";
        }
        if (name === "healthy") {
          const i = arg;
          ringColor(i, C.ok);
          tween(services[i].box.position, { y: services[i].y }, 0.3);
          return (["db", "api", "web"][i]) + " healthy";
        }
        return "";
      },
      update: function (t) {
        g.rotation.y = reduced ? 0.35 : 0.35 + Math.sin(t * 0.26) * 0.08;
      }
    };
  }

  function buildAbstract() {
    const g = new THREE.Group();
    const mats = [
      new THREE.MeshStandardMaterial({ color: 0xe9dfcd, roughness: 0.65 }),
      new THREE.MeshStandardMaterial({ color: 0xdde6df, roughness: 0.65 }),
      new THREE.MeshStandardMaterial({ color: 0xf2e7dd, roughness: 0.65 })
    ];
    for (let i = 0; i < 7; i++) {
      const m = new THREE.Mesh(new THREE.TorusGeometry(0.9 + i * 0.22, 0.012, 6, 90), mats[i % 3]);
      m.rotation.x = Math.PI / 2.35;
      m.rotation.z = i * 0.24;
      m.position.y = -0.4 + i * 0.14;
      g.add(m);
    }
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.55, 1),
      new THREE.MeshStandardMaterial({ color: 0xd9d3c6, roughness: 0.5, wireframe: true })
    );
    g.add(core);
    return {
      group: g,
      reset: function () {},
      action: function () { return ""; },
      update: function (t) {
        g.rotation.y = reduced ? 0.3 : t * 0.12;
        core.rotation.y = reduced ? 0 : t * 0.3;
      }
    };
  }

  const BUILDERS = {
    git: buildGit,
    docker: buildDocker,
    pipeline: buildPipeline,
    compose: buildCompose,
    abstract: buildAbstract
  };

  // each scene is framed differently: a wide row needs to sit further left and
  // smaller than a two-lane graph, or it runs off the right edge
  const FRAMES = {
    git:      { dx: 0.0,  scale: 1.00 },
    docker:   { dx: -0.5, scale: 0.94 },
    pipeline: { dx: -2.1, scale: 0.72 },
    compose:  { dx: 0.1,  scale: 0.92 },
    abstract: { dx: 0.0,  scale: 1.00 }
  };

  function get(kind) {
    const k = BUILDERS[kind] ? kind : "abstract";
    if (!registry.has(k)) {
      const s = BUILDERS[k]();
      s.kind = k;
      const f = FRAMES[k] || FRAMES.abstract;
      const narrow = window.innerWidth < 900;
      s.group.position.x = narrow ? 0 : 4.4 + f.dx;
      s.group.position.y = narrow ? -0.4 : -0.15;
      s.group.scale.setScalar(narrow ? f.scale * 0.78 : f.scale);
      sceneRoot.add(s.group);
      registry.set(k, s);
    }
    return registry.get(k);
  }

  function show(kind) {
    if (!renderer) return;
    if (current) current.group.visible = false;
    current = get(kind);
    current.group.visible = true;
    current.reset();
  }

  function action(name, arg) {
    if (!current) return "";
    return current.action(name, arg);
  }

  function loop() {
    requestAnimationFrame(loop);
    if (!renderer || !enabled) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    stepTweens(dt);
    if (current) current.update(t, dt);
    renderer.render(sceneRoot, camera);
  }

  const ok = init();
  if (ok) { show("abstract"); loop(); }
  window.addEventListener("resize", resize, { passive: true });

  return {
    show: show,
    action: action,
    resize: resize,
    setEnabled: function (on) {
      enabled = on;
      canvas.style.display = on ? "block" : "none";
      document.body.classList.toggle("no-3d", !on);
    },
    isReady: function () { return !!renderer; }
  };
}




