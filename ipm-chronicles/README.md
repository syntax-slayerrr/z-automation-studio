# The IPM Chronicles

Self-contained production workspace for the 15-episode vertical (`1080x1920`, 30fps) historical documentary series **The IPM Chronicles**.

## Structure

- `series/` — Series bible, `evidence_ledger.csv` (historical truth ground), `open_loops.csv`, `project_state.md`, and voice auditions.
- `public/` — Static runtime media (`audio/ep01/`, `audio/music/`, `audio/sfx/`, `art/`).
- `src/shared/` — Reusable documentary design system (aged paper textures, historical vector atlas, vintage cartouche props, scalloped editorial captions, word-cue script engine).
- `src/episodes/epXX/` — Episode-specific scripts, alignments, illustrated scenes, production briefs, and Remotion composition.
- `pipeline/` — Python/Node scripts for Cartesia VO generation, aligned foley sound mix, historical lint checks, and QA contact sheets.
- `out/` — Final rendered MP4s, audio credits, and QA frame sheets.

## Commands (run from workspace root or inside `ipm-chronicles/`)

```bash
npm run ipm:studio       # Open isolated Remotion Studio for The IPM Chronicles
npm run ipm:tsc          # Typecheck ipm-chronicles strictly (0 errors)
npm run ipm:render:ep01  # Render Episode 01 MP4
```
