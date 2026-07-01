# PRD — Ali Alavi Portfolio v2 ("PRISM")

## 1. Problem
v1 (dark "signal grid") tested as **empty, monotone, generic, and too abstract**. It did not
make a senior/technical viewer stop and take the person seriously. v2 is a full redirection.

## 2. Goal
A **bold, colorful, energetic, awwwards-caliber** personal site that instantly reads as
high-craft and memorable, while staying credible to hiring managers, senior engineers, and
research faculty. The site itself is a proof of engineering + design taste.

## 3. Audience
Primary: industry hiring managers & senior engineers. Secondary: research faculty/collaborators.
Everyone should grasp the value in ~10 seconds and find the CV/contact immediately.

## 4. Non-goals
No OS/metaphor. No dark-monotone minimalism. No fake academic template. No headshot (not provided).
Keep it text-forward — imagery is generated/graphic, not photographic.

## 5. Design system
- **Base:** light canvas (`#FAF9F6` / white) with big saturated color blocks and oversized type.
- **Palette:** ink `#0B0B12`, violet `#7C3AED`, cyan `#22D3EE`, lime `#A3E635`, plus paper/white.
  Color is used loudly (full-bleed blocks, gradient text, oversized numerals) — not as a thin accent.
- **Type:** display **serif = Fraunces** (expressive, variable) + body **sans = Inter**; mono for tiny labels.
  Oversized section numerals (01–08) as a graphic device.
- **Signature visual:** interactive **WebGL flowing gradient** (violet→cyan→lime domain-warped noise)
  that warps toward the cursor; graceful CSS mesh-gradient fallback; static frame under reduced-motion.
- **Motion (rich / awwwards):** scroll-triggered reveals with stagger, section parallax, magnetic
  buttons/links, a keyword marquee, gradient-animated headings, and a custom cursor (desktop, fine-pointer only).

## 6. Structure (single long scroll)
1. **Nav** — light, minimal, bold; RÉSUMÉ pill + AVAILABLE dot; scroll progress.
2. **Hero** — WebGL fluid gradient; giant serif headline "Building machines that listen." with a
   gradient/emphasis word; subhead; two bold CTAs; custom cursor.
3. **Marquee** — scrolling keyword/venue ribbon (Interspeech · NeurIPS · IEEE TASLP · Speech · Neural audio · EEG/BCI).
4. **Focus** — bold oversized list of research areas.
5. **Selected Work** — **bento grid** of vivid project cards (CADENZA, NEUROTOKEN, MAESTRO, CorticalFlow,
   AIMO3, Contrastive-AAD) with generated colorful visuals, status tags, oversized catalog numbers, magnetic hover.
6. **Approach** — big statement + DATA→MODEL→DEPLOYMENT.
7. **Experience** & **Education** — editorial lists with oversized years.
8. **Stack** — colorful chip clusters / marquee.
9. **Honors & service** — compact list.
10. **Contact** — huge colorful CTA, copy-to-copy emails, résumé, GitHub/Scholar; footer colophon.

## 7. Tech
Static site, no build step, GitHub Pages. Vanilla HTML/CSS/JS + one small WebGL shader (no libraries).
Google Fonts (Fraunces, Inter). Progressive enhancement: full content without JS (reveals default visible).

## 8. Accessibility & performance
Single `<h1>`, semantic sections, focus-visible, aria for interactive controls, aria-hidden canvases with
text equivalents, reduced-motion + Save-Data fallbacks (freeze shader, disable cursor/parallax), custom
cursor only on fine pointers, WebGL gated to on-screen + capped frame rate. Target fast first paint.

## 9. Success criteria
"Would I forward this?" yes in 10s; feels custom and high-end; color + motion land as intentional, not noisy;
content (systems built + venues) is instantly legible; works great on mobile; no blank state without JS.
