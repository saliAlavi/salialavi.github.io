/* =========================================================================
   Ali Alavi — portfolio behaviour
   starfield · console tilt · envelope chart · codec wave · circuit wires
   · reveals · active nav · mobile menu · paper filter
   Vanilla JS, no dependencies. Every visual has a static fallback.
   ========================================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var still = reduceMotion || saveData;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  function ready(fn) { document.readyState !== "loading" ? fn() : document.addEventListener("DOMContentLoaded", fn); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* Size a canvas to its CSS box; returns {ctx,w,h} in CSS pixels. */
  function fit(canvas) {
    var r = canvas.getBoundingClientRect();
    var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (canvas.width !== w * DPR || canvas.height !== h * DPR) { canvas.width = w * DPR; canvas.height = h * DPR; }
    var ctx = canvas.getContext("2d");
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }

  /* Run fn(t) on rAF only while el is on screen and the tab is visible. */
  function loop(el, fn, fps) {
    var on = false, raf = 0, last = 0, step = 1000 / (fps || 60);
    function tick(now) {
      raf = requestAnimationFrame(tick);
      if (now - last < step) return;
      last = now; fn(now / 1000);
    }
    function set(v) {
      v = v && !document.hidden;
      if (v === on) return; on = v;
      if (on) raf = requestAnimationFrame(tick); else cancelAnimationFrame(raf);
    }
    var visible = false;
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; set(visible); }).observe(el);
    document.addEventListener("visibilitychange", function () { set(visible); });
  }

  /* Smooth deterministic stand-in for a speech envelope (slowed down so a
     5 s window reads as a handful of phrases, not a wall of syllables). */
  var F = [0.31, 0.53, 0.87, 1.31, 1.9], P = [0.3, 2.1, 4.0, 1.2, 5.5], A = [0.36, 0.3, 0.2, 0.12, 0.07];
  function envelope(t) {
    var v = 0;
    for (var i = 0; i < F.length; i++) v += A[i] * Math.sin(2 * Math.PI * F[i] * t + P[i]);
    return 0.5 + 0.44 * Math.tanh(v * 1.5);
  }
  function eegRecon(t) {
    var n = 0.06 * Math.sin(2 * Math.PI * 2.7 * t + 1.1) + 0.04 * Math.sin(2 * Math.PI * 4.3 * t + 2.7);
    return clamp(0.5 + (envelope(t - 0.25) - 0.5) * 0.8 + n, 0.04, 0.98);
  }

  /* ---------------- starfield ---------------- */
  function starfield() {
    var c = $("#stars"); if (!c) return;
    var stars = [], W = 0, H = 0, ctx;
    function build() {
      var f = fit(c); ctx = f.ctx; W = f.w; H = f.h;
      var n = Math.round(W * H / (W < 700 ? 5200 : 4200));
      stars = [];
      for (var i = 0; i < n; i++) {
        var big = Math.random() < 0.035;
        stars.push({
          x: Math.random() * W, y: Math.random() * H * 1.6,
          r: big ? 1.1 + Math.random() * 1.1 : 0.25 + Math.random() * 0.75,
          a: big ? 0.8 : 0.25 + Math.random() * 0.55,
          tw: 0.6 + Math.random() * 2.2, ph: Math.random() * 6.28,
          z: 0.04 + Math.random() * 0.22, big: big,
          hue: Math.random() < 0.5 ? "214,208,255" : "255,255,255"
        });
      }
    }
    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      var sy = window.scrollY || 0, span = H * 1.6;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var y = ((s.y - sy * s.z) % span + span) % span; if (y > H + 4) continue;
        var a = still ? s.a : s.a * (0.6 + 0.4 * Math.sin(t * s.tw + s.ph));
        if (s.big) {
          var g = ctx.createRadialGradient(s.x, y, 0, s.x, y, s.r * 5);
          g.addColorStop(0, "rgba(" + s.hue + "," + a + ")");
          g.addColorStop(1, "rgba(" + s.hue + ",0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, y, s.r * 5, 0, 6.283); ctx.fill();
        }
        ctx.fillStyle = "rgba(" + s.hue + "," + a + ")";
        ctx.beginPath(); ctx.arc(s.x, y, s.r, 0, 6.283); ctx.fill();
      }
    }
    build(); draw(0);
    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { build(); draw(performance.now() / 1000); }, 150); });
    if (still) { window.addEventListener("scroll", function () { requestAnimationFrame(function () { draw(0); }); }, { passive: true }); return; }
    var raf, last = 0;
    function tick(now) {
      raf = requestAnimationFrame(tick);
      if (now - last < 33) return; last = now; draw(now / 1000);
    }
    raf = requestAnimationFrame(tick);
    document.addEventListener("visibilitychange", function () {
      cancelAnimationFrame(raf); if (!document.hidden) raf = requestAnimationFrame(tick);
    });
  }

  /* ---------------- console: flatten on scroll + count-up ---------------- */
  function consoleTilt() {
    var wrap = $("#consoleWrap"), con = $("#console"); if (!wrap || !con) return;
    if (!still) {
      var ticking = false;
      var update = function () {
        ticking = false;
        var r = wrap.getBoundingClientRect(), vh = window.innerHeight;
        var p = clamp((vh - r.top) / (vh * 0.85), 0, 1);
        con.style.setProperty("--tilt", (20 * (1 - p)).toFixed(2) + "deg");
        con.style.setProperty("--sc", (0.94 + 0.06 * p).toFixed(3));
      };
      window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
      window.addEventListener("resize", update);
      update();
    }
    var nums = $$(".kpi__n[data-count]", con);
    if (still || !nums.length) return;
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; io.disconnect();
      var t0 = performance.now();
      (function step(now) {
        var k = clamp((now - t0) / 1100, 0, 1), e = 1 - Math.pow(1 - k, 3);
        nums.forEach(function (n) { n.textContent = Math.round(e * +n.dataset.count); });
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    }, { threshold: 0.3 });
    io.observe(con);
  }

  /* ---------------- envelope-tracking chart ---------------- */
  function envChart() {
    var c = $("#envChart"); if (!c) return;
    var tip = $("#envTip"), tipR = $("#envTipR");
    var win = 5, shown = 5, offset = 0;

    function draw(t) {
      var f = fit(c), ctx = f.ctx, w = f.w, h = f.h;
      shown += (win - shown) * 0.12;                       // ease window changes
      var t0 = still ? 0 : t * 0.35;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1;
      for (var g = 1; g < 4; g++) { var gy = Math.round(h * g / 4) + 0.5; ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }
      for (var v = 1; v < 6; v++) { var gx = Math.round(w * v / 6) + 0.5; ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }

      function trace(fn, color, glow) {
        ctx.beginPath();
        for (var x = 0; x <= w; x += 2) {
          var y = h - 8 - fn(t0 + (x / w) * shown) * (h - 18);
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.shadowColor = glow; ctx.shadowBlur = 10;
        ctx.stroke(); ctx.shadowBlur = 0;
      }
      trace(eegRecon, "#ff4f8f", "rgba(255,79,143,.7)");
      trace(envelope, "#7d6cff", "rgba(125,108,255,.8)");

      var mx = Math.round(w * 0.56), my = h - 8 - envelope(t0 + 0.56 * shown) * (h - 18);
      ctx.fillStyle = "#0b0b17"; ctx.strokeStyle = "#cfc8ff"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(mx, my, 5.5, 0, 6.283); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(125,108,255,.35)"; ctx.beginPath(); ctx.arc(mx, my, 11, 0, 6.283); ctx.fill();
      if (tip) {
        var ty = my < h * 0.45 ? my + 14 : my - 52;
        var tw = tip.offsetWidth || 110;
        tip.style.left = (mx + 12 + tw > w ? mx - 12 - tw : mx + 12) + "px";
        tip.style.top = clamp(ty, 0, h - 44) + "px";
      }
    }
    $$(".cs-chart .seg button").forEach(function (b) {
      b.addEventListener("click", function () {
        $$(".cs-chart .seg button").forEach(function (o) { o.classList.remove("is-on"); o.setAttribute("aria-pressed", "false"); });
        b.classList.add("is-on"); b.setAttribute("aria-pressed", "true");
        win = +b.dataset.win; if (tipR) tipR.textContent = "window " + win + " s";
        if (still) { shown = win; draw(0); }
      });
    });
    draw(0);
    window.addEventListener("resize", function () { draw(performance.now() / 1000); });
    if (!still) loop(c, draw, 45);
  }

  /* ---------------- CADENZA codec bars ---------------- */
  function codecWave() {
    var c = $("#codecWave"); if (!c) return;
    function draw(t) {
      var f = fit(c), ctx = f.ctx, w = f.w, h = f.h, mid = h / 2;
      ctx.clearRect(0, 0, w, h);
      var levels = 7;                                     // finite scalar quantization levels
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      for (var l = 1; l < levels; l++) { var ly = Math.round(h * l / levels) + 0.5; ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(w, ly); ctx.stroke(); }
      var bw = 5, gap = 3, t0 = still ? 0 : t * 0.7;
      var grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "#5c50f5"); grad.addColorStop(0.6, "#9d8fff"); grad.addColorStop(1, "#ff6aa3");
      ctx.fillStyle = grad;
      for (var x = 6, i = 0; x < w - 6; x += bw + gap, i++) {
        var u = t0 + x / w * 8;
        var a = envelope(u) * (0.55 + 0.45 * Math.abs(Math.sin(i * 1.7 + u * 3)));
        var q = Math.max(1, Math.round(a * (levels - 1))) / (levels - 1);   // snap to a level
        var bh = q * (h - 30) / 2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, mid - bh, bw, bh * 2, 2.5); else ctx.rect(x, mid - bh, bw, bh * 2);
        ctx.fill();
      }
    }
    draw(0);
    window.addEventListener("resize", function () { draw(performance.now() / 1000); });
    if (!still) loop(c, draw, 24);
  }

  /* ---------------- pipeline circuit wires ---------------- */
  function wires() {
    var flow = $("#flow"), svg = $("#flowWires"), chip = $("#flowChip .chip3d");
    if (!flow || !svg || !chip) return;
    var NS = "http://www.w3.org/2000/svg";
    function el(name, attrs) { var e = document.createElementNS(NS, name); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
    function draw() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      if (getComputedStyle(svg).display === "none") return;
      var base = flow.getBoundingClientRect();
      function box(n) { var r = n.getBoundingClientRect(); return { l: r.left - base.left, r: r.right - base.left, t: r.top - base.top, b: r.bottom - base.top, cy: (r.top + r.bottom) / 2 - base.top }; }
      var c = box(chip), ins = $$(".flow__in .node", flow).map(box), outs = $$(".flow__out .node", flow).map(box);
      var paths = [];
      // 2×2 inputs: join each row, then run each row to the chip
      for (var i = 0; i + 1 < ins.length; i += 2) {
        var a = ins[i], b = ins[i + 1];
        paths.push("M" + a.r + " " + a.cy + " H" + b.l);
        var ty = c.cy + (i === 0 ? -18 : 18), mx = (b.r + c.l) / 2;
        paths.push("M" + b.r + " " + b.cy + " H" + (mx - 14) + " Q" + mx + " " + b.cy + " " + mx + " " + (b.cy + (ty > b.cy ? 14 : -14)) + " V" + (ty + (ty > b.cy ? -14 : 14)) + " Q" + mx + " " + ty + " " + (mx + 14) + " " + ty + " H" + c.l);
      }
      outs.forEach(function (o) {
        var mx = (c.r + o.l) / 2, sy = c.cy + (o.cy - c.cy) * 0.18;
        paths.push("M" + c.r + " " + sy + " C" + mx + " " + sy + " " + mx + " " + o.cy + " " + o.l + " " + o.cy);
      });
      paths.forEach(function (d, k) {
        svg.appendChild(el("path", { d: d }));
        if (!still) svg.appendChild(el("path", { d: d, class: "pulse", style: "animation-delay:" + (k * 0.45).toFixed(2) + "s" }));
      });
      outs.forEach(function (o) { svg.appendChild(el("circle", { cx: o.l, cy: o.cy, r: 3 })); });
      svg.appendChild(el("circle", { cx: c.l, cy: c.cy - 18, r: 3 }));
      svg.appendChild(el("circle", { cx: c.l, cy: c.cy + 18, r: 3 }));
    }
    draw();
    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(draw, 120); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    new IntersectionObserver(function (es) { if (es[0].isIntersecting) draw(); }).observe(flow);
  }

  /* ---------------- "why" card: tie each talker tag to the question ---------------- */
  function whyLines() {
    var viz = $(".why__viz"), svg = $("#whyLines"), hub = viz && $(".tag--c", viz);
    if (!viz || !svg || !hub) return;
    var NS = "http://www.w3.org/2000/svg";
    function draw() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var b = viz.getBoundingClientRect(), h = hub.getBoundingClientRect();
      var hx = h.left - b.left + h.width / 2, hy = h.top - b.top + h.height / 2;
      $$(".tag:not(.tag--c)", viz).forEach(function (t) {
        var r = t.getBoundingClientRect();
        var tx = r.left - b.left + r.width / 2, ty = r.top - b.top + r.height / 2;
        var left = tx < hx;
        var sx = left ? r.right - b.left : r.left - b.left;           // tag edge facing the hub
        var ex = left ? h.left - b.left + 18 : h.right - b.left - 18;  // hub edge facing the tag
        var ey = ty < hy ? h.top - b.top : h.bottom - b.top;
        var mx = (sx + ex) / 2;
        var p = document.createElementNS(NS, "path");
        p.setAttribute("d", "M" + sx + " " + ty + " C" + mx + " " + ty + " " + ex + " " + (ty + ey) / 2 + " " + ex + " " + ey);
        svg.appendChild(p);
        var c = document.createElementNS(NS, "circle");
        c.setAttribute("cx", sx); c.setAttribute("cy", ty); c.setAttribute("r", 2.5);
        svg.appendChild(c);
      });
    }
    draw();
    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(draw, 120); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    new IntersectionObserver(function (es) { if (es[0].isIntersecting) draw(); }).observe(viz);
  }

  /* ---------------- reveals ---------------- */
  function reveals() {
    var items = $$(".reveal");
    if (still || !("IntersectionObserver" in window)) { items.forEach(function (e) { e.classList.add("in"); }); $$(".hbars").forEach(function (e) { e.classList.add("in"); }); return; }
    items.forEach(function (e) {
      var sib = Array.prototype.indexOf.call(e.parentNode.children, e);
      if (sib > 0) e.style.setProperty("--d", Math.min(sib * 0.07, 0.35) + "s");
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        $$(".hbars", en.target).forEach(function (h) { setTimeout(function () { h.classList.add("in"); }, 250); });
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    items.forEach(function (e) { io.observe(e); });
  }

  /* ---------------- nav: active link + mobile sheet ---------------- */
  function nav() {
    var links = $$("[data-nav]"), map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        var a = map[en.target.id]; if (!a) return;
        if (en.isIntersecting) { links.forEach(function (l) { l.classList.remove("is-active"); l.removeAttribute("aria-current"); }); a.classList.add("is-active"); a.setAttribute("aria-current", "true"); }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });

    var btn = $("#menuToggle"), sheet = $("#sheet"); if (!btn || !sheet) return;
    function set(open) { btn.setAttribute("aria-expanded", String(open)); sheet.hidden = !open; }
    btn.addEventListener("click", function () { set(btn.getAttribute("aria-expanded") !== "true"); });
    $$("[data-sheet]", sheet).forEach(function (a) { a.addEventListener("click", function () { set(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !sheet.hidden) { set(false); btn.focus(); } });
  }

  /* ---------------- papers filter ---------------- */
  function papers() {
    var group = $("#paperFilter"), list = $$("#paperList .paper"), status = $("#filterStatus");
    if (!group) return;
    $$("button", group).forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.dataset.f, n = 0;
        $$("button", group).forEach(function (o) { o.classList.toggle("is-on", o === b); o.setAttribute("aria-pressed", String(o === b)); });
        list.forEach(function (li) { var show = f === "all" || li.dataset.t === f; li.hidden = !show; if (show) { n++; li.classList.add("in"); } });
        if (status) status.textContent = "Showing " + n + " of " + list.length + " papers";
      });
    });
  }

  ready(function () {
    starfield();
    consoleTilt();
    envChart();
    codecWave();
    wires();
    whyLines();
    reveals();
    nav();
    papers();
  });
})();
