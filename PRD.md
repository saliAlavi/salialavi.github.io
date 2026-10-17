# PRD — Ali Alavi Portfolio v3 ("NIGHTSHIFT")

## 1. Goal
Rebuild the site from the latest résumé and in the visual language of Outcrowd's
"Website for an Incident Management Platform" (Dribbble): black starfield, a single
violet light beam, glassy dark panels, indigo glow buttons, a hero dashboard mockup.

## 2. Content rules
- Works = CADENZA + everything on the author's arXiv (Merit, speech-quality hackability,
  NEUROTOKEN, MAESTRO, contrastive AAD, the 2020 optics paper, and the three CVPR 2026
  challenge reports: TLG, Perception First, R3-CoVR).
- Competitions: BirdCLEF+ 2026 silver (145th); Obesity ML Challenge Part 3, 2nd place
  in peer review for both proposals; CMDC Hackathon 3rd place; and the three CVPR 2026
  challenge results (TimeLogic, VRR, CoVR-R). All of these stay in the competitions
  section (site and résumé); the challenge reports are also listed as papers.
- Every number on the page comes from a paper or a results page. The envelope chart is
  labelled illustrative.

## 3. Structure (single page)
1. Floating glass pill nav + Résumé button.
2. Hero: "Building machines that listen." with gradient lead words, glow + ghost CTAs.
3. Research console (dashboard mockup): topic mix, KPIs, headline results, envelope
   chart with a working window toggle, latest-paper card. Flattens as it scrolls in.
4. Venue strip (text only).
5. Problem card: hearing aids amplify every voice alike.
6. Pipeline: EEG / gaze / head IMU / audio → AAD chip → which talker / side / envelope.
7. Selected research bento (Merit, NEUROTOKEN, MAESTRO, hackable metrics, CADENZA, contrastive AAD).
8. Papers & preprints, filterable by topic.
9. Competitions & challenges: six tilted glass tiles (BirdCLEF+ silver, Obesity 2nd place,
   TimeLogic, VRR, CoVR-R, CMDC Hackathon 3rd place).
10. Experience & education, toolkit, honors.
11. Contact CTA with light rising from below; footer.

## 4. Design system
Ink `#05050c`; indigo `#4b3ff0`; lavender `#9d8fff`; pink `#ff4f8f` (second chart
series); green `#3ddc97` (status). Manrope for everything, JetBrains Mono for small
labels. Radii 26 / 18 / 12. Glass = dark translucent fill + 1px white hairline.

## 5. Tech & accessibility
Static HTML/CSS/JS, no dependencies, GitHub Pages. Progressive enhancement, reduced
motion and Save-Data fallbacks, animations paused off-screen, mobile down to 360px.
