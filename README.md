# salialavi.github.io

Personal site for **Ali Alavi** (S. A. Alavi Bajestan), PhD student in Computer
Science at The Ohio State University: auditory attention decoding from EEG, gaze and
head motion; speech-quality metrics; neural audio coding; video-language reasoning.

Design direction, **NIGHTSHIFT**: a black starfield with one violet light beam that
lands on a glass "research console" (a dashboard mockup filled with real numbers from
the papers), followed by glass bento cards, a sensors-to-decision circuit diagram, a
filterable paper list and tilted competition tiles. Modelled on Outcrowd's
"Website for an Incident Management Platform" Dribbble shot.

## Stack
Plain static site, no build step, hosted on GitHub Pages.

- `index.html` — single page: nav, hero + research console, venues strip, problem card, pipeline diagram, selected research (bento), papers (filterable), competitions & challenges, experience & education, contact
- `styles.css` — design tokens, glass panels, beam/flare, responsive layout, reduced-motion fallbacks
- `script.js` — starfield, console flatten-on-scroll, envelope chart, codec bars, circuit wires, reveals, active nav, mobile menu, paper filter
- `resume/Resume-AliAlavi.tex` — LaTeX source of the résumé
- `files/Resume-AliAlavi.pdf` — compiled résumé (linked from the site)
- `files/og-cover.png` — 1200×630 social-share image
- `.nojekyll` — serve files as-is

## Résumé
```bash
latexmk -pdf -outdir=resume/build resume/Resume-AliAlavi.tex
cp resume/build/Resume-AliAlavi.pdf files/Resume-AliAlavi.pdf
```

## Accessibility & performance
Single `<h1>`, semantic sections, skip link, focus-visible outlines, real links inside
the console mockup, aria-hidden canvases with text equivalents. Canvases only animate
while on screen and the tab is visible; `prefers-reduced-motion` and Save-Data freeze
everything to a static frame. Content is fully readable without JavaScript.

## Publishing
GitHub Pages serves `master` as-is at https://salialavi.github.io. Commit and push to
`master`; the site updates within a minute or two.
