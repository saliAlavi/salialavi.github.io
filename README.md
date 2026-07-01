# salialavi.github.io

Personal portfolio for **Ali Alavi** (S. A. Alavi Bajestan) — PhD researcher in
Computer Science at The Ohio State University working on speech processing,
sub-kilobit neural audio coding, and decoding auditory attention from EEG.

Design direction — **NYQUIST · Editorial Signal Grid**: a dark, deep-space,
Swiss-editorial single page where one electric-cyan signal is both the grid's
rule system and a live instrument trace. The hero renders a live waveform; the
same primitive draws the static per-project sparklines and the footer sign-off.
Exactly one continuous animation, with a complete static fallback.

## Stack
Plain static site — no build step. Hosted on GitHub Pages.

- `index.html` — semantic single page: nav, hero, focus, selected work, approach, experience, education, stack, honors, contact + inline SVG favicon, meta/OG, JSON-LD Person
- `styles.css` — dark theme (Space Grotesk / Inter / IBM Plex Mono), 12-col editorial grid, faint schematic background, datasheet work rows, reduced-motion fallback
- `script.js` — shared `signal()` primitive (hero animator + static sparklines + sign-off), scroll-reveal, active-nav, scroll progress, click-to-copy emails, mobile menu, `prefers-reduced-motion` / Save-Data guards
- `files/Resume-AliAlavi.pdf` — downloadable résumé
- `.nojekyll` — serve files as-is

## Accessibility & performance
Single `<h1>`, semantic sections, focus-visible outlines, aria-hidden canvases with
text equivalents, skip link, and a fully legible static document under
`prefers-reduced-motion` / Save-Data (the hero freezes to a sampled waveform).

## Local preview
```bash
python3 -m http.server 8000
# then open http://localhost:8000
```
