/* ===== Windows XP résumé desktop — behaviour ===== */
(function () {
  "use strict";

  /* ---- Boot screen ---- */
  var boot = document.getElementById("boot");
  setTimeout(function () { boot.classList.add("hide"); }, 1900);
  setTimeout(function () { boot.style.display = "none"; }, 2600);

  /* ---- Build chips ---- */
  document.querySelectorAll("[data-chips]").forEach(function (box) {
    box.getAttribute("data-chips").split(",").forEach(function (txt) {
      var c = document.createElement("span");
      c.className = "chip";
      c.innerHTML = txt.trim();
      box.appendChild(c);
    });
  });

  /* ---- Window setup: build titlebars ---- */
  var z = 20;
  var tasks = document.getElementById("tasks");
  var taskBtns = {};       // id -> taskbar button
  var wins = {};           // id (without win-) -> window el

  document.querySelectorAll(".win").forEach(function (win) {
    var key = win.id.replace("win-", "");
    wins[key] = win;
    var title = win.getAttribute("data-title");
    var icon = win.getAttribute("data-icon");

    var bar = document.createElement("div");
    bar.className = "titlebar";
    bar.innerHTML =
      '<svg><use href="#' + icon + '"/></svg>' +
      '<div class="t-text">' + title + '</div>' +
      '<div class="tb-btns">' +
        '<button class="tb-min" title="Minimize" aria-label="Minimize">_</button>' +
        '<button class="tb-max" title="Maximize" aria-label="Maximize">□</button>' +
        '<button class="tb-close" title="Close" aria-label="Close">✕</button>' +
      '</div>';
    win.insertBefore(bar, win.firstChild);

    bar.querySelector(".tb-min").addEventListener("click", function (e) { e.stopPropagation(); minimize(key); });
    bar.querySelector(".tb-max").addEventListener("click", function (e) { e.stopPropagation(); toggleMax(win); });
    bar.querySelector(".tb-close").addEventListener("click", function (e) { e.stopPropagation(); closeWin(key); });
    bar.addEventListener("dblclick", function (e) {
      if (e.target.closest(".tb-btns")) return;
      toggleMax(win);
    });

    win.addEventListener("mousedown", function () { focusWin(key); });
    makeDraggable(win, bar);
  });

  /* ---- Open / focus / close / minimize ---- */
  function openWin(key) {
    var win = wins[key];
    if (!win) return;
    if (!win.classList.contains("open")) {
      win.classList.add("open");
      addTask(key);
      lazyPdf(win);
    }
    win.classList.remove("min");
    focusWin(key);
    closeStart();
  }

  function closeWin(key) {
    var win = wins[key];
    win.classList.remove("open", "max", "min");
    if (taskBtns[key]) { taskBtns[key].remove(); delete taskBtns[key]; }
  }

  function minimize(key) {
    wins[key].classList.add("min");
    wins[key].classList.remove("active");
    if (taskBtns[key]) taskBtns[key].classList.remove("active");
  }

  function focusWin(key) {
    var win = wins[key];
    if (win.classList.contains("min")) win.classList.remove("min");
    Object.keys(wins).forEach(function (k) {
      wins[k].classList.remove("active");
      if (taskBtns[k]) taskBtns[k].classList.remove("active");
    });
    win.classList.add("active");
    win.style.zIndex = ++z;
    if (taskBtns[key]) taskBtns[key].classList.add("active");
  }

  function toggleMax(win) {
    win.classList.toggle("max");
  }

  function lazyPdf(win) {
    var f = win.querySelector("iframe[data-src]");
    if (f && !f.src) f.src = f.getAttribute("data-src");
  }

  /* ---- Taskbar buttons ---- */
  function addTask(key) {
    if (taskBtns[key]) return;
    var win = wins[key];
    var btn = document.createElement("button");
    btn.className = "taskbtn";
    btn.innerHTML = '<svg><use href="#' + win.getAttribute("data-icon") + '"/></svg><span>' +
      win.getAttribute("data-title").split(" — ")[0] + "</span>";
    btn.addEventListener("click", function () {
      var active = win.classList.contains("active") && !win.classList.contains("min");
      if (active) { minimize(key); }
      else { openWin(key); }
    });
    tasks.appendChild(btn);
    taskBtns[key] = btn;
  }

  /* ---- Dragging ---- */
  function makeDraggable(win, handle) {
    var sx, sy, ox, oy, drag = false;
    handle.addEventListener("mousedown", start);
    handle.addEventListener("touchstart", function (e) { start(e.touches[0]); }, { passive: true });

    function start(e) {
      if (e.target && e.target.closest && e.target.closest(".tb-btns")) return;
      if (win.classList.contains("max")) return;
      drag = true;
      var r = win.getBoundingClientRect();
      ox = r.left; oy = r.top; sx = e.clientX; sy = e.clientY;
      win.style.left = ox + "px"; win.style.top = oy + "px";
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", end);
      document.addEventListener("touchmove", tmove, { passive: false });
      document.addEventListener("touchend", end);
    }
    function move(e) {
      if (!drag) return;
      var nx = ox + (e.clientX - sx);
      var ny = Math.max(0, oy + (e.clientY - sy));
      nx = Math.min(Math.max(nx, -win.offsetWidth + 80), window.innerWidth - 80);
      ny = Math.min(ny, window.innerHeight - 70);
      win.style.left = nx + "px"; win.style.top = ny + "px";
    }
    function tmove(e) { if (drag) { e.preventDefault(); move(e.touches[0]); } }
    function end() {
      drag = false;
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", end);
      document.removeEventListener("touchmove", tmove);
      document.removeEventListener("touchend", end);
    }
  }

  /* ---- Desktop icons (single-click select, double-click / touch open) ---- */
  document.querySelectorAll(".dicon").forEach(function (ic) {
    var key = ic.getAttribute("data-open");
    ic.addEventListener("click", function () {
      document.querySelectorAll(".dicon").forEach(function (d) { d.classList.remove("sel"); });
      ic.classList.add("sel");
    });
    ic.addEventListener("dblclick", function () { openWin(key); });
    // touch: open on tap
    ic.addEventListener("touchend", function (e) { e.preventDefault(); openWin(key); }, { passive: false });
  });
  // click empty desktop -> deselect
  document.getElementById("desktop").addEventListener("mousedown", function (e) {
    if (e.target.id === "desktop" || e.target.classList.contains("icons"))
      document.querySelectorAll(".dicon").forEach(function (d) { d.classList.remove("sel"); });
  });

  /* ---- Generic [data-open] (start menu items) ---- */
  document.querySelectorAll("[data-open]").forEach(function (el) {
    if (el.classList.contains("dicon")) return;
    el.addEventListener("click", function () { openWin(el.getAttribute("data-open")); });
  });

  /* ---- Start menu ---- */
  var startBtn = document.getElementById("startbtn");
  var startMenu = document.getElementById("startmenu");
  var scrim = document.getElementById("scrim");

  function openStart() {
    startMenu.hidden = false; scrim.hidden = false; startBtn.classList.add("active");
  }
  function closeStart() {
    startMenu.hidden = true; scrim.hidden = true; startBtn.classList.remove("active");
  }
  startBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    startMenu.hidden ? openStart() : closeStart();
  });
  scrim.addEventListener("click", closeStart);
  startMenu.querySelectorAll(".sm-item").forEach(function (it) {
    it.addEventListener("click", function () { closeStart(); });
  });

  /* ---- Power buttons ---- */
  function shutdownScreen(msg, sub) {
    closeStart();
    var bye = document.getElementById("bye");
    if (!bye) {
      bye = document.createElement("div");
      bye.id = "bye";
      document.body.appendChild(bye);
    }
    bye.innerHTML = '<div>' + msg + '</div><div class="small">' + sub + '</div>' +
      '<button class="xp-btn" onclick="location.reload()">Turn back on</button>';
    bye.classList.add("show");
  }
  document.getElementById("shutdown").addEventListener("click", function () {
    shutdownScreen("It is now safe to turn off your computer.", "Thanks for visiting — Ali Alavi");
  });
  document.getElementById("logoff").addEventListener("click", function () {
    shutdownScreen("Logging off…", "See you next time.");
  });

  /* ---- Clock ---- */
  function tick() {
    var d = new Date();
    var h = d.getHours(), m = d.getMinutes();
    var ap = h >= 12 ? "PM" : "AM";
    h = h % 12; if (h === 0) h = 12;
    document.getElementById("clock").textContent =
      h + ":" + (m < 10 ? "0" + m : m) + " " + ap;
  }
  tick(); setInterval(tick, 10000);

  /* ---- Open the About window on first load ---- */
  setTimeout(function () { openWin("about"); }, 2700);

  /* ---- Esc closes start menu ---- */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeStart();
  });
})();
