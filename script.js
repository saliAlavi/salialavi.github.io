/* =========================================================================
   PRISM — behaviour
   WebGL fluid-gradient hero · custom cursor · magnetic hovers · card visuals
   · scroll reveals/parallax · active nav · copy · mobile menu
   Vanilla JS, no dependencies.
   ========================================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pointerFine = window.matchMedia("(pointer: fine)").matches;
  var saveData = (navigator.connection && navigator.connection.saveData) ||
                 window.matchMedia("(prefers-reduced-data: reduce)").matches;
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  function ready(fn) { document.readyState !== "loading" ? fn() : document.addEventListener("DOMContentLoaded", fn); }

  /* =======================================================================
     WEBGL FLUID GRADIENT HERO
     ======================================================================= */
  var FRAG = [
    "precision highp float;",
    "uniform vec2 u_res; uniform float u_time; uniform vec2 u_mouse;",
    "vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}",
    "vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}",
    "vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}",
    "float snoise(vec2 v){const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);",
    " vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);",
    " vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);",
    " vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod289(i);",
    " vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));",
    " vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);m=m*m;m=m*m;",
    " vec3 x=2.0*fract(p*C.www)-1.0;vec3 h=abs(x)-0.5;vec3 ox=floor(x+0.5);vec3 a0=x-ox;",
    " m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);",
    " vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.0*dot(m,g);}",
    "float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<5;i++){v+=a*snoise(p);p*=2.03;a*=0.5;}return v;}",
    "void main(){",
    " vec2 uv=gl_FragCoord.xy/u_res;",
    " float ar=u_res.x/u_res.y; vec2 p=vec2(uv.x*ar,uv.y)*1.5;",
    " float t=u_time*0.06; vec2 m=(u_mouse-0.5);",
    " vec2 q=vec2(fbm(p+t),fbm(p+vec2(3.1,1.7)-t));",
    " vec2 r=vec2(fbm(p+1.5*q+m*0.8+t*0.5),fbm(p+1.5*q+vec2(8.3,2.8)-m*0.8));",
    " float f=fbm(p+2.0*r); f=f*0.5+0.5;",
    " vec3 violet=vec3(0.486,0.227,0.929);",
    " vec3 cyan=vec3(0.133,0.827,0.933);",
    " vec3 lime=vec3(0.639,0.902,0.208);",
    " vec3 paper=vec3(0.98,0.976,0.965);",
    " vec3 col=mix(violet,cyan,smoothstep(0.15,0.6,f));",
    " col=mix(col,lime,smoothstep(0.55,0.92,f));",
    " col=mix(col,paper,smoothstep(0.86,1.0,f)*0.4);",
    " float d=distance(vec2(uv.x*ar,uv.y),vec2(u_mouse.x*ar,u_mouse.y));",
    " col+=0.14*exp(-d*4.0);",
    " gl_FragColor=vec4(col,1.0);",
    "}"
  ].join("\n");

  function fallbackGradient(canvas) {
    canvas.style.background = "linear-gradient(135deg,#7c3aed,#22d3ee 50%,#a3e635)";
    canvas.closest(".hero__visual") && canvas.closest(".hero__visual").classList.add("no-webgl");
  }

  function initFluid(canvas) {
    var gl = canvas.getContext("webgl", { antialias: false, alpha: false }) ||
             canvas.getContext("experimental-webgl");
    if (!gl) { fallbackGradient(canvas); return function () {}; }

    function compile(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    }
    var vs = compile(gl.VERTEX_SHADER, "attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}");
    var fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { fallbackGradient(canvas); return function () {}; }
    var prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { fallbackGradient(canvas); return function () {}; }
    gl.useProgram(prog);

    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uRes = gl.getUniformLocation(prog, "u_res");
    var uTime = gl.getUniformLocation(prog, "u_time");
    var uMouse = gl.getUniformLocation(prog, "u_mouse");

    var dpr = Math.min(window.devicePixelRatio || 1, saveData ? 1 : 1.75);
    var mouse = [0.5, 0.55], target = [0.5, 0.55];
    function size() {
      var r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    size();
    if (pointerFine) {
      window.addEventListener("mousemove", function (e) {
        var r = canvas.getBoundingClientRect();
        target[0] = (e.clientX - r.left) / r.width;
        target[1] = 1 - (e.clientY - r.top) / r.height;
      });
    }
    var raf = null, running = false, last = 0;
    function render(now, tSec) {
      mouse[0] = lerp(mouse[0], target[0], 0.06);
      mouse[1] = lerp(mouse[1], target[1], 0.06);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, tSec);
      gl.uniform2f(uMouse, mouse[0], mouse[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (now - last < 33) return;               // ~30fps
      last = now;
      render(now, now / 1000);
    }
    function start() { if (running || reduceMotion) return; running = true; last = 0; raf = requestAnimationFrame(loop); }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

    render(0, 14);                               // static first frame always present
    if (!reduceMotion) {
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : stop(); }, { threshold: 0 }).observe(canvas);
      } else start();
    }
    return function () { dpr = Math.min(window.devicePixelRatio || 1, saveData ? 1 : 1.75); size(); render(0, 14); };
  }

  /* =======================================================================
     CARD VISUALS (static, colorful, per project)
     ======================================================================= */
  function motif(ctx, w, h, kind) {
    ctx.strokeStyle = "rgba(255,255,255,.92)";
    ctx.fillStyle = "rgba(255,255,255,.92)";
    ctx.lineWidth = 2.2; ctx.lineJoin = "round"; ctx.lineCap = "round";
    var i, x, y, N = 90;
    var sig = function (x, ph, sc) {
      return Math.sin(x * 6.28 * 1.0 + ph) * 0.5 + Math.sin(x * 6.28 * 2.4 + ph * 1.4) * 0.3 + Math.sin(x * 6.28 * 3.7) * 0.18;
    };
    if (kind === "eeg" || kind === "morph") {
      var lanes = [0.28, 0.5, 0.72];
      for (var L = 0; L < 3; L++) {
        ctx.globalAlpha = 0.55 + L * 0.18; ctx.beginPath();
        for (i = 0; i <= N; i++) { x = i / N; var damp = kind === "morph" ? (0.4 + 0.6 * (1 - x)) : 1;
          y = h * lanes[L] + sig(x, L * 1.3) * h * 0.11 * damp; i ? ctx.lineTo(x * w, y) : ctx.moveTo(0, y); }
        ctx.stroke();
      }
      ctx.globalAlpha = 1; return;
    }
    if (kind === "bars") {
      var bars = 22, bw = w / bars * 0.55;
      for (i = 0; i < bars; i++) { x = (i + 0.5) / bars * w; var mag = Math.abs(sig(i / bars, 0.6)) * 0.7 + 0.08;
        ctx.globalAlpha = 0.5 + 0.5 * mag; ctx.fillRect(x - bw / 2, h - mag * h, bw, mag * h); }
      ctx.globalAlpha = 1; return;
    }
    if (kind === "reward") {
      ctx.beginPath();
      for (i = 0; i <= N; i++) { x = i / N; y = h - (1 - Math.exp(-3.0 * x)) * h * 0.72 - h * 0.12 + sig(x, 0) * h * 0.03 * (1 - x); i ? ctx.lineTo(x * w, y) : ctx.moveTo(0, y); }
      ctx.stroke(); return;
    }
    // default: wave
    ctx.beginPath();
    for (i = 0; i <= N; i++) { x = i / N; var env = Math.exp(-Math.pow((x - 0.5) / 0.34, 2)); y = h * 0.5 + sig(x, 0) * h * 0.34 * env; i ? ctx.lineTo(x * w, y) : ctx.moveTo(0, y); }
    ctx.stroke();
  }
  function drawCard(canvas) {
    var card = canvas.closest(".card"); if (!card) return;
    var kind = card.getAttribute("data-kind");
    var cs = getComputedStyle(card);
    var c1 = (cs.getPropertyValue("--c1") || "#7c3aed").trim();
    var c2 = (cs.getPropertyValue("--c2") || "#22d3ee").trim();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = canvas.getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    var ctx = canvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    var g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    motif(ctx, w, h, kind);
  }

  /* =======================================================================
     CUSTOM CURSOR
     ======================================================================= */
  function initCursor() {
    if (!pointerFine || reduceMotion) return;
    document.documentElement.classList.add("cursor-on");
    var ring = document.getElementById("cursor"), dot = document.getElementById("cursorDot");
    if (!ring || !dot) return;
    var mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my;
    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
    });
    (function tick() {
      rx = lerp(rx, mx, 0.2); ry = lerp(ry, my, 0.2);
      ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      requestAnimationFrame(tick);
    })();
    var hot = "a,button,.card,[data-magnetic],input,textarea";
    document.querySelectorAll(hot).forEach(function (el) {
      el.addEventListener("mouseenter", function () { ring.classList.add("hot"); });
      el.addEventListener("mouseleave", function () { ring.classList.remove("hot"); });
    });
  }

  /* =======================================================================
     MAGNETIC ELEMENTS
     ======================================================================= */
  function initMagnetic() {
    if (!pointerFine || reduceMotion) return;
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      var strength = el.classList.contains("card") ? 0.12 : 0.35;
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = "translate(" + dx * strength + "px," + dy * strength + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* =======================================================================
     BOOTSTRAP
     ======================================================================= */
  ready(function () {
    var resizers = [];

    var fluid = document.getElementById("fluid");
    if (fluid) resizers.push(initFluid(fluid));

    document.querySelectorAll(".card__viz").forEach(function (c) {
      drawCard(c); resizers.push(function () { drawCard(c); });
    });

    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt); rt = setTimeout(function () { resizers.forEach(function (f) { f(); }); }, 160);
    });

    /* ---- reveals ---- */
    var headline = document.querySelector(".hero__headline");
    if (headline) { if (reduceMotion) headline.classList.add("in"); else setTimeout(function () { headline.classList.add("in"); }, 120); }

    var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (reduceMotion || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("in"); });
    } else {
      var counters = new Map();
      reveals.forEach(function (el) { var p = el.parentElement; var n = counters.get(p) || 0; counters.set(p, n + 1); el._d = Math.min(n * 80, 280); });
      var ro = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target; setTimeout(function () { el.classList.add("in"); }, el._d || 0); obs.unobserve(el);
        });
      }, { threshold: 0.1, rootMargin: "0px 0px -8% 0px" });
      reveals.forEach(function (el) { ro.observe(el); });
    }

    initCursor();
    initMagnetic();

    /* ---- parallax ---- */
    var parallax = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
    /* ---- active nav + progress + scrolled ---- */
    var navLinks = {};
    document.querySelectorAll(".nav__links a[href^='#']").forEach(function (a) { navLinks[a.getAttribute("href").slice(1)] = a; });
    if ("IntersectionObserver" in window) {
      var na = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          for (var id in navLinks) navLinks[id].classList.remove("is-active");
          if (navLinks[e.target.id]) navLinks[e.target.id].classList.add("is-active");
        });
      }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
      Object.keys(navLinks).forEach(function (id) { var s = document.getElementById(id); if (s) na.observe(s); });
    }
    var nav = document.getElementById("nav"), bar = document.getElementById("progressBar"), ticking = false;
    function onScroll() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var st = window.pageYOffset || document.documentElement.scrollTop;
        var max = document.documentElement.scrollHeight - window.innerHeight;
        if (bar) bar.style.transform = "scaleX(" + (max > 0 ? st / max : 0) + ")";
        if (nav) nav.classList.toggle("scrolled", st > 40);
        if (!reduceMotion) {
          var vh = window.innerHeight;
          parallax.forEach(function (el) {
            var r = el.getBoundingClientRect();
            var prog = ((r.top + r.height / 2) - vh / 2) / vh;   // -0.5..0.5-ish
            var amt = parseFloat(el.getAttribute("data-parallax")) || 0;
            if (!el.style.transform || el.style.transform.indexOf("translateY") === 0 || el._px) { el._px = true; el.style.transform = "translateY(" + (prog * amt) + "px)"; }
          });
        }
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* ---- copy-to-clipboard ---- */
    var status = document.getElementById("copyStatus");
    document.querySelectorAll(".copy[data-copy]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        var val = el.getAttribute("data-copy");
        if (!navigator.clipboard || !navigator.clipboard.writeText) return;
        e.preventDefault();
        navigator.clipboard.writeText(val).then(function () {
          var label = el.querySelector(".copy__label");
          if (el._t) clearTimeout(el._t);
          el.classList.add("copied");
          if (label) label.textContent = "copied ✓";
          if (status) { status.textContent = ""; status.textContent = val + " copied to clipboard"; }
          el._t = setTimeout(function () {
            if (label) label.textContent = val;
            el.classList.remove("copied");
            if (status) status.textContent = "";
            el._t = null;
          }, 1600);
        }).catch(function () { window.location.href = "mailto:" + val; });
      });
    });

    /* ---- mobile menu ---- */
    var toggle = document.getElementById("menuToggle"), sheet = document.getElementById("sheet");
    if (toggle && sheet) {
      function close() { sheet.hidden = true; toggle.setAttribute("aria-expanded", "false"); toggle.textContent = "Menu"; }
      function open() { sheet.hidden = false; toggle.setAttribute("aria-expanded", "true"); toggle.textContent = "Close"; var a = sheet.querySelector("a"); if (a) a.focus(); }
      toggle.addEventListener("click", function () { sheet.hidden ? open() : close(); });
      sheet.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { sheet.hidden = true; toggle.setAttribute("aria-expanded", "false"); toggle.textContent = "Menu"; }); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !sheet.hidden) { close(); toggle.focus(); } });
      var mq = window.matchMedia("(min-width:821px)");
      var onDesk = function (e) { if (e.matches && !sheet.hidden) close(); };
      if (mq.addEventListener) mq.addEventListener("change", onDesk); else if (mq.addListener) mq.addListener(onDesk);
    }
  });
})();
