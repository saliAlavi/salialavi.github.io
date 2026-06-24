# salialavi.github.io

Personal résumé site for **Ali Alavi**, built as an interactive **Windows XP** desktop.

Open the desktop icons (or the **Start** menu) to browse each résumé section in draggable XP windows:
About Me, Education, Experience, Selected Projects, Publications, Technical Skills, Honors & Service,
Contact, and the full **Resume.pdf**.

## Stack
Plain static site — no build step. Hosted on GitHub Pages.

- `index.html` — desktop, windows, taskbar, Start menu, inline SVG icon sprite
- `styles.css` — XP visual theme (Luna blue), Bliss wallpaper, window chrome
- `script.js` — window management (open/close/min/max/drag/focus), taskbar sync, Start menu, clock
- `assets/bliss.svg` — Bliss-style wallpaper
- `files/Resume-AliAlavi.pdf` — downloadable résumé
- `.nojekyll` — serve files as-is (skip Jekyll processing)

## Local preview
```bash
python3 -m http.server 8000
# then open http://localhost:8000
```
