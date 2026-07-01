/* =========================================================================
   NYQUIST — behaviour
   One shared signal() primitive drives: the live hero baseline, the static
   per-project sparklines, and the footer sign-off. Everything else is
   reveal-on-scroll, active-nav, scroll progress, copy-to-clipboard, menu.
   Vanilla JS, no dependencies.
   ========================================================================= */
(function () {
  "use strict";

  var TAU = Math.PI * 2;
  var ACCENT = "#6ee7ff";
  var GLOW = "rgba(110,231,255,.22)";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pointerFine = window.matchMedia("(pointer: fine)").matches;
  var saveData = (navigator.connection && navigator.connection.saveData) ||
                 window.matchMedia("(prefers-reduced-data: reduce)").matches;

  /* ---- core signal primitive: x in [0,1] -> ~[-1,1] ---- */
  function signal(x, t, seed) {
    var s = seed || 0;
    return 0.55 * Math.sin(x * TAU * 1.00 + t * 1.00 + s) +
           0.30 * Math.sin(x * TAU * 2.37 + t * 0.63 + s * 1.7) +
           0.18 * Math.sin(x * TAU * 3.71 + t * 0.41 + s * 2.3);
  }

  /* ---- DPR-capped canvas sizing ---- */
  function fit(canvas) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rect = canvas.getBoundingClientRect();
    var w = Math.max(1, Math.round(rect.width));
    var h = Math.max(1, Math.round(rect.height));
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }

  function strokePath(ctx, pts, glow) {
    if (glow) {
      ctx.beginPath();
      for (var i = 0; i < pts.length; i++) i ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[0][0], pts[0][1]);
      ctx.strokeStyle = GLOW; ctx.lineWidth = 6; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.stroke();
    }
    ctx.beginPath();
    for (var j = 0; j < pts.length; j++) j ? ctx.lineTo(pts[j][0], pts[j][1]) : ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.strokeStyle = ACCENT; ctx.lineWidth = 1.25; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.stroke();
  }

  function sampleDots(ctx, w, h, n) {
    ctx.fillStyle = ACCENT;
    for (var i = 0; i <= n; i++) {
      var x = (i / n) * w;
      ctx.beginPath();
      ctx.arc(x, h / 2, 1.4, 0, TAU);
      ctx.fill();
    }
  }

  /* =======================================================================
     HERO — the one live trace
     ======================================================================= */
  function initHero(canvas) {
    var ctx, w, h, t = 0, raf = null, running = false, last = 0;
    var mx = null, focus = 0, hovering = false;
    var N = saveData ? 120 : 200;
    var interactive = pointerFine && !reduceMotion;

    function yAt(xn) {
      var cy = h / 2;
      var env = Math.exp(-Math.pow((xn - 0.5) / 0.42, 2));
      var amp = h * 0.30 * env;
      if (interactive && mx !== null && focus > 0.001) {
        amp += Math.exp(-Math.pow((xn - mx) / 0.06, 2)) * focus * h * 0.24;
      }
      return cy - signal(xn, t, 0) * amp;
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      var pts = [];
      for (var i = 0; i <= N; i++) { var xn = i / N; pts.push([xn * w, yAt(xn)]); }
      strokePath(ctx, pts, true);
      if (reduceMotion) sampleDots(ctx, w, h, saveData ? 24 : 40);
    }

    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (now - last < 33) return;          // ~30fps cap
      last = now;
      t += 0.012;
      if (interactive) {
        if (hovering) focus += (1 - focus) * 0.2;
        else { focus *= 0.92; if (focus < 0.02) mx = null; }
      }
      draw();
    }

    function start() {
      if (running || reduceMotion) return;
      running = true; last = 0; raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    }
    function size() {
      var f = fit(canvas); ctx = f.ctx; w = f.w; h = f.h;
      draw();                                // static frame always present
    }

    size();

    if (interactive) {
      canvas.addEventListener("pointermove", function (e) {
        var r = canvas.getBoundingClientRect();
        mx = (e.clientX - r.left) / r.width; hovering = true;
      });
      canvas.addEventListener("pointerleave", function () { hovering = false; });
    }

    // gate the loop to on-screen only
    if (!reduceMotion && "IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? start() : stop();
      }, { threshold: 0 }).observe(canvas);
    }

    return size;
  }

  /* =======================================================================
     SPARKLINES — static, one per project, same primitive
     ======================================================================= */
  function drawSpark(canvas) {
    var f = fit(canvas), ctx = f.ctx, w = f.w, h = f.h, cy = h / 2;
    var kind = canvas.getAttribute("data-kind");
    var N = 96, pts = [], i, xn;
    ctx.clearRect(0, 0, w, h);

    if (kind === "eeg-stacked" || kind === "morph") {
      // three offset traces (morph tightens amplitude toward the right)
      var lanes = [-0.26, 0, 0.26];
      for (var L = 0; L < lanes.length; L++) {
        pts = [];
        for (i = 0; i <= N; i++) {
          xn = i / N;
          var damp = kind === "morph" ? (0.35 + 0.65 * (1 - xn)) : 1;
          pts.push([xn * w, cy + lanes[L] * h + signal(xn, L * 1.3, L * 2) * h * 0.14 * damp]);
        }
        strokePath(ctx, pts, false);
      }
      return;
    }

    if (kind === "spectrogram") {
      var bars = 26;
      ctx.fillStyle = ACCENT;
      for (i = 0; i < bars; i++) {
        xn = i / (bars - 1);
        var mag = Math.abs(signal(xn, 0.7, 1)) * 0.62 + 0.06;
        var bh = mag * h, bw = Math.max(1.5, w / bars - 2);
        ctx.globalAlpha = 0.55 + 0.45 * mag;
        ctx.fillRect(xn * (w - bw), h - bh, bw, bh);
      }
      ctx.globalAlpha = 1;
      return;
    }

    if (kind === "reward") {
      for (i = 0; i <= N; i++) {
        xn = i / N;
        var base = (1 - Math.exp(-3.2 * xn));                 // monotonic rise
        var noise = signal(xn, 0, 3) * 0.05 * (1 - xn);
        pts.push([xn * w, h - (base + noise) * h * 0.8 - h * 0.08]);
      }
      strokePath(ctx, pts, false);
      return;
    }

    if (kind === "envelope") {
      // amplitude-modulated audio-like burst
      for (i = 0; i <= N; i++) {
        xn = i / N;
        var env = Math.exp(-Math.pow((xn - 0.5) / 0.34, 2));
        pts.push([xn * w, cy + signal(xn, 0, 0) * h * 0.42 * env]);
      }
      strokePath(ctx, pts, false);
      return;
    }

    // default: single eeg trace
    for (i = 0; i <= N; i++) { xn = i / N; pts.push([xn * w, cy + signal(xn, 0.4, 1.1) * h * 0.30]); }
    strokePath(ctx, pts, false);
  }

  /* =======================================================================
     SIGN-OFF — flat static hairline resolving into sample dots
     ======================================================================= */
  function drawSignoff(canvas) {
    var f = fit(canvas), ctx = f.ctx, w = f.w, h = f.h, cy = h / 2;
    ctx.clearRect(0, 0, w, h);
    var N = 200, pts = [], i;
    for (i = 0; i <= N; i++) { var xn = i / N; pts.push([xn * w, cy + signal(xn, 0, 0) * h * 0.14]); }
    strokePath(ctx, pts, false);
    var dots = saveData ? 28 : 48;
    ctx.fillStyle = ACCENT;
    for (i = 0; i <= dots; i++) {
      var dx = (i / dots) * w;
      ctx.beginPath(); ctx.arc(dx, cy, 1.5, 0, TAU); ctx.fill();
    }
  }

  /* =======================================================================
     BOOTSTRAP
     ======================================================================= */
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var resizers = [];

    var hero = document.getElementById("heroWave");
    if (hero) resizers.push(initHero(hero));

    document.querySelectorAll(".spark").forEach(function (c) {
      drawSpark(c); resizers.push(function () { drawSpark(c); });
    });

    var signoff = document.getElementById("signoffWave");
    if (signoff) { drawSignoff(signoff); resizers.push(function () { drawSignoff(signoff); }); }

    // debounced resize -> re-fit every canvas
    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () { resizers.forEach(function (f) { f(); }); }, 160);
    });

    /* ---- reveal on scroll (staggered, once) ---- */
    var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (reduceMotion || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("in"); });
    } else {
      // per-element stagger index within its parent
      var counters = new Map();
      reveals.forEach(function (el) {
        var p = el.parentElement;
        var n = counters.get(p) || 0; counters.set(p, n + 1);
        el._delay = Math.min(n * 60, 260);
      });
      var ro = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target;
          setTimeout(function () { el.classList.add("in"); }, el._delay || 0);
          obs.unobserve(el);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
      reveals.forEach(function (el) { ro.observe(el); });
    }

    /* ---- active nav link ---- */
    var navLinks = {};
    document.querySelectorAll(".nav__links a[href^='#']").forEach(function (a) {
      navLinks[a.getAttribute("href").slice(1)] = a;
    });
    var watchIds = Object.keys(navLinks);
    if (watchIds.length && "IntersectionObserver" in window) {
      var na = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          for (var id in navLinks) navLinks[id].classList.remove("is-active");
          var link = navLinks[e.target.id];
          if (link) link.classList.add("is-active");
        });
      }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
      watchIds.forEach(function (id) { var s = document.getElementById(id); if (s) na.observe(s); });
    }

    /* ---- scroll progress + nav shadow ---- */
    var nav = document.getElementById("nav");
    var bar = document.getElementById("progressBar");
    var ticking = false;
    function onScroll() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var st = window.pageYOffset || document.documentElement.scrollTop;
        var max = document.documentElement.scrollHeight - window.innerHeight;
        if (bar) bar.style.transform = "scaleX(" + (max > 0 ? st / max : 0) + ")";
        if (nav) nav.classList.toggle("scrolled", st > 40);
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* ---- copy-to-clipboard emails (mailto fallback if it fails) ---- */
    var status = document.getElementById("copyStatus");
    document.querySelectorAll(".copy[data-copy]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        var val = el.getAttribute("data-copy");
        if (!navigator.clipboard || !navigator.clipboard.writeText) return; // let mailto proceed
        e.preventDefault();
        navigator.clipboard.writeText(val).then(function () {
          var label = el.querySelector(".copy__label");
          if (el._copyTimer) clearTimeout(el._copyTimer);   // cancel any pending restore
          el.classList.add("copied");
          label.textContent = "copied ✓";
          if (status) { status.textContent = ""; status.textContent = val + " copied to clipboard"; }
          el._copyTimer = setTimeout(function () {
            label.textContent = val;                        // restore from source of truth, never live text
            el.classList.remove("copied");
            if (status) status.textContent = "";
            el._copyTimer = null;
          }, 1600);
        }).catch(function () { window.location.href = "mailto:" + val; });
      });
    });

    /* ---- mobile menu ---- */
    var toggle = document.getElementById("menuToggle");
    var sheet = document.getElementById("sheet");
    if (toggle && sheet) {
      function closeSheet() {
        sheet.hidden = true; toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "MENU"; toggle.focus();
      }
      function openSheet() {
        sheet.hidden = false; toggle.setAttribute("aria-expanded", "true");
        toggle.textContent = "CLOSE";
        var first = sheet.querySelector("a"); if (first) first.focus();
      }
      toggle.addEventListener("click", function () {
        sheet.hidden ? openSheet() : closeSheet();
      });
      sheet.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { sheet.hidden = true; toggle.setAttribute("aria-expanded", "false"); toggle.textContent = "MENU"; });
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !sheet.hidden) closeSheet();
      });
      // if the viewport grows to desktop while the sheet is open, close it
      var mqDesktop = window.matchMedia("(min-width:781px)");
      var onDesktop = function (e) {
        if (e.matches && !sheet.hidden) {
          sheet.hidden = true; toggle.setAttribute("aria-expanded", "false"); toggle.textContent = "MENU";
        }
      };
      if (mqDesktop.addEventListener) mqDesktop.addEventListener("change", onDesktop);
      else if (mqDesktop.addListener) mqDesktop.addListener(onDesktop);
    }
  });
})();
